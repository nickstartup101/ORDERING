// =======================================================
// LA DOLCE — COMPLETE SUPERADMIN SUITE (OWNER PANEL)
// =======================================================

console.log("👑 [admin.js] Initializing Owner Suite...");

window.adminCurrentTab = 'analytics';

// 1. ປ່ຽນແຖບໃນໜ້າ Superadmin
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

  // ໂຫຼດຂໍ້ມູນຕາມ Tab
  if (tabName === 'analytics') window.loadAdminAnalytics();
  if (tabName === 'menu') window.loadAdminMenus();
  if (tabName === 'coupons') window.loadAdminCoupons();
  if (tabName === 'modifiers') window.loadAdminModifiers();
  if (tabName === 'payments') window.loadAdminPayments();
  if (tabName === 'users') window.loadAdminUsers();
};

// =======================================================
// 2. PANEL 1: ANALYTICS & TRANSACTIONS (ຍອດຂາຍ ແລະ ປະຫວັດ)
// =======================================================
window.loadAdminAnalytics = async function() {
  const firestore = db || firebase.firestore();
  try {
    const snap = await firestore.collection('orders').orderBy('createdAt', 'desc').limit(100).get();
    
    let totalSales = 0;
    let qrRevenue = 0;
    let cashRevenue = 0;
    let totalOrdersCount = 0;

    const rowsHtml = snap.docs.map(doc => {
      const o = doc.data();
      const isNotCancelled = o.status !== 'cancelled';
      const amount = Number(o.totalAmount || o.subtotal || 0);

      if (isNotCancelled) {
        totalSales += amount;
        totalOrdersCount++;
        if (o.slipUrl || (o.paymentMethod && o.paymentMethod.includes('QR'))) {
          qrRevenue += amount;
        } else {
          cashRevenue += amount;
        }
      }

      const dateStr = o.createdAt ? new Date(o.createdAt.seconds * 1000).toLocaleTimeString('lo-LA', { hour: '2-digit', minute: '2-digit' }) : 'ມື້ນີ້';
      const itemsSummary = (o.items || []).map(i => `${i.quantity}x ${i.name}`).join(', ');

      return `
        <tr class="hover:bg-surface/50 font-lao transition-colors">
          <td class="p-2.5 font-mono text-[11px] font-bold">${o.orderCode || doc.id.substr(0, 6)}</td>
          <td class="p-2.5 text-[11px] text-taupe">${dateStr}</td>
          <td class="p-2.5 font-medium">${o.customerName || 'Guest'}</td>
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

    // ອັບເດດຕົວເລກ Dashboard
    const elTotal = document.getElementById('metricTotalSales');
    const elCount = document.getElementById('metricTotalOrdersCount');
    const elQr = document.getElementById('metricQrRevenue');
    const elCash = document.getElementById('metricCashRevenue');
    const tableBody = document.getElementById('analyticsTransactionsTableBody');

    if (elTotal) elTotal.textContent = formatLAK(totalSales);
    if (elCount) elCount.textContent = `${totalOrdersCount} ອໍເດີ້`;
    if (elQr) elQr.textContent = formatLAK(qrRevenue);
    if (elCash) elCash.textContent = formatLAK(cashRevenue);
    if (tableBody) tableBody.innerHTML = rowsHtml || `<tr><td colspan="6" class="p-6 text-center text-taupe font-lao">ຍັງບໍ່ມີລາຍການຂາຍ</td></tr>`;

  } catch (err) {
    console.error("Analytics load error:", err);
  }
};

// =======================================================
// 3. PANEL 2: MENU MANAGEMENT (ດຶງຈາກ menu_items)
// =======================================================
window.loadAdminMenus = async function() {
  const container = document.getElementById('adminMenuListGrid');
  if (!container) return;

  const firestore = db || firebase.firestore();
  try {
    const snap = await firestore.collection('menu_items').get();

    if (snap.empty) {
      container.innerHTML = `<div class="col-span-full p-8 text-center text-taupe font-lao">ຍັງບໍ່ມີເມນູໃນລະບົບ. ກົດ "+ ເພີ່ມເມນູ" ເພື່ອເລີ່ມຕົ້ນ</div>`;
      return;
    }

    container.innerHTML = snap.docs.map(doc => {
      const item = doc.data();
      const isAvail = item.isAvailable !== false;
      const price = Number(item.price || item.standardPrice || 35000);

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
              <span class="text-[11px] text-taupe capitalize">${item.category} • ${formatLAK(price)}</span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button type="button" onclick="window.toggleMenuItemAvailability('${doc.id}', ${!isAvail})" class="px-2.5 py-1 rounded-lg border text-[11px] font-bold ${isAvail ? 'border-amber-300 text-amber-900 bg-amber-50' : 'border-emerald-300 text-emerald-900 bg-emerald-50'} cursor-pointer">
              ${isAvail ? 'ປິດ (ໝົດ)' : 'ເປີດຂາຍ'}
            </button>
            <button type="button" onclick="window.deleteMenuItem('${doc.id}')" class="p-1 text-taupe hover:text-red-600 cursor-pointer">
              <span class="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error("Load admin menus error:", err);
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
// 4. PANEL 3: COUPONS (ຈັດການຄູປອງ)
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
  const submitBtn = event && event.target ? event.target.querySelector('button[type="submit"]') : null;
  const originalText = submitBtn ? submitBtn.innerHTML : '';

  try {
    const code = document.getElementById('inputCpnCode')?.value.trim().toUpperCase();
    const type = document.getElementById('inputCpnType')?.value || 'percent';
    const value = Number(document.getElementById('inputCpnValue')?.value) || 0;
    const maxDiscount = Number(document.getElementById('inputCpnMaxDiscount')?.value) || 0;
    const minOrder = Number(document.getElementById('inputCpnMinOrder')?.value) || 0;
    const totalBudget = Number(document.getElementById('inputCpnTotalBudget')?.value) || 0;
    const expiry = document.getElementById('inputCpnExpiry')?.value || '';
    const desc = document.getElementById('inputCpnDesc')?.value.trim() || '';

    if (!code || value <= 0) {
      alert("⚠️ ກະລຸນາປ້ອນລະຫັດ Coupon ແລະ ມູນຄ່າສ່ວນຫຼຸດ!");
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>ກຳລັງບັນທຶກ...</span>`;
    }

    const firestore = db || firebase.firestore();
    await firestore.collection('coupons').doc(code).set({
      code, type, value, maxDiscount, minOrder, totalBudget,
      usedBudget: 0, expiryDate: expiry, desc, isActive: true,
      createdAt: new Date().toISOString()
    }, { merge: true });

    alert(`🎉 ປະກາດໃຊ້ຄູປອງ "${code}" ສຳເລັດແລ້ວ!`);
    window.closeAddCouponModal();
    window.loadAdminCoupons();
  } catch (e) {
    alert("Error: " + e.message);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  }
};

window.loadAdminCoupons = async function() {
  const container = document.getElementById('adminCouponsListGrid');
  if (!container) return;

  const firestore = db || firebase.firestore();
  try {
    const snap = await firestore.collection('coupons').get();
    if (snap.empty) {
      container.innerHTML = `<div class="col-span-full p-8 text-center text-taupe font-lao">ຍັງບໍ່ມີຄູປອງເທື່ອ. ກົດ "+ ສ້າງຄູປອງໃໝ່"</div>`;
      return;
    }

    container.innerHTML = snap.docs.map(doc => {
      const c = doc.data();
      return `
        <div class="p-4 rounded-xl bg-surface border border-hairline flex flex-col justify-between space-y-3 font-lao">
          <div>
            <div class="flex items-center justify-between">
              <span class="font-mono font-bold text-forest-emerald text-[14px] bg-forest-emerald/10 px-2 py-0.5 rounded">${c.code}</span>
              <span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded ${c.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}">Active</span>
            </div>
            <p class="text-[13px] font-bold text-primary mt-2">ຫຼຸດ ${c.type === 'percent' ? `${c.value}%` : `${formatLAK(c.value)}`}</p>
            <p class="text-[11px] text-taupe mt-1">${c.desc || 'ສ່ວນຫຼຸດ'}</p>
          </div>
          <div class="pt-2 border-t border-hairline flex justify-between text-[11px]">
            <span class="text-taupe">ໝົດອາຍຸ: ${c.expiryDate || 'ບໍ່ມີ'}</span>
            <button type="button" onclick="window.deleteCoupon('${c.code}')" class="text-red-600 font-bold cursor-pointer">ລຶບ</button>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error(err);
  }
};

window.deleteCoupon = async function(code) {
  if (!confirm(`ລຶບຄູປອງ ${code} ແທ້ບໍ່?`)) return;
  const firestore = db || firebase.firestore();
  await firestore.collection('coupons').doc(code).delete();
  window.loadAdminCoupons();
};

// =======================================================
// 5. PANEL 4: MODIFIERS & ADDONS (ຕົວເລືອກເສີມ)
// =======================================================
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
  try {
    const snap = await firestore.collection('modifiers').get();
    const list = snap.empty ? (DEFAULT_MODIFIERS || []) : snap.docs.map(d => ({ id: d.id, ...d.data() }));

    container.innerHTML = list.map(m => `
      <div class="p-3 rounded-lg bg-surface border border-hairline flex justify-between items-center text-[12px] font-lao">
        <div>
          <span class="font-bold text-primary block">${m.name}</span>
          <span class="text-[10px] text-taupe uppercase">[${m.group}]</span>
        </div>
        <span class="font-mono font-bold text-forest-emerald">+${formatLAK(m.price)}</span>
      </div>
    `).join('');
  } catch (err) {
    console.error(err);
  }
};

// =======================================================
// 6. PANEL 5: PAYMENTS (ບັນຊີຮັບເງິນ QR)
// =======================================================
window.loadAdminPayments = async function() {
  const container = document.getElementById('paymentMethodsAdminList');
  if (!container) return;

  const list = paymentMethods || DEFAULT_PAYMENTS || [];
  container.innerHTML = list.map(p => `
    <div class="p-4 rounded-xl bg-surface border-2 border-dashed flex flex-col items-center justify-center space-y-2 font-lao" style="border-color: ${p.borderColor || '#16593D'};">
      <img src="${p.qrImage}" class="w-24 h-24 object-contain rounded-lg border border-hairline"/>
      <div class="text-center">
        <h5 class="font-bold text-[13px] text-primary">${p.bankName}</h5>
        <span class="font-mono text-[11px] text-taupe">${p.accountNumber}</span>
      </div>
    </div>
  `).join('');
};

// =======================================================
// 7. PANEL 6: USERS (ຈັດການຜູ້ໃຊ້ລະບົບ)
// =======================================================
window.loadAdminUsers = async function() {
  const tableBody = document.getElementById('adminUsersTableBody');
  if (!tableBody) return;

  const firestore = db || firebase.firestore();
  try {
    const snap = await firestore.collection('users').get();
    const users = snap.empty ? (REGISTERED_ACCOUNTS || []) : snap.docs.map(d => ({ id: d.id, ...d.data() }));

    tableBody.innerHTML = users.map(u => `
      <tr class="hover:bg-surface/50 font-lao">
        <td class="p-2.5 font-bold">${u.name || 'User'}</td>
        <td class="p-2.5 font-mono text-taupe text-[11px]">${u.email || '-'}</td>
        <td class="p-2.5">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
            u.role === 'superadmin' ? 'bg-purple-100 text-purple-900' :
            u.role === 'staff' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
          }">
            ${u.role || 'Customer'}
          </span>
        </td>
        <td class="p-2.5 text-right font-mono text-[11px] text-taupe">${u.phone || '-'}</td>
      </tr>
    `).join('');
  } catch (err) {
    console.error(err);
  }
};

// =======================================================
// 8. BRANDING & STORE CONTROLS
// =======================================================
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

// ເລີ່ມໂຫຼດໜ້າ Analytics ທັນທີທີ່ເປີດແອັບ
document.addEventListener('DOMContentLoaded', () => {
  window.loadAdminAnalytics();
});
