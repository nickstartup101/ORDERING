// ລະບົບເມນູ ແລະ Modal ປັບແຕ່ງສິນຄ້າ
let currentCategoryFilter = 'all';
let activeCustomizingItem = null;
let selectedVariant = 'hot';
let selectedSweetnessLevel = '100%';
let modalQuantity = 1;

function filterCategory(cat) {
  currentCategoryFilter = cat;
  document.querySelectorAll('.cat-pill').forEach(btn => {
    btn.className = 'cat-pill px-4 py-2 rounded text-[12px] uppercase tracking-wider font-medium shrink-0 transition-colors bg-surface-pure border border-hairline text-taupe hover:text-charcoal';
  });
  event.target.className = 'cat-pill px-4 py-2 rounded text-[12px] uppercase tracking-wider font-medium shrink-0 transition-colors bg-primary text-white';
  renderMenu();
}

function renderMenu() {
  const grid = document.getElementById('menuGrid');
  const countLabel = document.getElementById('itemCountLabel');
  if (!grid) return;

  const filtered = currentCategoryFilter === 'all' 
    ? menuItems 
    : menuItems.filter(i => i.category === currentCategoryFilter);

  countLabel.textContent = `${filtered.length} ລາຍການພ້ອມບໍລິການ`;
  grid.innerHTML = '';

  filtered.forEach(item => {
    const prices = Object.values(item.variants).filter(v => v !== null);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 4.00;

    const card = document.createElement('div');
    card.className = 'bg-surface-pure border border-hairline rounded-lg p-3.5 flex flex-col justify-between hover:border-taupe-light transition-all shadow-xs';
    card.innerHTML = `
      <div>
        <div class="relative w-full aspect-[4/3] rounded bg-surface-dim overflow-hidden mb-3">
          <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"/>
          <span class="absolute top-2 left-2 px-2 py-0.5 rounded bg-surface/90 backdrop-blur-xs text-[9px] uppercase tracking-wider text-charcoal font-medium border border-hairline">
            ${item.category}
          </span>
        </div>
        <h4 class="font-serif text-[15px] text-primary leading-snug font-medium mb-1">${item.name}</h4>
        <p class="text-[12px] text-taupe font-light line-clamp-2 leading-relaxed mb-3">${item.desc}</p>
      </div>
      <div class="flex items-center justify-between pt-2.5 border-t border-hairline">
        <div>
          <span class="text-[10px] text-taupe block font-lao leading-none">ເລີ່ມຕົ້ນ</span>
          <span class="font-serif text-[15px] font-medium text-primary">$${minPrice.toFixed(2)}</span>
        </div>
        <button onclick="openCustomizeModal('${item.id}')" class="px-3.5 py-1.5 rounded bg-surface hover:bg-primary hover:text-white border border-hairline text-charcoal text-[11px] font-medium tracking-wider uppercase transition-all flex items-center gap-1 font-lao">
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
  document.getElementById('modalItemDesc').textContent = activeCustomizingItem.desc;
  document.getElementById('modalItemImage').src = activeCustomizingItem.image;

  const variantContainer = document.getElementById('variantButtonsGrid');
  variantContainer.innerHTML = '';

  const v = activeCustomizingItem.variants;
  const availableVariants = [];
  if (v.hot !== null && v.hot !== undefined) availableVariants.push({ key: 'hot', label: 'ຮ້ອນ (Hot)', price: v.hot, icon: 'coffee' });
  if (v.iced !== null && v.iced !== undefined) availableVariants.push({ key: 'iced', label: 'ເຢັນ (Iced)', price: v.iced, icon: 'icecream' });
  if (v.frappe !== null && v.frappe !== undefined) availableVariants.push({ key: 'frappe', label: 'ປັ່ນ (Frappe)', price: v.frappe, icon: 'blender' });

  selectedVariant = availableVariants[0] ? availableVariants[0].key : 'hot';

  availableVariants.forEach(variant => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `variant-pill p-2.5 rounded border text-left transition-all flex flex-col justify-between ${variant.key === selectedVariant ? 'border-primary bg-surface' : 'border-hairline bg-surface-pure hover:border-hairline-dark'}`;
    btn.onclick = () => selectVariant(variant.key);
    btn.innerHTML = `
      <div class="flex items-center gap-1.5 text-primary mb-1">
        <span class="material-symbols-outlined text-[16px]">${variant.icon}</span>
        <span class="text-[11px] font-medium font-lao">${variant.label}</span>
      </div>
      <span class="font-serif text-[13px] font-medium text-charcoal">$${variant.price.toFixed(2)}</span>
    `;
    variantContainer.appendChild(btn);
  });

  const milkGroup = document.getElementById('milkSelectorGroup');
  if (activeCustomizingItem.category === 'bakery') {
    milkGroup.classList.add('hidden');
  } else {
    milkGroup.classList.remove('hidden');
  }

  updateModalPrice();
  document.getElementById('customizeModal').classList.remove('hidden');
}

function selectVariant(key) {
  selectedVariant = key;
  const container = document.getElementById('variantButtonsGrid');
  container.querySelectorAll('.variant-pill').forEach(btn => {
    btn.className = 'variant-pill p-2.5 rounded border border-hairline bg-surface-pure text-left transition-all flex flex-col justify-between';
  });
  event.currentTarget.className = 'variant-pill p-2.5 rounded border-2 border-primary bg-surface text-left transition-all flex flex-col justify-between';
  updateModalPrice();
}

function selectSweetness(btn, level) {
  selectedSweetnessLevel = level;
  document.querySelectorAll('.sweet-btn').forEach(b => {
    b.className = 'sweet-btn py-1.5 rounded text-[11px] text-taupe font-medium';
  });
  btn.className = 'sweet-btn py-1.5 rounded text-[11px] bg-primary text-white font-medium';
}

function adjustModalQty(delta) {
  modalQuantity = Math.max(1, modalQuantity + delta);
  document.getElementById('modalQtyDisplay').textContent = modalQuantity;
  updateModalPrice();
}

function updateModalPrice() {
  if (!activeCustomizingItem) return;
  let unitPrice = activeCustomizingItem.variants[selectedVariant] || 4.50;

  const milkRadio = document.querySelector('input[name="milkOption"]:checked');
  if (milkRadio && (milkRadio.value.includes('Oat') || milkRadio.value.includes('Almond'))) {
    unitPrice += 0.75;
  }

  if (document.getElementById('addonExtraShot')?.checked) unitPrice += 1.20;
  if (document.getElementById('addonColdFoam')?.checked) unitPrice += 1.00;

  const total = unitPrice * modalQuantity;
  document.getElementById('modalDynamicTotal').textContent = `$${total.toFixed(2)}`;
  document.getElementById('modalItemBasePrice').textContent = `$${unitPrice.toFixed(2)}`;
}

function closeCustomizeModal() {
  document.getElementById('customizeModal').classList.add('hidden');
}
