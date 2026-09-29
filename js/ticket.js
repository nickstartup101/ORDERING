// =======================================================
// LA DOLCE — CUSTOMER MULTI-TICKET & READY ALERT SYSTEM
// =======================================================

window.customerOrderUnsubscribes = [];
window.notifiedReadyOrders = JSON.parse(localStorage.getItem('notified_ready_orders') || '[]');

// 1. ບັນທຶກ Order ID ໃໝ່ເຂົ້າລາຍການປີ້ຂອງລູກຄ້າ
function registerCustomerNewOrder(orderId) {
  const currentList = JSON.parse(localStorage.getItem('customer_order_ids') || '[]');
  if (!currentList.includes(orderId)) {
    currentList.unshift(orderId);
    localStorage.setItem('customer_order_ids', JSON.stringify(currentList));
  }
}

// 2. Render ປີ້ທັງໝົດຂອງລູກຄ້າ (Multi-Ticket)
function renderCustomerTicket() {
  const container = document.getElementById('activeTicketContainer');
  if (!container) return;

  const orderIds = JSON.parse(localStorage.getItem('customer_order_ids') || '[]');
  
  // ຖ້າມີ activeOrderId ເດີມໃຫ້ເອົາມາລວມນຳ
  const legacyId = localStorage.getItem('activeOrderId');
  if (legacyId && !orderIds.includes(legacyId)) {
    orderIds.unshift(legacyId);
    localStorage.setItem('customer_order_ids', JSON.stringify(orderIds));
  }

  if (orderIds.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center bg-surface-pure rounded-2xl border border-hairline space-y-3 font-lao">
        <span class="material-symbols-outlined text-[48px] text-taupe">receipt_long</span>
        <h4 class="font-serif-title text-[17px] text-primary">ບໍ່ມີອໍເດີ້ທີ່ກຳລັງດຳເນີນການ</h4>
        <p class="text-[12px] text-taupe">ທ່ານຍັງບໍ່ໄດ້ສັ່ງຊື້ເທື່ອ ຫຼື ອໍເດີ້ກ່ອນໜ້ານີ້ສຳເລັດແລ້ວ</p>
        <button type="button" onclick="switchCustomerTab('menu')" class="px-4 py-2 rounded-lg bg-forest-emerald text-white text-[12px] font-bold cursor-pointer">ສັ່ງເຄື່ອງດື່ມເລີຍ</button>
      </div>
    `;
    return;
  }

  // ລ້າງ Listener ເກົ່າ
  window.customerOrderUnsubscribes.forEach(unsub => unsub());
  window.customerOrderUnsubscribes = [];

  const firestore = db || firebase.firestore();

  // ດັກຟັງທຸກໆ Ticket ພ້ອມກັນ Realtime
  container.innerHTML = `<div class="space-y-4" id="ticketsListWrapper"></div>`;
  const wrapper = document.getElementById('ticketsListWrapper');

  orderIds.forEach(orderId => {
    const unsub = firestore.collection('orders').doc(orderId).onSnapshot(doc => {
      if (!doc.exists) return;
      const order = { id: doc.id, ...doc.data() };

      // 🔥 ກວດສອບ Pop-up ເມື່ອເຄື່ອງດື່ມ Ready
      if (order.status === 'ready' && !window.notifiedReadyOrders.includes(order.id)) {
        window.notifiedReadyOrders.push(order.id);
        localStorage.setItem('notified_ready_orders', JSON.stringify(window.notifiedReadyOrders));
        triggerCustomerDrinkReadyAlert();
      }

      // ອັບເດດໜ້າປີ້
      updateSingleTicketUI(order);
    });
    window.customerOrderUnsubscribes.push(unsub);
  });
}

function updateSingleTicketUI(order) {
  let ticketEl = document.getElementById(`ticket-card-${order.id}`);
  const wrapper = document.getElementById('ticketsListWrapper');
  if (!wrapper) return;

  if (!ticketEl) {
    ticketEl = document.createElement('div');
    ticketEl.id = `ticket-card-${order.id}`;
    wrapper.appendChild(ticketEl);
  }

  const isCompleted = order.status === 'completed';
  const isCancelled = order.status === 'cancelled';

  ticketEl.innerHTML = `
    <div class="p-5 rounded-2xl bg-surface-pure border ${order.status === 'ready' ? 'border-2 border-emerald-500 shadow-lg animate-pulse-border' : 'border-hairline shadow-xs'} space-y-4">
      <div class="flex items-center justify-between pb-3 border-b border-hairline font-lao">
        <div>
          <span class="text-[10px] uppercase tracking-wider text-taupe font-bold">ປີ້ຮັບເຄື່ອງ</span>
          <h3 class="font-serif-title text-[20px] text-primary font-bold">${order.orderCode}</h3>
        </div>
        <span class="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
          order.status === 'pending' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
          order.status === 'preparing' ? 'bg-blue-100 text-blue-900 border border-blue-300' :
          order.status === 'ready' ? 'bg-emerald-100 text-emerald-900 border border-emerald-400 animate-bounce' : 'bg-gray-100 text-gray-700'
        }">
          ${order.status === 'pending' ? '⏳ ລໍຖ້າຮ້ານຮັບ' : (order.status === 'preparing' ? '☕ ກຳລັງປຸງແຕ່ງ' : (order.status === 'ready' ? '🎉 ເຄື່ອງດື່ມພ້ອມຮັບແລ້ວ!' : 'ສຳເລັດແລ້ວ'))}
        </span>
      </div>

      <div class="space-y-2.5 divide-y divide-hairline">
        ${(order.items || []).map(item => `
          <div class="pt-2 first:pt-0 font-lao">
            <div class="flex justify-between items-baseline font-bold text-[13px]">
              <span>${item.quantity}x ${item.name} <span class="text-forest-leaf font-medium">[${item.variant}]</span></span>
              <span class="font-mono text-forest-emerald">${formatLAK(item.totalPrice || item.price)}</span>
            </div>
            <div class="text-[11px] text-taupe mt-0.5">
              ${item.sweetness ? `<span>ຫວານ ${item.sweetness}</span>` : ''} 
              ${item.milk ? `<span>• ນົມ: ${item.milk}</span>` : ''}
            </div>

            <!-- ສະແດງ Remark ທີ່ລູກຄ້າໃສ່ -->
            ${item.note ? `
              <div class="mt-1 px-2 py-0.5 rounded bg-surface border border-hairline text-taupe text-[11px]">
                <span class="font-bold text-forest-emerald">ໝາຍເຫດ:</span> ${item.note}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>

      <div class="pt-2 border-t border-hairline flex justify-between items-baseline font-lao">
        <span class="font-bold text-[13px]">ຍອດລວມ:</span>
        <span class="font-serif-title font-bold text-[18px] text-forest-emerald">${formatLAK(order.totalAmount)}</span>
      </div>

      ${isCompleted || isCancelled ? `
        <button type="button" onclick="dismissTicket('${order.id}')" class="w-full py-2 rounded-lg bg-surface border border-hairline text-taupe text-[11px] font-bold hover:bg-gray-100 font-lao cursor-pointer">
          ປິດໃບສັ່ງຊື້ເກົ່ານີ້
        </button>
      ` : ''}
    </div>
  `;
}

// 3. Pop-up ເມື່ອເຄື່ອງດື່ມ Ready
function triggerCustomerDrinkReadyAlert() {
  const modal = document.getElementById('customerReadyModal');
  if (modal) modal.classList.remove('hidden');
}

function closeCustomerReadyModal() {
  document.getElementById('customerReadyModal')?.classList.add('hidden');
}

function dismissTicket(orderId) {
  let list = JSON.parse(localStorage.getItem('customer_order_ids') || '[]');
  list = list.filter(id => id !== orderId);
  localStorage.setItem('customer_order_ids', JSON.stringify(list));
  renderCustomerTicket();
}
