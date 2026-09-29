// =======================================================
// SMART CATEGORY MATCHER (ແກ້ໄຂບັນຫາເມນູບໍ່ຕົງໝວດໝູ່ 100%)
// =======================================================

// 1. ຟັງຊັນກວດສອບໝວດໝູ່ແບບອັດສະລິຍະ (ຮອງຮັບທັງລາວ ແລະ ອັງກິດ)
function isMatchingCategory(itemCat, filter) {
  if (!filter || filter === 'all') return true;
  
  const c = String(itemCat || '').toLowerCase().trim();
  const f = String(filter).toLowerCase().trim();

  // ຖ້າຊື່ກົງກັນກົງໆ
  if (c === f) return true;

  // ໝວດ ຊາ & ມັດຊະ (Tea / Matcha)
  if (f === 'tea' && (c.includes('tea') || c.includes('matcha') || c.includes('ຊາ') || c.includes('ມັດຊະ'))) {
    return true;
  }

  // ໝວດ ກາເຟ (Coffee / Espresso)
  if (f === 'coffee' && (c.includes('coffee') || c.includes('espresso') || c.includes('latte') || c.includes('ກາເຟ'))) {
    return true;
  }

  // ໝວດ Refresher & ໂຊດາ
  if (f === 'refresher' && (c.includes('refresher') || c.includes('soda') || c.includes('spark') || c.includes('ໂຊດາ') || c.includes('ນ້ຳ'))) {
    return true;
  }

  // ໝວດ ເບເກີຣີ່ & ອາຫານ (Bakery / Food / Croissant)
  if (f === 'bakery' && (c.includes('bakery') || c.includes('food') || c.includes('cake') || c.includes('croissant') || c.includes('ເຂົ້າຈີ່') || c.includes('ເບເກີຣີ່') || c.includes('ອາຫານ'))) {
    return true;
  }

  return false;
}

// 2. Render Menu Card
function renderMenu() {
  const grid = document.getElementById('menuGrid');
  if (!grid) return;

  const list = window.menuItems || [];

  // ກັ່ນຕອງເມນູດ້ວຍ Smart Category Matcher
  const filtered = list.filter(item => isMatchingCategory(item.category, window.currentCategoryFilter));

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full p-8 text-center text-taupe bg-surface-pure rounded-xl border border-hairline font-lao">
        <p class="text-[14px] font-bold text-primary mb-1">ບໍ່ມີເມນູໃນໝວດນີ້</p>
        <button type="button" onclick="filterCategory('all')" class="mt-2 px-3 py-1.5 rounded-lg bg-surface border border-hairline text-forest-emerald text-[12px] font-bold">
          ກົດເບິ່ງ "ທັງໝົດ"
        </button>
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
                 alt="${item.name}"
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

// 3. ປ່ຽນໝວດໝູ່
function filterCategory(cat) {
  window.currentCategoryFilter = cat;
  
  // ອັບເດດສີປຸ່ມ Category Pill
  document.querySelectorAll('.cat-pill').forEach(btn => {
    btn.className = 'cat-pill px-4 py-2 rounded-lg text-[12px] font-medium shrink-0 bg-surface-pure border border-hairline text-taupe hover:text-charcoal transition-all';
  });

  if (window.event && window.event.target) {
    const t = window.event.target.closest('.cat-pill');
    if (t) t.className = 'cat-pill active-cat px-4 py-2 rounded-lg text-[12px] font-medium shrink-0 bg-forest-emerald text-white transition-all';
  } else {
    // ຖ້າບໍ່ມີ event ໃຫ້ໄຮໄລ້ປຸ່ມ 'all' ອັດຕະໂນມັດ
    const defaultBtn = document.querySelector('.cat-pill');
    if (defaultBtn && cat === 'all') {
      defaultBtn.className = 'cat-pill active-cat px-4 py-2 rounded-lg text-[12px] font-medium shrink-0 bg-forest-emerald text-white transition-all';
    }
  }

  renderMenu();
}
