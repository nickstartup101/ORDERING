// =======================================================
// MENU CURATION & CUSTOMIZATION MODAL ENGINE
// =======================================================

let activeCustomizingItem = null;
let selectedVariant = 'standard';
let modalQuantity = 1;

function filterCategory(cat) {
  currentCategoryFilter = cat;
  document.querySelectorAll('.cat-pill').forEach(btn => {
    btn.className = 'cat-pill px-4 py-2 rounded-lg text-[12px] font-medium shrink-0 bg-surface-pure border border-hairline text-taupe hover:text-charcoal';
  });
  if (event && event.target) {
    event.target.className = 'cat-pill active-cat px-4 py-2 rounded-lg text-[12px] font-medium shrink-0 bg-forest-emerald text-white';
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
    let minPrice = 35000;
    if (item.variants) {
      const valid = Object.values(item.variants).filter(v => typeof v === 'number' && v > 0);
      if (valid.length > 0) minPrice = Math.min(...valid);
    }

    const card = document.createElement('div');
    card.className = 'bg-surface-pure border border-hairline rounded-xl p-3.5 flex flex-col justify-between hover:border-forest-leaf transition-all shadow-xs';
    card.innerHTML = `
      <div>
        <div class="relative w-full aspect-[4/3] rounded-lg bg-surface-dim overflow-hidden mb-3">
          <img src="${item.image || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600'}" class="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"/>
          <span class="absolute top-2 left-2 px-2 py-0.5 rounded bg-surface/90 text-[9px] uppercase font-bold border border-hairline">${item.category}</span>
        </div>
        <h4 class="font-serif-title text-[15px] text-primary font-medium mb-1">${item.name}</h4>
        <p class="text-[12px] text-taupe line-clamp-2 mb-3 leading-relaxed">${item.desc || ''}</p>
      </div>
      <div class="flex items-center justify-between pt-2.5 border-t border-hairline">
        <span class="font-serif-title text-[15px] font-bold text-forest-emerald">${formatLAK(minPrice)}</span>
        <button onclick="openCustomizeModal('${item.id}')" class="px-3.5 py-1.5 rounded-lg bg-surface hover:bg-forest-emerald hover:text-white border border-hairline text-[11px] font-medium transition-all">ເລືອກ</button>
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
  document.getElementById('modalItemImage').src = activeCustomizingItem.image;

  const container = document.getElementById('variantButtonsGrid');
  container.innerHTML = '';
  const v = activeCustomizingItem.variants || {};
  const list = [];
  if (v.standard) list.push({ key: 'standard', label: 'ມາດຕະຖານ', price: v.standard });
  if (v.hot) list.push({ key: 'hot', label: 'ຮ້ອນ', price: v.hot });
  if (v.iced) list.push({ key: 'iced', label: 'ເຢັນ', price: v.iced });
  if (v.frappe) list.push({ key: 'frappe', label: 'ປັ່ນ', price: v.frappe });
  if (list.length === 0) list.push({ key: 'standard', label: 'ມາດຕະຖານ', price: 35000 });

  selectedVariant = list[0].key;
  list.forEach(varItem => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `p-2.5 rounded-lg border text-left flex flex-col justify-between ${varItem.key === selectedVariant ? 'border-forest-emerald bg-forest-emerald/10 font-bold' : 'border-hairline bg-surface-pure'}`;
    btn.onclick = () => { selectedVariant = varItem.key; openCustomizeModal(itemId); };
    btn.innerHTML = `<span class="text-[11px]">${varItem.label}</span><span class="font-serif-title font-bold text-forest-emerald">${formatLAK(varItem.price)}</span>`;
    container.appendChild(btn);
  });

  const price = activeCustomizingItem.variants?.[selectedVariant] || 35000;
  document.getElementById('modalItemBasePrice').textContent = formatLAK(price);
  document.getElementById('modalDynamicTotal').textContent = formatLAK(price * modalQuantity);
  document.getElementById('customizeModal').classList.remove('hidden');
}

function closeCustomizeModal() {
  document.getElementById('customizeModal').classList.add('hidden');
}

function adjustModalQty(delta) {
  modalQuantity = Math.max(1, modalQuantity + delta);
  document.getElementById('modalQtyDisplay').textContent = modalQuantity;
  const price = activeCustomizingItem.variants?.[selectedVariant] || 35000;
  document.getElementById('modalDynamicTotal').textContent = formatLAK(price * modalQuantity);
}
