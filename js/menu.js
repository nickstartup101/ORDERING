// =======================================================
// LA DOLCE — SMART FIRESTORE MENU LOADER (100% AUTO-SYNC)
// =======================================================

window.menuItems = [];
window.currentCategoryFilter = 'all';
window.activeCustomizingItem = null;
window.selectedVariant = 'standard';
window.selectedSweetnessLevel = '100%';
window.modalQuantity = 1;

function formatLAK(val) {
  return Number(val || 0).toLocaleString('lo-LA') + ' ₭';
}

// 🔥 1. ຟັງຊັນດຶງເມນູຈາກ Firestore ແບບກວດຫາ Collection ອັດຕະໂນມັດ
async function fetchMenuFromFirestore() {
  console.log("🔍 ກຳລັງເລີ່ມດຶງເມນູຈາກ Firestore...");

  if (typeof firebase === 'undefined' || !firebase.firestore) {
    console.error("❌ ບໍ່ພົບ Firebase SDK! ກະລຸນາກວດສອບໄຟລ໌ config.js");
    return;
  }

  const db = firebase.firestore();
  
  // ລາຍຊື່ Collection ທີ່ອາດຈະຖືກໃຊ້
  const possibleCollections = ['menus', 'menu', 'menuItems', 'items'];
  let foundCollection = null;
  let snapshot = null;

  for (const colName of possibleCollections) {
    try {
      const snap = await db.collection(colName).get();
      if (!snap.empty) {
        foundCollection = colName;
        snapshot = snap;
        console.log(`✅ ພົບເມນູໃນ Collection: "${colName}" (ຈຳນວນ ${snap.size} ລາຍການ)`);
        break;
      }
    } catch (e) {
      console.warn(`ກວດສອບ collection "${colName}" ບໍ່ສຳເລັດ:`, e.message);
    }
  }

// 🔥 ຟັງຊັນສະແດງປຸ່ມສ້າງເມນູຕົວຢ່າງເຂົ້າ Firebase ທັນທີ
function showEmptyMenuMessage() {
  const grid = document.getElementById('menuGrid');
  if (grid) {
    grid.innerHTML = `
      <div class="col-span-full p-8 text-center bg-surface-pure rounded-2xl border border-hairline space-y-4 max-w-md mx-auto shadow-xs">
        <span class="w-14 h-14 rounded-full bg-forest-emerald/10 text-forest-emerald flex items-center justify-center mx-auto">
          <span class="material-symbols-outlined text-[32px]">coffee</span>
        </span>
        <div>
          <h4 class="font-serif-title text-[18px] text-primary font-bold">ຍັງບໍ່ມີເມນູໃນຖານຂໍ້ມູນ Firestore</h4>
          <p class="text-[12px] text-taupe mt-1">ກົດປຸ່ມດ້ານລຸ່ມນີ້ ເພື່ອສ້າງເມນູຕົວຢ່າງ (ກາເຟ, ຊາ, ເບເກີຣີ່) ເຂົ້າລະບົບທັນທີ</p>
        </div>
        
        <button type="button" onclick="seedSampleMenus()" class="w-full py-3 rounded-xl bg-forest-emerald hover:bg-forest-leaf text-white text-[13px] font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer">
          <span class="material-symbols-outlined text-[18px]">add_circle</span>
          <span>+ ສ້າງເມນູຕົວຢ່າງ 5 ລາຍການດຽວນີ້</span>
        </button>
      </div>
    `;
  }
}

// 🔥 ຟັງຊັນບັນທຶກເມນູຕົວຢ່າງລົງ Firestore ອັດຕະໂນມັດ
async function seedSampleMenus() {
  const sampleItems = [
    {
      name: "Downtown Dirty Latte",
      category: "coffee",
      price: 45000,
      desc: "ນົມສົດເຢັນຈັດ ສູດພິເສດ ທັອບດ້ວຍເອັສເປຣສໂຊຊັອດເຂັ້ມຂຸ້ນ",
      image: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600",
      allowHot: false,
      allowIced: true,
      allowFrappe: false,
      allowMilk: true,
      allowSweetness: true,
      allowTopping: true,
      isAvailable: true,
      variants: { standard: 45000, iced: 45000 }
    },
    {
      name: "Classic Iced Americano",
      category: "coffee",
      price: 35000,
      desc: "ກາເຟອາຣາບິກ້າແທ້ 100% ຄົ່ວລະດັບກາງ ຫອມລະມຸນ ສົດຊື່ນ",
      image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600",
      allowHot: true,
      allowIced: true,
      allowFrappe: false,
      allowMilk: false,
      allowSweetness: true,
      allowTopping: true,
      isAvailable: true,
      variants: { standard: 35000, hot: 35000, iced: 40000 }
    },
    {
      name: "Kyoto Uji Matcha Latte",
      category: "tea",
      price: 42000,
      desc: "ມັດຊະແທ້ 100% ຈາກເມືອງອູຈິ ປະເທດຍີ່ປຸ່ນ ຕີສົດໆຈອກຕໍ່ຈອກ",
      image: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600",
      allowHot: true,
      allowIced: true,
      allowFrappe: true,
      allowMilk: true,
      allowSweetness: true,
      allowTopping: true,
      isAvailable: true,
      variants: { standard: 42000, hot: 42000, iced: 45000, frappe: 50000 }
    },
    {
      name: "Peach & Berry Sparkler",
      category: "refresher",
      price: 38000,
      desc: "ໂຊດາພີຊປະສົມສະຕໍເບີຣີ່ສົດ ສົດຊື່ນດັບຮ້ອນ",
      image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600",
      allowHot: false,
      allowIced: true,
      allowFrappe: false,
      allowMilk: false,
      allowSweetness: true,
      allowTopping: false,
      isAvailable: true,
      variants: { standard: 38000, iced: 38000 }
    },
    {
      name: "French Butter Croissant",
      category: "bakery",
      price: 28000,
      desc: "ຄົວຊອງເນີຍຝຣັ່ງແທ້ ອົບສົດໃໝ່ທຸກເຊົ້າ ກອບນອກນຸ້ມໃນ",
      image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600",
      allowHot: false,
      allowIced: false,
      allowFrappe: false,
      allowMilk: false,
      allowSweetness: false,
      allowTopping: false,
      isAvailable: true,
      variants: { standard: 28000 }
    }
  ];

  try {
    const btn = event.target.closest('button');
    if (btn) btn.innerHTML = "<span>ກຳລັງສ້າງເມນູ...</span>";

    const db = firebase.firestore();
    for (const item of sampleItems) {
      await db.collection('menus').add({
        ...item,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }

    alert("🎉 ສ້າງເມນູຕົວຢ່າງ 5 ລາຍການເຂົ້າ Firebase ສຳເລັດແລ້ວ!");
    fetchMenuFromFirestore(); // ດຶງມາສະແດງທັນທີ
  } catch (err) {
    alert("ເກີດຂໍ້ຜິດພາດ: " + err.message);
  }
}

  // 🔥 ແປງຂໍ້ມູນ (Normalize) ໃຫ້ເຂົ້າກັບລະບົບ 100% ບໍ່ວ່າຈະຕັ້ງຊື່ Field ແນວໃດ
  const loadedItems = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    
    // ແປງຊື່ Field ໃຫ້ອັດຕະໂນມັດ
    const item = {
      id: doc.id,
      name: data.name || data.itemName || data.title || 'ບໍ່ມີຊື່',
      category: (data.category || data.cat || 'coffee').toLowerCase(),
      desc: data.desc || data.description || '',
      image: data.image || data.img || data.imageUrl || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500',
      price: Number(data.price || data.itemPrice || data.standardPrice || 35000),
      isAvailable: data.isAvailable !== false,
      allowHot: data.allowHot !== false,
      allowIced: data.allowIced !== false,
      allowFrappe: data.allowFrappe === true,
      allowMilk: data.allowMilk !== false,
      allowSweetness: data.allowSweetness !== false,
      allowTopping: data.allowTopping !== false,
      variants: data.variants || { standard: Number(data.price || 35000) }
    };

    loadedItems.push(item);
  });

  window.menuItems = loadedItems;
  localStorage.setItem('ladolce_menu_cache', JSON.stringify(loadedItems));
  renderMenu();

  // ເປີດ Realtime Listener ຕາມ Collection ທີ່ພົບ
  db.collection(foundCollection).onSnapshot(liveSnap => {
    const updated = [];
    liveSnap.forEach(d => {
      const dData = d.data();
      updated.push({
        id: d.id,
        name: dData.name || dData.itemName || dData.title || 'ບໍ່ມີຊື່',
        category: (dData.category || dData.cat || 'coffee').toLowerCase(),
        desc: dData.desc || dData.description || '',
        image: dData.image || dData.img || dData.imageUrl || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500',
        price: Number(dData.price || dData.itemPrice || 35000),
        isAvailable: dData.isAvailable !== false,
        variants: dData.variants || { standard: Number(dData.price || 35000) }
      });
    });
    window.menuItems = updated;
    renderMenu();
  });
}

function showEmptyMenuMessage() {
  const grid = document.getElementById('menuGrid');
  if (grid) {
    grid.innerHTML = `
      <div class="col-span-full p-8 text-center bg-surface-pure rounded-xl border border-hairline space-y-3">
        <span class="material-symbols-outlined text-[40px] text-taupe">restaurant_menu</span>
        <h4 class="font-serif-title text-[16px] text-primary">ຍັງບໍ່ມີເມນູໃນຖານຂໍ້ມູນ Firestore</h4>
        <p class="text-[12px] text-taupe font-lao">ກະລຸນາເຂົ້າໜ້າ Superadmin ແລ້ວກົດ "+ ເພີ່ມເມນູໃໝ່" ເພື່ອເລີ່ມຕົ້ນ</p>
      </div>
    `;
  }
}

// 2. Render Menu Card
function renderMenu() {
  const grid = document.getElementById('menuGrid');
  if (!grid) return;

  const list = window.menuItems || [];
  const filtered = window.currentCategoryFilter === 'all' 
    ? list 
    : list.filter(i => i.category === window.currentCategoryFilter);

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="col-span-full p-8 text-center text-taupe bg-surface-pure rounded-xl border border-hairline">ບໍ່ມີເມນູໃນໝວດນີ້</div>`;
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
            <img src="${item.image}" 
                 alt="${item.name}"
                 loading="${index < 4 ? 'eager' : 'lazy'}" 
                 decoding="async" 
                 class="w-full h-full object-cover ${!isAvail ? 'grayscale' : 'hover:scale-105 transition-transform duration-500'}"/>
            ${!isAvail ? `<span class="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-[12px] font-bold">ໝົດຊົ່ວຄາວ</span>` : ''}
          </div>
          <h4 class="font-serif-title text-[15px] text-primary font-medium mb-1">${item.name}</h4>
          <p class="text-[12px] text-taupe line-clamp-2 mb-3 leading-relaxed">${item.desc || ''}</p>
        </div>
        <div class="flex items-center justify-between pt-2.5 border-t border-hairline">
          <span class="font-serif-title text-[15px] font-bold ${isAvail ? 'text-forest-emerald' : 'text-gray-400'}">${formatLAK(minPrice)}</span>
          ${isAvail ? `
            <button type="button" onclick="openCustomizeModal('${item.id}')" class="px-3.5 py-1.5 rounded-lg bg-surface hover:bg-forest-emerald hover:text-white border border-hairline text-[11px] font-medium transition-all cursor-pointer">ເລືອກ</button>
          ` : `<span class="px-3 py-1 text-[11px] text-gray-400 bg-gray-100 rounded-lg">ໝົດ</span>`}
        </div>
      </div>
    `;
  }).join('');
}

function filterCategory(cat) {
  window.currentCategoryFilter = cat;
  document.querySelectorAll('.cat-pill').forEach(btn => {
    btn.className = 'cat-pill px-4 py-2 rounded-lg text-[12px] font-medium shrink-0 bg-surface-pure border border-hairline text-taupe hover:text-charcoal transition-all';
  });
  if (window.event && window.event.target) {
    const t = window.event.target.closest('.cat-pill');
    if (t) t.className = 'cat-pill active-cat px-4 py-2 rounded-lg text-[12px] font-medium shrink-0 bg-forest-emerald text-white transition-all';
  }
  renderMenu();
}

// 3. Customize Modal
function openCustomizeModal(itemId) {
  window.activeCustomizingItem = (window.menuItems || []).find(i => String(i.id) === String(itemId));
  if (!window.activeCustomizingItem) return;

  const item = window.activeCustomizingItem;
  window.modalQuantity = 1;
  window.selectedSweetnessLevel = '100%';

  const noteInput = document.getElementById('modalItemSpecialNote');
  if (noteInput) noteInput.value = '';

  document.getElementById('modalQtyDisplay').textContent = window.modalQuantity;
  document.getElementById('modalItemTitle').textContent = item.name;
  document.getElementById('modalItemDesc').textContent = item.desc || '';
  document.getElementById('modalItemImage').src = item.image;

  // Variants
  const container = document.getElementById('variantButtonsGrid');
  if (container) {
    const v = item.variants || {};
    const baseP = item.price || 35000;
    const list = [];

    if (item.allowHot !== false && (v.hot || baseP)) list.push({ key: 'hot', label: 'ຮ້ອນ', price: v.hot || baseP });
    if (item.allowIced !== false && (v.iced || baseP)) list.push({ key: 'iced', label: 'ເຢັນ', price: v.iced || (baseP + 5000) });
    if (item.allowFrappe === true && v.frappe) list.push({ key: 'frappe', label: 'ປັ່ນ', price: v.frappe });
    if (list.length === 0) list.push({ key: 'standard', label: 'ມາດຕະຖານ', price: baseP });

    window.selectedVariant = list[0].key;
    container.innerHTML = list.map(vItem => `
      <button type="button" onclick="selectVariantOption('${vItem.key}')" data-key="${vItem.key}" class="variant-btn p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all ${vItem.key === window.selectedVariant ? 'border-forest-emerald bg-forest-emerald/10 font-bold' : 'border-hairline bg-surface-pure'}">
        <span class="text-[11px]">${vItem.label}</span>
        <span class="font-serif-title font-bold text-forest-emerald">${formatLAK(vItem.price)}</span>
      </button>
    `).join('');
  }

  const isBakery = item.category === 'bakery';
  document.getElementById('milkSelectorGroup')?.classList.toggle('hidden', item.allowMilk === false || isBakery);
  document.getElementById('sweetnessSelectorGroup')?.classList.toggle('hidden', item.allowSweetness === false || isBakery);
  document.getElementById('toppingSelectorGroup')?.classList.toggle('hidden', item.allowTopping === false || isBakery);

  updateModalPrice();
  document.getElementById('customizeModal')?.classList.remove('hidden');
}

function selectVariantOption(key) {
  window.selectedVariant = key;
  document.querySelectorAll('.variant-btn').forEach(btn => {
    btn.className = `variant-btn p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all ${btn.dataset.key === key ? 'border-forest-emerald bg-forest-emerald/10 font-bold' : 'border-hairline bg-surface-pure'}`;
  });
  updateModalPrice();
}

function selectSweetness(btn, level) {
  window.selectedSweetnessLevel = level;
  document.querySelectorAll('.sweet-btn').forEach(b => b.className = 'sweet-btn py-1.5 rounded text-[11px] text-taupe font-medium');
  btn.className = 'sweet-btn py-1.5 rounded text-[11px] bg-forest-emerald text-white font-medium';
}

function closeCustomizeModal() {
  document.getElementById('customizeModal')?.classList.add('hidden');
}

function adjustModalQty(delta) {
  window.modalQuantity = Math.max(1, window.modalQuantity + delta);
  document.getElementById('modalQtyDisplay').textContent = window.modalQuantity;
  updateModalPrice();
}

function updateModalPrice() {
  const item = window.activeCustomizingItem;
  if (!item) return 0;

  let unit = item.price || 35000;
  if (item.variants && item.variants[window.selectedVariant]) {
    unit = item.variants[window.selectedVariant];
  }

  const milk = document.querySelector('input[name="milkOption"]:checked');
  if (milk && milk.value.includes('Oat')) unit += 15000;
  if (document.getElementById('addonExtraShot')?.checked) unit += 12000;

  document.getElementById('modalItemBasePrice').textContent = formatLAK(unit);
  document.getElementById('modalDynamicTotal').textContent = formatLAK(unit * window.modalQuantity);
  return unit;
}

function confirmAddToCart() {
  const item = window.activeCustomizingItem;
  if (!item) return;

  const unit = updateModalPrice() || 35000;
  const note = document.getElementById('modalItemSpecialNote')?.value.trim() || '';

  const cartObj = {
    cartItemId: 'item_' + Date.now(),
    id: item.id,
    name: item.name,
    variant: window.selectedVariant,
    sweetness: window.selectedSweetnessLevel,
    note: note,
    quantity: window.modalQuantity,
    unitPrice: unit,
    totalPrice: unit * window.modalQuantity
  };

  window.cart = window.cart || [];
  window.cart.push(cartObj);

  const count = window.cart.reduce((s, i) => s + i.quantity, 0);
  const badge = document.getElementById('cartBadgeCount');
  if (badge) badge.textContent = count;

  closeCustomizeModal();
  alert(`ເພີ່ມ "${item.name}" ໃສ່ກະຕ່າແລ້ວ!`);
}

// ເລີ່ມໂຫຼດເມນູ
document.addEventListener('DOMContentLoaded', () => {
  // ລອງດຶງ Cache ເດີມມາກ່ອນ
  const cached = localStorage.getItem('ladolce_menu_cache');
  if (cached) {
    try {
      window.menuItems = JSON.parse(cached);
      renderMenu();
    } catch(e) {}
  }
  // ດຶງຂໍ້ມູນສົດຈາກ Firestore ທັນທີ
  fetchMenuFromFirestore();
});
