// =======================================================
// LA DOLCE — COMPLETE SUPERADMIN (EDIT MENU & QR PAYMENTS)
// =======================================================

console.log("👑 [admin.js] Loading Superadmin Controls...");

window.adminCurrentTab = 'analytics';
window.editingMenuItemId = null; // ຕົວແປເກັບ ID ເມນູທີ່ກຳລັງແກ້ໄຂ

// 1. ປ່ຽນແຖບ Superadmin
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
// 2. ຈັດການເມນູ (ເພີ່ມໃໝ່ & 🔥 ແກ້ໄຂເມນູ EDIT)
// =======================================================

// ໂຫຼດເມນູທັງໝົດ ພ້ອມປຸ່ມແກ້ໄຂ (Edit ✏️)
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

    // Sync ໃຫ້ຝັ່ງ Customer ເຫັນພ້ອມກັນ
    window.menuItems = items;
    if (typeof menuItems !== 'undefined') menuItems = items;
    if (typeof renderMenu === 'function') renderMenu();

    container.innerHTML = items.map(item => {
      const isAvail = item.isAvailable !== false;
      const price = Number(item.price || 35000);

      return `
        <div class="p-3.5 rounded-xl bg-surface border border-hairline flex items-center justify-between shadow-2xs font-lao">
          <div class="flex items-center gap-3">
            <img src="${item.image || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200'}" class="w-14 h-14 rounded-lg object-cover border border-hairline shrink-0"/>
            <div>
              <div class="flex items-center gap-2">
                <h5 class="font-bold text-[14px] text-primary">${item.name}</h5>
                <span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase ${isAvail ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}">
                  ${isAvail ? 'ພ້ອມຂາຍ' : 'ໝົດ'}
                </span>
              </div>
              <span class="text-[11px] text-taupe capitalize">${item.category || 'coffee'} • ${formatLAK(price)}</span>
            </div>
          </div>

          <div class="flex items-center gap-1.5">
            <!-- ປຸ່ມເປີດ/ປິດຂາຍ -->
            <button type="button" onclick="window.toggleMenuItemAvailability('${item.id}', ${!isAvail})" class="px-2.5 py-1 rounded-lg border text-[11px] font-bold ${isAvail ? 'border-amber-300 text-amber-900 bg-amber-50' : 'border-emerald-300 text-emerald-900 bg-emerald-50'} cursor-pointer">
              ${isAvail ? 'ປິດ (ໝົດ)' : 'ເປີດຂາຍ'}
            </button>

            <!-- 🔥🔥🔥 ປຸ່ມແກ້ໄຂເມນູ (EDIT ✏️) 🔥🔥🔥 -->
            <button type="button" onclick="window.openEditMenuModal('${item.id}')" class="p-1.5 rounded-lg border border-hairline hover:bg-surface text-taupe hover:text-forest-emerald cursor-pointer" title="ແກ້ໄຂເມນູນີ້">
              <span class="material-symbols-outlined text-[18px]">edit</span>
            </button>

            <!-- ປຸ່ມລຶບ -->
            <button type="button" onclick="window.deleteMenuItem('${item.id}')" class="p-1.5 rounded-lg border border-hairline hover:bg-red-50 text-taupe hover:text-red-600 cursor-pointer" title="ລຶບເມນູ">
              <span class="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    console.error("Admin menus error:", err);
  }
};

// ເປີດ Modal ເພີ່ມເມນູໃໝ່
window.openAddMenuModal = function() {
  window.editingMenuItemId = null; // ບໍ່ແມ່ນການແກ້ໄຂ
  document.getElementById('menuForm')?.reset();
  const preview = document.getElementById('menuImagePreview');
  if (preview) {
    preview.src = '';
    preview.classList.add('hidden');
  }
  document.getElementById('addMenuModal')?.classList.remove('hidden');
};

// 🔥 ເປີດ Modal ເພື່ອແກ້ໄຂເມນູເກົ່າ (ດຶງຂໍ້ມູນມາໃສ່ຊ່ອງຕ່າງໆ)
window.openEditMenuModal = function(itemId) {
  const item = (window.menuItems || []).find(i => String(i.id) === String(itemId));
  if (!item) return;

  window.editingMenuItemId = itemId; // ໝາຍໄວ້ວ່າກຳລັງແກ້ໄຂເມນູນີ້

  document.getElementById('inputItemName').value = item.name || '';
  document.getElementById('inputItemCategory').value = item.category || 'coffee';
  document.getElementById('inputItemDesc').value = item.desc || '';

  const v = item.variants || {};
  document.getElementById('priceStandard').value = item.price || v.standard || 35000;
  document.getElementById('priceHot').value = v.hot || '';
  document.getElementById('priceIced').value = v.iced || '';
  document.getElementById('priceFrappe').value = v.frappe || '';

  document.getElementById('toggleAllowHot').checked = item.allowHot !== false;
  document.getElementById('toggleAllowIced').checked = item.allowIced !== false;
  document.getElementById('toggleAllowFrappe').checked = item.allowFrappe === true;

  document.getElementById('toggleAllowMilk').checked = item.allowMilk !== false;
  document.getElementById('toggleAllowSweetness').checked = item.allowSweetness !== false;
  document.getElementById('toggleAllowTopping').checked = item.allowTopping !== false;

  const preview = document.getElementById('menuImagePreview');
  if (preview && item.image) {
    preview.src = item.image;
    preview.classList.remove('hidden');
  }

  document.getElementById('addMenuModal')?.classList.remove('hidden');
};

window.closeAddMenuModal = function() {
  window.editingMenuItemId = null;
  document.getElementById('addMenuModal')?.classList.add('hidden');
};

window.handleMenuImageUpload = function(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const preview = document.getElementById('menuImagePreview');
    if (preview) {
      preview.src = e.target.result;
      preview.classList.remove('hidden');
    }
  };
  reader.readAsDataURL(file);
};

// ບັນທຶກເມນູ (ຮອງຮັບທັງ ເພີ່ມໃໝ່ ແລະ ແກ້ໄຂອັບເດດ)
window.saveMenuItem = async function(event) {
  if (event) event.preventDefault();

  try {
    const name = document.getElementById('inputItemName')?.value.trim();
    const category = document.getElementById('inputItemCategory')?.value || 'coffee';
    const desc = document.getElementById('inputItemDesc')?.value.trim() || '';
    const imageSrc = document.getElementById('menuImagePreview')?.src || '';

    const allowHot = document.getElementById('toggleAllowHot')?.checked;
    const allowIced = document.getElementById('toggleAllowIced')?.checked;
    const allowFrappe = document.getElementById('toggleAllowFrappe')?.checked;

    const priceHot = Number(document.getElementById('priceHot')?.value) || 0;
    const priceIced = Number(document.getElementById('priceIced')?.value) || 0;
    const priceFrappe = Number(document.getElementById('priceFrappe')?.value) || 0;
    const priceStandard = Number(document.getElementById('priceStandard')?.value) || 35000;

    const allowMilk = document.getElementById('toggleAllowMilk')?.checked;
    const allowSweetness = document.getElementById('toggleAllowSweetness')?.checked;
    const allowTopping = document.getElementById('toggleAllowTopping')?.checked;

    if (!name) return alert("ກະລຸນາປ້ອນຊື່ເມນູ!");

    const menuItemData = {
      name,
      category,
      desc,
      price: priceStandard,
      allowHot,
      allowIced,
      allowFrappe,
      allowMilk,
      allowSweetness,
      allowTopping,
      isAvailable: true,
      variants: {
        standard: priceStandard,
        hot: allowHot ? (priceHot || priceStandard) : null,
        iced: allowIced ? (priceIced || priceStandard + 5000) : null,
        frappe: allowFrappe ? (priceFrappe || priceStandard + 10000) : null
      },
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (imageSrc && !imageSrc.includes('data:,')) {
      menuItemData.image = imageSrc;
    }

    const firestore = db || firebase.firestore();

    if (window.editingMenuItemId) {
      // ຖ້າເປັນການແກ້ໄຂ -> UPDATE
      await firestore.collection('menu_items').doc(window.editingMenuItemId).update(menuItemData);
      alert(`🎉 ແກ້ໄຂເມນູ "${name}" ສຳເລັດແລ້ວ!`);
    } else {
      // ຖ້າເປັນການເພີ່ມໃໝ່ -> ADD
      await firestore.collection('menu_items').add(menuItemData);
      alert(`🎉 ເພີ່ມເມນູໃໝ່ "${name}" ສຳເລັດແລ້ວ!`);
    }

    window.closeAddMenuModal();
    window.loadAdminMenus();

  } catch (e) {
    console.error("Save menu error:", e);
    alert("ເກີດຂໍ້ຜິດພາດ: " + e.message);
  }
};

window.toggleMenuItemAvailability = async function(id, status) {
  const firestore = db || firebase.firestore();
  await firestore.collection('menu_items').doc(id).update({ isAvailable: status });
  window.loadAdminMenus();
};

window.deleteMenuItem = async function(id) {
  if (!confirm("ທ່ານຕ້ອງການລຶບເມນູນີ້ແທ້ບໍ່?")) return;
  const firestore = db || firebase.firestore();
  await firestore.collection('menu_items').doc(id).delete();
  window.loadAdminMenus();
};

// =======================================================
// 3. ຈັດການ QR ທະນາຄານ (🔥 ແກ້ໄຂ openAddPaymentModal)
// =======================================================

// 🔥 ເປີດ Modal ເພີ່ມ QR ທະນາຄານ
window.openAddPaymentModal = function() {
  document.getElementById('paymentForm')?.reset();
  const preview = document.getElementById('bankQrPreview');
  if (preview) {
    preview.src = '';
    preview.classList.add('hidden');
  }
  document.getElementById('addPaymentModal')?.classList.remove('hidden');
};

window.closeAddPaymentModal = function() {
  document.getElementById('addPaymentModal')?.classList.add('hidden');
};

// ອັບໂຫຼດຮູບ QR Code
window.handleBankQRUpload = function(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const preview = document.getElementById('bankQrPreview');
    if (preview) {
      preview.src = e.target.result;
      preview.classList.remove('hidden');
    }
  };
  reader.readAsDataURL(file);
};

// 🔥 ບັນທຶກຊ່ອງທາງຮັບເງິນ QR ໃໝ່
window.savePaymentMethod = async function(event) {
  if (event) event.preventDefault();

  try {
    const bankName = document.getElementById('inputBankName')?.value.trim();
    const accountNumber = document.getElementById('inputAccountNumber')?.value.trim();
    const borderColor = document.getElementById('inputBorderColor')?.value || '#DC2626';
    const qrImage = document.getElementById('bankQrPreview')?.src;

    if (!bankName || !accountNumber) {
      alert("⚠️ ກະລຸນາປ້ອນຊື່ທະນາຄານ ແລະ ເລກບັນຊີ!");
      return;
    }

    const newPayment = {
      id: 'pay_' + Date.now(),
      bankName: bankName,
      accountNumber: accountNumber,
      borderColor: borderColor,
      qrImage: qrImage || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${accountNumber}`
    };

    // ບັນທຶກລົງ Firestore collection: 'payments'
    const firestore = db || firebase.firestore();
    await firestore.collection('payments').add(newPayment);

    // ສຳຮອງລົງ LocalStorage
    let list = JSON.parse(localStorage.getItem('ladolce_payment_methods') || '[]');
    list.push(newPayment);
    localStorage.setItem('ladolce_payment_methods', JSON.stringify(list));
    paymentMethods = list;

    alert(`🎉 ເພີ່ມບັນຊີ "${bankName}" ສຳເລັດແລ້ວ!`);
    window.closeAddPaymentModal();
    window.loadAdminPayments();

  } catch (e) {
    console.error("Save payment error:", e);
    alert("ເກີດຂໍ້ຜິດພາດ: " + e.message);
  }
};

// ໂຫຼດລາຍການ QR ທະນາຄານ
window.loadAdminPayments = async function() {
  const container = document.getElementById('paymentMethodsAdminList');
  if (!container) return;

  const firestore = db || firebase.firestore();
  let list = [];

  try {
    const snap = await firestore.collection('payments').get();
    if (!snap.empty) {
      list = snap.docs.map(d => ({ docId: d.id, ...d.data() }));
    } else {
      list = paymentMethods || DEFAULT_PAYMENTS || [];
    }
  } catch(e) {
    list = paymentMethods || DEFAULT_PAYMENTS || [];
  }

  container.innerHTML = list.map(p => `
    <div class="p-4 rounded-xl bg-surface border-2 border-dashed flex flex-col items-center justify-between space-y-2 font-lao relative group" style="border-color: ${p.borderColor || '#16593D'};">
      <img src="${p.qrImage}" class="w-28 h-28 object-contain rounded-lg border border-hairline bg-white p-1"/>
      <div class="text-center">
        <h5 class="font-bold text-[14px] text-primary">${p.bankName}</h5>
        <span class="font-mono text-[12px] text-taupe">${p.accountNumber}</span>
      </div>
      ${p.docId ? `
        <button type="button" onclick="window.deletePaymentMethod('${p.docId}')" class="text-red-500 hover:text-red-700 text-[11px] font-bold mt-1 cursor-pointer">
          ລຶບ QR ນີ້
        </button>
      ` : ''}
    </div>
  `).join('');
};

window.deletePaymentMethod = async function(docId) {
  if (!confirm("ທ່ານຕ້ອງການລຶບ QR ນີ້ແທ້ບໍ່?")) return;
  const firestore = db || firebase.firestore();
  await firestore.collection('payments').doc(docId).delete();
  window.loadAdminPayments();
};

// =======================================================
// 4. ANALYTICS (ຍອດຂາຍປະຈຳວັນ)
// =======================================================
window.loadAdminAnalytics = async function() {
  const firestore = db || firebase.firestore();
  if (!firestore) return;

  try {
    const snap = await firestore.collection('orders').get();
    let totalSales = 0, qrRevenue = 0, cashRevenue = 0, validOrdersCount = 0;

    const orderDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    orderDocs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

    const rowsHtml = orderDocs.map(o => {
      const isNotCancelled = o.status !== 'cancelled';
      const amount = Number(o.totalAmount || 0);

      if (isNotCancelled) {
        totalSales += amount;
        validOrdersCount++;
        if (o.slipUrl) qrRevenue += amount;
        else cashRevenue += amount;
      }

      const dateStr = o.createdAt ? new Date(o.createdAt.seconds * 1000).toLocaleTimeString('lo-LA', { hour: '2-digit', minute: '2-digit' }) : 'ມື້ນີ້';
      const itemsSummary = (o.items || []).map(i => `${i.quantity}x ${i.name}`).join(', ');

      return `
        <tr class="hover:bg-surface/50 font-lao transition-colors border-b border-hairline">
          <td class="p-2.5 font-mono text-[11px] font-bold text-primary">${o.orderCode || o.id.substr(0, 6)}</td>
          <td class="p-2.5 text-[11px] text-taupe">${dateStr}</td>
          <td class="p-2.5 font-medium text-[12px]">${o.customerName || 'Guest'}</td>
          <td class="p-2.5 text-[11px] text-taupe truncate max-w-[200px]">${itemsSummary || 'ບໍ່ມີລາຍການ'}</td>
          <td class="p-2.5 text-[11px]">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${o.slipUrl ? 'bg-blue-50 text-blue-800' : 'bg-gray-100 text-gray-800'}">
              ${o.slipUrl ? 'QR ໂອນ' : 'ເງິນສົດ'}
            </span>
          </td>
          <td class="p-2.5 font-mono text-forest-emerald text-right font-bold text-[12px]">${formatLAK(amount)}</td>
        </tr>
      `;
    }).join('');

    document.getElementById('metricTotalSales').textContent = formatLAK(totalSales);
    document.getElementById('metricTotalOrdersCount').textContent = `${validOrdersCount} ອໍເດີ້`;
    document.getElementById('metricQrRevenue').textContent = formatLAK(qrRevenue);
    document.getElementById('metricCashRevenue').textContent = formatLAK(cashRevenue);
    
    const tableBody = document.getElementById('analyticsTransactionsTableBody');
    if (tableBody) tableBody.innerHTML = rowsHtml || `<tr><td colspan="6" class="p-6 text-center text-taupe font-lao">ຍັງບໍ່ມີລາຍການຂາຍ</td></tr>`;

  } catch (err) {
    console.error("Analytics error:", err);
  }
};

// =======================================================
// 5. COUPONS, MODIFIERS, USERS & BRANDING
// =======================================================
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
  if (!code || value <= 0) return alert("ກະລຸນາປ້ອນຂໍ້ມູນໃຫ້ຄົບ!");

  const firestore = db || firebase.firestore();
  await firestore.collection('coupons').doc(code).set({
    code, type, value, isActive: true, createdAt: new Date().toISOString()
  }, { merge: true });

  alert("🎉 ສ້າງຄູປອງສຳເລັດ!");
  window.closeAddCouponModal();
  window.loadAdminCoupons();
};
window.loadAdminCoupons = async function() {
  const container = document.getElementById('adminCouponsListGrid');
  if (!container) return;
  const firestore = db || firebase.firestore();
  const snap = await firestore.collection('coupons').get();
  container.innerHTML = snap.docs.map(doc => {
    const c = doc.data();
    return `
      <div class="p-4 rounded-xl bg-surface border border-hairline flex justify-between items-center font-lao">
        <div>
          <span class="font-mono font-bold text-forest-emerald text-[14px] bg-forest-emerald/10 px-2 py-0.5 rounded">${c.code}</span>
          <p class="text-[12px] font-bold text-primary mt-1">ຫຼຸດ ${c.type === 'percent' ? `${c.value}%` : `${formatLAK(c.value)}`}</p>
        </div>
        <button type="button" onclick="window.deleteCoupon('${c.code}')" class="text-red-600 font-bold text-[12px] cursor-pointer">ລຶບ</button>
      </div>
    `;
  }).join('');
};
window.deleteCoupon = async function(code) {
  if (!confirm(`ລຶບຄູປອງ ${code} ແທ້ບໍ່?`)) return;
  const firestore = db || firebase.firestore();
  await firestore.collection('coupons').doc(code).delete();
  window.loadAdminCoupons();
};

window.openModifierModal = function() {
  document.getElementById('modifierForm')?.reset();
  document.getElementById('modifierModal')?.classList.remove('hidden');
};
window.closeModifierModal = function() {
  document.getElementById('modifierModal')?.classList.add('hidden');
};
window.saveModifierFromModal = async function(event) {
  if (event) event.preventDefault();
  const name = document.getElementById('inputModName')?.value.trim();
  const group = document.getElementById('inputModGroup')?.value || 'milk';
  const price = Number(document.getElementById('inputModPrice')?.value) || 0;
  const firestore = db || firebase.firestore();
  await firestore.collection('modifiers').add({ name, group, price, createdAt: new Date() });
  window.closeModifierModal();
  window.loadAdminModifiers();
};
window.loadAdminModifiers = async function() {
  const container = document.getElementById('modifierAdminList');
  if (!container) return;
  const firestore = db || firebase.firestore();
  const snap = await firestore.collection('modifiers').get();
  const list = snap.empty ? (DEFAULT_MODIFIERS || []) : snap.docs.map(d => ({ id: d.id, ...d.data() }));
  container.innerHTML = list.map(m => `
    <div class="p-3 rounded-lg bg-surface border border-hairline flex justify-between items-center text-[12px] font-lao">
      <div><span class="font-bold text-primary block">${m.name}</span><span class="text-[10px] text-taupe uppercase">[${m.group}]</span></div>
      <span class="font-mono font-bold text-forest-emerald">+${formatLAK(m.price)}</span>
    </div>
  `).join('');
};

window.loadAdminUsers = async function() {
  const tableBody = document.getElementById('adminUsersTableBody');
  if (!tableBody) return;
  const users = typeof REGISTERED_ACCOUNTS !== 'undefined' ? REGISTERED_ACCOUNTS : [];
  tableBody.innerHTML = users.map(u => `
    <tr class="hover:bg-surface/50 font-lao border-b border-hairline">
      <td class="p-2.5 font-bold">${u.name}</td>
      <td class="p-2.5 font-mono text-taupe text-[11px]">${u.email}</td>
      <td class="p-2.5"><span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-900">${u.role}</span></td>
      <td class="p-2.5 text-right font-mono text-[11px] text-taupe">${u.phone}</td>
    </tr>
  `).join('');
};

window.openBrandModal = function() {
  document.getElementById('brandSettingsModal')?.classList.remove('hidden');
};
window.closeBrandModal = function() {
  document.getElementById('brandSettingsModal')?.classList.add('hidden');
};
window.saveBrandSettings = function(event) {
  if (event) event.preventDefault();
  const name = document.getElementById('inputCafeName')?.value.trim();
  const branch = document.getElementById('inputCafeBranch')?.value.trim();
  if (name) document.querySelectorAll('.brand-name-display').forEach(el => el.textContent = name);
  if (branch) document.querySelectorAll('.brand-branch-display').forEach(el => el.textContent = branch);
  window.closeBrandModal();
  alert("🎉 ອັບເດດຊື່ຮ້ານຮຽບຮ້ອຍແລ້ວ!");
};

// ເລີ່ມຕົ້ນໂຫຼດຂໍ້ມູນ
window.loadAllOwnerData = function() {
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
