// =======================================================
// MENU & CUSTOMIZER LOGIC (WITH REMARK & 100% NULL-SAFE)
// =======================================================

let menuItems = [];
let currentCategoryFilter = 'all';
let activeCustomizingItem = null;
let selectedVariant = 'standard';
let selectedSweetnessLevel = '100%';
let modalQuantity = 1;

function formatLAK(val) {
  return Number(val || 0).toLocaleString('lo-LA') + ' ₭';
}

function filterCategory(cat) {
  currentCategoryFilter = cat;
  document.querySelectorAll('.cat-pill').forEach(btn => {
    btn.className = 'cat-pill px-4 py-2 rounded-lg text-[12px] font-medium shrink-0 bg-surface-pure border border-hairline text-taupe hover:text-charcoal transition-all';
  });
  if (window.event && window.event.target) {
    const btn = window.event.target.closest('.cat-pill');
    if (btn) btn.className = 'cat-pill active-cat px-4 py-2 rounded-lg text-[12px] font-medium shrink-0 bg-forest-emerald text-white transition-all';
  }
  renderMenu();
}

function renderMenu() {
  const grid = document.getElementById('menuGrid');
  if (!grid) return;

  const filtered = currentCategoryFilter === 'all' 
    ? menuItems 
    : menuItems.filter(i => i.category === currentCategoryFilter);

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="col-span-full p-8 text-center text-taupe bg-surface-pure rounded-xl border border-hairline">ບໍ່ມີເມນູໃນໝວດໝູ່ນີ້</div>`;
    return;
  }

  grid.innerHTML = filtered.map((item, index) => {
    const isAvail = item.isAvailable !== false;
    let minPrice = 35000;
    if (typeof item.price === 'number') {
      minPrice = item.price;
    } else if (item.variants) {
      if (typeof item.variants === 'number') {
        minPrice = item.variants;
      } else {
        const valid = Object.values(item.variants).filter(v => typeof v === 'number' && v > 0);
        if (valid.length > 0) minPrice = Math.min(...valid);
      }
    }

    const imgLoading = index < 4 ? 'eager' : 'lazy';

    return `
      <div class="bg-surface-pure border border-hairline rounded-xl p-3.5 flex flex-col justify-between transition-all shadow-xs ${isAvail ? 'hover:border-forest-leaf' : 'opacity-60 bg-gray-50'}">
        <div>
          <div class="relative w-full aspect-[4/3] rounded-lg bg-surface-dim overflow-hidden mb-3">
            <img src="${item.image || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500'}" 
                 loading="${imgLoading}" 
                 decoding="async" 
                 class="w-full h-full object-cover ${!isAvail ? 'grayscale' : 'transform hover:scale-105 transition-transform duration-500'}"/>
            ${!isAvail ? `<span class="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-[12px] font-bold font-lao">ສິນຄ້າໝົດຊົ່ວຄາວ</span>` : ''}
          </div>
          <h4 class="font-serif-title text-[15px] text-primary font-medium mb-1">${item.name}</h4>
          <p class="text-[12px] text-taupe line-clamp-2 mb-3 leading-relaxed">${item.desc || ''}</p>
        </div>
        <div class="flex items-center justify-between pt-2.5 border-t border-hairline">
          <span class="font-serif-title text-[15px] font-bold ${isAvail ? 'text-forest-emerald' : 'text-gray-400'}">${formatLAK(minPrice)}</span>
          ${isAvail ? `
            <button type="button" onclick="openCustomizeModal('${item.id}')" class="px-3.5 py-1.5 rounded-lg bg-surface hover:bg-forest-emerald hover:text-white border border-hairline text-[11px] font-medium transition-all cursor-pointer">ເລືອກ</button>
          ` : `
            <span class="px-3 py-1 text-[11px] text-gray-400 bg-gray-100 rounded-lg">ໝົດ</span>
          `}
        </div>
      </div>
    `;
  }).join('');
}

function openCustomizeModal(itemId) {
  activeCustomizingItem = menuItems.find(i => String(i.id) === String(itemId));
  if (!activeCustomizingItem || activeCustomizingItem.isAvailable === false) return;

  modalQuantity = 1;
  selectedSweetnessLevel = '100%';

  // 🔥 1. ລ້າງຄ່າ Remark ເກົ່າອອກທຸກຄັ້ງທີ່ເປີດເມນູໃໝ່
  const noteInput = document.getElementById('modalItemSpecialNote');
  if (noteInput) noteInput.value = '';

  const qtyEl = document.getElementById('modalQtyDisplay');
  const titleEl = document.getElementById('modalItemTitle');
  const descEl = document.getElementById('modalItemDesc');
  const imgEl = document.getElementById('modalItemImage');

  if (qtyEl) qtyEl.textContent = modalQuantity;
  if (titleEl) titleEl.textContent = activeCustomizingItem.name;
  if (descEl) descEl.textContent = activeCustomizingItem.desc || '';
  if (imgEl) imgEl.src = activeCustomizingItem.image || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500';

  const extraShotEl = document.getElementById('addonExtraShot');
  if (extraShotEl) extraShotEl.checked = false;

  const defaultMilk = document.querySelector('input[name="milkOption"][value="Whole Milk"]');
  if (defaultMilk) defaultMilk.checked = true;

  // Variants Generator
  const container = document.getElementById('variantButtonsGrid');
  if (container) {
    const v = activeCustomizingItem.variants || {};
    const list = [];
    const baseP = typeof v === 'number' ? v : (v.standard || 35000);

    if (activeCustomizingItem.allowHot !== false && (v.hot || baseP)) {
      list.push({ key: 'hot', label: 'ຮ້ອນ', price: v.hot || baseP });
    }
    if (activeCustomizingItem.allowIced !== false && (v.iced || baseP)) {
      list.push({ key: 'iced', label: 'ເຢັນ', price: v.iced || (baseP + 5000) });
    }
    if (activeCustomizingItem.allowFrappe === true && v.frappe) {
      list.push({ key: 'frappe', label: 'ປັ່ນ', price: v.frappe });
    }
    if (list.length === 0) {
      list.push({ key: 'standard', label: 'ມາດຕະຖານ', price: baseP });
    }

    selectedVariant = list[0].key;

    container.innerHTML = list.map(varItem => `
      <button type="button" 
              onclick="selectVariantOption('${varItem.key}')" 
              data-key="${varItem.key}" 
              class="variant-btn p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all ${varItem.key === selectedVariant ? 'border-forest-emerald bg-forest-emerald/10 font-bold' : 'border-hairline bg-surface-pure'}">
        <span class="text-[11px]">${varItem.label}</span>
        <span class="font-serif-title font-bold text-forest-emerald">${formatLAK(varItem.price)}</span>
      </button>
    `).join('');
  }

  const isBakery = activeCustomizingItem.category === 'bakery';
  const isRefresher = activeCustomizingItem.category === 'refresher';

  document.getElementById('milkSelectorGroup')?.classList.toggle('hidden', activeCustomizingItem.allowMilk === false || isBakery || isRefresher);
  document.getElementById('sweetnessSelectorGroup')?.classList.toggle('hidden', activeCustomizingItem.allowSweetness === false || isBakery);
  document.getElementById('toppingSelectorGroup')?.classList.toggle('hidden', activeCustomizingItem.allowTopping === false || isBakery);

  document.querySelectorAll('.sweet-btn').forEach(b => {
    const isDefault = b.textContent.trim() === '100%';
    b.className = `sweet-btn py-1.5 rounded text-[11px] font-medium ${isDefault ? 'bg-forest-emerald text-white' : 'text-taupe'}`;
  });

  updateModalPrice();
  document.getElementById('customizeModal')?.classList.remove('hidden');
}

function selectVariantOption(key) {
  selectedVariant = key;
  document.querySelectorAll('.variant-btn').forEach(btn => {
    const isSelected = btn.dataset.key === key;
    btn.className = `variant-btn p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all ${isSelected ? 'border-forest-emerald bg-forest-emerald/10 font-bold' : 'border-hairline bg-surface-pure'}`;
  });
  updateModalPrice();
}

function selectSweetness(btn, level) {
  selectedSweetnessLevel = level;
  document.querySelectorAll('.sweet-btn').forEach(b => {
    b.className = 'sweet-btn py-1.5 rounded text-[11px] text-taupe font-medium';
  });
  btn.className = 'sweet-btn py-1.5 rounded text-[11px] bg-forest-emerald text-white font-medium';
}

function closeCustomizeModal() {
  document.getElementById('customizeModal')?.classList.add('hidden');
}

function adjustModalQty(delta) {
  modalQuantity = Math.max(1, modalQuantity + delta);
  const qtyEl = document.getElementById('modalQtyDisplay');
  if (qtyEl) qtyEl.textContent = modalQuantity;
  updateModalPrice();
}

function updateModalPrice() {
  if (!activeCustomizingItem) return;
  const v = activeCustomizingItem.variants || {};
  let unitPrice = 35000;

  if (typeof v === 'number') {
    unitPrice = v;
  } else if (v[selectedVariant]) {
    unitPrice = v[selectedVariant];
  } else if (v.standard) {
    unitPrice = v.standard;
  }

  if (activeCustomizingItem.allowMilk !== false) {
    const milkRadio = document.querySelector('input[name="milkOption"]:checked');
    if (milkRadio && (milkRadio.value.includes('Oat') || milkRadio.value.includes('Almond'))) {
      unitPrice += 15000;
    }
  }

  const extraShot = document.getElementById('addonExtraShot')?.checked;
  if (extraShot && activeCustomizingItem.allowTopping !== false) {
    unitPrice += 12000;
  }

  const basePriceEl = document.getElementById('modalItemBasePrice');
  const dynamicTotalEl = document.getElementById('modalDynamicTotal');

  if (basePriceEl) basePriceEl.textContent = formatLAK(unitPrice);
  if (dynamicTotalEl) dynamicTotalEl.textContent = formatLAK(unitPrice * modalQuantity);

  return unitPrice;
}

// 🔥 2. ກົດເພີ່ມລົງກະຕ່າ ພ້ອມດຶງຄ່າ REMARK ຕິດໄປນຳ 100%
function confirmAddToCart() {
  if (!activeCustomizingItem) return;

  const unitPrice = updateModalPrice() || 35000;
  const specialNote = document.getElementById('modalItemSpecialNote')?.value.trim() || '';
  const selectedMilk = document.querySelector('input[name="milkOption"]:checked')?.value || 'Whole Milk';
  const hasExtraShot = document.getElementById('addonExtraShot')?.checked || false;

  const cartItem = {
    cartItemId: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    id: activeCustomizingItem.id,
    name: activeCustomizingItem.name,
    category: activeCustomizingItem.category || 'coffee',
    image: activeCustomizingItem.image || '',
    variant: selectedVariant,
    sweetness: activeCustomizingItem.category === 'bakery' ? null : selectedSweetnessLevel,
    milk: (activeCustomizingItem.allowMilk !== false && activeCustomizingItem.category !== 'bakery') ? selectedMilk : null,
    hasExtraShot: hasExtraShot,
    note: specialNote, // 👈 🔥 ຈຸດສຳຄັນ: ບັນທຶກໝາຍເຫດ
    quantity: modalQuantity,
    unitPrice: unitPrice,
    totalPrice: unitPrice * modalQuantity
  };

  if (typeof addToCartStore === 'function') {
    addToCartStore(cartItem);
  }

  closeCustomizeModal();

  if (typeof showToast === 'function') {
    showToast(`ເພີ່ມ "${cartItem.name}" ໃສ່ກະຕ່າແລ້ວ`);
  }
}
