// =======================================================
// LA DOLCE — OWNER SUITE ENGINE (ZERO-INDEX & AUTO-LOAD)
// =======================================================

console.log("👑 [admin.js] Starting Owner Suite...");

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

  // ໂຫຼດຂໍ້ມູນທັນທີເມື່ອກົດປ່ຽນແຖບ
  if (tabName === 'analytics') window.loadAdminAnalytics();
  if (tabName === 'menu') window.loadAdminMenus();
  if (tabName === 'coupons') window.loadAdminCoupons();
  if (tabName === 'modifiers') window.loadAdminModifiers();
  if (tabName === 'payments') window.loadAdminPayments();
  if (tabName === 'users') window.loadAdminUsers();
};

// =======================================================
// 2. ໂຫຼດຍອດຂາຍ ແລະ ປະຫວັດອໍເດີ້ (ບໍ່ໃຊ້ orderBy ເພື່ອບໍ່ໃຫ້ຕິດ Index)
// =======================================================
window.loadAdminAnalytics = async function() {
  const firestore = db || (typeof firebase !== 'undefined' ? firebase.firestore() : null);
  if (!firestore) return;

  try {
    console.log("📊 [admin.js] ກຳລັງໂຫຼດ Analytics ຈາກ Firestore...");
    // ດຶງແບບກົງໆ ບໍ່ຜ່ານ orderBy ເພື່ອປ້ອງກັນ Query Failed 100%
    const snap = await firestore.collection('orders').get();
    
    let totalSales = 0;
    let qrRevenue = 0;
    let cashRevenue = 0;
    let validOrdersCount = 0;

    // ຮຽງລຳດັບໃນ Memory ແທນ
    const orderDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    orderDocs.sort((a, b) => {
      const timeA = a.createdAt ? (a.createdAt.seconds || 0) : 0;
      const timeB = b.createdAt ? (b.createdAt.seconds || 0) : 0;
      return timeB - timeA;
    });

    const rowsHtml = orderDocs.map(o => {
      const isNotCancelled = o.status !== 'cancelled';
      const amount = Number(o.totalAmount || o.subtotal || 0);

      if (isNotCancelled) {
        totalSales += amount;
        validOrdersCount++;
        if (o.slipUrl || (o.paymentMethod && o.paymentMethod.includes('QR'))) {
          qrRevenue += amount;
        } else {
          cashRevenue += amount;
        }
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

    // ອັບເດດຕົວເລກ
    const elTotal = document.getElementById('metricTotalSales');
    const elCount = document.getElementById('metricTotalOrdersCount');
    const elQr = document.getElementById('metricQrRevenue');
    const elCash = document.getElementById('metricCashRevenue');
    const tableBody = document.getElementById('analyticsTransactionsTableBody');

    if (elTotal) elTotal.textContent = formatLAK(totalSales);
    if (elCount) elCount.textContent = `${validOrdersCount} ອໍເດີ້`;
    if (elQr) elQr.textContent = formatLAK(qrRevenue);
    if (elCash) elCash.textContent = formatLAK(cashRevenue);
    if (tableBody) tableBody.innerHTML = rowsHtml || `<tr><td colspan="6" class="p-6 text-center text-taupe font-lao">ຍັງບໍ່ມີລາຍການຂາຍ</td></tr>`;

    console.log(`✅ [admin.js] ສະແດງ Analytics ສຳເລັດ: ຍອດຂາຍ ${formatLAK(totalSales)} (${validOrdersCount} ອໍເດີ້)`);

  } catch (err) {
    console.error("❌ Analytics error:", err);
  }
};

// =======================================================
// 3. ໂຫຼດເມນູທັງ 12 ລາຍການຈາກ menu_items
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

    // ສົ່ງຕໍ່ໃຫ້ Customer View ເຫັນພ້ອມກັນ
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

          <div class="flex items-center gap-2">
            <button type="button" onclick="window.toggleMenuItemAvailability('${item.id}', ${!isAvail})" class="px-2.5 py-1 rounded-lg border text-[11px] font-bold ${isAvail ? 'border-amber-300 text-amber-900 bg-amber-50' : 'border-emerald-300 text-emerald-900 bg-emerald-50'} cursor-pointer">
              ${isAvail ? 'ປິດ (ໝົດ)' : 'ເປີດຂາຍ'}
            </button>
            <button type="button" onclick="window.deleteMenuItem('${item.id}')" class="p-1 text-taupe hover:text-red-600 cursor-pointer">
              <span class="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        </div>
      `;
    }).join('');

    console.log(`✅ [admin.js] ສະແດງເມນູໃນ Admin ສຳເລັດ: ${items.length} ລາຍການ`);
  } catch (err) {
    console.error("Admin menus error:", err);
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
// 4. ໂຫຼດຄູປອງ, ຕົວເລືອກເສີມ, ແລະ ຜູ້ໃຊ້ລະບົບ
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
  if (snap.empty) {
    container.innerHTML = `<div class="col-span-full p-6 text-center text-taupe font-lao">ຍັງບໍ່ມີຄູປອງ</div>`;
    return;
  }

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

window.loadAdminModifiers = async function() {
  const container = document.getElementById('modifierAdminList');
  if (!container) return;
  const list = typeof DEFAULT_MODIFIERS !== 'undefined' ? DEFAULT_MODIFIERS : [];
  container.innerHTML = list.map(m => `
    <div class="p-3 rounded-lg bg-surface border border-hairline flex justify-between items-center text-[12px] font-lao">
      <div>
        <span class="font-bold text-primary block">${m.name}</span>
        <span class="text-[10px] text-taupe uppercase">[${m.group}]</span>
      </div>
      <span class="font-mono font-bold text-forest-emerald">+${formatLAK(m.price)}</span>
    </div>
  `).join('');
};

window.loadAdminPayments = async function() {
  const container = document.getElementById('paymentMethodsAdminList');
  if (!container) return;
  const list = typeof DEFAULT_PAYMENTS !== 'undefined' ? DEFAULT_PAYMENTS : [];
  container.innerHTML = list.map(p => `
    <div class="p-4 rounded-xl bg-surface border-2 border-dashed flex flex-col items-center justify-center space-y-2 font-lao" style="border-color: ${p.borderColor};">
      <img src="${p.qrImage}" class="w-24 h-24 object-contain rounded-lg border border-hairline"/>
      <h5 class="font-bold text-[13px] text-primary">${p.bankName}</h5>
      <span class="font-mono text-[11px] text-taupe">${p.accountNumber}</span>
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

// 🔥 5. ໂຫຼດທຸກຢ່າງຂຶ້ນມາພ້ອມກັນທັນທີ!
window.loadAllOwnerData = function() {
  window.loadAdminAnalytics();
  window.loadAdminMenus();
  window.loadAdminCoupons();
  window.loadAdminModifiers();
  window.loadAdminPayments();
  window.loadAdminUsers();
};

// ເອີ້ນເຮັດວຽກທັນທີ
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', window.loadAllOwnerData);
} else {
  window.loadAllOwnerData();
}

setTimeout(window.loadAllOwnerData, 800);
