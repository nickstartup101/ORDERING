// =======================================================
// MENU ENGINE (SAFE SCOPE - ZERO CRASH - INSTANT LOAD)
// =======================================================

// ປ້ອງກັນ SyntaxError: ດຶງຄ່າເກົ່າຖ້າມີ, ຖ້າບໍ່ມີຈຶ່ງສ້າງໃໝ່
window.menuItems = window.menuItems || [
  { id: 'm1', name: 'Espresso Intenso', category: 'coffee', price: 35000, desc: 'ກາເຟເຂັ້ມຂຸ້ນ ສະກັດສົດ', allowHot: true, allowIced: false, isAvailable: true, image: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=500' },
  { id: 'm2', name: 'Dirty Latte', category: 'coffee', price: 45000, desc: 'ນົມເຢັນຈັດ ທັອບດ້ວຍເອັສເປຣສໂຊຊັອດ', allowHot: false, allowIced: true, isAvailable: true, image: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500' },
  { id: 'm3', name: 'Uji Matcha Latte', category: 'tea', price: 42000, desc: 'ມັດຊະແທ້ 100% ນຳເຂົ້າຈາກກຽວໂຕ', allowHot: true, allowIced: true, isAvailable: true, image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=500' },
  { id: 'm4', name: 'Classic Croissant', category: 'bakery', price: 28000, desc: 'ຄົວຊອງເນີຍຝຣັ່ງ ແປ້ງກອບນອກນຸ້ມໃນ', allowMilk: false, allowSweetness: false, allowTopping: false, isAvailable: true, image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500' }
];

window.currentCategoryFilter = 'all';
window.activeCustomizingItem = null;
window.selectedVariant = 'standard';
window.selectedSweetnessLevel = '100%';
window.modalQuantity = 1;

function formatLAK(val) {
  return Number(val || 0).toLocaleString('lo-LA') + ' ₭';
}

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
      const v = Object.values(item.variants).filter(p => typeof p === 'number' && p > 0);
      if (v.length > 0) minPrice = Math.min(...v);
    }

    return `
      <div class="bg-surface-pure border border-hairline rounded-xl p-3.5 flex flex-col justify-between shadow-xs ${isAvail ? 'hover:border-forest-leaf' : 'opacity-60 bg-gray-50'}">
        <div>
          <div class="relative w-full aspect-[4/3] rounded-lg bg-surface-dim overflow-hidden mb-3">
            <img src="${item.image || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500'}" 
                 loading="${index < 4 ? 'eager' : 'lazy'}" 
                 decoding="async" 
                 class="w-full h-full object-cover ${!isAvail ? 'grayscale' : 'hover:scale-105 transition-transform duration-500'}"/>
            ${!isAvail ? `<span class="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-[12px] font-bold">ໝົດຊົ່ວຄາວ</span>` : ''}
          </div>
          <h4 class="font-serif-title text-[15px] text-primary font-medium mb-1">${item.name}</h4>
          <p class="text-[12px] text-taupe line-clamp-2 mb-3">${item.desc || ''}</p>
        </div>
        <div class="flex items-center justify-between pt-2.5 border-t border-hairline">
          <span class="font-serif-title text-[15px] font-bold ${isAvail ? 'text-forest-emerald' : 'text-gray-400'}">${formatLAK(minPrice)}</span>
          ${isAvail ? `
            <button type="button" onclick="openCustomizeModal('${item.id}')" class="px-3.5 py-1.5 rounded-lg bg-surface hover:bg-forest-emerald hover:text-white border border-hairline text-[11px] font-medium transition-all">ເລືອກ</button>
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

function openCustomizeModal(itemId) {
  window.activeCustomizingItem = (window.menuItems || []).find(i => String(i.id) === String(itemId));
  if (!window.activeCustomizingItem) return;

  window.modalQuantity = 1;
  window.selectedSweetnessLevel = '100%';

  const noteInput = document.getElementById('modalItemSpecialNote');
  if (noteInput) noteInput.value = '';

  const item = window.activeCustomizingItem;
  document.getElementById('modalQtyDisplay').textContent = window.modalQuantity;
  document.getElementById('modalItemTitle').textContent = item.name;
  document.getElementById('modalItemDesc').textContent = item.desc || '';
  document.getElementById('modalItemImage').src = item.image || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500';

  // Variants Generator
  const container = document.getElementById('variantButtonsGrid');
  if (container) {
    const v = item.variants || {};
    const baseP = typeof v === 'number' ? v : (v.standard || item.price || 35000);
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

  // Toggle Visibility
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
    const isSel = btn.dataset.key === key;
    btn.className = `variant-btn p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all ${isSel ? 'border-forest-emerald bg-forest-emerald/10 font-bold' : 'border-hairline bg-surface-pure'}`;
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
  if (!item) return;

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
    note: note, // 👈 Remark
    quantity: window.modalQuantity,
    unitPrice: unit,
    totalPrice: unit * window.modalQuantity
  };

  window.cart = window.cart || [];
  window.cart.push(cartObj);

  // Update Badge
  const count = window.cart.reduce((s, i) => s + i.quantity, 0);
  const badge = document.getElementById('cartBadgeCount');
  if (badge) badge.textContent = count;

  closeCustomizeModal();
  alert(`ເພີ່ມ "${item.name}" ໃສ່ກະຕ່າແລ້ວ!`);
}

// ໂຫຼດເມນູທັນທີເມື່ອເປີດໜ້າ
document.addEventListener('DOMContentLoaded', () => {
  renderMenu(); // ແຕ້ມທັນທີ 0.01 ວິນາທີ

  // Sync Firebase ເບື້ອງຫຼັງ
  if (typeof firebase !== 'undefined' && firebase.firestore) {
    firebase.firestore().collection('menus').onSnapshot(snap => {
      if (!snap.empty) {
        const list = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() }));
        window.menuItems = list;
        renderMenu();
      }
    }, err => console.log("Firebase sync fallback to local."));
  }
});
