// ==========================================
// SUPERADMIN SUITE CONTROLLER
// ==========================================

// 1. ສະຫຼຸບຍອດຂາຍຕາມຊ່ວງເວລາ (Day, Week, Month)
let salesFilterPeriod = 'day'; // 'day' | 'week' | 'month'

function setSalesFilter(period) {
  salesFilterPeriod = period;
  document.querySelectorAll('.sales-filter-btn').forEach(btn => {
    btn.className = 'sales-filter-btn px-3 py-1.5 rounded text-[11px] font-medium border border-hairline bg-surface text-taupe hover:text-charcoal';
  });
  event.target.className = 'sales-filter-btn px-3 py-1.5 rounded text-[11px] font-medium border border-primary bg-primary text-white';
  renderAnalytics();
}

function renderAnalytics() {
  const totalSalesEl = document.getElementById('metricTotalSales');
  const totalOrdersEl = document.getElementById('metricTotalOrdersCount');
  const fastestContainer = document.getElementById('analyticsFastestMenu');
  const slowestContainer = document.getElementById('analyticsSlowestMenu');
  const customerFeedbackTable = document.getElementById('analyticsFeedbackTable');
  const periodLabel = document.getElementById('analyticsPeriodLabel');

  if (!totalSalesEl) return;

  // Filter completed orders
  const now = new Date();
  const completed = orders.filter(o => o.status === 'completed');

  let filteredOrders = completed.filter(o => {
    const oDate = new Date(o.createdAt || Date.now());
    const diffTime = Math.abs(now - oDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (salesFilterPeriod === 'day') return diffDays <= 1;
    if (salesFilterPeriod === 'week') return diffDays <= 7;
    if (salesFilterPeriod === 'month') return diffDays <= 30;
    return true;
  });

  const revenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
  totalSalesEl.textContent = `$${revenue.toFixed(2)}`;
  totalOrdersEl.textContent = `${filteredOrders.length} ອໍເດີ້`;
  periodLabel.textContent = salesFilterPeriod === 'day' ? 'ຍອດມື້ນີ້' : salesFilterPeriod === 'week' ? 'ຍອດອາທິດນີ້' : 'ຍອດເດືອນນີ້';

  // ວິເຄາະເມນູໄວ ແລະ ຊ້າ (Bottleneck Peak Hours & Day)
  const sorted = [...menuItems].sort((a, b) => (a.avgPrepMinutes || 5) - (b.avgPrepMinutes || 5));
  const fastest = sorted.slice(0, 2);
  const slowest = sorted.slice(-2).reverse();

  fastestContainer.innerHTML = fastest.map(item => `
    <div class="p-3 bg-emerald-50/70 border border-emerald-300/60 rounded-lg flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <img src="${item.image}" class="w-10 h-10 rounded object-cover border border-emerald-300"/>
        <div>
          <span class="font-medium text-emerald-950 text-[13px] block">${item.name}</span>
          <span class="text-[11px] text-emerald-700">ໃຊ້ເວລາສະເລ່ຍ: ~${item.avgPrepMinutes || 3} ນາທີ (ໄວ)</span>
        </div>
      </div>
      <div class="text-right text-[10px] text-emerald-800">
        <span class="block font-semibold">ຊ່ວງເວລາທີ່ຂາຍດີ</span>
        <span>07:30 - 09:30 AM</span>
      </div>
    </div>
  `).join('');

  slowestContainer.innerHTML = slowest.map(item => `
    <div class="p-3 bg-amber-50/70 border border-amber-300/60 rounded-lg flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <img src="${item.image}" class="w-10 h-10 rounded object-cover border border-amber-300"/>
        <div>
          <span class="font-medium text-amber-950 text-[13px] block">${item.name}</span>
          <span class="text-[11px] text-amber-900">ໃຊ້ເວລາສະເລ່ຍ: ~${item.avgPrepMinutes || 9} ນາທີ (ຊ້າ)</span>
        </div>
      </div>
      <div class="text-right text-[10px] text-amber-900">
        <span class="block font-semibold text-red-700">ມັກຊ້າຊ່ວງ: ວັນເສົາ-ອາທິດ</span>
        <span>Peak: 11:00 AM - 13:30 PM</span>
      </div>
    </div>
  `).join('');

  // ປະຫວັດການຊື້ ແລະ ຄຳຕິຊົມລູກຄ້າ
  if (customerFeedbackTable) {
    customerFeedbackTable.innerHTML = `
      <tr>
        <td class="p-2.5 font-medium">Elena Rostova<span class="block text-[10px] text-taupe">+856 20 5512 8899</span></td>
        <td class="p-2.5">Double Shot Cortado, Croissant</td>
        <td class="p-2.5 font-mono">$18.50</td>
        <td class="p-2.5 text-emerald-800">★★★★★ "ກາເຟຫອມ ແລະ ໄວກວ່າປົກກະຕິ"</td>
        <td class="p-2.5 text-[11px] text-taupe">ມື້ນີ້ 08:45 AM</td>
      </tr>
      <tr>
        <td class="p-2.5 font-medium">Khamphone K.<span class="block text-[10px] text-taupe">+856 20 9988 7766</span></td>
        <td class="p-2.5">Iced Pistachio Latte, Tartine</td>
        <td class="p-2.5 font-mono">$16.00</td>
        <td class="p-2.5 text-amber-800">★★★★☆ "ອາຫານແຊບ ແຕ່ຊ່ວງທ່ຽງລໍຖ້າດົນໜ້ອຍໜຶ່ງ"</td>
        <td class="p-2.5 text-[11px] text-taupe">ວານນີ້ 12:20 PM</td>
      </tr>
    `;
  }
}

// 2. ຈັດການເມນູແບບຄົບວົງຈອນ (Drink & Food, Variants, Image < 1MB)
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

    title.textContent = "ແກ້ໄຂເມນູ (Edit Menu Item)";
    document.getElementById('inputItemName').value = item.name;
    document.getElementById('inputItemType').value = item.type || 'drink';
    document.getElementById('inputItemCategory').value = item.category;
    document.getElementById('inputItemDesc').value = item.desc;
    document.getElementById('inputPrepTime').value = item.avgPrepMinutes || 5;

    // Toggle fields based on type
    toggleMenuTypeFields(item.type || 'drink');

    if (item.type === 'food') {
      document.getElementById('priceFoodStandard').value = item.variants.standard || '';
      document.getElementById('priceFoodWarmed').value = item.variants.warmed || '';
      document.getElementById('priceFoodSetbox').value = item.variants.setbox || '';
    } else {
      document.getElementById('priceHot').value = item.variants.hot || '';
      document.getElementById('priceIced').value = item.variants.iced || '';
      document.getElementById('priceFrappe').value = item.variants.frappe || '';
    }

    currentUploadedMenuImageBase64 = item.image;
    preview.src = item.image;
    preview.classList.remove('hidden');
  } else {
    title.textContent = "ເພີ່ມເມນູໃໝ່ (New Menu Item)";
    toggleMenuTypeFields('drink');
  }

  modal.classList.remove('hidden');
}

function toggleMenuTypeFields(type) {
  const drinkBox = document.getElementById('drinkVariantsBox');
  const foodBox = document.getElementById('foodVariantsBox');
  if (type === 'food') {
    drinkBox.classList.add('hidden');
    foodBox.classList.remove('hidden');
  } else {
    drinkBox.classList.remove('hidden');
    foodBox.classList.add('hidden');
  }
}

function handleMenuImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  // ກວດສອບຂະໜາດຮູບບໍ່ໃຫ້ເກີນ 1MB
  if (file.size > 1024 * 1024) {
    alert("ຮູບພາບຕ້ອງມີຂະໜາດບໍ່ເກີນ 1MB! (Image exceeds 1MB limit)");
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
    alert("ກະລຸນາເລືອກຮູບພາບສິນຄ້າ (ບໍ່ເກີນ 1MB)!");
    return;
  }

  const name = document.getElementById('inputItemName').value;
  const type = document.getElementById('inputItemType').value;
  const category = document.getElementById('inputItemCategory').value;
  const desc = document.getElementById('inputItemDesc').value;
  const prepTime = parseFloat(document.getElementById('inputPrepTime').value) || 5;

  let variants = {};
  if (type === 'food') {
    variants = {
      standard: parseFloat(document.getElementById('priceFoodStandard').value) || null,
      warmed: parseFloat(document.getElementById('priceFoodWarmed').value) || null,
      setbox: parseFloat(document.getElementById('priceFoodSetbox').value) || null
    };
  } else {
    variants = {
      hot: parseFloat(document.getElementById('priceHot').value) || null,
      iced: parseFloat(document.getElementById('priceIced').value) || null,
      frappe: parseFloat(document.getElementById('priceFrappe').value) || null
    };
  }

  if (editingItemId) {
    const idx = menuItems.findIndex(i => i.id === editingItemId);
    if (idx !== -1) {
      menuItems[idx] = {
        ...menuItems[idx],
        name, type, category, desc, variants,
        image: currentUploadedMenuImageBase64,
        avgPrepMinutes: prepTime
      };
    }
  } else {
    const newItem = {
      id: 'item_' + Date.now(),
      name, type, category, desc, variants,
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

function closeAddMenuModal() {
  document.getElementById('addMenuModal').classList.add('hidden');
}

function renderAdminMenu() {
  const container = document.getElementById('adminMenuListGrid');
  if (!container) return;

  container.innerHTML = '';
  menuItems.forEach(item => {
    const card = document.createElement('div');
    card.className = 'p-3.5 bg-surface-pure border border-hairline rounded-lg flex items-center justify-between gap-3 shadow-xs hover:border-emerald-700 transition-all';
    card.innerHTML = `
      <div class="flex items-center gap-3">
        <img src="${item.image}" class="w-12 h-12 rounded object-cover border border-hairline"/>
        <div>
          <div class="flex items-center gap-1.5">
            <h5 class="font-serif-title text-[14px] text-primary font-medium">${item.name}</h5>
            <span class="px-1.5 py-0.2 rounded text-[9px] uppercase font-bold tracking-wider ${item.type === 'food' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'}">${item.type}</span>
          </div>
          <span class="text-[10px] text-taupe block font-lao">${item.category} • ~${item.avgPrepMinutes}m</span>
          <p class="text-[11px] font-mono text-charcoal">
            ${item.variants.hot ? 'H: $' + item.variants.hot : ''}
            ${item.variants.iced ? ' | I: $' + item.variants.iced : ''}
            ${item.variants.frappe ? ' | F: $' + item.variants.frappe : ''}
            ${item.variants.standard ? 'Std: $' + item.variants.standard : ''}
            ${item.variants.warmed ? ' | Warm: $' + item.variants.warmed : ''}
          </p>
        </div>
      </div>
      <div class="flex items-center gap-1.5">
        <button onclick="openAddMenuModal('${item.id}')" title="ແກ້ໄຂ" class="w-8 h-8 rounded border border-hairline hover:bg-emerald-50 hover:border-emerald-700 text-emerald-900 flex items-center justify-center transition-colors">
          <span class="material-symbols-outlined text-[16px]">edit</span>
        </button>
        <button onclick="deleteMenuItem('${item.id}')" title="ລຶບ" class="w-8 h-8 rounded border border-hairline hover:bg-red-50 hover:border-red-500 text-red-700 flex items-center justify-center transition-colors">
          <span class="material-symbols-outlined text-[16px]">delete</span>
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

function deleteMenuItem(id) {
  if (!confirm("ທ່ານຕ້ອງການລຶບເມນູນີ້ແທ້ບໍ່?")) return;
  menuItems = menuItems.filter(i => i.id !== id);
  localStorage.setItem('ladolce_menu', JSON.stringify(menuItems));
  renderMenu();
  renderAdminMenu();
  renderAnalytics();
  showToast("ລຶບເມນູແລ້ວ");
}

// 3. ຈັດການຕົວເລືອກເສີມ (Modifiers: ນົມ, Toppings, Food Prep)
function renderModifierSettings() {
  const list = document.getElementById('modifierAdminList');
  if (!list) return;

  list.innerHTML = modifiers.map(m => `
    <div class="p-2.5 bg-surface border border-hairline rounded flex items-center justify-between text-[12px]">
      <div>
        <span class="font-medium text-charcoal">${m.name}</span>
        <span class="text-[10px] uppercase text-taupe block font-mono">[${m.group}] +$${m.price.toFixed(2)}</span>
      </div>
      <button onclick="deleteModifier('${m.id}')" class="text-red-700 hover:underline text-[11px] font-lao">ລຶບ</button>
    </div>
  `).join('');
}

function addNewModifier() {
  const name = prompt("ປ້ອນຊື່ຕົວເລືອກເສີມ (ເຊັ່ນ: ນົມເຂົ້າໂອດ Oatly, Grass Jelly, Extra Shot):");
  if (!name) return;
  const group = prompt("ກຸ່ມຕົວເລືອກ (milk, topping, food_prep):", "topping");
  const price = parseFloat(prompt("ລາຄາບວກເພີ່ມ ($):", "0.75")) || 0.00;

  modifiers.push({
    id: "mod_" + Date.now(),
    name, group, price
  });
  localStorage.setItem('ladolce_modifiers', JSON.stringify(modifiers));
  renderModifierSettings();
  showToast("ເພີ່ມຕົວເລືອກໃໝ່ສຳເລັດ");
}

function deleteModifier(id) {
  modifiers = modifiers.filter(m => m.id !== id);
  localStorage.setItem('ladolce_modifiers', JSON.stringify(modifiers));
  renderModifierSettings();
}

// 4. ຈັດການ QR Code ການຊຳລະເງິນ (Multi-Bank QR + Color Frame)
let currentUploadedBankQRBase64 = null;

function renderPaymentSettings() {
  const list = document.getElementById('paymentMethodsAdminList');
  if (!list) return;

  list.innerHTML = paymentMethods.map(p => `
    <div class="p-3 bg-surface-pure rounded-lg border-2 flex items-center gap-3 shadow-xs" style="border-color: ${p.borderColor}">
      <img src="${p.qrImage}" class="w-16 h-16 rounded object-contain border p-1" style="border-color: ${p.borderColor}"/>
      <div class="flex-1">
        <h5 class="font-medium text-[13px] text-charcoal">${p.bankName}</h5>
        <span class="text-[11px] font-mono text-taupe block">${p.accountNumber}</span>
        <span class="text-[10px] text-taupe">${p.accountName}</span>
      </div>
      <button onclick="deletePaymentMethod('${p.id}')" class="text-red-700 hover:underline text-[11px]">ລຶບ</button>
    </div>
  `).join('');
}

function openAddPaymentModal() {
  currentUploadedBankQRBase64 = null;
  document.getElementById('paymentForm').reset();
  document.getElementById('bankQrPreview').classList.add('hidden');
  document.getElementById('addPaymentModal').classList.remove('hidden');
}

function closeAddPaymentModal() {
  document.getElementById('addPaymentModal').classList.add('hidden');
}

function handleBankQRUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 1024 * 1024) {
    alert("ຮູບ QR Code ຕ້ອງມີຂະໜາດບໍ່ເກີນ 1MB!");
    e.target.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = function(evt) {
    currentUploadedBankQRBase64 = evt.target.result;
    const preview = document.getElementById('bankQrPreview');
    preview.src = currentUploadedBankQRBase64;
    preview.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

function savePaymentMethod(e) {
  e.preventDefault();
  if (!currentUploadedBankQRBase64) {
    alert("ກະລຸນາອັບໂຫຼດຮູບ QR Code ຂອງທະນາຄານ!");
    return;
  }

  const bankName = document.getElementById('inputBankName').value;
  const accountNumber = document.getElementById('inputAccountNumber').value;
  const accountName = document.getElementById('inputAccountName').value;
  const borderColor = document.getElementById('inputBorderColor').value;

  paymentMethods.push({
    id: "pay_" + Date.now(),
    bankName, accountNumber, accountName, borderColor,
    qrImage: currentUploadedBankQRBase64
  });

  localStorage.setItem('ladolce_payment_methods', JSON.stringify(paymentMethods));
  renderPaymentSettings();
  renderCustomerPaymentOptions();
  closeAddPaymentModal();
  showToast("ເພີ່ມຊ່ອງທາງຮັບເງິນໃໝ່ແລ້ວ!");
}

function deletePaymentMethod(id) {
  paymentMethods = paymentMethods.filter(p => p.id !== id);
  localStorage.setItem('ladolce_payment_methods', JSON.stringify(paymentMethods));
  renderPaymentSettings();
  renderCustomerPaymentOptions();
}

// 5. ລະບົບຄວບຄຸມຝັ່ງ Admin & Store Switcher
function toggleStoreStatus() {
  storeSettings.isStoreOpen = !storeSettings.isStoreOpen;
  localStorage.setItem('ladolce_store_settings', JSON.stringify(storeSettings));
  updateStoreStatusUI();
  showToast(storeSettings.isStoreOpen ? "ເປີດຮັບອໍເດີ້ແລ້ວ" : "ປິດຮັບອໍເດີ້ຊົ່ວຄາວແລ້ວ");
}

function updateStoreStatusUI() {
  const toggleBtn = document.getElementById('btnToggleStore');
  const storeBadge = document.getElementById('customerStoreOpenBadge');
  if (toggleBtn) {
    toggleBtn.textContent = storeSettings.isStoreOpen ? "ຮ້ານເປີດຢູ່ (ກົດເພື່ອປິດ)" : "ຮ້ານປິດຢູ່ (ກົດເພື່ອເປີດ)";
    toggleBtn.className = storeSettings.isStoreOpen 
      ? "px-3 py-1.5 rounded bg-emerald-800 text-white text-[11px] font-medium" 
      : "px-3 py-1.5 rounded bg-red-700 text-white text-[11px] font-medium";
  }
  if (storeBadge) {
    storeBadge.textContent = storeSettings.isStoreOpen ? "ເປີດບໍລິການ" : "ປິດຊົ່ວຄາວ";
    storeBadge.className = storeSettings.isStoreOpen 
      ? "px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold" 
      : "px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider bg-red-100 text-red-900 border border-red-300 font-bold";
  }
}
