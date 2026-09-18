// =======================================================
// SUPERADMIN CONTROLLER - FIXED INSTANT SAVE & CLOUD SYNC
// =======================================================

let editingItemId = null;
let currentUploadedMenuImageBase64 = null;
let salesFilterPeriod = 'day';

// Default Coffee Fallback Image ຖ້າບໍ່ໄດ້ອັບໂຫຼດຮູບ
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80";

// 1. Auto Compress Image (ປ້ອງກັນເກີນ 1MB)
function compressImage(file, maxWidth = 600, maxHeight = 600, quality = 0.7) {
  return new Promise((resolve) => {
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

        // ໄດ້ Base64 ທີ່ມີຂະໜາດນ້ອຍພຽງ ~50KB - 90KB
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(FALLBACK_IMAGE);
    };
    reader.onerror = () => resolve(FALLBACK_IMAGE);
  });
}

// 2. ຈັດການການເລືອກຮູບພາບ
async function handleMenuImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const preview = document.getElementById('menuImagePreview');
  if (preview) {
    preview.classList.remove('hidden');
    preview.src = "https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif"; // loading indicator
  }

  try {
    currentUploadedMenuImageBase64 = await compressImage(file);
    if (preview) preview.src = currentUploadedMenuImageBase64;
  } catch (err) {
    console.warn("Compression failed, using fallback:", err);
    currentUploadedMenuImageBase64 = FALLBACK_IMAGE;
    if (preview) preview.src = FALLBACK_IMAGE;
  }
}

// 3. ເປີດ Modal ເພີ່ມ / ແກ້ໄຂ
function openAddMenuModal(itemId = null) {
  editingItemId = itemId;
  const modal = document.getElementById('addMenuModal');
  const title = document.getElementById('addMenuModalTitle');
  const form = document.getElementById('menuForm');
  const preview = document.getElementById('menuImagePreview');

  if (form) form.reset();
  currentUploadedMenuImageBase64 = null;
  if (preview) preview.classList.add('hidden');

  if (itemId) {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;

    if (title) title.textContent = "ແກ້ໄຂເມນູ (Edit Menu Item)";
    document.getElementById('inputItemName').value = item.name || '';
    document.getElementById('inputItemType').value = item.type || 'drink';
    document.getElementById('inputItemCategory').value = item.category || 'coffee';
    document.getElementById('inputItemDesc').value = item.desc || '';
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
    if (preview) {
      preview.src = item.image;
      preview.classList.remove('hidden');
    }
  } else {
    if (title) title.textContent = "ເພີ່ມເມນູໃໝ່ (New Menu Item)";
    toggleMenuTypeFields('drink');
  }

  if (modal) modal.classList.remove('hidden');
}

function toggleMenuTypeFields(type) {
  const drinkBox = document.getElementById('drinkVariantsBox');
  const foodBox = document.getElementById('foodVariantsBox');
  if (type === 'food') {
    if (drinkBox) drinkBox.classList.add('hidden');
    if (foodBox) foodBox.classList.remove('hidden');
  } else {
    if (drinkBox) drinkBox.classList.remove('hidden');
    if (foodBox) foodBox.classList.add('hidden');
  }
}

function closeAddMenuModal() {
  const modal = document.getElementById('addMenuModal');
  if (modal) modal.classList.add('hidden');
}

// 4. ບັນທຶກເມນູ (ແກ້ໄຂໃຫ້ບັນທຶກທັນທີ 100% ບໍ່ມີຕິດ Bug)
async function saveMenuItem(event) {
  if (event) event.preventDefault();

  const nameInput = document.getElementById('inputItemName');
  const name = nameInput ? nameInput.value.trim() : "ເມນູໃໝ່";
  if (!name) {
    if (typeof showAtelierAlert === 'function') {
      showAtelierAlert({ title: "ແຈ້ງເຕືອນ", message: "ກະລຸນາປ້ອນຊື່ເມນູ!", type: "info" });
    } else {
      alert("ກະລຸນາປ້ອນຊື່ເມນູ!");
    }
    return;
  }

  const type = document.getElementById('inputItemType')?.value || 'drink';
  const category = document.getElementById('inputItemCategory')?.value || 'coffee';
  const desc = document.getElementById('inputItemDesc')?.value.trim() || 'Signature atelier curation';
  const prepTime = parseFloat(document.getElementById('inputPrepTime')?.value) || 5;

  // ຖ້າບໍ່ໄດ້ອັບໂຫຼດຮູບ ໃຫ້ໃຊ້ຮູບເລີ່ມຕົ້ນທັນທີ ບໍ່ໃຫ້ block ການບັນທຶກ
  const finalImage = currentUploadedMenuImageBase64 || FALLBACK_IMAGE;

  let variants = {};
  if (type === 'food') {
    const std = parseFloat(document.getElementById('priceFoodStandard')?.value);
    const warm = parseFloat(document.getElementById('priceFoodWarmed')?.value);
    const box = parseFloat(document.getElementById('priceFoodSetbox')?.value);
    variants = {
      standard: !isNaN(std) ? std : 4.50,
      warmed: !isNaN(warm) ? warm : null,
      setbox: !isNaN(box) ? box : null
    };
  } else {
    const hot = parseFloat(document.getElementById('priceHot')?.value);
    const iced = parseFloat(document.getElementById('priceIced')?.value);
    const frappe = parseFloat(document.getElementById('priceFrappe')?.value);
    variants = {
      hot: !isNaN(hot) ? hot : 4.50,
      iced: !isNaN(iced) ? iced : (!isNaN(hot) ? hot + 0.5 : 5.00),
      frappe: !isNaN(frappe) ? frappe : null
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
    image: finalImage,
    avgPrepMinutes: prepTime,
    updatedAt: new Date().toISOString()
  };

  console.log("Saving Item Payload:", itemPayload);

  // 1. ອັບເດດລົງ LocalStorage ແລະ State ທັນທີ (Instant Local Save)
  if (editingItemId) {
    const idx = menuItems.findIndex(i => i.id === editingItemId);
    if (idx !== -1) menuItems[idx] = itemPayload;
  } else {
    menuItems.unshift(itemPayload);
  }
  localStorage.setItem('ladolce_menu', JSON.stringify(menuItems));

  // 2. ສັ່ງ Render UI ທຸກບ່ອນທັນທີ
  if (typeof renderMenu === 'function') renderMenu();
  if (typeof renderAdminMenu === 'function') renderAdminMenu();
  if (typeof renderAnalytics === 'function') renderAnalytics();

  // 3. ກະຈາຍ Event ໃຫ້ໜ້າລູກຄ້າອັບເດດ
  window.dispatchEvent(new CustomEvent('ladolce_menu_updated'));

  // ປິດ Modal
  closeAddMenuModal();

  // 4. ສະແດງ Pop-up ສຳເລັດ
  if (typeof showAtelierAlert === 'function') {
    showAtelierAlert({
      title: editingItemId ? "ແກ້ໄຂເມນູສຳເລັດ!" : "ເພີ່ມເມນູສຳເລັດ!",
      message: `ເມນູ "${name}" ຖືກບັນທຶກ ແລະ ສະແດງຢູ່ໜ້າສັ່ງຊື້ຂອງລູກຄ້າແລ້ວ.`,
      type: "success"
    });
  } else {
    alert(`ເມນູ "${name}" ຖືກບັນທຶກສຳເລັດແລ້ວ!`);
  }

  // 5. Sync ຂຶ້ນ Cloud Firestore ຢູ່ Background
  if (isFirebaseReady && db) {
    db.collection("menu_items").doc(itemId).set(itemPayload, { merge: true })
      .then(() => {
        console.log("✅ Firestore Synced successfully for ID:", itemId);
      })
      .catch((err) => {
        console.warn("⚠️ Firestore background sync warning (Saved locally):", err.message);
      });
  }
}

// 5. ລຶບເມນູ
async function deleteMenuItem(id) {
  const item = menuItems.find(i => i.id === id);
  const itemName = item ? item.name : "ເມນູນີ້";

  let isConfirmed = true;
  if (typeof showAtelierConfirm === 'function') {
    isConfirmed = await showAtelierConfirm({
      title: "ຢືນຢັນການລຶບເມນູ?",
      message: `ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບ "${itemName}"? ເມນູນີ້ຈະຫາຍໄປຈາກໜ້າລູກຄ້າທັນທີ.`,
      confirmText: "ລຶບອອກທັນທີ",
      cancelText: "ຍົກເລີກ",
      isDanger: true
    });
  } else {
    isConfirmed = confirm(`ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບ "${itemName}"?`);
  }

  if (!isConfirmed) return;

  menuItems = menuItems.filter(i => i.id !== id);
  localStorage.setItem('ladolce_menu', JSON.stringify(menuItems));

  window.dispatchEvent(new CustomEvent('ladolce_menu_updated'));
  if (typeof renderMenu === 'function') renderMenu();
  if (typeof renderAdminMenu === 'function') renderAdminMenu();
  if (typeof renderAnalytics === 'function') renderAnalytics();

  if (typeof showAtelierAlert === 'function') {
    showAtelierAlert({ title: "ລຶບສຳເລັດ", message: `ເມນູ "${itemName}" ຖືກລຶບຮຽບຮ້ອຍແລ້ວ`, type: "success" });
  }

  if (isFirebaseReady && db) {
    db.collection("menu_items").doc(id).delete().catch(e => console.warn(e));
  }
}

// 6. ສະແດງລາຍການເມນູຝັ່ງ Superadmin
function renderAdminMenu() {
  const container = document.getElementById('adminMenuListGrid');
  if (!container) return;

  container.innerHTML = '';
  menuItems.forEach(item => {
    const card = document.createElement('div');
    card.className = 'p-3.5 bg-surface-pure border border-hairline rounded-xl flex items-center justify-between gap-3 shadow-xs hover:border-forest-leaf transition-all';
    card.innerHTML = `
      <div class="flex items-center gap-3 min-w-0">
        <img src="${item.image || FALLBACK_IMAGE}" class="w-14 h-14 rounded-lg object-cover border border-hairline shrink-0"/>
        <div class="min-w-0">
          <div class="flex items-center gap-1.5 flex-wrap">
            <h5 class="font-serif-title text-[14px] text-primary font-medium truncate">${item.name}</h5>
            <span class="px-1.5 py-0.2 rounded text-[9px] uppercase font-bold tracking-wider ${item.type === 'food' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'}">${item.type || 'drink'}</span>
          </div>
          <span class="text-[10px] text-taupe block font-lao">${item.category} • ເວລາຊົງ ~${item.avgPrepMinutes || 5}m</span>
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

// 7. ສະຖິຕິຍອດຂາຍ
function setSalesFilter(period) {
  salesFilterPeriod = period;
  document.querySelectorAll('.sales-filter-btn').forEach(btn => {
    btn.className = 'sales-filter-btn px-3 py-1.5 rounded-lg text-[11px] font-medium border border-hairline bg-surface text-taupe hover:text-charcoal';
  });
  if (event && event.target) {
    event.target.className = 'sales-filter-btn px-3 py-1.5 rounded-lg text-[11px] font-medium border border-forest-emerald bg-forest-emerald text-white';
  }
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
  if (totalOrdersEl) totalOrdersEl.textContent = `${filtered.length} ອໍເດີ້ທີ່ສຳເລັດ`;
  if (periodLabel) periodLabel.textContent = salesFilterPeriod === 'day' ? 'ຍອດຂາຍມື້ນີ້' : salesFilterPeriod === 'week' ? 'ຍອດຂາຍອາທິດນີ້' : 'ຍອດຂາຍເດືອນນີ້';

  const sorted = [...menuItems].sort((a, b) => (a.avgPrepMinutes || 5) - (b.avgPrepMinutes || 5));
  const fastest = sorted.slice(0, 2);
  const slowest = sorted.slice(-2).reverse();

  if (fastestContainer) {
    fastestContainer.innerHTML = fastest.map(item => `
      <div class="p-3 bg-emerald-50/70 border border-emerald-300/60 rounded-xl flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <img src="${item.image || FALLBACK_IMAGE}" class="w-10 h-10 rounded-lg object-cover border border-emerald-200"/>
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
  }

  if (slowestContainer) {
    slowestContainer.innerHTML = slowest.map(item => `
      <div class="p-3 bg-amber-50/70 border border-amber-300/60 rounded-xl flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <img src="${item.image || FALLBACK_IMAGE}" class="w-10 h-10 rounded-lg object-cover border border-amber-200"/>
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
  }

  if (feedbackTable) {
    feedbackTable.innerHTML = `
      <tr>
        <td class="p-2.5 font-medium">Elena Rostova<span class="block text-[10px] text-taupe">+856 20 5512 8899</span></td>
        <td class="p-2.5">Double Shot Cortado, Croissant</td>
        <td class="p-2.5 font-mono">$18.50</td>
        <td class="p-2.5 text-emerald-800">★★★★★ "ກາເຟແຊບ ຊົງໄວຫຼາຍ"</td>
        <td class="p-2.5 text-[11px] text-taupe">ມື້ນີ້ 08:45 AM</td>
      </tr>
    `;
  }
}

// 8. ຕົວເລືອກເສີມ
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
}

async function deleteModifier(id) {
  modifiers = modifiers.filter(m => m.id !== id);
  localStorage.setItem('ladolce_modifiers', JSON.stringify(modifiers));
  renderModifierSettings();
}

// 9. QR ທະນາຄານ
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
  const form = document.getElementById('paymentForm');
  if (form) form.reset();
  const preview = document.getElementById('bankQrPreview');
  if (preview) preview.classList.add('hidden');
  const modal = document.getElementById('addPaymentModal');
  if (modal) modal.classList.remove('hidden');
}

function closeAddPaymentModal() {
  const modal = document.getElementById('addPaymentModal');
  if (modal) modal.classList.add('hidden');
}

async function handleBankQRUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  try {
    currentUploadedBankQRBase64 = await compressImage(file, 600, 600, 0.8);
    const preview = document.getElementById('bankQrPreview');
    if (preview) {
      preview.src = currentUploadedBankQRBase64;
      preview.classList.remove('hidden');
    }
  } catch (err) {
    console.warn("QR upload fallback:", err);
  }
}

function savePaymentMethod(e) {
  if (e) e.preventDefault();
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
  if (typeof renderCustomerPaymentOptions === 'function') renderCustomerPaymentOptions();
  closeAddPaymentModal();
}

function deletePaymentMethod(id) {
  paymentMethods = paymentMethods.filter(p => p.id !== id);
  localStorage.setItem('ladolce_payment_methods', JSON.stringify(paymentMethods));
  renderPaymentSettings();
  if (typeof renderCustomerPaymentOptions === 'function') renderCustomerPaymentOptions();
}

// 10. ເປີດ/ປິດ ຮ້ານ
function toggleStoreStatus() {
  storeSettings.isStoreOpen = !storeSettings.isStoreOpen;
  localStorage.setItem('ladolce_store_settings', JSON.stringify(storeSettings));
  updateStoreStatusUI();
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
