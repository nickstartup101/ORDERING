// =======================================================
// LA DOLCE — SUPERADMIN CONTROL CENTER (FULL CRUD + SYNC)
// =======================================================

window.adminCurrentTab = 'analytics';
window.editingMenuItemId = null;
window.editingPaymentDocId = null;
window.editingModifierId = null;
window.salesDateFilter = 'day';
window.cachedAdminUsers = [];

function compressImageFile(file, maxWidth = 540, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/webp', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

window.switchAdminPanelTab = function(tabName) {
  window.adminCurrentTab = tabName;
  const tabs = ['analytics', 'menu', 'coupons', 'modifiers', 'payments', 'users'];

  tabs.forEach(t => {
    const panel = document.getElementById(`adm-panel-${t}`);
    const btn = document.getElementById(`adm-tab-${t}`);
    if (panel) panel.classList.add('hidden');
    if (btn) {
      btn.className = 'px-3.5 py-1.5 rounded-lg bg-surface border border-hairline text-taupe text-[12px] font-medium shrink-0 flex items-center gap-1.5 hover:text-charcoal transition-colors cursor-pointer font-lao';
    }
  });

  const activePanel = document.getElementById(`adm-panel-${tabName}`);
  const activeBtn = document.getElementById(`adm-tab-${tabName}`);
  if (activePanel) activePanel.classList.remove('hidden');
  if (activeBtn) {
    activeBtn.className = 'px-3.5 py-1.5 rounded-lg bg-forest-emerald text-white text-[12px] font-bold shrink-0 flex items-center gap-1.5 shadow-xs cursor-pointer font-lao';
  }

  if (tabName === 'analytics') window.loadAdminAnalytics();
  if (tabName === 'menu') window.loadAdminMenus();
  if (tabName === 'coupons') window.loadAdminCoupons();
  if (tabName === 'modifiers') window.loadAdminModifiers();
  if (tabName === 'payments') window.loadAdminPayments();
  if (tabName === 'users') window.loadAdminUsers();
};

// =======================================================
// 1. MENU MANAGEMENT
// =======================================================
window.loadAdminMenus = async function() {
  const container = document.getElementById('adminMenuListGrid');
  if (!container) return;

  const firestore = db || firebase.firestore();
  try {
    const snap = await firestore.collection('menu_items').get();
    if (snap.empty) {
      container.innerHTML = `<div class="col-span-full p-8 text-center text-taupe font-lao">ຍັງບໍ່ມີເມນູໃນລະບົບ</div>`;
      return;
    }

    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    container.innerHTML = items.map(item => {
      const isAvail = item.isAvailable !== false;
      const price = Number(item.price || 35000);
      return `
        <div class="p-3.5 rounded-xl bg-surface border border-hairline flex items-center justify-between shadow-2xs font-lao gap-2">
          <div class="flex items-center gap-3 min-w-0">
            <img src="${item.image || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200'}" class="w-14 h-14 rounded-lg object-cover border border-hairline shrink-0"/>
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h5 class="font-bold text-[14px] text-primary truncate">${item.name}</h5>
                <span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase ${isAvail ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}">
                  ${isAvail ? 'ພ້ອມຂາຍ' : 'ໝົດ'}
                </span>
              </div>
              <span class="text-[11px] text-taupe capitalize">${item.category || 'coffee'} • ${formatLAK(price)}</span>
            </div>
          </div>
          <div class="flex items-center gap-1.5 shrink-0">
            <button type="button" onclick="window.toggleMenuItemAvailability('${item.id}', ${!isAvail})" class="px-2.5 py-1 rounded-lg border text-[11px] font-bold ${isAvail ? 'border-amber-300 text-amber-900 bg-amber-50' : 'border-emerald-300 text-emerald-900 bg-emerald-50'} cursor-pointer">
              ${isAvail ? 'ປິດ (ໝົດ)' : 'ເປີດຂາຍ'}
            </button>
            <button type="button" onclick="window.openEditMenuModal('${item.id}')" class="p-1.5 rounded-lg border border-hairline hover:bg-surface text-taupe hover:text-forest-emerald cursor-pointer" title="ແກ້ໄຂເມນູນີ້">
              ${svgIcon('edit', 'w-4 h-4')}
            </button>
            <button type="button" onclick="window.deleteMenuItem('${item.id}')" class="p-1.5 rounded-lg border border-hairline hover:bg-red-50 text-taupe hover:text-red-600 cursor-pointer" title="ລຶບເມນູ">
              ${svgIcon('trash', 'w-4 h-4')}
            </button>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error("Admin menus error:", err);
  }
};

window.autoCheckStandardPriceVisibility = function() {
  const hot = document.getElementById('toggleAllowHot')?.checked;
  const iced = document.getElementById('toggleAllowIced')?.checked;
  const frappe = document.getElementById('toggleAllowFrappe')?.checked;
  const box = document.getElementById('standardPriceBox');
  if (box) box.style.opacity = (hot || iced || frappe) ? '0.65' : '1';
};

window.openAddMenuModal = function() {
  window.editingMenuItemId = null;
  document.getElementById('menuForm')?.reset();
  const preview = document.getElementById('menuImagePreview');
  if (preview) {
    preview.src = '';
    preview.classList.add('hidden');
  }
  window.autoCheckStandardPriceVisibility();
  document.getElementById('addMenuModal')?.classList.remove('hidden');
};

window.openEditMenuModal = function(itemId) {
  const item = (menuItems || []).find(i => String(i.id) === String(itemId));
  if (!item) return;

  window.editingMenuItemId = itemId;
  document.getElementById('inputItemName').value = item.name || '';
  document.getElementById('inputItemCategory').value = item.category || 'coffee';
  document.getElementById('inputItemDesc').value = item.desc || '';

  const v = item.variants || {};
  document.getElementById('priceStandard').value = item.price || v.standard || 35000;
  document.getElementById('priceHot').value = v.hot || '';
  document.getElementById('priceIced').value = v.iced || '';
  document.getElementById('priceFrappe').value = v.frappe || '';

  document.getElementById('toggleAllowHot').checked = item.allowHot === true;
  document.getElementById('toggleAllowIced').checked = item.allowIced === true;
  document.getElementById('toggleAllowFrappe').checked = item.allowFrappe === true;
  document.getElementById('toggleAllowMilk').checked = item.allowMilk === true;
  document.getElementById('toggleAllowSweetness').checked = item.allowSweetness !== false;
  document.getElementById('toggleAllowTopping').checked = item.allowTopping === true;

  const preview = document.getElementById('menuImagePreview');
  if (preview && item.image) {
    preview.src = item.image;
    preview.classList.remove('hidden');
  }
  window.autoCheckStandardPriceVisibility();
  document.getElementById('addMenuModal')?.classList.remove('hidden');
};

window.closeAddMenuModal = function() {
  window.editingMenuItemId = null;
  document.getElementById('addMenuModal')?.classList.add('hidden');
};

window.handleMenuImageUpload = async function(event) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const compressed = await compressImageFile(file, 540, 0.76);
    const preview = document.getElementById('menuImagePreview');
    if (preview) {
      preview.src = compressed;
      preview.classList.remove('hidden');
    }
  } catch (e) {
    console.error('Image compress error:', e);
  }
};

window.saveMenuItem = async function(event) {
  if (event) event.preventDefault();
  try {
    const name = document.getElementById('inputItemName')?.value.trim();
    const category = document.getElementById('inputItemCategory')?.value || 'coffee';
    const desc = document.getElementById('inputItemDesc')?.value.trim() || '';
    const imageSrc = document.getElementById('menuImagePreview')?.src || '';

    const allowHot = document.getElementById('toggleAllowHot')?.checked === true;
    const allowIced = document.getElementById('toggleAllowIced')?.checked === true;
    const allowFrappe = document.getElementById('toggleAllowFrappe')?.checked === true;
    const priceHot = Number(document.getElementById('priceHot')?.value) || 0;
    const priceIced = Number(document.getElementById('priceIced')?.value) || 0;
    const priceFrappe = Number(document.getElementById('priceFrappe')?.value) || 0;
    const priceStandard = Number(document.getElementById('priceStandard')?.value) || 35000;

    const allowMilk = document.getElementById('toggleAllowMilk')?.checked === true;
    const allowSweetness = document.getElementById('toggleAllowSweetness')?.checked === true;
    const allowTopping = document.getElementById('toggleAllowTopping')?.checked === true;

    if (!name) {
      showAtelierToast('ກະລຸນາປ້ອນຊື່ເມນູ!', 'warning');
      return;
    }

    const menuItemData = {
      name, category, desc, price: priceStandard,
      allowHot, allowIced, allowFrappe,
      allowMilk, allowSweetness, allowTopping,
      isAvailable: true,
      variants: {
        standard: priceStandard,
        hot: allowHot ? (priceHot || priceStandard) : null,
        iced: allowIced ? (priceIced || priceStandard + 5000) : null,
        frappe: allowFrappe ? (priceFrappe || priceStandard + 10000) : null
      },
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (imageSrc && !imageSrc.includes('data:,') && (imageSrc.startsWith('data:') || imageSrc.startsWith('http'))) {
      menuItemData.image = imageSrc;
    }

    const firestore = db || firebase.firestore();
    if (window.editingMenuItemId) {
      await firestore.collection('menu_items').doc(window.editingMenuItemId).update(menuItemData);
      showAtelierToast(`ແກ້ໄຂເມນູ "${name}" ສຳເລັດ!`);
    } else {
      await firestore.collection('menu_items').add(menuItemData);
      showAtelierToast(`ເພີ່ມເມນູ "${name}" ສຳເລັດ!`);
    }
    window.closeAddMenuModal();
    window.loadAdminMenus();
  } catch (e) {
    console.error("Save menu error:", e);
    showAtelierAlert({ title: 'ບັນທຶກບໍ່ສຳເລັດ', message: e.message, type: 'error' });
  }
};

window.toggleMenuItemAvailability = async function(id, status) {
  const firestore = db || firebase.firestore();
  await firestore.collection('menu_items').doc(id).update({ isAvailable: status });
  window.loadAdminMenus();
};

window.deleteMenuItem = async function(id) {
  const ok = await showAtelierConfirm({ title: 'ຢືນຢັນການລຶບເມນູ', message: 'ທ່ານຕ້ອງການລຶບເມນູນີ້ອອກຈາກຮ້ານແທ້ບໍ່?', confirmText: 'ລຶບເມນູ', cancelText: 'ຍົກເລີກ' });
  if (!ok) return;
  const firestore = db || firebase.firestore();
  await firestore.collection('menu_items').doc(id).delete();
  showAtelierToast('ລຶບເມນູສຳເລັດ');
  window.loadAdminMenus();
};

// =======================================================
// 2. QR PAYMENTS CRUD (ເພີ່ມ / ແກ້ໄຂ / ລົບ)
// =======================================================
window.openAddPaymentModal = function() {
  window.editingPaymentDocId = null;
  document.getElementById('paymentForm')?.reset();
  const title = document.querySelector('#addPaymentModal h3');
  if (title) title.textContent = 'ເພີ່ມຊ່ອງທາງຮັບເງິນ QR';
  const preview = document.getElementById('bankQrPreview');
  if (preview) {
    preview.src = '';
    preview.classList.add('hidden');
  }
  document.getElementById('addPaymentModal')?.classList.remove('hidden');
};

window.openEditPaymentModal = function(docId) {
  const target = (paymentMethods || []).find(p => (p.docId || p.id) === docId);
  if (!target) return;

  window.editingPaymentDocId = target.docId || target.id;
  const title = document.querySelector('#addPaymentModal h3');
  if (title) title.textContent = `ແກ້ໄຂບັນຊີ QR: ${target.bankName}`;

  document.getElementById('inputBankName').value = target.bankName || '';
  document.getElementById('inputAccountNumber').value = target.accountNumber || '';
  document.getElementById('inputBorderColor').value = target.borderColor || '#DC2626';

  const preview = document.getElementById('bankQrPreview');
  if (preview && target.qrImage) {
    preview.src = target.qrImage;
    preview.classList.remove('hidden');
  }
  document.getElementById('addPaymentModal')?.classList.remove('hidden');
};

window.closeAddPaymentModal = function() {
  window.editingPaymentDocId = null;
  document.getElementById('addPaymentModal')?.classList.add('hidden');
};

window.handleBankQRUpload = async function(event) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const compressed = await compressImageFile(file, 600, 0.85);
    const preview = document.getElementById('bankQrPreview');
    if (preview) {
      preview.src = compressed;
      preview.classList.remove('hidden');
    }
  } catch (e) {
    console.error('QR compress error:', e);
  }
};

window.savePaymentMethod = async function(event) {
  if (event) event.preventDefault();

  try {
    const bankName = document.getElementById('inputBankName')?.value.trim();
    const accountNumber = document.getElementById('inputAccountNumber')?.value.trim();
    const borderColor = document.getElementById('inputBorderColor')?.value || '#DC2626';
    const qrPreview = document.getElementById('bankQrPreview')?.src;

    if (!bankName || !accountNumber) {
      showAtelierToast('ກະລຸນາປ້ອນຊື່ທະນາຄານ ແລະ ເລກບັນຊີ!', 'warning');
      return;
    }

    const payload = {
      id: window.editingPaymentDocId || ('pay_' + Date.now()),
      bankName,
      accountNumber,
      borderColor,
      qrImage: (qrPreview && (qrPreview.startsWith('data:image') || qrPreview.startsWith('http')))
        ? qrPreview
        : `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(accountNumber)}`,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    const firestore = db || firebase.firestore();
    if (window.editingPaymentDocId) {
      await firestore.collection('payments').doc(window.editingPaymentDocId).set(payload, { merge: true });
      showAtelierToast(`ແກ້ໄຂບັນຊີ "${bankName}" ສຳເລັດ!`);
    } else {
      await firestore.collection('payments').doc(payload.id).set(payload);
      showAtelierToast(`ເພີ່ມບັນຊີ "${bankName}" ສຳເລັດ!`);
    }

    window.closeAddPaymentModal();
    window.loadAdminPayments();
  } catch (e) {
    console.error("Save payment error:", e);
    showAtelierAlert({ title: 'ຜິດພາດ', message: e.message, type: 'error' });
  }
};

window.loadAdminPayments = async function() {
  const container = document.getElementById('paymentMethodsAdminList');
  if (!container) return;

  const firestore = db || firebase.firestore();
  let list = [];
  try {
    const snap = await firestore.collection('payments').get();
    if (!snap.empty) {
      list = snap.docs.map(d => ({ docId: d.id, ...d.data() }));
    } else if (typeof DEFAULT_PAYMENTS !== 'undefined') {
      // Seed default payments ເຂົ້າ Firestore ເພື່ອໃຫ້ແກ້ໄຂ/ລຶບໄດ້ທັນທີ
      for (const p of DEFAULT_PAYMENTS) {
        await firestore.collection('payments').doc(p.id).set(p, { merge: true });
      }
      list = DEFAULT_PAYMENTS.map(p => ({ docId: p.id, ...p }));
    }
  } catch (e) {
    list = paymentMethods || DEFAULT_PAYMENTS || [];
  }

  paymentMethods = list;
  localStorage.setItem('ladolce_payment_methods', JSON.stringify(list));

  container.innerHTML = list.map(p => {
    const docId = p.docId || p.id;
    return `
      <div class="p-4 rounded-xl bg-surface border-2 border-dashed flex flex-col items-center justify-between space-y-2.5 font-lao" style="border-color: ${p.borderColor || '#16593D'};">
        <img src="${p.qrImage}" class="w-28 h-28 object-contain rounded-lg border border-hairline bg-white p-1"/>
        <div class="text-center">
          <h5 class="font-bold text-[14px] text-primary">${p.bankName}</h5>
          <span class="font-mono text-[12px] text-taupe">${p.accountNumber}</span>
        </div>
        <div class="flex items-center gap-2 pt-1 w-full justify-center">
          <button type="button" onclick="window.openEditPaymentModal('${docId}')" class="px-2.5 py-1 rounded-lg border border-hairline bg-surface-pure hover:border-forest-emerald text-charcoal text-[11px] font-bold cursor-pointer inline-flex items-center gap-1">
            ${svgIcon('edit', 'w-3.5 h-3.5')} <span>ແກ້ໄຂ</span>
          </button>
          <button type="button" onclick="window.deletePaymentMethod('${docId}')" class="px-2.5 py-1 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-bold cursor-pointer inline-flex items-center gap-1">
            ${svgIcon('trash', 'w-3.5 h-3.5')} <span>ລຶບ</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
};

window.deletePaymentMethod = async function(docId) {
  const ok = await showAtelierConfirm({
    title: 'ລຶບຊ່ອງທາງ QR',
    message: 'ທ່ານຕ້ອງການລຶບ QR ທະນາຄານນີ້ແທ້ບໍ່?',
    confirmText: 'ລຶບ',
    cancelText: 'ຍົກເລີກ'
  });
  if (!ok) return;
  const firestore = db || firebase.firestore();
  await firestore.collection('payments').doc(docId).delete();
  showAtelierToast('ລຶບ QR ສຳເລັດ');
  window.loadAdminPayments();
};

// =======================================================
// 3. MODIFIERS CRUD (ເພີ່ມ / ແກ້ໄຂ / ລົບ)
// =======================================================
window.openModifierModal = function() {
  window.editingModifierId = null;
  document.getElementById('modifierForm')?.reset();
  const title = document.getElementById('modifierModalTitle');
  if (title) title.textContent = 'ເພີ່ມຕົວເລືອກເສີມໃໝ່';
  document.getElementById('modifierModal')?.classList.remove('hidden');
};

window.openEditModifierModal = function(modId) {
  const target = (modifiers || []).find(m => m.id === modId);
  if (!target) return;

  window.editingModifierId = modId;
  const title = document.getElementById('modifierModalTitle');
  if (title) title.textContent = 'ແກ້ໄຂຕົວເລືອກເສີມ';

  document.getElementById('inputModName').value = target.name || '';
  document.getElementById('inputModGroup').value = target.group || 'milk';
  document.getElementById('inputModPrice').value = Number(target.price || 0);
  document.getElementById('modifierModal')?.classList.remove('hidden');
};

window.closeModifierModal = function() {
  window.editingModifierId = null;
  document.getElementById('modifierModal')?.classList.add('hidden');
};

window.saveModifierFromModal = async function(event) {
  if (event) event.preventDefault();
  const name = document.getElementById('inputModName')?.value.trim();
  const group = document.getElementById('inputModGroup')?.value || 'milk';
  const price = Number(document.getElementById('inputModPrice')?.value) || 0;

  if (!name) {
    showAtelierToast('ກະລຸນາປ້ອນຊື່ຕົວເລືອກ!', 'warning');
    return;
  }

  const firestore = db || firebase.firestore();
  const id = window.editingModifierId || ('mod_' + Date.now());
  await firestore.collection('modifiers').doc(id).set({
    id, name, group, price, updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  showAtelierToast(window.editingModifierId ? 'ແກ້ໄຂຕົວເລືອກສຳເລັດ' : 'ເພີ່ມຕົວເລືອກເສີມສຳເລັດ');
  window.closeModifierModal();
  window.loadAdminModifiers();
};

window.loadAdminModifiers = async function() {
  const container = document.getElementById('modifierAdminList');
  if (!container) return;
  const firestore = db || firebase.firestore();
  let list = [];

  try {
    const snap = await firestore.collection('modifiers').get();
    if (!snap.empty) {
      list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else if (typeof DEFAULT_MODIFIERS !== 'undefined') {
      for (const m of DEFAULT_MODIFIERS) {
        await firestore.collection('modifiers').doc(m.id).set(m, { merge: true });
      }
      list = DEFAULT_MODIFIERS;
    }
  } catch (_) {
    list = DEFAULT_MODIFIERS || [];
  }

  modifiers = list;
  localStorage.setItem('ladolce_modifiers', JSON.stringify(list));

  container.innerHTML = list.map(m => `
    <div class="p-3 rounded-xl bg-surface border border-hairline flex justify-between items-center text-[12px] font-lao gap-2">
      <div class="min-w-0">
        <span class="font-bold text-primary block truncate">${m.name}</span>
        <span class="text-[10px] text-taupe uppercase">[${m.group}] • <strong class="font-mono text-forest-emerald">+${formatLAK(m.price)}</strong></span>
      </div>
      <div class="flex items-center gap-1 shrink-0">
        <button type="button" onclick="window.openEditModifierModal('${m.id}')" class="p-1.5 rounded-lg border border-hairline bg-surface-pure hover:text-forest-emerald cursor-pointer" title="ແກ້ໄຂ">
          ${svgIcon('edit', 'w-3.5 h-3.5')}
        </button>
        <button type="button" onclick="window.deleteModifier('${m.id}')" class="p-1.5 rounded-lg border border-hairline bg-surface-pure hover:text-red-600 cursor-pointer" title="ລຶບ">
          ${svgIcon('trash', 'w-3.5 h-3.5')}
        </button>
      </div>
    </div>
  `).join('');
};

window.deleteModifier = async function(modId) {
  const ok = await showAtelierConfirm({ title: 'ລຶບຕົວເລືອກເສີມ', message: 'ຕ້ອງການລຶບຕົວເລືອກນີ້ແທ້ບໍ່?', confirmText: 'ລຶບ', cancelText: 'ຍົກເລີກ' });
  if (!ok) return;
  const firestore = db || firebase.firestore();
  await firestore.collection('modifiers').doc(modId).delete();
  showAtelierToast('ລຶບຕົວເລືອກເສີມແລ້ວ');
  window.loadAdminModifiers();
};

// =======================================================
// 4. USERS & PERMISSIONS (ຈັດການຜູ້ໃຊ້ + ມອບສິດໃຫ້ STAFF)
// =======================================================
window.loadAdminUsers = async function() {
  const panel = document.getElementById('adm-panel-users');
  const tableBody = document.getElementById('adminUsersTableBody');
  if (!tableBody) return;

  // ເພີ່ມປຸ່ມ "ເພີ່ມຜູ້ໃຊ້ໃໝ່" ໃນຫົວຂໍ້ຖ້າຍັງບໍ່ມີ
  const headerBar = panel?.querySelector('.flex.items-center.justify-between');
  if (headerBar && !document.getElementById('btnAdminAddUser')) {
    const addBtn = document.createElement('button');
    addBtn.id = 'btnAdminAddUser';
    addBtn.type = 'button';
    addBtn.onclick = () => window.openAdminAddUserModal();
    addBtn.className = 'px-3 py-1.5 rounded-lg bg-forest-emerald text-white text-[11px] font-bold cursor-pointer';
    addBtn.textContent = '+ ເພີ່ມຜູ້ໃຊ້ / Staff';
    headerBar.appendChild(addBtn);
  }

  const firestore = db || firebase.firestore();
  const userMap = new Map();

  if (typeof REGISTERED_ACCOUNTS !== 'undefined') {
    REGISTERED_ACCOUNTS.forEach(u => userMap.set(u.email.toLowerCase(), { ...u }));
  }

  try {
    const snap = await firestore.collection('users').get();
    snap.docs.forEach(doc => {
      const u = doc.data();
      const email = (u.email || doc.id).toLowerCase();
      userMap.set(email, { ...userMap.get(email), ...u, email });
    });
  } catch (_) {}

  window.cachedAdminUsers = Array.from(userMap.values());

  tableBody.innerHTML = window.cachedAdminUsers.map(u => {
    const perms = u.permissions || {};
    const isStaff = u.role === 'staff';
    const isProtectedOwner = u.email === 'owner@ladolce.com';

    return `
      <tr class="hover:bg-surface/50 font-lao border-b border-hairline">
        <td class="p-2.5">
          <div class="font-bold text-primary">${u.name || 'User'}</div>
          <div class="text-[10px] text-taupe font-mono">${u.phone || '-'}</div>
        </td>
        <td class="p-2.5 font-mono text-taupe text-[11px]">${u.email}</td>
        <td class="p-2.5 space-y-1.5">
          <select onchange="window.updateUserRole('${u.email}', this.value)" ${isProtectedOwner ? 'disabled' : ''}
                  class="rounded-lg border border-hairline bg-surface-pure text-[11px] font-bold py-1 px-2 cursor-pointer">
            <option value="customer" ${u.role === 'customer' ? 'selected' : ''}>customer (ລູກຄ້າ)</option>
            <option value="staff" ${u.role === 'staff' ? 'selected' : ''}>staff (ພະນັກງານ)</option>
            <option value="superadmin" ${u.role === 'superadmin' ? 'selected' : ''}>superadmin (ເຈົ້າຂອງ)</option>
          </select>

          ${isStaff ? `
            <div class="flex flex-wrap gap-2 pt-1">
              <label class="inline-flex items-center gap-1 text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-900 px-2 py-0.5 rounded cursor-pointer">
                <input type="checkbox" ${perms.canToggleStore ? 'checked' : ''}
                       onchange="window.toggleStaffPermission('${u.email}', 'canToggleStore', this.checked)"
                       class="rounded text-forest-emerald focus:ring-0"/>
                <span>ສິດເປີດ/ປິດຮ້ານ</span>
              </label>
              <label class="inline-flex items-center gap-1 text-[10px] bg-amber-50 border border-amber-200 text-amber-900 px-2 py-0.5 rounded cursor-pointer">
                <input type="checkbox" ${perms.canToggleMenu ? 'checked' : ''}
                       onchange="window.toggleStaffPermission('${u.email}', 'canToggleMenu', this.checked)"
                       class="rounded text-forest-emerald focus:ring-0"/>
                <span>ສິດປິດເມນູ Run Out</span>
              </label>
            </div>
          ` : ''}
        </td>
        <td class="p-2.5 text-right">
          ${!isProtectedOwner ? `
            <button type="button" onclick="window.deleteAdminUser('${u.email}')" class="p-1.5 rounded-lg border border-hairline hover:bg-red-50 text-red-600 cursor-pointer" title="ລຶບຜູ້ໃຊ້">
              ${svgIcon('trash', 'w-3.5 h-3.5')}
            </button>
          ` : `<span class="text-[10px] text-taupe font-bold">Owner ຫຼັກ</span>`}
        </td>
      </tr>
    `;
  }).join('');
};

window.updateUserRole = async function(email, newRole) {
  const u = window.cachedAdminUsers.find(x => x.email === email) || { email };
  const firestore = db || firebase.firestore();
  await firestore.collection('users').doc(email).set({
    ...u,
    role: newRole,
    permissions: u.permissions || { canToggleStore: false, canToggleMenu: false },
    updatedAt: new Date().toISOString()
  }, { merge: true });
  showAtelierToast(`ປ່ຽນສິດ ${email} ເປັນ ${newRole} ແລ້ວ`);
  window.loadAdminUsers();
};

window.toggleStaffPermission = async function(email, permKey, value) {
  const u = window.cachedAdminUsers.find(x => x.email === email) || { email, role: 'staff' };
  const nextPerms = { ...(u.permissions || {}), [permKey]: value };
  const firestore = db || firebase.firestore();
  await firestore.collection('users').doc(email).set({
    ...u,
    permissions: nextPerms,
    updatedAt: new Date().toISOString()
  }, { merge: true });
  showAtelierToast(value ? 'ມອບສິດໃຫ້ Staff ສຳເລັດ' : 'ຖອນສິດ Staff ແລ້ວ');
  window.loadAdminUsers();
};

window.deleteAdminUser = async function(email) {
  const ok = await showAtelierConfirm({ title: 'ລຶບຜູ້ໃຊ້', message: `ລຶບບັນຊີ ${email} ອອກຈາກລະບົບແທ້ບໍ່?`, confirmText: 'ລຶບ', cancelText: 'ຍົກເລີກ' });
  if (!ok) return;
  const firestore = db || firebase.firestore();
  await firestore.collection('users').doc(email).delete();
  showAtelierToast('ລຶບບັນຊີຜູ້ໃຊ້ແລ້ວ');
  window.loadAdminUsers();
};

window.openAdminAddUserModal = function() {
  let modal = document.getElementById('adminAddUserModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'adminAddUserModal';
    modal.className = 'fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="bg-surface-pure w-full max-w-sm rounded-2xl border border-hairline p-5 shadow-2xl space-y-4">
        <div class="flex justify-between items-center border-b border-hairline pb-2">
          <h3 class="font-serif-title text-[17px] text-primary font-bold">ເພີ່ມຜູ້ໃຊ້ / ພະນັກງານໃໝ່</h3>
          <button type="button" onclick="document.getElementById('adminAddUserModal').classList.add('hidden')" class="w-7 h-7 rounded-full border border-hairline flex items-center justify-center text-taupe cursor-pointer">${svgIcon('close', 'w-4 h-4')}</button>
        </div>
        <form onsubmit="saveAdminNewUser(event)" class="space-y-3 text-[12px] font-lao">
          <div><label class="block text-taupe mb-1">ຊື່:</label><input required id="newUserName" type="text" class="w-full rounded-lg border border-hairline p-2"/></div>
          <div><label class="block text-taupe mb-1">ອີເມວ:</label><input required id="newUserEmail" type="email" class="w-full rounded-lg border border-hairline p-2"/></div>
          <div><label class="block text-taupe mb-1">ລະຫັດຜ່ານ:</label><input required id="newUserPass" type="text" value="123" class="w-full rounded-lg border border-hairline p-2"/></div>
          <div><label class="block text-taupe mb-1">ເບີໂທ:</label><input id="newUserPhone" type="tel" placeholder="+856 20 ..." class="w-full rounded-lg border border-hairline p-2"/></div>
          <div>
            <label class="block text-taupe mb-1">ຕຳແໜ່ງ (Role):</label>
            <select id="newUserRole" class="w-full rounded-lg border border-hairline p-2">
              <option value="staff">staff (ພະນັກງານ)</option>
              <option value="customer">customer (ລູກຄ້າ)</option>
              <option value="superadmin">superadmin (ເຈົ້າຂອງ)</option>
            </select>
          </div>
          <button type="submit" class="w-full py-2.5 rounded-lg bg-forest-emerald text-white font-bold cursor-pointer">ບັນທຶກຜູ້ໃຊ້</button>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
  }
  modal.classList.remove('hidden');
};

window.saveAdminNewUser = async function(event) {
  if (event) event.preventDefault();
  const name = document.getElementById('newUserName')?.value.trim();
  const email = document.getElementById('newUserEmail')?.value.trim().toLowerCase();
  const password = document.getElementById('newUserPass')?.value.trim();
  const phone = document.getElementById('newUserPhone')?.value.trim() || '';
  const role = document.getElementById('newUserRole')?.value || 'staff';

  if (!name || !email || !password) return;
  const firestore = db || firebase.firestore();
  await firestore.collection('users').doc(email).set({
    name, email, password, phone, role,
    permissions: { canToggleStore: false, canToggleMenu: false },
    createdAt: new Date().toISOString()
  }, { merge: true });

  document.getElementById('adminAddUserModal')?.classList.add('hidden');
  showAtelierToast(`ເພີ່ມບັນຊີ ${email} ສຳເລັດ!`);
  window.loadAdminUsers();
};

// =======================================================
// 5. ANALYTICS, STORE STATUS & BRANDING SYNC
// =======================================================
window.setSalesFilter = function(range) {
  window.salesDateFilter = range;
  window.loadAdminAnalytics();
};

window.loadAdminAnalytics = async function() {
  const firestore = db || firebase.firestore();
  if (!firestore) return;

  try {
    const orderDocs = (Array.isArray(orders) && orders.length > 0)
      ? [...orders]
      : (await firestore.collection('orders').get()).docs.map(d => ({ id: d.id, ...d.data() }));

    orderDocs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const filterMs = window.salesDateFilter === 'month'
      ? startOfToday - 30 * 86400000
      : window.salesDateFilter === 'week'
      ? startOfToday - 7 * 86400000
      : startOfToday;

    let totalSales = 0, qrRevenue = 0, cashRevenue = 0, validOrdersCount = 0;

    const filteredDocs = orderDocs.filter(o => {
      const ms = o.createdAt?.seconds ? o.createdAt.seconds * 1000 : new Date(o.createdAt || Date.now()).getTime();
      return ms >= filterMs;
    });

    const rowsHtml = filteredDocs.map(o => {
      const isExcluded = o.status === 'cancelled' || o.status === 'rejected';
      const amount = Number(o.totalAmount ?? o.total ?? 0);
      const isQr = o.paymentType === 'qr' || Boolean(o.slipImage) || Boolean(o.slipUrl) || o.paymentType !== 'cash';

      if (!isExcluded) {
        totalSales += amount;
        validOrdersCount++;
        if (isQr) qrRevenue += amount;
        else cashRevenue += amount;
      }

      const dateStr = o.createdAt?.seconds
        ? new Date(o.createdAt.seconds * 1000).toLocaleTimeString('lo-LA', { hour: '2-digit', minute: '2-digit' })
        : 'ມື້ນີ້';
      const itemsSummary = (o.items || []).map(i => `${i.quantity}x ${i.name}`).join(', ');

      return `
        <tr class="hover:bg-surface/50 font-lao transition-colors border-b border-hairline ${isExcluded ? 'opacity-50' : ''}">
          <td class="p-2.5 font-mono text-[11px] font-bold text-primary">${o.orderCode || o.id.substr(0, 6)}</td>
          <td class="p-2.5 text-[11px] text-taupe">${dateStr}</td>
          <td class="p-2.5 font-medium text-[12px]">${o.customerName || 'Guest'}</td>
          <td class="p-2.5 text-[11px] text-taupe truncate max-w-[200px]">${itemsSummary || 'ບໍ່ມີລາຍການ'}</td>
          <td class="p-2.5 text-[11px]">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${isExcluded ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-800'}">
              ${isExcluded ? 'ປະຕິເສດ/ຍົກເລີກ' : (o.paymentMethod || 'QR ໂອນ')}
            </span>
          </td>
          <td class="p-2.5 font-mono text-forest-emerald text-right font-bold text-[12px]">${formatLAK(amount)}</td>
        </tr>
      `;
    }).join('');

    const elSales = document.getElementById('metricTotalSales');
    const elCount = document.getElementById('metricTotalOrdersCount');
    const elQr = document.getElementById('metricQrRevenue');
    const elCash = document.getElementById('metricCashRevenue');

    if (elSales) elSales.textContent = formatLAK(totalSales);
    if (elCount) elCount.textContent = `${validOrdersCount} ອໍເດີ້`;
    if (elQr) elQr.textContent = formatLAK(qrRevenue);
    if (elCash) elCash.textContent = formatLAK(cashRevenue);

    const tableBody = document.getElementById('analyticsTransactionsTableBody');
    if (tableBody) tableBody.innerHTML = rowsHtml || `<tr><td colspan="6" class="p-6 text-center text-taupe font-lao">ຍັງບໍ່ມີລາຍການຂາຍໃນຊ່ວງເວລານີ້</td></tr>`;
  } catch (err) {
    console.error("Analytics error:", err);
  }
};

window.renderAnalytics = window.loadAdminAnalytics;

window.updateStoreStatusUI = function() {
  const isOpen = storeSettings?.isStoreOpen !== false;
  const adminBtn = document.getElementById('btnToggleStore');
  if (adminBtn) {
    adminBtn.textContent = isOpen ? 'ສະຖານະ: ເປີດຮ້ານ (ກົດເພື່ອປິດ)' : 'ສະຖານະ: ປິດຊົ່ວຄາວ (ກົດເພື່ອເປີດ)';
    adminBtn.className = `px-3 py-1.5 rounded-lg text-white text-[11px] font-medium cursor-pointer ${isOpen ? 'bg-emerald-800' : 'bg-red-700'}`;
  }

  const taxEl = document.getElementById('taxSettingsDisplay');
  if (taxEl) taxEl.textContent = `Tax: ${Number(storeSettings?.taxRatePercent || 0)}% (ປັບປ່ຽນ)`;

  const badge = document.getElementById('customerStoreOpenBadge');
  if (badge) {
    badge.innerHTML = isOpen
      ? `<span class="relative flex h-2 w-2"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span></span><span class="text-[11px] font-bold text-emerald-900 tracking-wide font-lao">ເປີດບໍລິການ (07:00 – 20:00)</span>`
      : `<span class="h-2 w-2 rounded-full bg-red-600"></span><span class="text-[11px] font-bold text-red-800 tracking-wide font-lao">ປິດບໍລິການຊົ່ວຄາວ</span>`;
  }
};

window.toggleStoreStatus = async function() {
  const nextOpen = !(storeSettings?.isStoreOpen !== false);
  storeSettings.isStoreOpen = nextOpen;
  localStorage.setItem('ladolce_store_settings', JSON.stringify(storeSettings));
  window.updateStoreStatusUI();
  if (typeof renderStaffStoreControl === 'function') renderStaffStoreControl();

  try {
    const firestore = db || firebase.firestore();
    await firestore.collection('settings').doc('store').set({
      isStoreOpen: nextOpen,
      taxRatePercent: Number(storeSettings?.taxRatePercent || 0),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  } catch (_) {}

  showAtelierToast(nextOpen ? 'ເປີດຮັບອໍເດີ້ແລ້ວ' : 'ປິດຮັບອໍເດີ້ຊົ່ວຄາວ', nextOpen ? 'success' : 'warning');
};

window.updateTaxSettings = async function() {
  const val = prompt('ກຳນົດອັດຕາອາກອນ Tax (%) ເຊັ່ນ 0, 7, 10:', String(storeSettings?.taxRatePercent || 0));
  if (val === null) return;
  const num = Math.max(0, Math.min(50, Number(val) || 0));
  storeSettings.taxRatePercent = num;
  localStorage.setItem('ladolce_store_settings', JSON.stringify(storeSettings));
  window.updateStoreStatusUI();
  if (typeof calculateCartSummary === 'function') calculateCartSummary();
  try {
    const firestore = db || firebase.firestore();
    await firestore.collection('settings').doc('store').set({ taxRatePercent: num }, { merge: true });
  } catch (_) {}
  showAtelierToast(`ຕັ້ງຄ່າອາກອນເປັນ ${num}% ແລ້ວ`);
};

// COUPONS
window.openAddCouponModal = function() {
  document.getElementById('couponForm')?.reset();
  document.getElementById('addCouponModal')?.classList.remove('hidden');
};
window.closeAddCouponModal = function() {
  document.getElementById('addCouponModal')?.classList.add('hidden');
};
window.saveCouponFromModal = async function(event) {
  if (event) event.preventDefault();
  const code = document.getElementById('inputCpnCode')?.value.trim().toUpperCase();
  const type = document.getElementById('inputCpnType')?.value || 'percent';
  const value = Number(document.getElementById('inputCpnValue')?.value) || 0;
  const maxDiscount = Number(document.getElementById('inputCpnMaxDiscount')?.value) || 0;
  const minOrder = Number(document.getElementById('inputCpnMinOrder')?.value) || 0;
  const totalBudget = Number(document.getElementById('inputCpnTotalBudget')?.value) || 0;
  const expiryDate = document.getElementById('inputCpnExpiry')?.value || '';
  const desc = document.getElementById('inputCpnDesc')?.value.trim() || '';

  if (!code || value <= 0) {
    showAtelierToast('ກະລຸນາປ້ອນລະຫັດ ແລະ ມູນຄ່າສ່ວນຫຼຸດໃຫ້ຄົບ!', 'warning');
    return;
  }

  const firestore = db || firebase.firestore();
  await firestore.collection('coupons').doc(code).set({
    code, type, value,
    maxDiscount: maxDiscount || null,
    minOrder: minOrder || 0,
    totalBudget: totalBudget || null,
    usedBudget: 0,
    expiryDate: expiryDate || null,
    desc, isActive: true, createdAt: new Date().toISOString()
  }, { merge: true });

  showAtelierToast(`ສ້າງຄູປອງ ${code} ສຳເລັດ!`);
  window.closeAddCouponModal();
  window.loadAdminCoupons();
};

window.loadAdminCoupons = async function() {
  const container = document.getElementById('adminCouponsListGrid');
  if (!container) return;
  const firestore = db || firebase.firestore();
  const snap = await firestore.collection('coupons').get();
  if (snap.empty) {
    container.innerHTML = `<div class="col-span-full p-6 text-center text-taupe font-lao">ຍັງບໍ່ມີຄູປອງໃນລະບົບ</div>`;
    return;
  }
  container.innerHTML = snap.docs.map(doc => {
    const c = doc.data();
    return `
      <div class="p-4 rounded-xl bg-surface border border-hairline flex justify-between items-start font-lao gap-2">
        <div>
          <span class="font-mono font-bold text-forest-emerald text-[14px] bg-forest-emerald/10 px-2 py-0.5 rounded">${c.code}</span>
          <p class="text-[12px] font-bold text-primary mt-1">ຫຼຸດ ${c.type === 'percent' ? `${c.value}%` : `${formatLAK(c.value)}`}</p>
          <p class="text-[10px] text-taupe mt-0.5">
            ${c.minOrder ? `ຂັ້ນຕ່ຳ ${formatLAK(c.minOrder)} • ` : ''}
            ${c.expiryDate ? `ໝົດອາຍຸ ${c.expiryDate}` : 'ບໍ່ກຳນົດວັນໝົດອາຍຸ'}
          </p>
        </div>
        <button type="button" onclick="window.deleteCoupon('${c.code}')" class="text-red-600 hover:text-red-800 p-1 cursor-pointer" title="ລຶບຄູປອງ">
          ${svgIcon('trash', 'w-4 h-4')}
        </button>
      </div>
    `;
  }).join('');
};

window.deleteCoupon = async function(code) {
  const ok = await showAtelierConfirm({ title: 'ລຶບຄູປອງ', message: `ລຶບຄູປອງ ${code} ແທ້ບໍ່?`, confirmText: 'ລຶບ', cancelText: 'ຍົກເລີກ' });
  if (!ok) return;
  const firestore = db || firebase.firestore();
  await firestore.collection('coupons').doc(code).delete();
  showAtelierToast(`ລຶບຄູປອງ ${code} ແລ້ວ`);
  window.loadAdminCoupons();
};

// BRANDING & LOGO INITIALS SYNC
window.openBrandModal = function() {
  const modal = document.getElementById('brandSettingsModal');
  const nameInput = document.getElementById('inputCafeName');
  const branchInput = document.getElementById('inputCafeBranch');

  if (nameInput) nameInput.value = brandSettings?.cafeName || 'LA DOLCE';
  if (branchInput) branchInput.value = brandSettings?.cafeBranch || 'Downtown Flagship Roastery';

  // ເພີ່ມຊ່ອງໂຕຫຍໍ້ໂລໂກ້ (Logo Initials) ອັດຕະໂນມັດ
  if (modal && !document.getElementById('inputCafeInitials')) {
    const div = document.createElement('div');
    div.innerHTML = `
      <label class="block text-taupe mb-1 font-bold">ໂຕຫຍໍ້ໂລໂກ້ (Logo Initials — ເຊັ່ນ LD, ALS):</label>
      <input id="inputCafeInitials" type="text" maxlength="4" placeholder="LD" class="w-full rounded-lg border border-hairline p-2 font-serif-title font-bold uppercase text-[14px]"/>
    `;
    branchInput?.parentElement?.after(div);
    nameInput?.addEventListener('input', () => {
      const initEl = document.getElementById('inputCafeInitials');
      if (initEl && !initEl.dataset.manual) {
        initEl.value = generateBrandInitials(nameInput.value);
      }
    });
    document.getElementById('inputCafeInitials')?.addEventListener('input', (e) => {
      e.target.dataset.manual = e.target.value.trim() ? '1' : '';
    });
  }

  const initInput = document.getElementById('inputCafeInitials');
  if (initInput) {
    initInput.dataset.manual = '';
    initInput.value = brandSettings?.brandInitials || generateBrandInitials(nameInput?.value || 'LA DOLCE');
  }

  modal?.classList.remove('hidden');
};

window.closeBrandModal = function() {
  document.getElementById('brandSettingsModal')?.classList.add('hidden');
};

window.saveBrandSettings = async function(event) {
  if (event) event.preventDefault();
  const cafeName = document.getElementById('inputCafeName')?.value.trim() || 'LA DOLCE';
  const cafeBranch = document.getElementById('inputCafeBranch')?.value.trim() || 'Downtown Flagship Roastery';
  const customInit = document.getElementById('inputCafeInitials')?.value.trim().toUpperCase();
  const brandInitials = customInit || generateBrandInitials(cafeName);

  brandSettings = { cafeName, cafeBranch, brandInitials };
  localStorage.setItem('ladolce_brand_settings', JSON.stringify(brandSettings));
  applyBrandSettingsUI();

  try {
    const firestore = db || firebase.firestore();
    await firestore.collection('settings').doc('brand').set({
      ...brandSettings,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    window.closeBrandModal();
    showAtelierToast(`ອັບເດດຊື່ຮ້ານ "${cafeName}" (${brandInitials}) Sync ທຸກໜ້າແລ້ວ!`);
  } catch (e) {
    console.error('Brand save error:', e);
    showAtelierAlert({
      title: 'ບັນທຶກຊື່ຮ້ານຂຶ້ນ Cloud ບໍ່ສຳເລັດ',
      message: `ກວດສອບ Firestore Rules ຂອງ settings ອີກຄັ້ງ: ${e.message}`,
      type: 'error'
    });
  }
};

  window.closeBrandModal();
  showAtelierToast(`ອັບເດດຊື່ຮ້ານ "${cafeName}" (${brandInitials}) ທົ່ວທັງລະບົບແລ້ວ!`);
};

window.loadAllOwnerData = function() {
  window.updateStoreStatusUI();
  window.loadAdminAnalytics();
  window.loadAdminMenus();
  window.loadAdminCoupons();
  window.loadAdminModifiers();
  window.loadAdminPayments();
  window.loadAdminUsers();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', window.loadAllOwnerData);
} else {
  window.loadAllOwnerData();
}
