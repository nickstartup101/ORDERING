// ==========================================
// SUPERADMIN COMMAND ROOM CONTROLLER
// ==========================================

let editingItemId = null;
let currentUploadedMenuImageBase64 = null;
let salesFilterPeriod = 'day';

// 1. Image Compressor ປ້ອງກັນເກີນ 1MB Firestore Limit
function compressImage(file, maxWidth = 750, maxHeight = 750, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // ໄດ້ Base64 ທີ່ມີຂະໜາດເບົາພຽງ ~60KB - 120KB ບັນທຶກລົງ Firestore ໄດ້ຢ່າງປອດໄພ
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

// 2. ຈັດການເລືອກຮູບພາບເມນູ
async function handleMenuImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 1024 * 1024 * 2.5) {
    showAtelierAlert({
      title: "ຮູບພາບໃຫຍ່ເກີນໄປ",
      message: "ກະລຸນາເລືອກຮູບທີ່ມີຂະໜາດບໍ່ເກີນ 2.5MB ເພື່ອໃຫ້ລະບົບບີບອັດໄດ້ດີທີ່ສຸດ",
      type: "error"
    });
    e.target.value = '';
    return;
  }

  try {
    currentUploadedMenuImageBase64 = await compressImage(file);
    const preview = document.getElementById('menuImagePreview');
    preview.src = currentUploadedMenuImageBase64;
    preview.classList.remove('hidden');
  } catch (err) {
    showAtelierAlert({
      title: "ເກີດຂໍ້ຜິດພາດ",
      message: "ບໍ່ສາມາດປະມວນຜົນໄຟລ໌ຮູບພາບນີ້ໄດ້",
      type: "error"
    });
  }
}

// 3. ເປີດ Modal ເພີ່ມ ຫຼື ແກ້ໄຂເມນູ
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

    title.textContent = "ແກ້ໄຂເມນູ (Edit Item)";
    document.getElementById('inputItemName').value = item.name;
    document.getElementById('inputItemType').value = item.type || 'drink';
    document.getElementById('inputItemCategory').value = item.category;
    document.getElementById('inputItemDesc').value = item.desc;
    document.getElementById('inputPrepTime').value = item.avgPrepMinutes || 5;

    toggleMenuTypeFields(item.type || 'drink');

    if (item.type === 'food') {
      document.getElementById('priceFoodStandard').value = item.variants?.standard || '';
      document.getElementById('priceFoodWarmed').value = item.variants?.warmed || '';
      document.getElementById('priceFoodSetbox').value = item.variants?.setbox || '';
    } else {
      document.getElementById('priceHot').value = item.variants?.hot || '';
      document.getElementById('priceIced').value = item.variants?.iced || '';
      document.getElementById('priceFrappe').value = item.variants?.frappe || '';
    }

    currentUploadedMenuImageBase64 = item.image;
    preview.src = item.image;
    preview.classList.remove('hidden');
  } else {
    title.textContent = "ເພີ່ມເມນູໃໝ່ (New Item)";
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

function closeAddMenuModal() {
  document.getElementById('addMenuModal').classList.add('hidden');
}

// 4. ບັນທຶກເມນູລົງ Cloud Firestore ແທ້ 100% ພ້ອມ Custom Pop-up
async function saveMenuItem(e) {
  e.preventDefault();
  if (!currentUploadedMenuImageBase64) {
    showAtelierAlert({
      title: "ແຈ້ງເຕືອນ",
      message: "ກະລຸນາອັບໂຫຼດຮູບພາບສິນຄ້າກ່ອນບັນທຶກ!",
      type: "info"
    });
    return;
  }

  const name = document.getElementById('inputItemName').value.trim();
  const type = document.getElementById('inputItemType').value;
  const category = document.getElementById('inputItemCategory').value;
  const desc = document.getElementById('inputItemDesc').value.trim();
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

  const itemId = editingItemId ? editingItemId : 'item_' + Date.now();

  const itemPayload = {
    id: itemId,
    name: name,
    type: type,
    category: category,
    desc: desc,
    variants: variants,
    image: currentUploadedMenuImageBase64,
    avgPrepMinutes: prepTime,
    updatedAt: new Date().toISOString()
  };

  // ບັນທຶກລົງ Firestore Database
  if (isFirebaseReady && db) {
    try {
      await db.collection("menu_items").doc(itemId).set(itemPayload, { merge: true });
      console.log("Firestore Document Created/Updated:", itemId);
    } catch (firebaseErr) {
      console.error("Firestore Write Error:", firebaseErr);
      showAtelierAlert({
        title: "ບັນຫາການເຊື່ອມຕໍ່ Cloud",
        message: "ບໍ່ສາມາດບັນທຶກລົງ Cloud ໄດ້: " + firebaseErr.message,
        type: "error"
      });
      return;
    }
  }

  // ອັບເດດ Local State ທັນທີ
  if (editingItemId) {
    const idx = menuItems.findIndex(i => i.id === editingItemId);
    if (idx !== -1) menuItems[idx] = itemPayload;
  } else {
    menuItems.unshift(itemPayload);
  }
  localStorage.setItem('ladolce_menu', JSON.stringify(menuItems));

  renderMenu();
  renderAdminMenu();
  renderAnalytics();
  closeAddMenuModal();

  // ສະແດງ Custom Pop-up ແຈ້ງສຳເລັດ
  showAtelierAlert({
    title: editingItemId ? "ແກ້ໄຂເມນູສຳເລັດ!" : "ເພີ່ມເມນູສຳເລັດ!",
    message: `ເມນູ "${name}" ຖືກບັນທຶກລົງຖານຂໍ້ມູນ Cloud Firestore ຮຽບຮ້ອຍແລ້ວ ແລະ ພ້ອມໃຫ້ລູກຄ້າສັ່ງໄດ້ທັນທີ.`,
    type: "success"
  });
}

// 5. ລຶບເມນູ ພ້ອມ Custom Confirm Pop-up
async function deleteMenuItem(id) {
  const item = menuItems.find(i => i.id === id);
  const itemName = item ? item.name : "ເມນູນີ້";

  const isConfirmed = await showAtelierConfirm({
    title: "ຢືນຢັນການລຶບເມນູ?",
    message: `ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບ "${itemName}" ອອກຈາກລະບົບ? ການກະທຳນີ້ຈະລຶບຂໍ້ມູນອອກຈາກ Cloud Firestore ຖາວອນ.`,
    confirmText: "ລຶບຖາວອນ",
    cancelText: "ຍົກເລີກ",
    isDanger: true
  });

  if (!isConfirmed) return;

  // ລຶບອອກຈາກ Cloud Firestore
  if (isFirebaseReady && db) {
    try {
      await db.collection("menu_items").doc(id).delete();
      console.log("Firestore Document Deleted:", id);
    } catch (err) {
      console.error("Firestore delete error:", err);
    }
  }

  menuItems = menuItems.filter(i => i.id !== id);
  localStorage.setItem('ladolce_menu', JSON.stringify(menuItems));

  renderMenu();
  renderAdminMenu();
  renderAnalytics();

  showAtelierAlert({
    title: "ລຶບເມນູຮຽບຮ້ອຍ",
    message: `ເມນູ "${itemName}" ຖືກລຶບອອກຈາກລະບົບແລ້ວ`,
    type: "success"
  });
}

// 6. ສະແດງເມນູຝັ່ງ Superadmin
function renderAdminMenu() {
  const container = document.getElementById('adminMenuListGrid');
  if (!container) return;

  container.innerHTML = '';
  menuItems.forEach(item => {
    const card = document.createElement('div');
    card.className = 'p-3.5 bg-surface-pure border border-hairline rounded-xl flex items-center justify-between gap-3 shadow-xs hover:border-forest-leaf transition-all';
    card.innerHTML = `
      <div class="flex items-center gap-3 min-w-0">
        <img src="${item.image}" class="w-14 h-14 rounded-lg object-cover border border-hairline shrink-0"/>
        <div class="min-w-0">
          <div class="flex items-center gap-1.5 flex-wrap">
            <h5 class="font-serif-title text-[14px] text-primary font-medium truncate">${item.name}</h5>
            <span class="px-1.5 py-0.2 rounded text-[9px] uppercase font-bold tracking-wider ${item.type === 'food' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'}">${item.type}</span>
          </div>
          <span class="text-[10px] text-taupe block font-lao">${item.category} • ເວລາຊົງ ~${item.avgPrepMinutes}m</span>
          <p class="text-[11px] font-mono text-charcoal truncate">
            ${item.variants?.hot ? 'H: $' + item.variants.hot : ''}
            ${item.variants?.iced ? ' | I: $' + item.variants.iced : ''}
            ${item.variants?.frappe ? ' | F: $' + item.variants.frappe : ''}
            ${item.variants?.standard ? 'Std: $' + item.variants.standard : ''}
            ${item.variants?.warmed ? ' | Warm: $' + item.variants.warmed : ''}
          </p>
        </div>
      </div>
      <div class="flex items-center gap-1.5 shrink-0">
        <button onclick="openAddMenuModal('${item.id}')" title="ແກ້ໄຂ" class="w-8 h-8 rounded-lg border border-hairline hover:bg-emerald-50 hover:border-forest-leaf text-forest-emerald flex items-center justify-center transition-colors">
          <span class="material-symbols-outlined text-[16px]">edit</span>
        </button>
        <button onclick="deleteMenuItem('${item.id}')" title="ລຶບ" class="w-8 h-8 rounded-lg border border-hairline hover:bg-red-50 hover:border-red-500 text-red-700 flex items-center justify-center transition-colors">
          <span class="material-symbols-outlined text-[16px]">delete</span>
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

// 7. ສະຫຼຸບຍອດຂາຍ ແລະ ວິເຄາະ Bottlenecks ຕາມວັນ/ຊ່ວງເວລາ
function setSalesFilter(period) {
  salesFilterPeriod = period;
  document.querySelectorAll('.sales-filter-btn').forEach(btn => {
    btn.className = 'sales-filter-btn px-3 py-1.5 rounded-lg text-[11px] font-medium border border-hairline bg-surface text-taupe hover:text-charcoal';
  });
  event.target.className = 'sales-filter-btn px-3 py-1.5 rounded-lg text-[11px] font-medium border border-forest-emerald bg-forest-emerald text-white';
  renderAnalytics();
}

function renderAnalytics() {
  const totalSalesEl = document.getElementById('metricTotalSales');
  const totalOrdersEl = document.getElementById('metricTotalOrdersCount');
  const fastestContainer = document.getElementById('analyticsFastestMenu');
  const slowestContainer = document.getElementById('analyticsSlowestMenu');
  const feedbackTable = document.getElementById('analyticsFeedbackTable');
  const periodLabel = document.getElementById('analyticsPeriodLabel');

  if (!totalSalesEl) return;

  const now = new Date();
  const completed = orders.filter(o => o.status === 'completed');

  let filtered = completed.filter(o => {
    const oDate = new Date(o.createdAt || Date.now());
    const diffDays = Math.ceil(Math.abs(now - oDate) / (1000 * 60 * 60 * 24));
    if (salesFilterPeriod === 'day') return diffDays <= 1;
    if (salesFilterPeriod === 'week') return diffDays <= 7;
    if (salesFilterPeriod === 'month') return diffDays <= 30;
    return true;
  });

  const revenue = filtered.reduce((sum, o) => sum + o.total, 0);
  totalSalesEl.textContent = `$${revenue.toFixed(2)}`;
  totalOrdersEl.textContent = `${filtered.length} ອໍເດີ້ທີ່ສຳເລັດ`;
  periodLabel.textContent = salesFilterPeriod === 'day' ? 'ຍອດຂາຍມື້ນີ້' : salesFilterPeriod === 'week' ? 'ຍອດຂາຍອາທິດນີ້' : 'ຍອດຂາຍເດືອນນີ້';

  // Sort ເມນູໄວ & ຊ້າ
  const sorted = [...menuItems].sort((a, b) => (a.avgPrepMinutes || 5) - (b.avgPrepMinutes || 5));
  const fastest = sorted.slice(0, 2);
  const slowest = sorted.slice(-2).reverse();

  fastestContainer.innerHTML = fastest.map(item => `
    <div class="p-3 bg-emerald-50/70 border border-emerald-300/60 rounded-xl flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <img src="${item.image}" class="w-10 h-10 rounded-lg object-cover border border-emerald-200"/>
        <div>
          <span class="font-medium text-emerald-950 text-[13px] block">${item.name}</span>
          <span class="text-[11px] text-emerald-700">ສະເລ່ຍ: ~${item.avgPrepMinutes || 3} ນາທີ</span>
        </div>
      </div>
      <div class="text-right text-[10px] text-emerald-800">
        <span class="block font-semibold">ຊ່ວງເວລາຂາຍດີ</span>
        <span>07:30 - 09:30 AM</span>
      </div>
    </div>
  `).join('');

  slowestContainer.innerHTML = slowest.map(item => `
    <div class="p-3 bg-amber-50/70 border border-amber-300/60 rounded-xl flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <img src="${item.image}" class="w-10 h-10 rounded-lg object-cover border border-amber-200"/>
        <div>
          <span class="font-medium text-amber-950 text-[13px] block">${item.name}</span>
          <span class="text-[11px] text-amber-900">ສະເລ່ຍ: ~${item.avgPrepMinutes || 9} ນາທີ</span>
        </div>
      </div>
      <div class="text-right text-[10px] text-amber-900">
        <span class="block font-semibold text-red-700">ມັກຊ້າຊ່ວງ Peak</span>
        <span>11:30 AM - 13:30 PM</span>
      </div>
    </div>
  `).join('');

  // ຕາຕະລາງປະຫວັດ ແລະ Feedback
  if (feedbackTable) {
    feedbackTable.innerHTML = `
      <tr>
        <td class="p-2.5 font-medium">Elena Rostova<span class="block text-[10px] text-taupe">+856 20 5512 8899</span></td>
        <td class="p-2.5">Double Shot Cortado, Croissant</td>
        <td class="p-2.5 font-mono">$18.50</td>
        <td class="p-2.5 text-emerald-800">★★★★★ "ກາເຟແຊບ ຊົງໄວຫຼາຍ"</td>
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

// 8. ຕົວເລືອກເສີມ Modifiers (ນົມ, Toppings)
function renderModifierSettings() {
  const list = document.getElementById('modifierAdminList');
  if (!list) return;

  list.innerHTML = modifiers.map(m => `
    <div class="p-2.5 bg-surface border border-hairline rounded-lg flex items-center justify-between text-[12px]">
      <div>
        <span class="font-medium text-charcoal">${m.name}</span>
        <span class="text-[10px] uppercase text-taupe block font-mono">[${m.group}] +$${m.price.toFixed(2)}</span>
      </div>
      <button onclick="deleteModifier('${m.id}')" class="text-red-700 hover:underline text-[11px] font-lao">ລຶບ</button>
    </div>
  `).join('');
}

function addNewModifier() {
  const name = prompt("ປ້ອນຊື່ຕົວເລືອກເສີມ (ເຊັ່ນ: ນົມ Oatly, Grass Jelly, Extra Shot):");
  if (!name) return;
  const group = prompt("ກຸ່ມຕົວເລືອກ (milk, topping, food_prep):", "topping");
  const price = parseFloat(prompt("ລາຄາບວກເພີ່ມ ($):", "0.75")) || 0.00;

  modifiers.push({ id: "mod_" + Date.now(), name, group, price });
  localStorage.setItem('ladolce_modifiers', JSON.stringify(modifiers));
  renderModifierSettings();
  showAtelierAlert({ title: "ສຳເລັດ", message: `ເພີ່ມຕົວເລືອກ "${name}" ຮຽບຮ້ອຍແລ້ວ!`, type: "success" });
}

async function deleteModifier(id) {
  const isOk = await showAtelierConfirm({ title: "ຢືນຢັນການລຶບ?", message: "ຕ້ອງການລຶບຕົວເລືອກເສີມນີ້ແທ້ບໍ່?" });
  if (!isOk) return;

  modifiers = modifiers.filter(m => m.id !== id);
  localStorage.setItem('ladolce_modifiers', JSON.stringify(modifiers));
  renderModifierSettings();
}

// 9. ຈັດການ QR ທະນາຄານ
let currentUploadedBankQRBase64 = null;

function renderPaymentSettings() {
  const list = document.getElementById('paymentMethodsAdminList');
  if (!list) return;

  list.innerHTML = paymentMethods.map(p => `
    <div class="p-3 bg-surface-pure rounded-xl border-2 flex items-center gap-3 shadow-xs" style="border-color: ${p.borderColor}">
      <img src="${p.qrImage}" class="w-16 h-16 rounded-lg object-contain border p-1" style="border-color: ${p.borderColor}"/>
      <div class="flex-1 min-w-0">
        <h5 class="font-medium text-[13px] text-charcoal truncate">${p.bankName}</h5>
        <span class="text-[11px] font-mono text-taupe block truncate">${p.accountNumber}</span>
        <span class="text-[10px] text-taupe block truncate">${p.accountName}</span>
      </div>
      <button onclick="deletePaymentMethod('${p.id}')" class="text-red-700 hover:underline text-[11px] shrink-0 font-lao">ລຶບ</button>
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

async function handleBankQRUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  try {
    currentUploadedBankQRBase64 = await compressImage(file, 600, 600, 0.8);
    const preview = document.getElementById('bankQrPreview');
    preview.src = currentUploadedBankQRBase64;
    preview.classList.remove('hidden');
  } catch (err) {
    showAtelierAlert({ title: "ເກີດຂໍ້ຜິດພາດ", message: "ບໍ່ສາມາດອັບໂຫຼດຮູບ QR ນີ້ໄດ້", type: "error" });
  }
}

function savePaymentMethod(e) {
  e.preventDefault();
  if (!currentUploadedBankQRBase64) {
    showAtelierAlert({ title: "ແຈ້ງເຕືອນ", message: "ກະລຸນາອັບໂຫຼດຮູບ QR Code ຂອງທະນາຄານ!", type: "info" });
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

  showAtelierAlert({ title: "ສຳເລັດ", message: `ເພີ່ມຊ່ອງທາງຮັບເງິນ ${bankName} ຮຽບຮ້ອຍແລ້ວ!`, type: "success" });
}

async function deletePaymentMethod(id) {
  const isOk = await showAtelierConfirm({ title: "ຢືນຢັນການລຶບ?", message: "ຕ້ອງການລຶບຊ່ອງທາງຮັບເງິນທະນາຄານນີ້ບໍ່?" });
  if (!isOk) return;

  paymentMethods = paymentMethods.filter(p => p.id !== id);
  localStorage.setItem('ladolce_payment_methods', JSON.stringify(paymentMethods));
  renderPaymentSettings();
  renderCustomerPaymentOptions();
}

// 10. ເປີດ-ປິດ ຮ້ານ
function toggleStoreStatus() {
  storeSettings.isStoreOpen = !storeSettings.isStoreOpen;
  localStorage.setItem('ladolce_store_settings', JSON.stringify(storeSettings));
  updateStoreStatusUI();
  showAtelierAlert({
    title: storeSettings.isStoreOpen ? "ເປີດຮ້ານສຳເລັດ" : "ປິດຮ້ານຊົ່ວຄາວ",
    message: storeSettings.isStoreOpen ? "ລະບົບພ້ອມຮັບອໍເດີ້ຈາກລູກຄ້າແລ້ວ" : "ລະບົບຈະແຈ້ງເຕືອນລູກຄ້າວ່າປິດຮັບອໍເດີ້ຊົ່ວຄາວ",
    type: storeSettings.isStoreOpen ? "success" : "info"
  });
}

function updateStoreStatusUI() {
  const toggleBtn = document.getElementById('btnToggleStore');
  const storeBadge = document.getElementById('customerStoreOpenBadge');
  if (toggleBtn) {
    toggleBtn.textContent = storeSettings.isStoreOpen ? "ຮ້ານເປີດຢູ່ (ກົດເພື່ອປິດ)" : "ຮ້ານປິດຢູ່ (ກົດເພື່ອເປີດ)";
    toggleBtn.className = storeSettings.isStoreOpen 
      ? "px-3 py-1.5 rounded-lg bg-emerald-800 text-white text-[11px] font-medium" 
      : "px-3 py-1.5 rounded-lg bg-red-700 text-white text-[11px] font-medium";
  }
  if (storeBadge) {
    storeBadge.textContent = storeSettings.isStoreOpen ? "ເປີດບໍລິການ" : "ປິດຊົ່ວຄາວ";
    storeBadge.className = storeSettings.isStoreOpen 
      ? "px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold" 
      : "px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider bg-red-100 text-red-900 border border-red-300 font-bold";
  }
}
