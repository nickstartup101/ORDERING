// =======================================================
// SUPERADMIN CONTROL CENTER (MENU, MODIFIERS, PAYMENTS, USERS)
// =======================================================

function switchAdminPanelTab(tab) {
  ['analytics', 'menu', 'modifiers', 'payments', 'users'].forEach(t => {
    const btn = document.getElementById(`adm-tab-${t}`);
    const pnl = document.getElementById(`adm-panel-${t}`);
    if (pnl) pnl.classList.add('hidden');
    if (btn) btn.className = "px-3.5 py-1.5 rounded-lg bg-surface border border-hairline text-taupe text-[12px] font-medium shrink-0";
  });
  const activeBtn = document.getElementById(`adm-tab-${tab}`);
  const activePnl = document.getElementById(`adm-panel-${tab}`);
  if (activePnl) activePnl.classList.remove('hidden');
  if (activeBtn) activeBtn.className = "px-3.5 py-1.5 rounded-lg bg-forest-emerald text-white text-[12px] font-bold shrink-0";
}

function openAddMenuModal(id = null) {
  editingItemId = id;
  document.getElementById('menuForm').reset();
  document.getElementById('menuImagePreview').classList.add('hidden');
  if (id) {
    const item = menuItems.find(i => i.id === id);
    if (item) {
      document.getElementById('inputItemName').value = item.name;
      document.getElementById('inputItemCategory').value = item.category;
      document.getElementById('inputItemPrice').value = item.variants?.standard || item.variants?.hot || 35000;
      document.getElementById('inputItemDesc').value = item.desc || '';
      currentUploadedMenuImageBase64 = item.image;
    }
  }
  document.getElementById('addMenuModal').classList.remove('hidden');
}

function closeAddMenuModal() {
  document.getElementById('addMenuModal').classList.add('hidden');
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
  const name = document.getElementById('inputItemName').value.trim();
  const cat = document.getElementById('inputItemCategory').value;
  const price = parseFloat(document.getElementById('inputItemPrice').value) || 35000;
  const desc = document.getElementById('inputItemDesc').value.trim();

  if (!name) { alert("ກະລຸນາໃສ່ຊື່ເມນູ!"); return; }

  const itemPayload = {
    id: editingItemId || 'item_' + Date.now(),
    name: name,
    category: cat,
    variants: { standard: price, hot: price, iced: price + 5000 },
    desc: desc,
    image: currentUploadedMenuImageBase64 || "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600"
  };

  if (editingItemId) {
    const idx = menuItems.findIndex(i => i.id === editingItemId);
    if (idx !== -1) menuItems[idx] = itemPayload;
  } else {
    menuItems.unshift(itemPayload);
  }

  localStorage.setItem('ladolce_menu', JSON.stringify(menuItems));

  // Sync to Cloud Firestore Real-time
  if (isFirebaseReady && db) {
    await db.collection("menu_items").doc(itemPayload.id).set(itemPayload, { merge: true });
  }

  renderMenu();
  renderAdminMenu();
  closeAddMenuModal();
  showToast("ບັນທຶກເມນູຮຽບຮ້ອຍ!");
}

function renderAdminMenu() {
  const container = document.getElementById('adminMenuListGrid');
  if (!container) return;
  container.innerHTML = menuItems.map(item => `
    <div class="p-3 bg-surface-pure border border-hairline rounded-xl flex justify-between items-center shadow-xs">
      <div class="flex items-center gap-3">
        <img src="${item.image}" class="w-12 h-12 rounded-lg object-cover border border-hairline"/>
        <div>
          <h5 class="font-serif-title font-bold text-[14px]">${item.name}</h5>
          <span class="text-[10px] text-taupe block">${item.category} • ${formatLAK(item.variants?.standard || 35000)}</span>
        </div>
      </div>
      <div class="flex gap-1">
        <button onclick="openAddMenuModal('${item.id}')" class="w-8 h-8 rounded-lg bg-surface border border-hairline text-forest-emerald flex items-center justify-center"><span class="material-symbols-outlined text-[16px]">edit</span></button>
        <button onclick="deleteMenuItem('${item.id}')" class="w-8 h-8 rounded-lg bg-surface border border-hairline text-red-600 flex items-center justify-center"><span class="material-symbols-outlined text-[16px]">delete</span></button>
      </div>
    </div>
  `).join('');
}

async function deleteMenuItem(id) {
  if (!confirm("ທ່ານຕ້ອງການລຶບເມນູນີ້ແທ້ບໍ່?")) return;
  menuItems = menuItems.filter(i => i.id !== id);
  localStorage.setItem('ladolce_menu', JSON.stringify(menuItems));
  if (isFirebaseReady && db) await db.collection("menu_items").doc(id).delete();
  renderMenu();
  renderAdminMenu();
  showToast("ລຶບເມນູແລ້ວ");
}

// Modifiers
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

// Payments
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

// User Roles Management
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
