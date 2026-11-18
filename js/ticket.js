// =======================================================
// LA DOLCE — CUSTOMER MULTI-TICKET ENGINE (PURE SVG)
// =======================================================

window.customerOrderListeners = [];
window.notifiedReadyList = JSON.parse(localStorage.getItem('notified_ready_orders') || '[]');
window.notifiedRejectedList = JSON.parse(localStorage.getItem('notified_rejected_orders') || '[]');

window.renderCustomerTicket = function() {
  const container = document.getElementById('activeTicketContainer');
  if (!container) return;

  const orderIds = JSON.parse(localStorage.getItem('customer_order_ids') || '[]');
  const legacyId = localStorage.getItem('activeOrderId');
  if (legacyId && !orderIds.includes(legacyId)) {
    orderIds.unshift(legacyId);
  }

  // ລ້າງ Listener ເກົ່າສະເໝີ
  window.customerOrderListeners.forEach(unsub => unsub());
  window.customerOrderListeners = [];

  if (orderIds.length === 0) {
    document.getElementById('bottomNavLiveOrderPulse')?.classList.add('hidden');
    container.innerHTML = `
      <div class="p-8 text-center bg-surface-pure rounded-2xl border border-hairline space-y-3 font-lao">
        <div class="w-12 h-12 rounded-full bg-surface mx-auto flex items-center justify-center text-taupe">
          ${svgIcon('ticket', 'w-6 h-6')}
        </div>
        <h4 class="font-serif-title text-[17px] text-primary font-bold">ບໍ່ມີອໍເດີ້ທີ່ກຳລັງດຳເນີນການ</h4>
        <p class="text-[12px] text-taupe">ທ່ານຍັງບໍ່ໄດ້ສັ່ງຊື້ເທື່ອ ຫຼື ອໍເດີ້ກ່ອນໜ້ານີ້ສຳເລັດແລ້ວ</p>
        <button type="button" onclick="switchCustomerTab('menu')" class="px-4 py-2 rounded-lg bg-forest-emerald text-white text-[12px] font-bold cursor-pointer">ສັ່ງເຄື່ອງດື່ມເລີຍ</button>
      </div>
    `;
    return;
  }

  document.getElementById('bottomNavLiveOrderPulse')?.classList.remove('hidden');
  container.innerHTML = `<div class="space-y-4" id="customerTicketsList"></div>`;
  const listWrapper = document.getElementById('customerTicketsList');
  const firestore = db || firebase.firestore();

  orderIds.forEach(orderId => {
    const unsub = firestore.collection('orders').doc(orderId).onSnapshot(doc => {
      if (!doc.exists) return;
      const order = { id: doc.id, ...doc.data() };

      // ແຈ້ງເຕືອນເມື່ອ Staff ກົດວ່າເຄື່ອງດື່ມພ້ອມຮັບ
      if (order.status === 'ready' && !window.notifiedReadyList.includes(order.id)) {
        window.notifiedReadyList.push(order.id);
        localStorage.setItem('notified_ready_orders', JSON.stringify(window.notifiedReadyList));
        window.triggerCustomerDrinkReadyAlert(order.orderCode);
      }

      // ແຈ້ງເຕືອນທັນທີເມື່ອ Staff ປະຕິເສດອໍເດີ້
      if ((order.status === 'rejected' || order.status === 'cancelled') && !window.notifiedRejectedList.includes(order.id)) {
        window.notifiedRejectedList.push(order.id);
        localStorage.setItem('notified_rejected_orders', JSON.stringify(window.notifiedRejectedList));
        if (typeof showAtelierAlert === 'function') {
          showAtelierAlert({
            title: `ອໍເດີ້ #${order.orderCode} ຖືກປະຕິເສດ`,
            message: `ເຫດຜົນ: ${order.rejectionReason || 'ເຄື່ອງດື່ມບໍ່ພ້ອມໃຫ້ບໍລິການ'}. ທາງຮ້ານຈະທຳການຣີຟັນເງິນຄືນໃຫ້ທ່ານ.`,
            type: 'error',
            confirmText: 'ເຂົ້າໃຈແລ້ວ'
          });
        }
      }

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

  const isRejected = order.status === 'rejected' || order.status === 'cancelled';
  const isCompleted = order.status === 'completed';

  const statusMeta = {
    pending: {
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
      icon: 'clock',
      label: 'ລໍຖ້າຮ້ານກວດສອບ',
      title: 'ກຳລັງລໍຖ້າພະນັກງານຮັບອໍເດີ້',
      step: 1
    },
    preparing: {
      badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
      icon: 'coffee',
      label: 'ກຳລັງດຳເນີນການ',
      title: 'ບາຣິສຕ້າກຳລັງຊົງເຄື່ອງດື່ມໃຫ້ທ່ານ...',
      step: 2
    },
    ready: {
      badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-400',
      icon: 'checkCircle',
      label: 'ສຳເລັດແລ້ວ',
      title: 'ເຄື່ອງດື່ມພ້ອມແລ້ວ! ສາມາດເຂົ້າມາຮັບເອົາໄດ້ເລີຍ',
      step: 3
    },
    completed: {
      badgeClass: 'bg-stone-100 text-stone-700 border-stone-300',
      icon: 'checkCircle',
      label: 'ຮັບເຄື່ອງສຳເລັດ',
      title: 'ຂອບໃຈທີ່ອຸດໜູນ LA DOLCE',
      step: 3
    },
    rejected: {
      badgeClass: 'bg-red-100 text-red-800 border-red-300',
      icon: 'xCircle',
      label: 'ປະຕິເສດອໍເດີ້',
      title: 'ຂໍອະໄພ ເຄື່ອງດື່ມບໍ່ພ້ອມໃຫ້ບໍລິການ',
      step: 0
    },
    cancelled: {
      badgeClass: 'bg-red-100 text-red-800 border-red-300',
      icon: 'xCircle',
      label: 'ຖືກຍົກເລີກ',
      title: 'ອໍເດີ້ນີ້ຖືກຍົກເລີກແລ້ວ',
      step: 0
    }
  }[order.status] || {
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-300',
    icon: 'info',
    label: order.status,
    title: '',
    step: 1
  };

  card.innerHTML = `
    <div class="p-5 rounded-2xl bg-surface-pure border ${order.status === 'ready' ? 'border-2 border-emerald-500 shadow-lg' : (isRejected ? 'border-2 border-red-300' : 'border-hairline shadow-xs')} space-y-4 font-lao">
      <div class="flex items-center justify-between pb-3 border-b border-hairline gap-2">
        <div>
          <span class="text-[10px] uppercase tracking-wider text-taupe font-bold">ປີ້ຮັບເຄື່ອງດື່ມ</span>
          <h3 class="font-serif-title text-[20px] text-primary font-bold">#${order.orderCode || 'Order'}</h3>
        </div>
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${statusMeta.badgeClass}">
          ${svgIcon(statusMeta.icon, 'w-3.5 h-3.5')}
          <span>${statusMeta.label}</span>
        </span>
      </div>

      <!-- ແຖບສະແດງຂັ້ນຕອນ Sync ກັບ Staff -->
      ${!isRejected ? `
        <div class="space-y-2">
          <p class="text-[12px] font-bold ${order.status === 'ready' ? 'text-emerald-800' : 'text-primary'}">${statusMeta.title}</p>
          <div class="grid grid-cols-3 gap-1.5">
            <div class="h-1.5 rounded-full ${statusMeta.step >= 1 ? 'bg-forest-emerald' : 'bg-hairline'}"></div>
            <div class="h-1.5 rounded-full ${statusMeta.step >= 2 ? 'bg-forest-emerald' : 'bg-hairline'}"></div>
            <div class="h-1.5 rounded-full ${statusMeta.step >= 3 ? 'bg-emerald-500' : 'bg-hairline'}"></div>
          </div>
          <div class="flex justify-between text-[10px] text-taupe">
            <span class="${statusMeta.step >= 1 ? 'text-forest-emerald font-bold' : ''}">1. ລໍຖ້າຮັບ</span>
            <span class="${statusMeta.step >= 2 ? 'text-forest-emerald font-bold' : ''}">2. ກຳລັງດຳເນີນການ</span>
            <span class="${statusMeta.step >= 3 ? 'text-emerald-700 font-bold' : ''}">3. ພ້ອມຮັບເຄື່ອງ</span>
          </div>
        </div>
      ` : `
        <div class="p-3.5 rounded-xl bg-red-50 border border-red-200 space-y-2 text-[12px]">
          <div class="flex items-start gap-2 text-red-800 font-bold">
            ${svgIcon('alert', 'w-4 h-4 mt-0.5')}
            <div>
              <p>${statusMeta.title}</p>
              <p class="font-normal text-red-700 mt-0.5">ເຫດຜົນ: ${order.rejectionReason || 'ວັດຖຸດິບບໍ່ພ້ອມໃຫ້ບໍລິການ'}</p>
            </div>
          </div>
          <div class="pt-2 border-t border-red-200 flex items-start gap-2 text-[11px] text-red-900">
            ${svgIcon('refresh', 'w-4 h-4 mt-0.5')}
            <span>${order.refundNote || 'ທາງຮ້ານຈະທຳການຣີຟັນເງິນຄືນໃຫ້ທ່ານ ແລ້ວທ່ານສາມາດເລືອກສັ່ງລາຍການອື່ນເຂົ້າມາໃໝ່ແທນໄດ້ເລີຍ.'}</span>
          </div>
          <button type="button" onclick="reorderAfterReject('${order.id}')"
                  class="w-full py-2.5 rounded-lg bg-forest-emerald hover:bg-forest-leaf text-white text-[12px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all">
            ${svgIcon('coffee', 'w-4 h-4')}
            <span>ສັ່ງລາຍການອື່ນເຂົ້າມາໃໝ່</span>
          </button>
        </div>
      `}

      <!-- ລາຍການເຄື່ອງດື່ມ -->
      <div class="space-y-2.5 divide-y divide-hairline">
        ${(order.items || []).map(item => `
          <div class="pt-2 first:pt-0">
            <div class="flex justify-between items-baseline font-bold text-[13px]">
              <span>${item.quantity}x ${item.name} <span class="text-forest-leaf font-medium">[${formatVariantLabel(item.variant)}]</span></span>
              <span class="font-mono text-forest-emerald">${formatLAK(item.totalPrice || item.price)}</span>
            </div>
            <div class="text-[11px] text-taupe mt-0.5">
              ${item.sweetness ? `<span>ຫວານ ${item.sweetness}</span>` : ''}
              ${item.milk ? `<span>• ${item.milk}</span>` : ''}
              ${item.extraShot ? `<span>• +Extra Shot</span>` : ''}
            </div>
            ${item.note ? `
              <div class="mt-1 px-2 py-0.5 rounded bg-surface border border-hairline text-taupe text-[11px] inline-flex items-center gap-1">
                ${svgIcon('note', 'w-3 h-3 text-forest-emerald')}
                <span><strong class="text-forest-emerald">ໝາຍເຫດ:</strong> ${item.note}</span>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>

      <div class="pt-2 border-t border-hairline flex justify-between items-baseline">
        <span class="font-bold text-[13px]">ຍອດລວມ (${order.paymentMethod || 'QR'}):</span>
        <span class="font-serif-title font-bold text-[18px] text-forest-emerald">${formatLAK(order.totalAmount)}</span>
      </div>

      ${isCompleted ? `
        <button type="button" onclick="dismissCustomerTicket('${order.id}')" class="w-full py-2 rounded-lg bg-surface border border-hairline text-taupe text-[11px] font-bold hover:bg-gray-100 cursor-pointer">
          ປິດໃບສັ່ງຊື້ທີ່ສຳເລັດແລ້ວນີ້
        </button>
      ` : ''}
    </div>
  `;
}

window.triggerCustomerDrinkReadyAlert = function(orderCode) {
  const modal = document.getElementById('customerReadyModal');
  if (modal) {
    const codeBadge = document.getElementById('customerReadyOrderCode');
    if (codeBadge && orderCode) codeBadge.textContent = `#${orderCode}`;
    modal.classList.remove('hidden');
  }
};

window.closeCustomerReadyModal = function() {
  document.getElementById('customerReadyModal')?.classList.add('hidden');
};

window.dismissCustomerTicket = function(orderId) {
  let list = JSON.parse(localStorage.getItem('customer_order_ids') || '[]');
  list = list.filter(id => id !== orderId);
  localStorage.setItem('customer_order_ids', JSON.stringify(list));
  if (localStorage.getItem('activeOrderId') === orderId) {
    localStorage.removeItem('activeOrderId');
  }
  window.renderCustomerTicket();
};

window.reorderAfterReject = function(orderId) {
  window.dismissCustomerTicket(orderId);
  switchCustomerTab('menu');
};
