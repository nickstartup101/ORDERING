// =======================================================
// SUPERADMIN CONTROL CENTER (MENU, MODIFIERS, PAYMENTS, USERS)
// =======================================================

let editingItemId = null;
let currentUploadedMenuImageBase64 = null;
let currentUploadedBankQRBase64 = null;

function switchAdminPanelTab(tab) {
  const tabs = [
    { id: 'analytics', icon: 'bar_chart', label: 'ຍອດຂາຍ & ລາຍງານ' },
    { id: 'menu', icon: 'restaurant_menu', label: 'ຈັດການເມນູທັງໝົດ' },
    { id: 'modifiers', icon: 'tune', label: 'ຕົວເລືອກເສີມ' },
    { id: 'payments', icon: 'qr_code_scanner', label: 'QR ທະນາຄານ' },
    { id: 'users', icon: 'group', label: 'ຈັດການຜູ້ໃຊ້' }
  ];

  tabs.forEach(t => {
    const btn = document.getElementById(`adm-tab-${t.id}`);
    const pnl = document.getElementById(`adm-panel-${t.id}`);
    if (pnl) pnl.classList.add('hidden');
    if (btn) {
      btn.className = "px-3.5 py-1.5 rounded-lg bg-surface border border-hairline text-taupe text-[12px] font-medium shrink-0 flex items-center gap-1.5 hover:text-charcoal transition-colors";
      btn.innerHTML = `<span class="material-symbols-outlined text-[16px]">${t.icon}</span><span>${t.label}</span>`;
    }
  });

  const activeBtn = document.getElementById(`adm-tab-${tab}`);
  const activePnl = document.getElementById(`adm-panel-${tab}`);
  const activeItem = tabs.find(t => t.id === tab);

  if (activePnl) activePnl.classList.remove('hidden');
  if (activeBtn && activeItem) {
    activeBtn.className = "px-3.5 py-1.5 rounded-lg bg-forest-emerald text-white text-[12px] font-bold shrink-0 flex items-center gap-1.5";
    activeBtn.innerHTML = `<span class="material-symbols-outlined text-[16px]">${activeItem.icon}</span><span>${activeItem.label}</span>`;
  }
}

// 1. ຈັດການເມນູ ພ້ອມ Toggle Switch ເປີດ-ປິດເມນູທີ່ໝົດ
function renderAdminMenu() {
  const container = document.getElementById('adminMenuListGrid');
  if (!container) return;

  container.innerHTML = menuItems.map(item => {
    const isAvail = item.isAvailable !== false;
    return `
      <div class="p-3.5 bg-surface-pure border border-hairline rounded-xl flex justify-between items-center shadow-xs">
        <div class="flex items-center gap-3 min-w-0">
          <img src="${item.image}" class="w-13 h-13 rounded-lg object-cover border border-hairline shrink-0 ${!isAvail ? 'grayscale opacity-60' : ''}"/>
          <div class="min-w-0">
            <h5 class="font-serif-title font-bold text-[14px] truncate">${item.name}</h5>
            <span class="text-[10px] text-taupe block">${item.category} • ${formatLAK(item.variants?.standard || 35000)}</span>
            <div class="flex items-center gap-1 mt-1 text-[9px]">
              <span class="px-1.5 py-0.2 rounded font-bold ${isAvail ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}">
                ${isAvail ? '✓ ພ້ອມຂາຍ' : '✕ ໝົດ'}
              </span>
              ${item.allowMilk === false ? '<span class="px-1.5 py-0.2 rounded bg-gray-100 text-gray-600">ບໍ່ມີນົມ</span>' : ''}
              ${item.allowSweetness === false ? '<span class="px-1.5 py-0.2 rounded bg-gray-100 text-gray-600">ບໍ່ປັບຫວານ</span>' : ''}
            </div>
          </div>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <button type="button" onclick="toggleItemAvailability('${item.id}')" class="px-2 py-1 rounded-lg border text-[11px] font-bold transition-all ${isAvail ? 'border-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-100' : 'border-emerald-500 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'}">
            ${isAvail ? 'ປິດ (ໝົດ)' : 'ເປີດຂາຍ'}
          </button>
          <button type="button" onclick="openAddMenuModal('${item.id}')" class="w-8 h-8 rounded-lg bg-surface border border-hairline text-forest-emerald flex items-center justify-center"><span class="material-symbols-outlined text-[16px]">edit</span></button>
          <button type="button" onclick="deleteMenuItem('${item.id}')" class="w-8 h-8 rounded-lg bg-surface border border-hairline text-red-600 flex items-center justify-center"><span class="material-symbols-outlined text-[16px]">delete</span></button>
        </div>
      </div>
    `;
  }).join('');
}

async function toggleItemAvailability(itemId) {
  const item = menuItems.find(i => i.id === itemId);
  if (!item) return;

  item.isAvailable = item.isAvailable === false ? true : false;
  localStorage.setItem('ladolce_menu', JSON.stringify(menuItems));

  if (isFirebaseReady && db) {
    await db.collection("menu_items").doc(itemId).update({ isAvailable: item.isAvailable });
  }

  if (typeof renderMenu === 'function') renderMenu();
  renderAdminMenu();
  showToast(item.isAvailable ? `ເປີດຂາຍ "${item.name}" ແລ້ວ` : `ປິດ "${item.name}" (ສິນຄ້າໝົດ)`);
}

function openAddMenuModal(id = null) {
  editingItemId = id;
  const form = document.getElementById('menuForm');
  if (form) form.reset();
  const preview = document.getElementById('menuImagePreview');
  if (preview) preview.classList.add('hidden');
  currentUploadedMenuImageBase64 = null;

  if (id) {
    const item = menuItems.find(i => i.id === id);
    if (item) {
      document.getElementById('inputItemName').value = item.name || '';
      document.getElementById('inputItemCategory').value = item.category || 'coffee';
      document.getElementById('inputItemDesc').value = item.desc || '';
      
      const v = item.variants || {};
      const basePrice = typeof v === 'number' ? v : (v.standard || v.hot || item.price || 35000);
      document.getElementById('priceStandard').value = basePrice;

      document.getElementById('priceHot').value = v.hot || basePrice;
      document.getElementById('priceIced').value = v.iced || (basePrice + 5000);
      document.getElementById('priceFrappe').value = v.frappe || '';

      document.getElementById('toggleAllowMilk').checked = item.allowMilk !== false;
      document.getElementById('toggleAllowSweetness').checked = item.allowSweetness !== false;
      document.getElementById('toggleAllowHot').checked = item.allowHot !== false;
      document.getElementById('toggleAllowIced').checked = item.allowIced !== false;
      document.getElementById('toggleAllowFrappe').checked = item.allowFrappe === true;

      currentUploadedMenuImageBase64 = item.image;
      if (preview && item.image) {
        preview.src = item.image;
        preview.classList.remove('hidden');
      }
    }
  } else {
    document.getElementById('priceStandard').value = 35000;
    document.getElementById('priceHot').value = 35000;
    document.getElementById('priceIced').value = 40000;
    document.getElementById('priceFrappe').value = '';
    document.getElementById('toggleAllowMilk').checked = true;
    document.getElementById('toggleAllowSweetness').checked = true;
    document.getElementById('toggleAllowHot').checked = true;
    document.getElementById('toggleAllowIced').checked = true;
    document.getElementById('toggleAllowFrappe').checked = false;
  }

  document.getElementById('addMenuModal')?.classList.remove('hidden');
}

function closeAddMenuModal() {
  document.getElementById('addMenuModal')?.classList.add('hidden');
}

function handleMenuImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    currentUploadedMenuImageBase64 = reader.result;
    document.getElementById('menuImagePreview').src = currentUploadedMenuImageBase64;
    document.getElementById('menuImagePreview').classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

async function saveMenuItem(e) {
  if (e) e.preventDefault();
  const name = document.getElementById('inputItemName')?.value.trim();
  const cat = document.getElementById('inputItemCategory')?.value || 'coffee';
  const price = parseFloat(document.getElementById('priceStandard')?.value) || 35000;
  const desc = document.getElementById('inputItemDesc')?.value.trim() || '';

  if (!name) { alert("ກະລຸນາໃສ່ຊື່ເມນູ!"); return; }

  const allowMilk = document.getElementById('toggleAllowMilk')?.checked;
  const allowSweetness = document.getElementById('toggleAllowSweetness')?.checked;
  const allowHot = document.getElementById('toggleAllowHot')?.checked;
  const allowIced = document.getElementById('toggleAllowIced')?.checked;
  const allowFrappe = document.getElementById('toggleAllowFrappe')?.checked;

  const pHot = parseFloat(document.getElementById('priceHot')?.value) || price;
  const pIced = parseFloat(document.getElementById('priceIced')?.value) || (price + 5000);
  const pFrappe = parseFloat(document.getElementById('priceFrappe')?.value) || null;

  const itemPayload = {
    id: editingItemId || 'item_' + Date.now(),
    name: name,
    category: cat,
    variants: {
      standard: price,
      hot: allowHot ? pHot : null,
      iced: allowIced ? pIced : null,
      frappe: allowFrappe ? pFrappe : null
    },
    allowMilk: allowMilk,
    allowSweetness: allowSweetness,
    allowHot: allowHot,
    allowIced: allowIced,
    allowFrappe: allowFrappe,
    desc: desc,
    image: currentUploadedMenuImageBase64 || "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600",
    isAvailable: true,
    updatedAt: new Date().toISOString()
  };

  if (editingItemId) {
    const idx = menuItems.findIndex(i => i.id === editingItemId);
    if (idx !== -1) menuItems[idx] = itemPayload;
  } else {
    menuItems.unshift(itemPayload);
  }

  localStorage.setItem('ladolce_menu', JSON.stringify(menuItems));

  if (isFirebaseReady && db) {
    await db.collection("menu_items").doc(itemPayload.id).set(itemPayload, { merge: true });
  }

  if (typeof renderMenu === 'function') renderMenu();
  renderAdminMenu();
  closeAddMenuModal();
  showToast("ບັນທຶກເມນູຮຽບຮ້ອຍ!");
}

async function deleteMenuItem(id) {
  if (!confirm("ທ່ານຕ້ອງການລຶບເມນູນີ້ແທ້ບໍ່?")) return;
  menuItems = menuItems.filter(i => i.id !== id);
  localStorage.setItem('ladolce_menu', JSON.stringify(menuItems));
  if (isFirebaseReady && db) await db.collection("menu_items").doc(id).delete();
  if (typeof renderMenu === 'function') renderMenu();
  renderAdminMenu();
  showToast("ລຶບເມນູແລ້ວ");
}

// 2. Modifiers
function renderModifierSettings() {
  const list = document.getElementById('modifierAdminList');
  if (!list) return;
  list.innerHTML = modifiers.map(m => `
    <div class="p-2.5 bg-surface border border-hairline rounded-xl flex justify-between items-center text-[12px]">
      <div><span class="font-bold">${m.name}</span><span class="text-[10px] text-taupe block font-mono">[${m.group}] +${formatLAK(m.price)}</span></div>
      <button onclick="deleteModifier('${m.id}')" class="text-red-600 text-[11px]">ລຶບ</button>
    </div>
  `).join('');
}

function addNewModifier() {
  const name = prompt("ປ້ອນຊື່ຕົວເລືອກເສີມ:");
  if (!name) return;
  const group = prompt("ກຸ່ມຕົວເລືອກ (milk, topping):", "milk");
  const price = parseFloat(prompt("ລາຄາບວກເພີ່ມ (LAK ₭):", "15000")) || 0;
  modifiers.push({ id: "mod_" + Date.now(), name, group, price });
  localStorage.setItem('ladolce_modifiers', JSON.stringify(modifiers));
  renderModifierSettings();
}

function deleteModifier(id) {
  modifiers = modifiers.filter(m => m.id !== id);
  localStorage.setItem('ladolce_modifiers', JSON.stringify(modifiers));
  renderModifierSettings();
}

// 3. Payments
function renderPaymentSettings() {
  const list = document.getElementById('paymentMethodsAdminList');
  if (!list) return;
  list.innerHTML = paymentMethods.map(p => `
    <div class="p-3 bg-surface-pure rounded-xl border-2 flex items-center gap-3 shadow-xs" style="border-color: ${p.borderColor}">
      <img src="${p.qrImage}" class="w-14 h-14 rounded-lg object-contain border p-1" style="border-color: ${p.borderColor}"/>
      <div class="flex-1 min-w-0">
        <h5 class="font-bold text-[13px]">${p.bankName}</h5>
        <span class="text-[11px] font-mono text-taupe block truncate">${p.accountNumber}</span>
      </div>
      <button onclick="deletePaymentMethod('${p.id}')" class="text-red-600 text-[11px]">ລຶບ</button>
    </div>
  `).join('');
}

function openAddPaymentModal() {
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
  const reader = new FileReader();
  reader.onload = () => {
    currentUploadedBankQRBase64 = reader.result;
    document.getElementById('bankQrPreview').src = currentUploadedBankQRBase64;
    document.getElementById('bankQrPreview').classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

function savePaymentMethod(e) {
  if (e) e.preventDefault();
  const bankName = document.getElementById('inputBankName').value;
  const accountNumber = document.getElementById('inputAccountNumber').value;
  const borderColor = document.getElementById('inputBorderColor').value;
  if (!currentUploadedBankQRBase64) { alert("ກະລຸນາອັບໂຫຼດຮູບ QR!"); return; }

  paymentMethods.push({
    id: "pay_" + Date.now(),
    bankName, accountNumber, borderColor,
    qrImage: currentUploadedBankQRBase64
  });
  localStorage.setItem('ladolce_payment_methods', JSON.stringify(paymentMethods));
  renderPaymentSettings();
  closeAddPaymentModal();
}

function deletePaymentMethod(id) {
  paymentMethods = paymentMethods.filter(p => p.id !== id);
  localStorage.setItem('ladolce_payment_methods', JSON.stringify(paymentMethods));
  renderPaymentSettings();
}

// 4. Users Management
async function renderUsersList() {
  const tbody = document.getElementById('adminUsersTableBody');
  if (!tbody) return;

  if (isFirebaseReady && db) {
    try {
      const snapshot = await db.collection("users").get();
      cloudUsers = [];
      snapshot.forEach(doc => cloudUsers.push({ id: doc.id, ...doc.data() }));
    } catch (e) {}
  }

  if (cloudUsers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-taupe">ກຳລັງໂຫຼດລາຍຊື່ຜູ້ໃຊ້...</td></tr>`;
    return;
  }

  tbody.innerHTML = cloudUsers.map(u => `
    <tr>
      <td class="p-2.5 font-bold">${u.name}</td>
      <td class="p-2.5 font-mono text-taupe">${u.email}</td>
      <td class="p-2.5"><span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${u.role === 'superadmin' ? 'bg-amber-100 text-amber-900' : u.role === 'staff' ? 'bg-emerald-100 text-emerald-900' : 'bg-surface text-taupe'}">${u.role || 'customer'}</span></td>
      <td class="p-2.5 text-right">
        <select onchange="updateUserRole('${u.email}', this.value)" class="text-[11px] rounded border border-hairline p-1">
          <option value="customer" ${u.role === 'customer' ? 'selected' : ''}>Customer</option>
          <option value="staff" ${u.role === 'staff' ? 'selected' : ''}>Staff</option>
          <option value="superadmin" ${u.role === 'superadmin' ? 'selected' : ''}>Superadmin</option>
        </select>
      </td>
    </tr>
  `).join('');
}

async function updateUserRole(email, newRole) {
  if (isFirebaseReady && db) {
    await db.collection("users").doc(email).update({ role: newRole });
    showToast(`ອັບເດດສິດ ${email} ເປັນ ${newRole}`);
    renderUsersList();
  }
}

function toggleStoreStatus() {
  storeSettings.isStoreOpen = !storeSettings.isStoreOpen;
  localStorage.setItem('ladolce_store_settings', JSON.stringify(storeSettings));
  updateStoreStatusUI();
}

function updateStoreStatusUI() {
  const btn = document.getElementById('btnToggleStore');
  const badge = document.getElementById('customerStoreOpenBadge');
  if (btn) {
    btn.textContent = storeSettings.isStoreOpen ? "ຮ້ານເປີດຢູ່ (ກົດເພື່ອປິດ)" : "ຮ້ານປິດຢູ່ (ກົດເພື່ອເປີດ)";
    btn.className = storeSettings.isStoreOpen ? "px-3 py-1.5 rounded-lg bg-emerald-800 text-white text-[11px] font-medium" : "px-3 py-1.5 rounded-lg bg-red-700 text-white text-[11px] font-medium";
  }
  if (badge) {
    badge.textContent = storeSettings.isStoreOpen ? "ເປີດບໍລິການ" : "ປິດຊົ່ວຄາວ";
    badge.className = storeSettings.isStoreOpen ? "px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold" : "px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider bg-red-100 text-red-900 border border-red-300 font-bold";
  }
}
