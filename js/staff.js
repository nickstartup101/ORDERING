// =======================================================
// LA DOLCE — BARISTA DISPLAY (POPUP QUEUE + REJECT + SVG)
// =======================================================

window.currentStaffSubTab = 'active';
window.allStaffOrders = [];
window.currentAlertingOrderId = null;
window.pendingRejectOrderId = null;
window.snoozedPendingIds = new Set();

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

window.renderStaffOrders = function(ordersInput) {
  let list = [];
  if (Array.isArray(ordersInput)) list = ordersInput;
  else if (ordersInput && ordersInput.docs) list = ordersInput.docs.map(d => ({ id: d.id, ...d.data() }));
  else if (Array.isArray(window.orders)) list = window.orders;
  else if (Array.isArray(window.allStaffOrders)) list = window.allStaffOrders;

  window.allStaffOrders = list;

  const containerActive = document.getElementById('staffOrdersContainer');
  const containerHistory = document.getElementById('staffOrdersContainerHistory');
  const containerCancelled = document.getElementById('staffOrdersContainerCancelled');
  if (!containerActive) return;

  const activeOrders = list.filter(o => o && (o.status === 'pending' || o.status === 'preparing' || o.status === 'ready'));
  const historyOrders = list.filter(o => o && o.status === 'completed');
  const cancelledOrders = list.filter(o => o && (o.status === 'rejected' || o.status === 'cancelled'));

  // ນັບຈຳນວນອໍເດີ້ຂອງລູກຄ້າຄົນດຽວກັນ
  const customerCounts = {};
  activeOrders.forEach(o => {
    const key = o.customerPhone || o.customerName || 'Unknown';
    customerCounts[key] = (customerCounts[key] || 0) + 1;
  });

  // ກວດສອບຄິວອໍເດີ້ pending ເພື່ອເດັ້ງ Pop-up ໃຫ້ Staff ກວດສອບ & ຮັບອໍເດີ້
  const pendingOrders = activeOrders.filter(o => o.status === 'pending' && !window.snoozedPendingIds.has(o.id));
  if (pendingOrders.length > 0) {
    const nextPending = pendingOrders[0];
    if (nextPending.id !== window.currentAlertingOrderId) {
      window.currentAlertingOrderId = nextPending.id;
      window.triggerStaffNewOrderAlert(nextPending, pendingOrders.length);
    } else {
      // ອັບເດດຈຳນວນຄິວຖ້າມີຄົນສັ່ງເພີ່ມລະຫວ່າງກຳລັງເປີດ Modal
      const queueBadge = document.getElementById('staffNotifQueueBadge');
      if (queueBadge) queueBadge.textContent = `ລໍຖ້າກວດສອບ (${pendingOrders.length})`;
    }
    if (typeof startStaffAlarm === 'function') startStaffAlarm(nextPending);
  } else {
    window.currentAlertingOrderId = null;
    window.closeStaffNewOrderModal(false);
    if (activeOrders.every(o => o.status !== 'pending')) {
      if (typeof stopStaffAlarm === 'function') stopStaffAlarm();
    }
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
      ? `<div class="col-span-full p-8 text-center bg-surface-pure rounded-xl border border-hairline text-taupe font-lao">ບໍ່ມີອໍເດີ້ທີ່ຖືກປະຕິເສດ / ຍົກເລີກ</div>`
      : cancelledOrders.map(o => createStaffOrderCard(o, customerCounts)).join('');
  }

  if (typeof updateStaffNotifyBadge === 'function') updateStaffNotifyBadge();
};

function createStaffOrderCard(order, customerCounts) {
  const isPending = order.status === 'pending';
  const isPreparing = order.status === 'preparing';
  const isReady = order.status === 'ready';
  const isRejected = order.status === 'rejected' || order.status === 'cancelled';

  const custKey = order.customerPhone || order.customerName || 'Unknown';
  const isMultiOrder = customerCounts && customerCounts[custKey] > 1;
  const theme = getCustomerColorTheme(custKey);

  const itemsHtml = (order.items || []).map(item => `
    <div class="py-2 border-b border-hairline last:border-0">
      <div class="flex justify-between items-start font-lao gap-2">
        <span class="font-bold text-[13px] text-primary">
          ${item.quantity}x ${item.name}
          <span class="text-forest-leaf font-medium">[${formatVariantLabel(item.variant)}]</span>
        </span>
        <span class="text-[12px] font-mono font-bold text-taupe shrink-0">${formatLAK(item.totalPrice || item.price)}</span>
      </div>

      <div class="text-[11px] text-taupe mt-0.5 space-x-1.5 font-lao">
        ${item.sweetness ? `<span>ຫວານ ${item.sweetness}</span>` : ''}
        ${item.milk ? `<span>• ນົມ: ${item.milk}</span>` : ''}
        ${item.extraShot ? `<span>• +Extra Shot</span>` : ''}
      </div>

      ${item.note ? `
        <div class="mt-1.5 p-2 rounded-lg bg-amber-50 border border-amber-300 text-amber-950 flex items-start gap-1.5 shadow-2xs font-lao">
          <span class="text-amber-700 mt-0.5">${svgIcon('note', 'w-3.5 h-3.5')}</span>
          <span class="text-[11px] font-bold leading-tight">ໝາຍເຫດ: ${item.note}</span>
        </div>
      ` : ''}
    </div>
  `).join('');

  return `
    <div class="p-4 rounded-xl bg-surface-pure border-2 ${isPending ? 'border-amber-400 shadow-md' : (isMultiOrder ? theme.border : 'border-hairline')} flex flex-col justify-between space-y-3">
      <div>
        <div class="flex items-start justify-between pb-2 border-b border-hairline font-lao gap-2">
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-serif-title font-bold text-[17px] text-primary">#${order.orderCode || 'Order'}</span>
              ${isMultiOrder ? `
                <span class="px-2 py-0.5 rounded-full ${theme.bg} border ${theme.border} ${theme.text} text-[9px] font-bold inline-flex items-center gap-1 font-lao">
                  ${svgIcon('user', 'w-3 h-3')}
                  <span>ລູກຄ້າດຽວກັນ (${customerCounts[custKey]})</span>
                </span>
              ` : ''}
            </div>

            <div class="mt-1 text-[11px] text-charcoal font-medium">
              <span class="font-bold text-forest-emerald">${order.customerName || 'Guest'}</span>
              <span class="text-[10px] text-taupe font-mono">(${order.customerPhone || 'Walk-in'})</span>
            </div>

            ${order.fulfillmentType === 'delivery' ? `
              <div class="mt-1 text-[10px] text-blue-800 bg-blue-50 border border-blue-200 rounded px-2 py-0.5 inline-flex items-center gap-1">
                ${svgIcon('bike', 'w-3 h-3')}
                <span>ສົ່ງ: ${order.deliveryAddress || 'ພາຍໃນ 500ມ'}</span>
              </div>
            ` : ''}
          </div>

          <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
            isPending ? 'bg-amber-100 text-amber-900 border border-amber-300' :
            isPreparing ? 'bg-blue-100 text-blue-900 border border-blue-300' :
            isReady ? 'bg-emerald-100 text-emerald-900 border border-emerald-400' :
            isRejected ? 'bg-red-100 text-red-800 border border-red-300' :
            'bg-gray-100 text-gray-700'
          }">
            ${isPending ? 'ລໍຖ້າກວດສອບ' : isPreparing ? 'ກຳລັງດຳເນີນການ' : isReady ? 'ພ້ອມຮັບ' : isRejected ? 'ປະຕິເສດ' : 'ສຳເລັດ'}
          </span>
        </div>

        <div class="py-1 divide-y divide-hairline">${itemsHtml}</div>

        ${isRejected && order.rejectionReason ? `
          <div class="mt-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-[11px] text-red-800 font-lao space-y-1">
            <p class="font-bold">ເຫດຜົນປະຕິເສດ: ${order.rejectionReason}</p>
            <p class="text-[10px] text-red-700">${order.refundNote || 'ດຳເນີນການຣີຟັນເງິນຄືນແລ້ວ'}</p>
          </div>
        ` : ''}
      </div>

      <div class="pt-2 border-t border-hairline space-y-2 font-lao">
        <div class="flex justify-between items-center text-[12px]">
          <span class="text-taupe">
            ${order.paymentMethod || 'QR'}
            ${order.slipImage ? `
              <button type="button" onclick="openSlipAuditModal('${order.id}')" class="ml-1.5 text-blue-700 underline font-bold cursor-pointer">ເບິ່ງ Slip</button>
            ` : ''}
          </span>
          <span class="text-forest-emerald font-serif-title font-bold text-[15px]">${formatLAK(order.totalAmount)}</span>
        </div>

        <div class="grid grid-cols-2 gap-2 pt-1 font-lao">
          ${isPending ? `
            <button type="button" onclick="openRejectModal('${order.id}')" class="py-2 rounded-lg border border-red-200 text-red-700 text-[11px] font-bold hover:bg-red-50 cursor-pointer flex items-center justify-center gap-1">
              ${svgIcon('xCircle', 'w-3.5 h-3.5')}
              <span>ປະຕິເສດ</span>
            </button>
            <button type="button" onclick="updateOrderStatus('${order.id}', 'preparing')" class="py-2 rounded-lg bg-forest-emerald text-white text-[11px] font-bold hover:bg-forest-leaf cursor-pointer flex items-center justify-center gap-1">
              ${svgIcon('checkCircle', 'w-3.5 h-3.5')}
              <span>ຮັບອໍເດີ້</span>
            </button>
          ` : ''}

          ${isPreparing ? `
            <button type="button" onclick="updateOrderStatus('${order.id}', 'ready')" class="col-span-2 py-2.5 rounded-lg bg-emerald-600 text-white text-[12px] font-bold hover:bg-emerald-700 shadow-xs cursor-pointer flex items-center justify-center gap-1.5">
              ${svgIcon('coffee', 'w-4 h-4')}
              <span>ສຳເລັດ! ພ້ອມໃຫ້ລູກຄ້າມາຮັບ (Ready)</span>
            </button>
          ` : ''}

          ${isReady ? `
            <button type="button" onclick="updateOrderStatus('${order.id}', 'completed')" class="col-span-2 py-2.5 rounded-lg bg-primary text-white text-[12px] font-bold hover:bg-primary-dark cursor-pointer flex items-center justify-center gap-1.5">
              ${svgIcon('checkCircle', 'w-4 h-4')}
              <span>ລູກຄ້າຮັບເຄື່ອງສຳເລັດແລ້ວ</span>
            </button>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

// =======================================================
// POP-UP ກວດສອບອໍເດີ້ໃໝ່ແບບລະອຽດສຳລັບ STAFF
// =======================================================
window.triggerStaffNewOrderAlert = function(order, queueCount = 1) {
  const modal = document.getElementById('staffNewOrderModal');
  if (!modal) return;

  const box = modal.querySelector('div');
  if (box) {
    box.className = 'bg-surface-pure w-full max-w-md rounded-2xl border-2 border-forest-emerald p-5 shadow-2xl space-y-4 animate-scale-up max-h-[90vh] overflow-y-auto';
    box.innerHTML = `
      <div class="flex items-center justify-between border-b border-hairline pb-3">
        <div class="flex items-center gap-2.5">
          <div class="w-10 h-10 rounded-full bg-emerald-50 text-forest-emerald border border-emerald-200 flex items-center justify-center animate-bounce">
            ${svgIcon('bell', 'w-5 h-5')}
          </div>
          <div>
            <span id="staffNotifQueueBadge" class="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-bold uppercase tracking-wider">
              ລໍຖ້າກວດສອບ (${queueCount})
            </span>
            <h3 class="font-serif-title text-[19px] text-primary font-bold mt-0.5">#${order.orderCode || 'Order'}</h3>
          </div>
        </div>
        <span class="font-mono font-bold text-forest-emerald text-[16px]">${formatLAK(order.totalAmount)}</span>
      </div>

      <div class="text-[12px] bg-surface p-3 rounded-xl border border-hairline space-y-1 font-lao">
        <div class="flex justify-between">
          <span class="text-taupe">ລູກຄ້າ:</span>
          <span class="font-bold text-primary">${order.customerName || 'Guest'} (${order.customerPhone || 'Walk-in'})</span>
        </div>
        <div class="flex justify-between">
          <span class="text-taupe">ການຊຳລະ:</span>
          <span class="font-bold text-charcoal">${order.paymentMethod || 'QR'}</span>
        </div>
        ${order.fulfillmentType === 'delivery' ? `
          <div class="flex justify-between text-blue-800 font-bold">
            <span>ຈັດສົ່ງ:</span>
            <span>${order.deliveryAddress || 'ພາຍໃນ 500ມ'}</span>
          </div>
        ` : ''}
      </div>

      ${order.slipImage ? `
        <div class="flex items-center justify-between p-2.5 rounded-xl bg-blue-50 border border-blue-200">
          <span class="text-[11px] font-bold text-blue-900">ລູກຄ້າແນບໃບໂອນເງິນ (Slip) ແລ້ວ</span>
          <button type="button" onclick="openSlipAuditModal('${order.id}')" class="px-3 py-1 rounded-lg bg-blue-700 text-white text-[11px] font-bold cursor-pointer">
            ກວດສອບ Slip
          </button>
        </div>
      ` : ''}

      <div class="space-y-1.5 max-h-48 overflow-y-auto divide-y divide-hairline border border-hairline rounded-xl p-3 bg-surface-pure">
        ${(order.items || []).map(item => `
          <div class="pt-1.5 first:pt-0 text-[12px] font-lao">
            <div class="flex justify-between font-bold text-primary">
              <span>${item.quantity}x ${item.name} [${formatVariantLabel(item.variant)}]</span>
              <span class="font-mono text-forest-emerald">${formatLAK(item.totalPrice || item.price)}</span>
            </div>
            <div class="text-[11px] text-taupe">
              ${item.sweetness ? `ຫວານ ${item.sweetness}` : ''} ${item.milk ? `• ${item.milk}` : ''} ${item.extraShot ? '• +Extra Shot' : ''}
            </div>
            ${item.note ? `<div class="mt-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">ໝາຍເຫດ: ${item.note}</div>` : ''}
          </div>
        `).join('')}
      </div>

      <div class="grid grid-cols-2 gap-2 pt-1 font-lao">
        <button type="button" onclick="openRejectModal('${order.id}')" class="py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-[12px] font-bold hover:bg-red-100 cursor-pointer flex items-center justify-center gap-1.5">
          ${svgIcon('xCircle', 'w-4 h-4')}
          <span>ປະຕິເສດ (ບໍ່ພ້ອມເສີບ)</span>
        </button>
        <button type="button" onclick="acceptStaffNewOrderFromModal()" class="py-2.5 rounded-xl bg-forest-emerald text-white text-[12px] font-bold hover:bg-forest-leaf shadow-xs cursor-pointer flex items-center justify-center gap-1.5">
          ${svgIcon('checkCircle', 'w-4 h-4')}
          <span>ກວດສອບ & ຮັບອໍເດີ້</span>
        </button>
      </div>
      <button type="button" onclick="snoozeStaffCurrentAlert()" class="w-full py-1.5 text-[11px] text-taupe hover:text-charcoal cursor-pointer font-lao">
        ປິດສຽງຊົ່ວຄາວ (ກວດສອບພາຍຫຼັງໃນລາຍການ)
      </button>
    `;
  }

  modal.classList.remove('hidden');
};

// Alias ເພື່ອໃຫ້ເຂົ້າກັບໂຄດເດີມໃນ app.js
window.triggerStaffIncomingModal = window.triggerStaffNewOrderAlert;

window.closeStaffNewOrderModal = function(stopAudio = true) {
  document.getElementById('staffNewOrderModal')?.classList.add('hidden');
  if (stopAudio && typeof stopStaffAlarm === 'function') stopStaffAlarm();
};

window.snoozeStaffCurrentAlert = function() {
  if (window.currentAlertingOrderId) {
    window.snoozedPendingIds.add(window.currentAlertingOrderId);
  }
  window.currentAlertingOrderId = null;
  window.closeStaffNewOrderModal(true);
};

window.acceptStaffNewOrderFromModal = function() {
  const id = window.currentAlertingOrderId;
  window.currentAlertingOrderId = null;
  window.closeStaffNewOrderModal(true);
  if (id) window.updateOrderStatus(id, 'preparing');
};

// =======================================================
// REJECT MODAL (ໃສ່ເຫດຜົນ + ແຈ້ງຣີຟັນເງິນຄືນ)
// =======================================================
window.openRejectModal = function(orderId) {
  window.pendingRejectOrderId = orderId;
  const modal = document.getElementById('staffRejectModal');
  const reasonEl = document.getElementById('rejectInputReason');
  if (reasonEl) reasonEl.value = '';

  // ເພີ່ມປຸ່ມເຫດຜົນດ່ວນຖ້າຍັງບໍ່ມີ
  if (modal && !document.getElementById('quickRejectChips')) {
    const chips = document.createElement('div');
    chips.id = 'quickRejectChips';
    chips.className = 'flex flex-wrap gap-1.5';
    const presets = [
      'ເຄື່ອງດື່ມ/ວັດຖຸດິບໝົດຊົ່ວຄາວ',
      'ເຄື່ອງຊົງຂັດຂ້ອງ ບໍ່ພ້ອມເສີບ',
      'ໃບໂອນເງິນ (Slip) ບໍ່ຖືກຕ້ອງ'
    ];
    chips.innerHTML = presets.map(text => `
      <button type="button" onclick="selectQuickRejectReason('${text}')"
              class="px-2 py-1 rounded-lg bg-surface border border-hairline hover:border-red-300 text-[10px] text-charcoal cursor-pointer">${text}</button>
    `).join('');
    reasonEl?.parentElement?.appendChild(chips);
  }

  modal?.classList.remove('hidden');
};

window.selectQuickRejectReason = function(text) {
  const reasonEl = document.getElementById('rejectInputReason');
  if (reasonEl) reasonEl.value = text;
};

window.closeRejectModal = function() {
  window.pendingRejectOrderId = null;
  document.getElementById('staffRejectModal')?.classList.add('hidden');
};

window.confirmRejectOrder = async function() {
  const orderId = window.pendingRejectOrderId;
  const reason = document.getElementById('rejectInputReason')?.value.trim();

  if (!orderId) return;
  if (!reason) {
    if (typeof showAtelierToast === 'function') showAtelierToast('ກະລຸນາລະບຸເຫດຜົນທີ່ປະຕິເສດອໍເດີ້', 'warning');
    return;
  }

  try {
    const firestore = db || firebase.firestore();
    await firestore.collection('orders').doc(orderId).update({
      status: 'rejected',
      rejectionReason: reason,
      refundNote: 'ທາງຮ້ານຈະທຳການຣີຟັນເງິນຄືນໃຫ້ທ່ານ. ກະລຸນາເລືອກສັ່ງລາຍການອື່ນເຂົ້າມາໃໝ່ແທນ.',
      rejectedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    window.closeRejectModal();
    if (window.currentAlertingOrderId === orderId) {
      window.currentAlertingOrderId = null;
      window.closeStaffNewOrderModal(true);
    }
    if (typeof showAtelierToast === 'function') {
      showAtelierToast('ປະຕິເສດອໍເດີ້ ແລະ ແຈ້ງຣີຟັນໄປຫາລູກຄ້າແລ້ວ');
    }
  } catch (e) {
    if (typeof showAtelierAlert === 'function') {
      showAtelierAlert({ title: 'ຜິດພາດ', message: e.message, type: 'error' });
    }
  }
};

// =======================================================
// SLIP AUDIT & STATUS UPDATES
// =======================================================
window.openSlipAuditModal = function(orderId) {
  const order = (window.allStaffOrders || []).find(o => o.id === orderId);
  if (!order || !order.slipImage) return;

  const img = document.getElementById('slipAuditImage');
  const ref = document.getElementById('slipAuditOrderRef');
  if (img) img.src = order.slipImage;
  if (ref) ref.textContent = `Ref #${order.orderCode || order.id} • ${formatLAK(order.totalAmount)}`;
  document.getElementById('slipAuditModal')?.classList.remove('hidden');
};

window.closeSlipAuditModal = function() {
  document.getElementById('slipAuditModal')?.classList.add('hidden');
};

window.updateOrderStatus = async function(orderId, nextStatus) {
  try {
    const firestore = db || firebase.firestore();
    const payload = {
      status: nextStatus,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    if (nextStatus === 'preparing') payload.acceptedAt = firebase.firestore.FieldValue.serverTimestamp();
    if (nextStatus === 'ready') payload.readyAt = firebase.firestore.FieldValue.serverTimestamp();
    if (nextStatus === 'completed') payload.completedAt = firebase.firestore.FieldValue.serverTimestamp();

    await firestore.collection('orders').doc(orderId).update(payload);
    if (typeof showAtelierToast === 'function') {
      const msg = nextStatus === 'preparing' ? 'ຮັບອໍເດີ້ແລ້ວ — ກຳລັງດຳເນີນການ'
        : nextStatus === 'ready' ? 'ແຈ້ງລູກຄ້າວ່າເຄື່ອງດື່ມພ້ອມຮັບແລ້ວ!'
        : 'ປິດອໍເດີ້ສຳເລັດ';
      showAtelierToast(msg);
    }
  } catch (e) {
    if (typeof showAtelierAlert === 'function') {
      showAtelierAlert({ title: 'ອັບເດດບໍ່ສຳເລັດ', message: e.message, type: 'error' });
    }
  }
};

window.updateStaffNotifyBadge = function() {
  const btn = document.getElementById('btnStaffEnableNotify');
  if (!btn) return;
  const granted = ('Notification' in window) && Notification.permission === 'granted';
  btn.innerHTML = granted
    ? `${svgIcon('bell', 'w-3.5 h-3.5 text-emerald-300')} <span>ແຈ້ງເຕືອນພ້ອມໃຊ້</span>`
    : `${svgIcon('bell', 'w-3.5 h-3.5 text-amber-300')} <span>ເປີດສຽງ & ແຈ້ງເຕືອນ</span>`;
};
