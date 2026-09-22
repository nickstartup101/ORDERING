// =======================================================
// MENU CURATION & BULLETPROOF CUSTOMIZER (100% NULL-SAFE)
// =======================================================

let currentCategoryFilter = 'all';
let activeCustomizingItem = null;
let selectedVariant = 'standard';
let selectedSweetnessLevel = '100%';
let modalQuantity = 1;

function filterCategory(cat) {
  currentCategoryFilter = cat;
  document.querySelectorAll('.cat-pill').forEach(btn => {
    btn.className = 'cat-pill px-4 py-2 rounded-lg text-[12px] font-medium shrink-0 bg-surface-pure border border-hairline text-taupe hover:text-charcoal transition-all';
  });
  if (event && event.target) {
    event.target.className = 'cat-pill active-cat px-4 py-2 rounded-lg text-[12px] font-medium shrink-0 bg-forest-emerald text-white transition-all';
  }
  renderMenu();
}

function renderMenu() {
  const grid = document.getElementById('menuGrid');
  if (!grid) return;

  const filtered = currentCategoryFilter === 'all' 
    ? menuItems 
    : menuItems.filter(i => i.category === currentCategoryFilter);

  grid.innerHTML = '';

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="col-span-full p-8 text-center text-taupe bg-surface-pure rounded-xl border border-hairline">ບໍ່ມີເມນູໃນໝວດໝູ່ນີ້</div>`;
    return;
  }

  filtered.forEach(item => {
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

    const card = document.createElement('div');
    card.className = `bg-surface-pure border border-hairline rounded-xl p-3.5 flex flex-col justify-between transition-all shadow-xs ${isAvail ? 'hover:border-forest-leaf' : 'opacity-60 bg-gray-50'}`;
    card.innerHTML = `
      <div>
        <div class="relative w-full aspect-[4/3] rounded-lg bg-surface-dim overflow-hidden mb-3">
          <img src="${item.image || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600'}" class="w-full h-full object-cover ${!isAvail ? 'grayscale' : 'transform hover:scale-105 transition-transform duration-500'}"/>
          <span class="absolute top-2 left-2 px-2 py-0.5 rounded bg-surface/90 text-[9px] uppercase font-bold border border-hairline">${item.category || 'coffee'}</span>
          ${!isAvail ? `<span class="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-[12px] font-bold font-lao">ສິນຄ້າໝົດຊົ່ວຄາວ</span>` : ''}
        </div>
        <h4 class="font-serif-title text-[15px] text-primary font-medium mb-1">${item.name}</h4>
        <p class="text-[12px] text-taupe line-clamp-2 mb-3 leading-relaxed">${item.desc || ''}</p>
      </div>
      <div class="flex items-center justify-between pt-2.5 border-t border-hairline">
        <span class="font-serif-title text-[15px] font-bold ${isAvail ? 'text-forest-emerald' : 'text-gray-400'}">${formatLAK(minPrice)}</span>
        ${isAvail ? `
          <button type="button" onclick="openCustomizeModal('${item.id}')" class="px-3.5 py-1.5 rounded-lg bg-surface hover:bg-forest-emerald hover:text-white border border-hairline text-[11px] font-medium transition-all">ເລືອກ</button>
        ` : `
          <span class="px-3 py-1 text-[11px] text-gray-400 bg-gray-100 rounded-lg">ໝົດ</span>
        `}
      </div>
    `;
    grid.appendChild(card);
  });
}

// 🔥 ຟັງຊັນເປີດ Customize Modal ແບບ Null-Safe 100%
function openCustomizeModal(itemId) {
  activeCustomizingItem = menuItems.find(i => i.id === itemId);
  if (!activeCustomizingItem || activeCustomizingItem.isAvailable === false) return;

  modalQuantity = 1;
  selectedSweetnessLevel = '100%';

  // Null-Safe Element Updating
  const qtyEl = document.getElementById('modalQtyDisplay');
  const titleEl = document.getElementById('modalItemTitle');
  const descEl = document.getElementById('modalItemDesc');
  const imgEl = document.getElementById('modalItemImage');

  if (qtyEl) qtyEl.textContent = modalQuantity;
  if (titleEl) titleEl.textContent = activeCustomizingItem.name;
  if (descEl) descEl.textContent = activeCustomizingItem.desc || '';
  if (imgEl) imgEl.src = activeCustomizingItem.image || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600';

  // Reset Topping Checkbox
  const extraShotEl = document.getElementById('addonExtraShot');
  if (extraShotEl) extraShotEl.checked = false;

  // Reset Milk Radio
  const defaultMilk = document.querySelector('input[name="milkOption"][value="Whole Milk"]');
  if (defaultMilk) defaultMilk.checked = true;

  // Render Variants List
  const container = document.getElementById('variantButtonsGrid');
  if (container) {
    container.innerHTML = '';
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

    list.forEach(varItem => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `variant-btn p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all ${varItem.key === selectedVariant ? 'border-forest-emerald bg-forest-emerald/10 font-bold' : 'border-hairline bg-surface-pure'}`;
      btn.dataset.key = varItem.key;
      btn.onclick = function() { selectVariantOption(varItem.key); };
      btn.innerHTML = `<span class="text-[11px]">${varItem.label}</span><span class="font-serif-title font-bold text-forest-emerald">${formatLAK(varItem.price)}</span>`;
      container.appendChild(btn);
    });
  }

  // ເຊື່ອງ/ສະແດງ Options ຕາມທີ່ Admin ຕັ້ງຄ່າ
  const milkSection = document.getElementById('milkSelectorGroup');
  if (milkSection) {
    milkSection.classList.toggle('hidden', activeCustomizingItem.allowMilk === false || activeCustomizingItem.category === 'bakery' || activeCustomizingItem.category === 'refresher');
  }

  const sweetSection = document.getElementById('sweetnessSelectorGroup');
  if (sweetSection) {
    sweetSection.classList.toggle('hidden', activeCustomizingItem.allowSweetness === false || activeCustomizingItem.category === 'bakery');
  }

  const toppingSection = document.getElementById('toppingSelectorGroup');
  if (toppingSection) {
    toppingSection.classList.toggle('hidden', activeCustomizingItem.allowTopping === false || activeCustomizingItem.category === 'bakery');
  }

  // Reset Sweetness Buttons
  document.querySelectorAll('.sweet-btn').forEach(b => {
    b.className = 'sweet-btn py-1.5 rounded text-[11px] text-taupe font-medium';
    if (b.textContent.trim() === '100%') {
      b.className = 'sweet-btn py-1.5 rounded text-[11px] bg-forest-emerald text-white font-medium';
    }
  });

  // ຄິດໄລ່ລາຄາ (Null-safe)
  updateModalPrice();
  
  document.getElementById('customizeModal')?.classList.remove('hidden');
}

function selectVariantOption(key) {
  selectedVariant = key;
  document.querySelectorAll('.variant-btn').forEach(btn => {
    if (btn.dataset.key === key) {
      btn.className = 'variant-btn p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all border-forest-emerald bg-forest-emerald/10 font-bold';
    } else {
      btn.className = 'variant-btn p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all border-hairline bg-surface-pure';
    }
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

// 🔥 ແກ້ໄຂແຖວທີ 224: Null-Safe 100% ບໍ່ມີ Error ອີກເລີຍ
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

  // 1. ບວກຄ່ານົມ
  if (activeCustomizingItem.allowMilk !== false) {
    const milkRadio = document.querySelector('input[name="milkOption"]:checked');
    if (milkRadio && (milkRadio.value.includes('Oat') || milkRadio.value.includes('Almond'))) {
      const oatMod = (typeof modifiers !== 'undefined') ? modifiers.find(m => m.id === 'mod_oat') : null;
      unitPrice += (oatMod ? oatMod.price : 15000);
    }
  }

  // 2. ບວກຄ່າ Extra Shot
  const extraShot = document.getElementById('addonExtraShot')?.checked;
  if (extraShot && activeCustomizingItem.allowTopping !== false) {
    const shotMod = (typeof modifiers !== 'undefined') ? (modifiers.find(m => m.id === 'mod_shot') || modifiers.find(m => m.group === 'topping')) : null;
    unitPrice += (shotMod ? shotMod.price : 12000);
  }

  // 🔥 ກວດສອບກ່ອນ set textContent ປ້ອງກັນ crash 100%
  const basePriceEl = document.getElementById('modalItemBasePrice');
  const dynamicTotalEl = document.getElementById('modalDynamicTotal');

  if (basePriceEl) {
    basePriceEl.textContent = formatLAK(unitPrice);
  }
  if (dynamicTotalEl) {
    dynamicTotalEl.textContent = formatLAK(unitPrice * modalQuantity);
  }
}
