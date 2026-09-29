// =======================================================
// LA DOLCE — BARISTA KITCHEN DISPLAY (BULLETPROOF 100%)
// =======================================================

console.log("🚀 [staff.js] Loaded successfully");

window.currentStaffSubTab = 'active';
window.allStaffOrders = [];
window.activePendingAlertId = null;

// 1. ປ່ຽນແຖບ (Active / History / Cancelled)
window.switchStaffSubTab = function(tabName) {
  window.currentStaffSubTab = tabName;

  const btnActive = document.getElementById('staff-tab-active');
  const btnHistory = document.getElementById('staff-tab-history');
  const btnCancelled = document.getElementById('staff-tab-cancelled');

  const cActive = document.getElementById('staffOrdersContainer');
  const cHistory = document.getElementById('staffOrdersContainerHistory');
  const cCancelled = document.getElementById('staffOrdersContainerCancelled');

  [btnActive, btnHistory, btnCancelled].forEach(b => {
    if (b) b.className = 'px-4 py-1.5 rounded-lg bg-surface border border-hairline text-taupe text-[12px] cursor-pointer';
  });

  if (cActive) cActive.classList.add('hidden');
  if (cHistory) cHistory.classList.add('hidden');
  if (cCancelled) cCancelled.classList.add('hidden');

  if (tabName === 'active') {
    if (btnActive) btnActive.className = 'px-4 py-1.5 rounded-lg bg-forest-emerald text-white text-[12px] font-bold shadow-xs cursor-pointer';
    if (cActive) cActive.classList.remove('hidden');
  } else if (tabName === 'history') {
    if (btnHistory) btnHistory.className = 'px-4 py-1.5 rounded-lg bg-forest-emerald text-white text-[12px] font-bold shadow-xs cursor-pointer';
    if (cHistory) cHistory.classList.remove('hidden');
  } else if (tabName === 'cancelled') {
    if (btnCancelled) btnCancelled.className = 'px-4 py-1.5 rounded-lg bg-red-700 text-white text-[12px] font-bold shadow-xs cursor-pointer';
    if (cCancelled) cCancelled.classList.remove('hidden');
  }

  window.renderStaffOrders(window.allStaffOrders);
};

// 2. Render Orders ແບບປ້ອງກັນ Undefined 100% (ແກ້ reading 'filter' ຖາວອນ)
window.renderStaffOrders = function(ordersInput) {
  let list = [];

  // ກວດສອບທຸກຮູບແບບທີ່ app.js ອາດຈະສົ່ງມາ
  if (Array.isArray(ordersInput)) {
    list = ordersInput;
  } else if (ordersInput && ordersInput.docs && Array.isArray(ordersInput.docs)) {
    list = ordersInput.docs.map(d => ({ id: d.id, ...d.data() }));
  } else if (Array.isArray(window.orders) && window.orders.length > 0) {
    list = window.orders;
  } else if (Array.isArray(window.allStaffOrders)) {
    list = window.allStaffOrders;
  }

  window.allStaffOrders = list;

  const containerActive = document.getElementById('staffOrdersContainer');
  const containerHistory = document.getElementById('staffOrdersContainerHistory');
  const containerCancelled = document.getElementById('staffOrdersContainerCancelled');

  if (!containerActive) return;

  const activeOrders = list.filter(o => o && (o.status === 'pending' || o.status === 'preparing' || o.status === 'ready'));
  const historyOrders = list.filter(o => o && o.status === 'completed');
  const cancelledOrders = list.filter(o => o && o.status === 'cancelled');

  // ນັບຈຳນວນອໍເດີ້ຂອງລູກຄ້າແຕ່ລະຄົນ (Same customer)
  const customerCounts = {};
  activeOrders.forEach(o => {
    const key = o.customerPhone || o.customerName || 'Unknown';
    customerCounts[key] = (customerCounts[key] || 0) + 1;
  });

  // 🔥 ກວດສອບອໍເດີ້ໃໝ່ທີ່ເປັນ 'pending' ແລ້ວເປີດ Pop-up ທັນທີ!
  const latestPending = activeOrders.find(o => o.status === 'pending');
  if (latestPending && latestPending.id !== window.activePendingAlertId) {
    window.activePendingAlertId = latestPending.id;
    window.triggerStaffNewOrderAlert(latestPending);
  }

  containerActive.innerHTML = activeOrders.length === 0 
    ? `<div class="col-span-full p-8 text-center bg-surface-pure rounded-xl border border-hairline text-taupe font-lao">ບໍ່ມີອໍເດີ້ທີ່ກຳລັງດຳເນີນການ</div>`
    : activeOrders.map(o => createStaffOrderCard(o, customerCounts)).join('');

  if (containerHistory) {
    containerHistory.innerHTML = historyOrders.length === 0
      ? `<div class="col-span-full p-8 text-center bg-surface-pure rounded-xl border border-hairline text-taupe font-lao">ບໍ່ມີປະຫວັດອໍເດີ້</div>`
      : historyOrders.map(o => createStaffOrderCard(o, customerCounts)).join('');
  }

  if (containerCancelled) {
    containerCancelled.innerHTML = cancelledOrders.length === 0
      ? `<div class="col-span-full p-8 text-center bg-surface-pure rounded-xl border border-hairline text-taupe font-lao">ບໍ່ມີອໍເດີ້ທີ່ຖືກຍົກເລີກ</div>`
      : cancelledOrders.map(o => createStaffOrderCard(o, customerCounts)).join('');
  }
};

// 3. ແຕ້ມບັດອໍເດີ້ ພ້ອມ Remark ແລະ ແທັກ "ລູກຄ້າຄົນດຽວກັນ"
function createStaffOrderCard(order, customerCounts) {
  const isPending = order.status === 'pending';
  const isPreparing = order.status === 'preparing';
  const isReady = order.status === 'ready';

  const custKey = order.customerPhone || order.customerName || 'Unknown';
  const isMultiOrder = customerCounts && customerCounts[custKey] > 1;

  const itemsHtml = (order.items || []).map(item => `
    <div class="py-2 border-b border-hairline last:border-0">
      <div class="flex justify-between items-start font-lao">
        <span class="font-bold text-[13px] text-primary">
          ${item.quantity}x ${item.name} 
          <span class="text-forest-leaf font-medium">[${item.variant === 'hot' ? 'ຮ້ອນ' : (item.variant === 'iced' ? 'ເຢັນ' : 'ປັ່ນ')}]</span>
        </span>
        <span class="text-[12px] font-mono font-bold text-taupe">${formatLAK(item.totalPrice || item.price)}</span>
      </div>

      <div class="text-[11px] text-taupe mt-0.5 space-x-1.5 font-lao">
        ${item.sweetness ? `<span>ຫວານ ${item.sweetness}</span>` : ''}
        ${item.milk ? `<span>• ນົມ: ${item.milk}</span>` : ''}
        ${item.hasExtraShot ? `<span class="text-forest-emerald font-bold">• +Extra Shot</span>` : ''}
      </div>

      <!-- 📝 ໝາຍເຫດ (Remark) ຂອງລູກຄ້າ -->
      ${item.note ? `
        <div class="mt-1.5 p-2 rounded-lg bg-amber-50 border border-amber-300 text-amber-950 flex items-start gap-1.5 shadow-2xs font-lao">
          <span class="material-symbols-outlined text-[15px] text-amber-700 shrink-0">edit_note</span>
          <span class="text-[11px] font-bold leading-tight">ໝາຍເຫດ: ${item.note}</span>
        </div>
      ` : ''}
    </div>
  `).join('');

  return `
    <div class="p-4 rounded-xl bg-surface-pure border-2 ${isPending ? 'border-amber-400 shadow-md animate-pulse-border' : 'border-hairline'} flex flex-col justify-between space-y-3">
      <div>
        <div class="flex items-start justify-between pb-2 border-b border-hairline font-lao">
          <div>
            <div class="flex items-center gap-2">
              <span class="font-serif-title font-bold text-[17px] text-primary">${order.orderCode || 'Order'}</span>
              
              <!-- 🔥 ແທັກບອກລູກຄ້າຄົນດຽວກັນສັ່ງຫຼາຍອໍເດີ້ -->
              ${isMultiOrder ? `
                <span class="px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 font-lao animate-bounce">
                  <span class="material-symbols-outlined text-[12px]">group</span>
                  <span>ລູກຄ້າຄົນດຽວກັນ (${customerCounts[custKey]} ອໍເດີ້)</span>
                </span>
              ` : ''}
            </div>

            <div class="mt-1 text-[11px] text-charcoal font-medium">
              <span class="font-bold text-forest-emerald">${order.customerName || 'Guest'}</span>
              <span class="text-[10px] text-taupe font-mono">(${order.customerPhone || 'Walk-in'})</span>
            </div>
          </div>

          <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            isPending ? 'bg-amber-100 text-amber-900 border border-amber-300' :
            isPreparing ? 'bg-blue-100 text-blue-900 border border-blue-300' :
            isReady ? 'bg-emerald-100 text-emerald-900 border border-emerald-400' : 'bg-gray-100 text-gray-700'
          }">
            ${order.status}
          </span>
        </div>

        <div class="py-1 divide-y divide-hairline">
          ${itemsHtml}
        </div>
      </div>

      <div class="pt-2 border-t border-hairline space-y-2 font-lao">
        <div class="flex justify-between text-[12px] font-bold">
          <span>ຍອດລວມ:</span>
          <span class="text-forest-emerald font-serif-title text-[15px]">${formatLAK(order.totalAmount)}</span>
        </div>

        <div class="grid grid-cols-2 gap-2 pt-1 font-lao">
          ${isPending ? `
            <button type="button" onclick="updateOrderStatus('${order.id}', 'cancelled')" class="py-2 rounded-lg border border-red-200 text-red-700 text-[11px] font-bold hover:bg-red-50 cursor-pointer">ຍົກເລີກ</button>
            <button type="button" onclick="updateOrderStatus('${order.id}', 'preparing')" class="py-2 rounded-lg bg-forest-emerald text-white text-[11px] font-bold hover:bg-forest-leaf cursor-pointer">ຮັບອໍເດີ້</button>
          ` : ''}

          ${isPreparing ? `
            <button type="button" onclick="updateOrderStatus('${order.id}', 'ready')" class="col-span-2 py-2 rounded-lg bg-emerald-600 text-white text-[12px] font-bold hover:bg-emerald-700 shadow-xs cursor-pointer flex items-center justify-center gap-1">
              <span class="material-symbols-outlined text-[16px]">coffee</span>
              <span>ເຄື່ອງດື່ມພ້ອມຮັບແລ້ວ (Ready)</span>
            </button>
          ` : ''}

          ${isReady ? `
            <button type="button" onclick="updateOrderStatus('${order.id}', 'completed')" class="col-span-2 py-2 rounded-lg bg-primary text-white text-[12px] font-bold hover:bg-primary-dark cursor-pointer">
              ສົ່ງເຄື່ອງສຳເລັດແລ້ວ
            </button>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

// 4. 🔥 Pop-up ອໍເດີ້ໃໝ່ເຂົ້າມາ (ເດັ້ງກາງໜ້າຈໍທັນທີ)
window.triggerStaffNewOrderAlert = function(order) {
  const modal = document.getElementById('staffNewOrderModal');
  if (!modal) return;

  const orderIdEl = document.getElementById('staffNotifOrderId');
  const custEl = document.getElementById('staffNotifCustomer');
  const totalEl = document.getElementById('staffNotifTotal');

  if (orderIdEl) orderIdEl.textContent = order.orderCode || 'Order';
  if (custEl) custEl.textContent = `${order.customerName || 'Guest'} (${order.customerPhone || 'Walk-in'})`;
  if (totalEl) totalEl.textContent = formatLAK(order.totalAmount);

  // ເປີດສຽງເຕືອນ
  if (typeof playStaffAlarm === 'function') playStaffAlarm();

  modal.classList.remove('hidden');
};

window.closeStaffNewOrderModal = function() {
  document.getElementById('staffNewOrderModal')?.classList.add('hidden');
  if (typeof stopStaffAlarm === 'function') stopStaffAlarm();
};

window.acceptStaffNewOrderFromModal = function() {
  if (window.activePendingAlertId) {
    window.updateOrderStatus(window.activePendingAlertId, 'preparing');
  }
  window.closeStaffNewOrderModal();
};

// 5. ອັບເດດສະຖານະລົງ Firestore
window.updateOrderStatus = async function(orderId, nextStatus) {
  try {
    const firestore = db || firebase.firestore();
    await firestore.collection('orders').doc(orderId).update({
      status: nextStatus,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (e) {
    alert("Error updating order: " + e.message);
  }
};
