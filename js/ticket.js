// =======================================================
// LA DOLCE — CUSTOMER MULTI-TICKET ENGINE (100% REALTIME)
// =======================================================

window.customerOrderListeners = [];
window.notifiedReadyList = JSON.parse(localStorage.getItem('notified_ready_orders') || '[]');

// 🔥 ສະແດງປີ້ທັງໝົດທີ່ລູກຄ້າເຄີຍສັ່ງ
window.renderCustomerTicket = function() {
  const container = document.getElementById('activeTicketContainer');
  if (!container) return;

  const orderIds = JSON.parse(localStorage.getItem('customer_order_ids') || '[]');
  const legacyId = localStorage.getItem('activeOrderId');
  if (legacyId && !orderIds.includes(legacyId)) {
    orderIds.unshift(legacyId);
  }

  if (orderIds.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center bg-surface-pure rounded-2xl border border-hairline space-y-3 font-lao">
        <span class="material-symbols-outlined text-[48px] text-taupe">receipt_long</span>
        <h4 class="font-serif-title text-[17px] text-primary font-bold">ບໍ່ມີອໍເດີ້ທີ່ກຳລັງດຳເນີນການ</h4>
        <p class="text-[12px] text-taupe">ທ່ານຍັງບໍ່ໄດ້ສັ່ງຊື້ເທື່ອ ຫຼື ອໍເດີ້ກ່ອນໜ້ານີ້ສຳເລັດແລ້ວ</p>
        <button type="button" onclick="switchCustomerTab('menu')" class="px-4 py-2 rounded-lg bg-forest-emerald text-white text-[12px] font-bold cursor-pointer">ສັ່ງເຄື່ອງດື່ມເລີຍ</button>
      </div>
    `;
    return;
  }

  // ລ້າງ Listener ເກົ່າ
  window.customerOrderListeners.forEach(unsub => unsub());
  window.customerOrderListeners = [];

  container.innerHTML = `<div class="space-y-4" id="customerTicketsList"></div>`;
  const listWrapper = document.getElementById('customerTicketsList');

  const firestore = db || firebase.firestore();

  // ດັກຟັງທຸກໆ Ticket ພ້ອມກັນ Realtime
  orderIds.forEach(orderId => {
    const unsub = firestore.collection('orders').doc(orderId).onSnapshot(doc => {
      if (!doc.exists) return;
      const order = { id: doc.id, ...doc.data() };

      // 🔥 ກວດສອບ Pop-up ເມື່ອເຄື່ອງດື່ມ Ready
      if (order.status === 'ready' && !window.notifiedReadyList.includes(order.id)) {
        window.notifiedReadyList.push(order.id);
        localStorage.setItem('notified_ready_orders', JSON.stringify(window.notifiedReadyList));
        window.triggerCustomerDrinkReadyAlert();
      }

      // ແຕ້ມ ຫຼື ອັບເດດບັດປີ້
      renderSingleCustomerTicket(order, listWrapper);
    });
    window.customerOrderListeners.push(unsub);
  });
};

function renderSingleCustomerTicket(order, container) {
  let card = document.getElementById(`ticket-${order.id}`);
  if (!card) {
    card = document.createElement('div');
    card.id = `ticket-${order.id}`;
    container.appendChild(card);
  }

  const isCompleted = order.status === 'completed';
  const isCancelled = order.status === 'cancelled';

  card.innerHTML = `
    <div class="p-5 rounded-2xl bg-surface-pure border ${order.status === 'ready' ? 'border-2 border-emerald-500 shadow-xl animate-pulse-border' : 'border-hairline shadow-xs'} space-y-4">
      <div class="flex items-center justify-between pb-3 border-b border-hairline font-lao">
        <div>
          <span class="text-[10px] uppercase tracking-wider text-taupe font-bold">ປີ້ຮັບເຄື່ອງ</span>
          <h3 class="font-serif-title text-[20px] text-primary font-bold">${order.orderCode || 'Order'}</h3>
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
              ${item.milk ? `<span>• ${item.milk}</span>` : ''}
            </div>
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
        <button type="button" onclick="dismissCustomerTicket('${order.id}')" class="w-full py-2 rounded-lg bg-surface border border-hairline text-taupe text-[11px] font-bold hover:bg-gray-100 font-lao cursor-pointer">
          ປິດໃບສັ່ງຊື້ເກົ່ານີ້
        </button>
      ` : ''}
    </div>
  `;
}

// 🔥 Pop-up ເມື່ອເຄື່ອງດື່ມ Ready
window.triggerCustomerDrinkReadyAlert = function() {
  const modal = document.getElementById('customerReadyModal');
  if (modal) modal.classList.remove('hidden');
};

window.closeCustomerReadyModal = function() {
  document.getElementById('customerReadyModal')?.classList.add('hidden');
};

window.dismissCustomerTicket = function(orderId) {
  let list = JSON.parse(localStorage.getItem('customer_order_ids') || '[]');
  list = list.filter(id => id !== orderId);
  localStorage.setItem('customer_order_ids', JSON.stringify(list));
  window.renderCustomerTicket();
};
