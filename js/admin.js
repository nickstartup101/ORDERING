// 1. Turnaround Speed Insights (Fastest vs Slowest)
function renderAnalytics() {
  const fastestContainer = document.getElementById('analyticsFastestMenu');
  const slowestContainer = document.getElementById('analyticsSlowestMenu');
  const totalRevEl = document.getElementById('metricTotalSales');

  if (!fastestContainer || !slowestContainer) return;

  // Sort Menu by preparation time
  const sorted = [...menuItems].sort((a, b) => (a.avgPrepMinutes || 5) - (b.avgPrepMinutes || 5));
  const fastest = sorted.slice(0, 2);
  const slowest = sorted.slice(-2).reverse();

  fastestContainer.innerHTML = fastest.map(item => `
    <div class="p-3 bg-emerald-50/60 border border-emerald-200 rounded flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <img src="${item.image}" class="w-10 h-10 rounded object-cover border border-emerald-200"/>
        <div>
          <span class="font-medium text-emerald-950 text-[13px] block">${item.name}</span>
          <span class="text-[11px] text-emerald-700 font-lao">ສະເລ່ຍ: ~${item.avgPrepMinutes || 3.5} ນາທີ</span>
        </div>
      </div>
      <span class="text-[11px] uppercase tracking-wider font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">ໄວ (Fast)</span>
    </div>
  `).join('');

  slowestContainer.innerHTML = slowest.map(item => `
    <div class="p-3 bg-amber-50/60 border border-amber-200 rounded flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <img src="${item.image}" class="w-10 h-10 rounded object-cover border border-amber-200"/>
        <div>
          <span class="font-medium text-amber-950 text-[13px] block">${item.name}</span>
          <span class="text-[11px] text-amber-800 font-lao">ສະເລ່ຍ: ~${item.avgPrepMinutes || 9.5} ນາທີ</span>
        </div>
      </div>
      <span class="text-[11px] uppercase tracking-wider font-bold text-amber-900 bg-white px-2 py-0.5 rounded border border-amber-200">ຊ້າ (Bottleneck)</span>
    </div>
  `).join('');

  const completed = orders.filter(o => o.status === 'completed');
  const revenue = completed.reduce((sum, o) => sum + o.total, 0);
  totalRevEl.textContent = `$${revenue.toFixed(2)}`;
}

// 2. Menu Management (Edit existing items & Image Upload < 1MB)
let editingItemId = null;
let currentUploadedMenuImageBase64 = null;

function openAddMenuModal(itemId = null) {
  editingItemId = itemId;
  const modal = document.getElementById('addMenuModal');
  const title = document.getElementById('addMenuModalTitle');
  const form = document.getElementById('menuForm');
  const preview = document.getElementById('menuImagePreview');

  form.reset();
  currentUploadedMenuImageBase64 = null;
  preview.classList.add('hidden');

  if (itemId) {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;

    title.textContent = t('edit_item');
    document.getElementById('inputItemName').value = item.name;
    document.getElementById('inputItemCategory').value = item.category;
    document.getElementById('inputItemDesc').value = item.desc;
    document.getElementById('priceHot').value = item.variants.hot || '';
    document.getElementById('priceIced').value = item.variants.iced || '';
    document.getElementById('priceFrappe').value = item.variants.frappe || '';
    document.getElementById('inputPrepTime').value = item.avgPrepMinutes || 5;

    currentUploadedMenuImageBase64 = item.image;
    preview.src = item.image;
    preview.classList.remove('hidden');
  } else {
    title.textContent = t('add_item');
  }

  modal.classList.remove('hidden');
}

function handleMenuImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  // Validation: Max 1MB
  if (file.size > 1024 * 1024) {
    alert("ຮູບພາບຕ້ອງມີຂະໜາດບໍ່ເກີນ 1MB! (File exceeds 1MB limit)");
    e.target.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = function(evt) {
    currentUploadedMenuImageBase64 = evt.target.result;
    const preview = document.getElementById('menuImagePreview');
    preview.src = currentUploadedMenuImageBase64;
    preview.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

function saveMenuItem(e) {
  e.preventDefault();
  if (!currentUploadedMenuImageBase64) {
    alert("ກະລຸນາອັບໂຫຼດຮູບພາບເມນູ (ບໍ່ເກີນ 1MB)!");
    return;
  }

  const name = document.getElementById('inputItemName').value;
  const category = document.getElementById('inputItemCategory').value;
  const desc = document.getElementById('inputItemDesc').value;
  const pHot = parseFloat(document.getElementById('priceHot').value) || null;
  const pIced = parseFloat(document.getElementById('priceIced').value) || null;
  const pFrappe = parseFloat(document.getElementById('priceFrappe').value) || null;
  const prepTime = parseFloat(document.getElementById('inputPrepTime').value) || 5;

  if (editingItemId) {
    // Update existing item
    const idx = menuItems.findIndex(i => i.id === editingItemId);
    if (idx !== -1) {
      menuItems[idx] = {
        ...menuItems[idx],
        name, category, desc,
        variants: { hot: pHot, iced: pIced, frappe: pFrappe },
        image: currentUploadedMenuImageBase64,
        avgPrepMinutes: prepTime
      };
    }
  } else {
    // Create new item
    const newItem = {
      id: 'item_' + Date.now(),
      name, category, desc,
      variants: { hot: pHot, iced: pIced, frappe: pFrappe },
      image: currentUploadedMenuImageBase64,
      avgPrepMinutes: prepTime
    };
    menuItems.unshift(newItem);
  }

  localStorage.setItem('ladolce_menu', JSON.stringify(menuItems));
  renderMenu();
  renderAdminMenu();
  renderAnalytics();
  closeAddMenuModal();
  showToast("ບັນທຶກເມນູຮຽບຮ້ອຍແລ້ວ!");
}

function renderAdminMenu() {
  const container = document.getElementById('adminMenuListGrid');
  if (!container) return;

  container.innerHTML = '';
  menuItems.forEach(item => {
    const card = document.createElement('div');
    card.className = 'p-3.5 bg-surface-pure border border-hairline rounded-lg flex items-center justify-between gap-3 shadow-xs';
    card.innerHTML = `
      <div class="flex items-center gap-3">
        <img src="${item.image}" class="w-12 h-12 rounded object-cover border border-hairline"/>
        <div>
          <h5 class="font-serif text-[14px] text-primary font-medium leading-tight">${item.name}</h5>
          <span class="text-[10px] uppercase tracking-wider text-taupe font-lao">${item.category} • ~${item.avgPrepMinutes || 5}m</span>
          <p class="text-[11px] font-mono text-charcoal">
            ${item.variants.hot ? 'H: $' + item.variants.hot : ''}
            ${item.variants.iced ? ' | I: $' + item.variants.iced : ''}
            ${item.variants.frappe ? ' | F: $' + item.variants.frappe : ''}
          </p>
        </div>
      </div>
      <div class="flex items-center gap-1.5">
        <button onclick="openAddMenuModal('${item.id}')" class="w-8 h-8 rounded border border-hairline hover:bg-surface text-primary flex items-center justify-center">
          <span class="material-symbols-outlined text-[16px]">edit</span>
        </button>
        <button onclick="deleteMenuItem('${item.id}')" class="w-8 h-8 rounded border border-hairline hover:bg-surface text-red-700 flex items-center justify-center">
          <span class="material-symbols-outlined text-[16px]">delete</span>
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

// 3. Modifier Management (Milk, Toppings)
function renderModifierSettings() {
  const list = document.getElementById('modifierAdminList');
  if (!list) return;

  list.innerHTML = modifiers.map(m => `
    <div class="p-2.5 bg-surface border border-hairline rounded flex items-center justify-between text-[12px]">
      <div>
        <span class="font-medium text-charcoal">${m.name}</span>
        <span class="text-[10px] uppercase tracking-wider text-taupe block font-mono">[Group: ${m.group}] +$${m.price.toFixed(2)}</span>
      </div>
      <button onclick="deleteModifier('${m.id}')" class="text-red-700 hover:underline text-[11px]">ລຶບ</button>
    </div>
  `).join('');
}

function addNewModifier() {
  const name = prompt("ປ້ອນຊື່ຕົວເລືອກເສີມ (ເຊັ່ນ: Oat Milk, Grass Jelly, Extra Shot):");
  if (!name) return;
  const group = prompt("ກຸ່ມຕົວເລືອກ (ພິມ 'milk' ຫຼື 'topping'):", "topping");
  const price = parseFloat(prompt("ລາຄາບວກເພີ່ມ ($):", "0.75")) || 0.00;

  const newMod = {
    id: "mod_" + Date.now(),
    name: name,
    group: group === "milk" ? "milk" : "topping",
    price: price
  };

  modifiers.push(newMod);
  localStorage.setItem('ladolce_modifiers', JSON.stringify(modifiers));
  renderModifierSettings();
  showToast("ເພີ່ມຕົວເລືອກເສີມສຳເລັດ");
}

function deleteModifier(id) {
  modifiers = modifiers.filter(m => m.id !== id);
  localStorage.setItem('ladolce_modifiers', JSON.stringify(modifiers));
  renderModifierSettings();
}
