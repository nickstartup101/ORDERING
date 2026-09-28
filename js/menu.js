// =======================================================
// HIGH-PERFORMANCE MENU & CUSTOMIZER (FAST & NULL-SAFE)
// =======================================================

let currentCategoryFilter = 'all';
let activeCustomizingItem = null;
let selectedVariant = 'standard';
let selectedSweetnessLevel = '100%';
let modalQuantity = 1;

// 1. Cache Menu Items ເປັນ Map ເພື່ອດຶງຂໍ້ມູນໄວລະດັບ O(1)
let menuMap = new Map();
function initMenuCache() {
  if (typeof menuItems !== 'undefined') {
    menuMap = new Map(menuItems.map(item => [String(item.id), item]));
  }
}

// 2. Cache DOM Elements ທີ່ໃຊ້ເລື້ອຍໆ ບໍ່ໃຫ້ Query ໃໝ່ຕະຫຼອດເວລາ
const DOM = {
  grid: null,
  modal: null,
  qtyDisplay: null,
  title: null,
  desc: null,
  img: null,
  basePrice: null,
  dynamicTotal: null,
  variantGrid: null,
  milkGroup: null,
  sweetGroup: null,
  toppingGroup: null,
  extraShot: null,
  init() {
    this.grid = document.getElementById('menuGrid');
    this.modal = document.getElementById('customizeModal');
    this.qtyDisplay = document.getElementById('modalQtyDisplay');
    this.title = document.getElementById('modalItemTitle');
    this.desc = document.getElementById('modalItemDesc');
    this.img = document.getElementById('modalItemImage');
    this.basePrice = document.getElementById('modalItemBasePrice');
    this.dynamicTotal = document.getElementById('modalDynamicTotal');
    this.variantGrid = document.getElementById('variantButtonsGrid');
    this.milkGroup = document.getElementById('milkSelectorGroup');
    this.sweetGroup = document.getElementById('sweetnessSelectorGroup');
    this.toppingGroup = document.getElementById('toppingSelectorGroup');
    this.extraShot = document.getElementById('addonExtraShot');
  }
};

// ເອີ້ນເຮັດວຽກເມື່ອ DOM ພ້ອມ
document.addEventListener('DOMContentLoaded', () => {
  initMenuCache();
  DOM.init();
  setupMenuDelegation();
  renderMenu();
});

// 3. Event Delegation ສຳລັບການກົດເລືອກເມນູ (ໄວ ແລະ ປະຢັດ RAM)
function setupMenuDelegation() {
  if (!DOM.grid) return;
  DOM.grid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="customize"]');
    if (btn && btn.dataset.id) {
      openCustomizeModal(btn.dataset.id);
    }
  });
}

function filterCategory(cat, btnElement) {
  currentCategoryFilter = cat;
  
  // ອັບເດດ Style ປຸ່ມ Category
  document.querySelectorAll('.cat-pill').forEach(btn => {
    btn.className = 'cat-pill px-4 py-2 rounded-lg text-[12px] font-medium shrink-0 bg-surface-pure border border-hairline text-taupe hover:text-charcoal transition-all';
  });
  
  const targetBtn = btnElement || (event && event.target ? event.target.closest('.cat-pill') : null);
  if (targetBtn) {
    targetBtn.className = 'cat-pill active-cat px-4 py-2 rounded-lg text-[12px] font-medium shrink-0 bg-forest-emerald text-white transition-all';
  }
  
  renderMenu();
}

// 4. Render Menu ແບບ Batch Processing (ໂຫຼດໄວຫຼາຍ)
function renderMenu() {
  if (!DOM.grid) DOM.grid = document.getElementById('menuGrid');
  if (!DOM.grid || typeof menuItems === 'undefined') return;

  const filtered = currentCategoryFilter === 'all' 
    ? menuItems 
    : menuItems.filter(i => i.category === currentCategoryFilter);

  if (filtered.length === 0) {
    DOM.grid.innerHTML = `<div class="col-span-full p-8 text-center text-taupe bg-surface-pure rounded-xl border border-hairline">ບໍ່ມີເມນູໃນໝວດໝູ່ນີ້</div>`;
    return;
  }

  // ສ້າງ HTML ດ້ວຍ Array Join (ໄວກວ່າ appendChild ໃນ loop ເຖິງ 5-10 ເທົ່າ)
  const cardsHtml = filtered.map((item, index) => {
    const isAvail = item.isAvailable !== false;

    // ຄິດໄລ່ລາຄາເລີ່ມຕົ້ນ
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

    // ຮູບ 4 ອັນທຳອິດໃຫ້ໂຫຼດທັນທີ (eager), ສ່ວນທີ່ເຫຼືອໃຫ້ lazy load
    const imgLoading = index < 4 ? 'eager' : 'lazy';
    const fetchPriority = index < 2 ? 'fetchpriority="high"' : '';

    return `
      <div class="bg-surface-pure border border-hairline rounded-xl p-3.5 flex flex-col justify-between transition-all shadow-xs ${isAvail ? 'hover:border-forest-leaf' : 'opacity-60 bg-gray-50'}">
        <div>
          <div class="relative w-full aspect-[4/3] rounded-lg bg-surface-dim overflow-hidden mb-3">
            <img src="${item.image || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&q=75&auto=format'}" 
                 alt="${item.name}"
                 loading="${imgLoading}" 
                 ${fetchPriority}
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
            <button type="button" data-action="customize" data-id="${item.id}" class="px-3.5 py-1.5 rounded-lg bg-surface hover:bg-forest-emerald hover:text-white border border-hairline text-[11px] font-medium transition-all">ເລືອກ</button>
          ` : `
            <span class="px-3 py-1 text-[11px] text-gray-400 bg-gray-100 rounded-lg">ໝົດ</span>
          `}
        </div>
      </div>
    `;
  }).join('');

  DOM.grid.innerHTML = cardsHtml;
}

// 5. ເປີດ Modal ແບບ Instant (ດຶງຈາກ Map ບໍ່ມີຊັກຊ້າ)
function openCustomizeModal(itemId) {
  if (menuMap.size === 0) initMenuCache();
  activeCustomizingItem = menuMap.get(String(itemId));

  if (!activeCustomizingItem || activeCustomizingItem.isAvailable === false) return;

  modalQuantity = 1;
  selectedSweetnessLevel = '100%';

  if (DOM.qtyDisplay) DOM.qtyDisplay.textContent = modalQuantity;
  if (DOM.title) DOM.title.textContent = activeCustomizingItem.name;
  if (DOM.desc) DOM.desc.textContent = activeCustomizingItem.desc || '';
  if (DOM.img) DOM.img.src = activeCustomizingItem.image || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&q=75&auto=format';

  if (DOM.extraShot) DOM.extraShot.checked = false;
  const defaultMilk = document.querySelector('input[name="milkOption"][value="Whole Milk"]');
  if (defaultMilk) defaultMilk.checked = true;

  // Variants Generator
  if (DOM.variantGrid) {
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

    DOM.variantGrid.innerHTML = list.map(varItem => `
      <button type="button" 
              onclick="selectVariantOption('${varItem.key}')" 
              data-key="${varItem.key}" 
              class="variant-btn p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all ${varItem.key === selectedVariant ? 'border-forest-emerald bg-forest-emerald/10 font-bold' : 'border-hairline bg-surface-pure'}">
        <span class="text-[11px]">${varItem.label}</span>
        <span class="font-serif-title font-bold text-forest-emerald">${formatLAK(varItem.price)}</span>
      </button>
    `).join('');
  }

  // ສະແດງ/ເຊື່ອງ Options
  const isBakery = activeCustomizingItem.category === 'bakery';
  const isRefresher = activeCustomizingItem.category === 'refresher';

  if (DOM.milkGroup) DOM.milkGroup.classList.toggle('hidden', activeCustomizingItem.allowMilk === false || isBakery || isRefresher);
  if (DOM.sweetGroup) DOM.sweetGroup.classList.toggle('hidden', activeCustomizingItem.allowSweetness === false || isBakery);
  if (DOM.toppingGroup) DOM.toppingGroup.classList.toggle('hidden', activeCustomizingItem.allowTopping === false || isBakery);

  // Reset Sweetness Buttons
  document.querySelectorAll('.sweet-btn').forEach(b => {
    const isDefault = b.textContent.trim() === '100%';
    b.className = `sweet-btn py-1.5 rounded text-[11px] font-medium ${isDefault ? 'bg-forest-emerald text-white' : 'text-taupe'}`;
  });

  updateModalPrice();
  DOM.modal?.classList.remove('hidden');
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
  DOM.modal?.classList.add('hidden');
}

function adjustModalQty(delta) {
  modalQuantity = Math.max(1, modalQuantity + delta);
  if (DOM.qtyDisplay) DOM.qtyDisplay.textContent = modalQuantity;
  updateModalPrice();
}

// ຄິດໄລ່ລາຄາແບບ Cache-friendly & Null-Safe
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

  // 1. ຄ່ານົມ
  if (activeCustomizingItem.allowMilk !== false) {
    const milkRadio = document.querySelector('input[name="milkOption"]:checked');
    if (milkRadio && (milkRadio.value.includes('Oat') || milkRadio.value.includes('Almond'))) {
      unitPrice += 15000;
    }
  }

  // 2. Extra Shot
  if (DOM.extraShot?.checked && activeCustomizingItem.allowTopping !== false) {
    unitPrice += 12000;
  }

  if (DOM.basePrice) DOM.basePrice.textContent = formatLAK(unitPrice);
  if (DOM.dynamicTotal) DOM.dynamicTotal.textContent = formatLAK(unitPrice * modalQuantity);
}
