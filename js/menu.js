// =======================================================
// LA DOLCE — ACCURATE MENU CUSTOMIZER (STRICT ADMIN SYNC)
// =======================================================

currentCategoryFilter = 'all';
activeCustomizingItem = null;
selectedVariant = 'standard';
selectedSweetnessLevel = '100%';
modalQuantity = 1;

// 1. Smart Category Matcher
function isMatchingCategory(itemCat, filter) {
  if (!filter || filter === 'all') return true;
  const c = String(itemCat || '').toLowerCase().trim();
  const f = String(filter).toLowerCase().trim();

  if (c === f) return true;
  if (f === 'tea' && (c.includes('tea') || c.includes('matcha') || c.includes('ຊາ') || c.includes('ມັດຊະ'))) return true;
  if (f === 'coffee' && (c.includes('coffee') || c.includes('espresso') || c.includes('latte') || c.includes('ກາເຟ'))) return true;
  if (f === 'refresher' && (c.includes('refresher') || c.includes('soda') || c.includes('spark') || c.includes('ໂຊດາ'))) return true;
  if (f === 'bakery' && (c.includes('bakery') || c.includes('food') || c.includes('cake') || c.includes('croissant') || c.includes('ເຂົ້າຈີ່') || c.includes('ເບເກີຣີ່'))) return true;
  return false;
}

// 2. Render Menu Grid
function renderMenu() {
  const grid = document.getElementById('menuGrid');
  if (!grid) return;

  const list = menuItems || [];
  const filtered = list.filter(item => isMatchingCategory(item.category, currentCategoryFilter));

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full p-8 text-center text-taupe bg-surface-pure rounded-xl border border-hairline font-lao">
        <p class="text-[14px] font-bold text-primary mb-1">${list.length === 0 ? 'ກຳລັງໂຫຼດເມນູ...' : 'ບໍ່ມີເມນູໃນໝວດນີ້'}</p>
        ${list.length > 0 ? `<button type="button" onclick="filterCategory('all')" class="mt-2 px-3.5 py-1.5 rounded-lg bg-surface border border-hairline text-forest-emerald text-[12px] font-bold">ກົດເບິ່ງ "ທັງໝົດ"</button>` : ''}
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map((item, index) => {
    const isAvail = item.isAvailable !== false;
    let minPrice = item.price || 35000;

    if (item.variants && typeof item.variants === 'object') {
      const valid = Object.values(item.variants).filter(v => typeof v === 'number' && v > 0);
      if (valid.length > 0) minPrice = Math.min(...valid);
    }

    return `
      <div class="bg-surface-pure border border-hairline rounded-xl p-3.5 flex flex-col justify-between shadow-xs ${isAvail ? 'hover:border-forest-leaf' : 'opacity-60 bg-gray-50'}">
        <div>
          <div class="relative w-full aspect-[4/3] rounded-lg bg-surface-dim overflow-hidden mb-3">
            <img src="${item.image || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500'}" 
                 loading="${index < 4 ? 'eager' : 'lazy'}" 
                 decoding="async" 
                 class="w-full h-full object-cover ${!isAvail ? 'grayscale' : 'hover:scale-105 transition-transform duration-500'}"/>
            ${!isAvail ? `<span class="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-[12px] font-bold font-lao">ໝົດຊົ່ວຄາວ</span>` : ''}
          </div>
          <h4 class="font-serif-title text-[15px] text-primary font-medium mb-1">${item.name}</h4>
          <p class="text-[12px] text-taupe line-clamp-2 mb-3 leading-relaxed">${item.desc || ''}</p>
        </div>
        <div class="flex items-center justify-between pt-2.5 border-t border-hairline">
          <span class="font-serif-title text-[15px] font-bold ${isAvail ? 'text-forest-emerald' : 'text-gray-400'}">${formatLAK(minPrice)}</span>
          ${isAvail ? `
            <button type="button" onclick="openCustomizeModal('${item.id}')" class="px-3.5 py-1.5 rounded-lg bg-surface hover:bg-forest-emerald hover:text-white border border-hairline text-[11px] font-medium transition-all cursor-pointer font-lao">ເລືອກ</button>
          ` : `<span class="px-3 py-1 text-[11px] text-gray-400 bg-gray-100 rounded-lg font-lao">ໝົດ</span>`}
        </div>
      </div>
    `;
  }).join('');
}

function filterCategory(cat) {
  currentCategoryFilter = cat;
  document.querySelectorAll('.cat-pill').forEach(btn => {
    btn.className = 'cat-pill px-4 py-2 rounded-lg text-[12px] font-medium shrink-0 bg-surface-pure border border-hairline text-taupe hover:text-charcoal transition-all';
  });
  if (window.event && window.event.target) {
    const t = window.event.target.closest('.cat-pill');
    if (t) t.className = 'cat-pill active-cat px-4 py-2 rounded-lg text-[12px] font-medium shrink-0 bg-forest-emerald text-white transition-all';
  }
  renderMenu();
}

// 🔥 3. ດຶງຂໍ້ມູນຈາກ Firestore ພ້ອມອ່ານຄ່າ Checkbox ທຸກຕົວຢ່າງຄົບຖ້ວນ
async function loadMenuItemsOnce() {
  const firestore = db || firebase.firestore();
  try {
    const snap = await firestore.collection('menu_items').get();
    if (!snap.empty) {
      menuItems = snap.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          name: d.name || d.itemName || 'ບໍ່ມີຊື່',
          category: (d.category || d.cat || 'coffee').toLowerCase().trim(),
          desc: d.desc || '',
          image: d.image || d.imageUrl || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500',
          price: Number(d.price || d.itemPrice || 35000),
          isAvailable: d.isAvailable !== false,
          variants: d.variants || { standard: Number(d.price || 35000) },
          
          // 🔥 ອ່ານຄ່າ Checkbox ທີ່ Admin ຕັ້ງໄວ້
          allowHot: d.allowHot === true,
          allowIced: d.allowIced === true,
          allowFrappe: d.allowFrappe === true,
          allowMilk: d.allowMilk === true,
          allowSweetness: d.allowSweetness !== false,
          allowTopping: d.allowTopping === true
        };
      });

      renderMenu();

      // Realtime Sync
      firestore.collection('menu_items').onSnapshot(liveSnap => {
        menuItems = liveSnap.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            name: d.name || d.itemName || 'ບໍ່ມີຊື່',
            category: (d.category || d.cat || 'coffee').toLowerCase().trim(),
            desc: d.desc || '',
            image: d.image || d.imageUrl || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500',
            price: Number(d.price || d.itemPrice || 35000),
            isAvailable: d.isAvailable !== false,
            variants: d.variants || { standard: Number(d.price || 35000) },
            allowHot: d.allowHot === true,
            allowIced: d.allowIced === true,
            allowFrappe: d.allowFrappe === true,
            allowMilk: d.allowMilk === true,
            allowSweetness: d.allowSweetness !== false,
            allowTopping: d.allowTopping === true
          };
        });
        renderMenu();
      });
    }
  } catch (e) {
    console.error("Menu load error:", e);
  }
}

// 🔥 4. Customize Modal (ສະແດງສະເພາະຕົວເລືອກທີ່ Admin ເປີດໄວ້ 100%)
function openCustomizeModal(itemId) {
  activeCustomizingItem = (menuItems || []).find(i => String(i.id) === String(itemId));
  if (!activeCustomizingItem) return;

  const item = activeCustomizingItem;
  modalQuantity = 1;
  selectedSweetnessLevel = '100%';

  const noteInput = document.getElementById('modalItemSpecialNote');
  if (noteInput) noteInput.value = '';

  document.getElementById('modalQtyDisplay').textContent = modalQuantity;
  document.getElementById('modalItemTitle').textContent = item.name;
  document.getElementById('modalItemDesc').textContent = item.desc || '';
  document.getElementById('modalItemImage').src = item.image;

  // 🔥 ຈັດການ Variants (ສະແດງສະເພາະ ຮ້ອນ/ເຢັນ/ປັ່ນ ທີ່ Admin ຕິກເລືອກເທົ່ານັ້ນ)
  const container = document.getElementById('variantButtonsGrid');
  if (container) {
    const v = item.variants || {};
    const baseP = item.price || 35000;
    const list = [];

    // ກວດສອບ strictly ຖ້າ Admin ຕິກ true ຈຶ່ງສະແດງ
    if (item.allowHot === true && (v.hot || baseP)) {
      list.push({ key: 'hot', label: 'ຮ້ອນ', price: v.hot || baseP });
    }
    if (item.allowIced === true && (v.iced || baseP)) {
      list.push({ key: 'iced', label: 'ເຢັນ', price: v.iced || baseP });
    }
    if (item.allowFrappe === true && v.frappe) {
      list.push({ key: 'frappe', label: 'ປັ່ນ', price: v.frappe });
    }

    // ຖ້າບໍ່ມີການຕິກ ຮ້ອນ/ເຢັນ/ປັ່ນ ເລີຍ ໃຫ້ເປັນມາດຕະຖານລາຄາດຽວ
    if (list.length === 0) {
      list.push({ key: 'standard', label: 'ມາດຕະຖານ', price: baseP });
    }

    selectedVariant = list[0].key; // ເລືອກໂຕທຳອິດທີ່ໃຊ້ໄດ້ອັດຕະໂນມັດ

    container.innerHTML = list.map(vItem => `
      <button type="button" onclick="selectVariantOption('${vItem.key}')" data-key="${vItem.key}" class="variant-btn p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all ${vItem.key === selectedVariant ? 'border-forest-emerald bg-forest-emerald/10 font-bold' : 'border-hairline bg-surface-pure'}">
        <span class="text-[11px] font-lao">${vItem.label}</span>
        <span class="font-serif-title font-bold text-forest-emerald">${formatLAK(vItem.price)}</span>
      </button>
    `).join('');
  }

  // 🔥🔥🔥 ເຊື່ອງ/ສະແດງ ນົມ, ຄວາມຫວານ, Topping ຕາມ Admin ກຳນົດ 100% 🔥🔥🔥
  const milkSection = document.getElementById('milkSelectorGroup');
  if (milkSection) {
    // ຖ້າ allowMilk ບໍ່ແມ່ນ true ຫຼື ເປັນເບເກີຣີ່ -> ເຊື່ອງທັນທີ!
    const shouldShowMilk = item.allowMilk === true && item.category !== 'bakery' && item.category !== 'refresher';
    milkSection.classList.toggle('hidden', !shouldShowMilk);
  }

  const sweetSection = document.getElementById('sweetnessSelectorGroup');
  if (sweetSection) {
    const shouldShowSweet = item.allowSweetness !== false && item.category !== 'bakery';
    sweetSection.classList.toggle('hidden', !shouldShowSweet);
  }

  const toppingSection = document.getElementById('toppingSelectorGroup');
  if (toppingSection) {
    const shouldShowTopping = item.allowTopping === true && item.category !== 'bakery';
    toppingSection.classList.toggle('hidden', !shouldShowTopping);
  }

  // Reset Milk Radio
  const defaultMilk = document.querySelector('input[name="milkOption"][value="Whole Milk"]');
  if (defaultMilk) defaultMilk.checked = true;

  // Reset Extra Shot
  const extraShot = document.getElementById('addonExtraShot');
  if (extraShot) extraShot.checked = false;

  updateModalPrice();
  document.getElementById('customizeModal')?.classList.remove('hidden');
}

function selectVariantOption(key) {
  selectedVariant = key;
  document.querySelectorAll('.variant-btn').forEach(btn => {
    btn.className = `variant-btn p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all ${btn.dataset.key === key ? 'border-forest-emerald bg-forest-emerald/10 font-bold' : 'border-hairline bg-surface-pure'}`;
  });
  updateModalPrice();
}

function selectSweetness(btn, level) {
  selectedSweetnessLevel = level;
  document.querySelectorAll('.sweet-btn').forEach(b => b.className = 'sweet-btn py-1.5 rounded text-[11px] text-taupe font-medium');
  btn.className = 'sweet-btn py-1.5 rounded text-[11px] bg-forest-emerald text-white font-medium';
}

function closeCustomizeModal() {
  document.getElementById('customizeModal')?.classList.add('hidden');
}

function adjustModalQty(delta) {
  modalQuantity = Math.max(1, modalQuantity + delta);
  document.getElementById('modalQtyDisplay').textContent = modalQuantity;
  updateModalPrice();
}

// ຄິດໄລ່ລາຄາຕາມ Variant ທີ່ເລືອກຕົວຈິງ
function updateModalPrice() {
  const item = activeCustomizingItem;
  if (!item) return 0;

  const v = item.variants || {};
  let unit = item.price || 35000;

  if (v[selectedVariant]) {
    unit = v[selectedVariant];
  } else if (v.standard) {
    unit = v.standard;
  }

  // ຄ່ານົມ (ບວກສະເພາະເມື່ອ allowMilk ເປັນ true)
  if (item.allowMilk === true) {
    const milk = document.querySelector('input[name="milkOption"]:checked');
    if (milk && milk.value.includes('Oat')) unit += 15000;
  }

  // Topping (ບວກສະເພາະເມື່ອ allowTopping ເປັນ true)
  if (item.allowTopping === true) {
    if (document.getElementById('addonExtraShot')?.checked) unit += 12000;
  }

  document.getElementById('modalItemBasePrice').textContent = formatLAK(unit);
  document.getElementById('modalDynamicTotal').textContent = formatLAK(unit * modalQuantity);
  return unit;
}

function confirmAddToCart() {
  const item = activeCustomizingItem;
  if (!item) return;

  const unit = updateModalPrice() || 35000;
  const note = document.getElementById('modalItemSpecialNote')?.value.trim() || '';

  cart.push({
    cartItemId: 'item_' + Date.now(),
    id: item.id,
    name: item.name,
    variant: selectedVariant,
    sweetness: item.allowSweetness !== false ? selectedSweetnessLevel : null,
    milk: item.allowMilk === true ? (document.querySelector('input[name="milkOption"]:checked')?.value || 'Whole Milk') : null,
    note: note,
    quantity: modalQuantity,
    unitPrice: unit,
    totalPrice: unit * modalQuantity
  });

  localStorage.setItem('ladolce_cart', JSON.stringify(cart));
  const badge = document.getElementById('cartBadgeCount');
  if (badge) badge.textContent = cart.reduce((s, i) => s + i.quantity, 0);

  closeCustomizeModal();
  alert(`ເພີ່ມ "${item.name}" ໃສ່ກະຕ່າແລ້ວ!`);
}

// ໂຫຼດທັນທີ
loadMenuItemsOnce();
