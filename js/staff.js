// =======================================================
// STAFF KITCHEN DISPLAY LOGIC (SHOWING PROMINENT REMARKS)
// =======================================================

let staffOrdersUnsubscribe = null;
let currentStaffSubTab = 'active';

function initStaffRealtimeListener() {
  if (staffOrdersUnsubscribe) staffOrdersUnsubscribe();

  const ordersRef = firebase.firestore().collection('orders').orderBy('createdAt', 'desc').limit(50);

  staffOrdersUnsubscribe = ordersRef.onSnapshot(snapshot => {
    const orders = [];
    snapshot.forEach(doc => orders.push({ id: doc.id, ...doc.data() }));

    // ກວດສອບສຽງເຕືອນອໍເດີ້ໃໝ່ (pending)
    const hasNewPending = orders.some(o => o.status === 'pending');
    const indicator = document.getElementById('staffRingingIndicator');
    if (indicator) {
      indicator.classList.toggle('hidden', !hasNewPending);
      indicator.classList.toggle('flex', hasNewPending);
    }

    renderStaffOrders(orders);
  });
}

function renderStaffOrders(orders) {
  const containerActive = document.getElementById('staffOrdersContainer');
  const containerHistory = document.getElementById('staffOrdersContainerHistory');
  const containerCancelled = document.getElementById('staffOrdersContainerCancelled');

  if (!containerActive) return;

  const activeOrders = orders.filter(o => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready');
  const historyOrders = orders.filter(o => o.status === 'completed');
  const cancelledOrders = orders.filter(o => o.status === 'cancelled');

  containerActive.innerHTML = activeOrders.map(order => createStaffOrderCard(order)).join('');
  if (containerHistory) containerHistory.innerHTML = historyOrders.map(order => createStaffOrderCard(order)).join('');
  if (containerCancelled) containerCancelled.innerHTML = cancelledOrders.map(order => createStaffOrderCard(order)).join('');
}

function createStaffOrderCard(order) {
  const isPending = order.status === 'pending';
  const isPreparing = order.status === 'preparing';
  const isReady = order.status === 'ready';

  // 🔥 ແຕ້ມລາຍການພ້ອມກ່ອງ REMARK ແບບຊັດເຈນ
  const itemsHtml = (order.items || []).map(item => `
    <div class="py-2.5 border-b border-hairline last:border-0">
      <div class="flex justify-between items-start">
        <span class="font-bold text-[13px] text-primary">
          ${item.quantity}x ${item.name} 
          <span class="text-forest-leaf font-medium">[${item.variant === 'hot' ? 'ຮ້ອນ' : (item.variant === 'iced' ? 'ເຢັນ' : 'ປັ່ນ')}]</span>
        </span>
        <span class="text-[12px] font-mono font-bold text-taupe">${formatLAK(item.totalPrice || item.price)}</span>
      </div>

      <div class="text-[11px] text-taupe mt-1 flex flex-wrap gap-2">
        ${item.sweetness ? `<span>ຫວານ: <strong>${item.sweetness}</strong></span>` : ''}
        ${item.milk ? `<span>• ນົມ: <strong>${item.milk}</strong></span>` : ''}
        ${item.hasExtraShot ? `<span class="text-forest-emerald font-bold">• +Extra Shot</span>` : ''}
      </div>

      <!-- 🔥🔥🔥 REMARK CALLOUT BOX (ບ່ອນສະແດງໝາຍເຫດພິເສດ) 🔥🔥🔥 -->
      ${item.note ? `
        <div class="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-300 text-amber-950 flex items-start gap-1.5 shadow-2xs">
          <span class="material-symbols-outlined text-[16px] text-amber-700 shrink-0">edit_note</span>
          <span class="text-[11px] font-bold leading-snug font-lao">ໝາຍເຫດ: ${item.note}</span>
        </div>
      ` : ''}
    </div>
  `).join('');

  return `
    <div class="p-4 rounded-xl bg-surface-pure border-2 ${isPending ? 'border-amber-400 shadow-md animate-pulse-border' : 'border-hairline'} flex flex-col justify-between space-y-3">
      <div>
        <div class="flex items-center justify-between pb-2 border-b border-hairline">
          <div>
            <span class="font-serif-title font-bold text-[16px] text-primary">${order.orderCode || 'Order'}</span>
            <span class="text-[11px] text-taupe block font-medium">${order.customerName || 'Customer'} (${order.customerPhone || 'Walk-in'})</span>
          </div>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            isPending ? 'bg-amber-100 text-amber-900 border border-amber-300' :
            isPreparing ? 'bg-blue-100 text-blue-900 border border-blue-300' :
            isReady ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-gray-100 text-gray-700'
          }">
            ${order.status}
          </span>
        </div>

        <div class="py-1 divide-y divide-hairline">
          ${itemsHtml}
        </div>
      </div>

      <div class="pt-2 border-t border-hairline space-y-2">
        <div class="flex justify-between text-[12px] font-bold">
          <span>ຍອດລວມ:</span>
          <span class="text-forest-emerald font-serif-title text-[15px]">${formatLAK(order.totalAmount)}</span>
        </div>

        <!-- ປຸ່ມປ່ຽນສະຖານະ -->
        <div class="grid grid-cols-2 gap-2 pt-1">
          ${isPending ? `
            <button type="button" onclick="updateOrderStatus('${order.id}', 'cancelled')" class="py-2 rounded-lg border border-red-200 text-red-700 text-[11px] font-bold hover:bg-red-50">ປະຕິເສດ</button>
            <button type="button" onclick="updateOrderStatus('${order.id}', 'preparing')" class="py-2 rounded-lg bg-forest-emerald text-white text-[11px] font-bold hover:bg-forest-leaf">ຮັບອໍເດີ້</button>
          ` : ''}

          ${isPreparing ? `
            <button type="button" onclick="updateOrderStatus('${order.id}', 'ready')" class="col-span-2 py-2 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700">ເຄື່ອງດື່ມພ້ອມຮັບແລ້ວ</button>
          ` : ''}

          ${isReady ? `
            <button type="button" onclick="updateOrderStatus('${order.id}', 'completed')" class="col-span-2 py-2 rounded-lg bg-primary text-white text-[11px] font-bold hover:bg-primary-dark">ສຳເລັດ / ສົ່ງເຄື່ອງແລ້ວ</button>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

async function updateOrderStatus(orderId, nextStatus) {
  try {
    await firebase.firestore().collection('orders').doc(orderId).update({
      status: nextStatus,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (e) {
    alert("Error updating order: " + e.message);
  }
}
