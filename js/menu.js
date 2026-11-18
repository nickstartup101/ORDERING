ັ// =======================================================
// LA DOLCE — FAST MENU ENGINE (2 COLUMNS + CACHE)
// =======================================================

let currentCategoryFilter = 'all';
let activeCustomizingItem = null;
let selectedVariant = 'standard';
let selectedSweetnessLevel = '100%';
let modalQuantity = 1;
let menuUnsubscribe = null;

const MENU_CACHE_KEY = 'ladolce_menu_cache_v2';

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

function renderMenuSkeleton() {
  const grid = document.getElementById('menuGrid');
  if (!grid) return;
  grid.className = 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4';
  grid.innerHTML = Array(6).fill(0).map(() => `
    <div class="bg-surface-pure border border-hairline rounded-xl p-2.5 sm:p-3.5 animate-pulse space-y-2.5">
      <div class="w-full aspect-square rounded-lg bg-surface-dim"></div>
      <div class="h-4 bg-surface-dim rounded w-3/4"></div>
      <div class="h-3 bg-surface-dim rounded w-1/2"></div>
      <div class="h-7 bg-surface-dim rounded w-full mt-2"></div>
    </div>
  `).join('');
}

function renderMenu() {
  const grid = document.getElementById('menuGrid');
  if (!grid) return;

  // ບັງຄັບສະແດງເປັນ 2 ຄໍລັ້ມເທິງມືຖື ແລະ ປັບຂະໜາດກາດໃຫ້ພໍດີ
  grid.className = 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4';

  const list = menuItems || [];
  const filtered = list.filter(item => isMatchingCategory(item.category, currentCategoryFilter));

  if (filtered.length === 0) {
    if (list.length === 0) {
      renderMenuSkeleton();
      return;
    }
    grid.innerHTML = `
      <div class="col-span-full p-8 text-center text-taupe bg-surface-pure rounded-xl border border-hairline font-lao space-y-2">
        <div class="w-10 h-10 mx-auto rounded-full bg-surface flex items-center justify-center text-taupe">${svgIcon('coffee', 'w-5 h-5')}</div>
        <p class="text-[14px] font-bold text-primary">ບໍ່ມີເມນູໃນໝວດນີ້</p>
        <button type="button" onclick="filterCategory('all')" class="px-4 py-1.5 rounded-lg bg-surface border border-hairline text-forest-emerald text-[12px] font-bold cursor-pointer">ກົດເບິ່ງ "ທັງໝົດ"</button>
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
      <div onclick="${isAvail ? `openCustomizeModal('${item.id}')` : ''}"
           class="bg-surface-pure border border-hairline rounded-xl p-2.5 sm:p-3.5 flex flex-col justify-between shadow-xs transition-all ${isAvail ? 'hover:border-forest-leaf cursor-pointer active:scale-[0.98]' : 'opacity-60 bg-gray-50'}">
        <div>
          <div class="relative w-full aspect-square rounded-lg bg-surface-dim overflow-hidden mb-2.5">
            <img src="${item.image || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400'}"
                 alt="${item.name}"
                 loading="${index < 4 ? 'eager' : 'lazy'}"
                 decoding="async"
                 class="w-full h-full object-cover ${!isAvail ? 'grayscale' : ''}"/>
            ${!isAvail ? `<span class="absolute inset-0 bg-black/45 flex items-center justify-center text-white text-[11px] font-bold font-lao">ໝົດຊົ່ວຄາວ</span>` : ''}
          </div>
          <h4 class="font-serif-title text-[13px] sm:text-[15px] text-primary font-semibold leading-snug line-clamp-2 mb-1">${item.name}</h4>
          <p class="text-[11px] text-taupe line-clamp-2 mb-2.5 leading-relaxed hidden sm:block">${item.desc || ''}</p>
        </div>
        <div class="flex items-center justify-between pt-2 border-t border-hairline gap-1.5">
          <span class="font-serif-title text-[12px] sm:text-[14px] font-bold truncate ${isAvail ? 'text-forest-emerald' : 'text-gray-400'}">${formatLAK(minPrice)}</span>
          ${isAvail ? `
            <button type="button" onclick="event.stopPropagation(); openCustomizeModal('${item.id}')"
                    class="w-7 h-7 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-lg bg-forest-emerald hover:bg-forest-leaf text-white flex items-center justify-center gap-1 text-[11px] font-medium transition-all cursor-pointer shrink-0">
              ${svgIcon('plus', 'w-3.5 h-3.5')}
              <span class="hidden sm:inline font-lao">ເລືອກ</span>
            </button>
          ` : `<span class="px-2 py-0.5 text-[10px] text-gray-400 bg-gray-100 rounded font-lao">ໝົດ</span>`}
        </div>
      </div>
    `;
  }).join('');
}

function filterCategory(cat) {
  currentCategoryFilter = cat;
  document.querySelectorAll('.cat-pill').forEach(btn => {
    btn.className = 'cat-pill px-4 py-2 rounded-lg text-[12px] font-medium shrink-0 bg-surface-pure border border-hairline text-taupe hover:text-charcoal transition-all cursor-pointer';
  });
  if (window.event && window.event.target) {
    const t = window.event.target.closest('.cat-pill');
    if (t) t.className = 'cat-pill active-cat px-4 py-2 rounded-lg text-[12px] font-medium shrink-0 bg-forest-emerald text-white transition-all cursor-pointer';
  }
  renderMenu();
}

function mapMenuDoc(doc) {
  const d = doc.data();
  return {
    id: doc.id,
    name: d.name || d.itemName || 'ບໍ່ມີຊື່',
    category: (d.category || d.cat || 'coffee').toLowerCase().trim(),
    desc: d.desc || '',
    image: d.image || d.imageUrl || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400',
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
}

// ໂຫຼດເມນູແບບໄວທີ່ສຸດ (Instant Cache + Single Realtime Sync)
function loadMenuItemsOnce() {
  // 1. ສະແດງຈາກ Cache ທັນທີ (0ms delay)
  const cachedRaw = localStorage.getItem(MENU_CACHE_KEY);
  if (cachedRaw) {
    try {
      const parsed = JSON.parse(cachedRaw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        menuItems = parsed;
        renderMenu();
      }
    } catch (_) {}
  } else {
    renderMenuSkeleton();
  }

  // 2. ດຶງ ແລະ Sync ຮອບດຽວຜ່ານ onSnapshot (ບໍ່ດຶງ get() ຊ້ຳຊ້ອນ)
  const firestore = db || (typeof firebase !== 'undefined' ? firebase.firestore() : null);
  if (!firestore) return;

  if (menuUnsubscribe) menuUnsubscribe();
  menuUnsubscribe = firestore.collection('menu_items').onSnapshot((liveSnap) => {
    const freshMenu = liveSnap.docs.map(mapMenuDoc);
    const freshJson = JSON.stringify(freshMenu);
    const oldJson = localStorage.getItem(MENU_CACHE_KEY);

    menuItems = freshMenu;
    if (freshJson !== oldJson) {
      try {
        localStorage.setItem(MENU_CACHE_KEY, freshJson);
      } catch (e) {
        // ກໍລະນີຮູບ Base64 ໃຫຍ່ເກີນໂຄຕ້າ localStorage ກໍຍັງສະແດງຜົນໄດ້ປົກກະຕິ
        console.warn('Cache storage quota skipped:', e.message);
      }
      renderMenu();
    } else if (!cachedRaw) {
      renderMenu();
    }
  }, (err) => {
    console.error("Menu snapshot error:", err);
  });
}

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

  const container = document.getElementById('variantButtonsGrid');
  if (container) {
    const v = item.variants || {};
    const baseP = item.price || 35000;
    const list = [];

    if (item.allowHot === true && (v.hot || baseP)) list.push({ key: 'hot', label: 'ຮ້ອນ', price: v.hot || baseP });
    if (item.allowIced === true && (v.iced || baseP)) list.push({ key: 'iced', label: 'ເຢັນ', price: v.iced || baseP });
    if (item.allowFrappe === true && v.frappe) list.push({ key: 'frappe', label: 'ປັ່ນ', price: v.frappe });

    if (list.length === 0) list.push({ key: 'standard', label: 'ມາດຕະຖານ', price: baseP });

    selectedVariant = list[0].key;
    container.innerHTML = list.map(vItem => `
      <button type="button" onclick="selectVariantOption('${vItem.key}')" data-key="${vItem.key}"
              class="variant-btn p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${vItem.key === selectedVariant ? 'border-forest-emerald bg-forest-emerald/10 font-bold' : 'border-hairline bg-surface-pure'}">
        <span class="text-[11px] font-lao">${vItem.label}</span>
        <span class="font-serif-title font-bold text-forest-emerald text-[12px]">${formatLAK(vItem.price)}</span>
      </button>
    `).join('');
  }

  const milkSection = document.getElementById('milkSelectorGroup');
  if (milkSection) {
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

  const defaultMilk = document.querySelector('input[name="milkOption"][value="Whole Milk"]');
  if (defaultMilk) defaultMilk.checked = true;

  const extraShot = document.getElementById('addonExtraShot');
  if (extraShot) extraShot.checked = false;

  updateModalPrice();
  document.getElementById('customizeModal')?.classList.remove('hidden');
}

function selectVariantOption(key) {
  selectedVariant = key;
  document.querySelectorAll('.variant-btn').forEach(btn => {
    btn.className = `variant-btn p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${btn.dataset.key === key ? 'border-forest-emerald bg-forest-emerald/10 font-bold' : 'border-hairline bg-surface-pure'}`;
  });
  updateModalPrice();
}

function selectSweetness(btn, level) {
  selectedSweetnessLevel = level;
  document.querySelectorAll('.sweet-btn').forEach(b => b.className = 'sweet-btn py-1.5 rounded text-[11px] text-taupe font-medium cursor-pointer');
  btn.className = 'sweet-btn py-1.5 rounded text-[11px] bg-forest-emerald text-white font-medium cursor-pointer';
}

function closeCustomizeModal() {
  document.getElementById('customizeModal')?.classList.add('hidden');
}

function adjustModalQty(delta) {
  modalQuantity = Math.max(1, modalQuantity + delta);
  document.getElementById('modalQtyDisplay').textContent = modalQuantity;
  updateModalPrice();
}

function updateModalPrice() {
  const item = activeCustomizingItem;
  if (!item) return 0;

  const v = item.variants || {};
  let unit = item.price || 35000;

  if (v[selectedVariant]) unit = v[selectedVariant];
  else if (v.standard) unit = v.standard;

  if (item.allowMilk === true) {
    const milk = document.querySelector('input[name="milkOption"]:checked');
    if (milk && milk.value.includes('Oat')) unit += 15000;
  }

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
    cartItemId: 'item_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    id: item.id,
    name: item.name,
    image: item.image, // ເກັບຮູບສິນຄ້າໄວ້ສະແດງໃນໜ້າກະຕ່າ
    variant: selectedVariant,
    sweetness: item.allowSweetness !== false && item.category !== 'bakery' ? selectedSweetnessLevel : null,
    milk: item.allowMilk === true && item.category !== 'bakery' && item.category !== 'refresher'
      ? (document.querySelector('input[name="milkOption"]:checked')?.value || 'Whole Milk')
      : null,
    extraShot: item.allowTopping === true && document.getElementById('addonExtraShot')?.checked ? true : false,
    note: note,
    quantity: modalQuantity,
    unitPrice: unit,
    totalPrice: unit * modalQuantity
  });

  localStorage.setItem('ladolce_cart', JSON.stringify(cart));
  if (typeof updateCartBadge === 'function') updateCartBadge();

  closeCustomizeModal();
  if (typeof showAtelierToast === 'function') {
    showAtelierToast(`ເພີ່ມ "${item.name}" ໃສ່ກະຕ່າແລ້ວ`);
  }
}

loadMenuItemsOnce();
