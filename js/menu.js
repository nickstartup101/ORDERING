// ==========================================
// MENU RENDERING ENGINE (NULL-SAFE)
// ==========================================

let currentCategoryFilter = 'all';
let activeCustomizingItem = null;
let selectedVariant = 'hot';
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
  if (!grid) return; // ປ້ອງກັນ Crash ຖ້າບໍ່ມີ grid

  // ແກ້ຈຸດນີ້: ກວດສອບກ່ອນວ່າ element ມີແທ້ບໍ່ ຖ້າບໍ່ມີກໍບໍ່ໃຫ້ Error
  const countLabel = document.getElementById('itemCountLabel');
  
  const filtered = currentCategoryFilter === 'all' 
    ? menuItems 
    : menuItems.filter(i => i.category === currentCategoryFilter);

  if (countLabel) {
    countLabel.textContent = `${filtered.length} ລາຍການພ້ອມບໍລິການ`;
  }

  grid.innerHTML = '';

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full p-8 text-center text-taupe text-[13px] bg-surface-pure rounded-xl border border-hairline">
        ບໍ່ມີເມນູໃນໝວດໝູ່ນີ້
      </div>
    `;
    return;
  }

  filtered.forEach(item => {
    // ຫາລາຄາເລີ່ມຕົ້ນ
    let minPrice = 4.50;
    if (item.variants) {
      const validPrices = Object.values(item.variants).filter(v => typeof v === 'number' && !isNaN(v) && v > 0);
      if (validPrices.length > 0) {
        minPrice = Math.min(...validPrices);
      }
    }

    const card = document.createElement('div');
    card.className = 'bg-surface-pure border border-hairline rounded-xl p-3.5 flex flex-col justify-between hover:border-forest-leaf transition-all shadow-xs';
    card.innerHTML = `
      <div>
        <div class="relative w-full aspect-[4/3] rounded-lg bg-surface-dim overflow-hidden mb-3">
          <img src="${item.image || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80'}" alt="${item.name}" class="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"/>
          <span class="absolute top-2 left-2 px-2 py-0.5 rounded bg-surface/90 backdrop-blur-xs text-[9px] uppercase tracking-wider text-charcoal font-bold border border-hairline">
            ${item.category}
          </span>
        </div>
        <h4 class="font-serif-title text-[15px] text-primary leading-snug font-medium mb-1">${item.name}</h4>
        <p class="text-[12px] text-taupe font-light line-clamp-2 leading-relaxed mb-3">${item.desc || ''}</p>
      </div>
      <div class="flex items-center justify-between pt-2.5 border-t border-hairline">
        <div>
          <span class="text-[10px] text-taupe block font-lao leading-none">ເລີ່ມຕົ້ນ</span>
          <span class="font-serif-title text-[15px] font-bold text-forest-emerald">$${minPrice.toFixed(2)}</span>
        </div>
        <button onclick="openCustomizeModal('${item.id}')" class="px-3.5 py-1.5 rounded-lg bg-surface hover:bg-forest-emerald hover:text-white border border-hairline text-charcoal text-[11px] font-medium tracking-wider uppercase transition-all flex items-center gap-1 font-lao">
          <span class="material-symbols-outlined text-[14px]">add</span>
          <span>ເລືອກ</span>
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
}

function openCustomizeModal(itemId) {
  activeCustomizingItem = menuItems.find(i => i.id === itemId);
  if (!activeCustomizingItem) return;

  modalQuantity = 1;
  document.getElementById('modalQtyDisplay').textContent = modalQuantity;
  document.getElementById('modalItemTitle').textContent = activeCustomizingItem.name;
  document.getElementById('modalItemDesc').textContent = activeCustomizingItem.desc || '';
  document.getElementById('modalItemImage').src = activeCustomizingItem.image || '';

  const variantContainer = document.getElementById('variantButtonsGrid');
  variantContainer.innerHTML = '';

  const v = activeCustomizingItem.variants || {};
  const availableVariants = [];
  
  if (activeCustomizingItem.type === 'food') {
    if (v.standard) availableVariants.push({ key: 'standard', label: 'ປົກກະຕິ (Standard)', price: v.standard, icon: 'bakery_dining' });
    if (v.warmed) availableVariants.push({ key: 'warmed', label: 'ອຸ່ນຮ້ອນ (Warmed)', price: v.warmed, icon: 'microwave' });
    if (v.setbox) availableVariants.push({ key: 'setbox', label: 'ກ່ອງ Set Box', price: v.setbox, icon: 'inventory_2' });
  } else {
    if (v.hot) availableVariants.push({ key: 'hot', label: 'ຮ້ອນ (Hot)', price: v.hot, icon: 'coffee' });
    if (v.iced) availableVariants.push({ key: 'iced', label: 'ເຢັນ (Iced)', price: v.iced, icon: 'icecream' });
    if (v.frappe) availableVariants.push({ key: 'frappe', label: 'ປັ່ນ (Frappe)', price: v.frappe, icon: 'blender' });
  }

  if (availableVariants.length === 0) {
    availableVariants.push({ key: 'standard', label: 'ມາດຕະຖານ', price: 4.50, icon: 'coffee' });
  }

  selectedVariant = availableVariants[0].key;

  availableVariants.forEach(variant => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `variant-pill p-2.5 rounded-lg border text-left transition-all flex flex-col justify-between ${variant.key === selectedVariant ? 'border-forest-emerald bg-forest-emerald/10 font-bold' : 'border-hairline bg-surface-pure hover:border-hairline-dark'}`;
    btn.onclick = () => selectVariant(variant.key);
    btn.innerHTML = `
      <div class="flex items-center gap-1.5 text-primary mb-1">
        <span class="material-symbols-outlined text-[16px]">${variant.icon}</span>
        <span class="text-[11px] font-medium font-lao">${variant.label}</span>
      </div>
      <span class="font-serif-title text-[13px] font-bold text-forest-emerald">$${variant.price.toFixed(2)}</span>
    `;
    variantContainer.appendChild(btn);
  });

  const milkGroup = document.getElementById('milkSelectorGroup');
  if (activeCustomizingItem.type === 'food' || activeCustomizingItem.category === 'bakery') {
    if (milkGroup) milkGroup.classList.add('hidden');
  } else {
    if (milkGroup) milkGroup.classList.remove('hidden');
  }

  updateModalPrice();
  document.getElementById('customizeModal').classList.remove('hidden');
}

function selectVariant(key) {
  selectedVariant = key;
  const container = document.getElementById('variantButtonsGrid');
  if (!container) return;
  container.querySelectorAll('.variant-pill').forEach(btn => {
    btn.className = 'variant-pill p-2.5 rounded-lg border border-hairline bg-surface-pure text-left transition-all flex flex-col justify-between';
  });
  if (event && event.currentTarget) {
    event.currentTarget.className = 'variant-pill p-2.5 rounded-lg border-2 border-forest-emerald bg-forest-emerald/10 text-left transition-all flex flex-col justify-between font-bold';
  }
  updateModalPrice();
}

function selectSweetness(btn, level) {
  selectedSweetnessLevel = level;
  document.querySelectorAll('.sweet-btn').forEach(b => {
    b.className = 'sweet-btn py-1.5 rounded text-[11px] text-taupe font-medium';
  });
  btn.className = 'sweet-btn py-1.5 rounded text-[11px] bg-forest-emerald text-white font-medium';
}

function adjustModalQty(delta) {
  modalQuantity = Math.max(1, modalQuantity + delta);
  document.getElementById('modalQtyDisplay').textContent = modalQuantity;
  updateModalPrice();
}

function updateModalPrice() {
  if (!activeCustomizingItem) return;
  let unitPrice = activeCustomizingItem.variants?.[selectedVariant] || 4.50;

  const milkRadio = document.querySelector('input[name="milkOption"]:checked');
  if (milkRadio && (milkRadio.value.includes('Oat') || milkRadio.value.includes('Almond'))) {
    unitPrice += 0.75;
  }

  if (document.getElementById('addonExtraShot')?.checked) unitPrice += 1.20;

  const total = unitPrice * modalQuantity;
  const dynamicTotal = document.getElementById('modalDynamicTotal');
  const basePrice = document.getElementById('modalItemBasePrice');
  if (dynamicTotal) dynamicTotal.textContent = `$${total.toFixed(2)}`;
  if (basePrice) basePrice.textContent = `$${unitPrice.toFixed(2)}`;
}

function closeCustomizeModal() {
  const modal = document.getElementById('customizeModal');
  if (modal) modal.classList.add('hidden');
}
