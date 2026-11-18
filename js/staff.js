// =======================================================
// LA DOLCE — BARISTA DISPLAY (ORDER & SLIP AUDIT BEFORE PREPARE)
// =======================================================

window.currentStaffSubTab = 'active';
window.allStaffOrders = [];
window.currentAlertingOrderId = null;
window.pendingRejectOrderId = null;
window.currentAuditingSlipOrderId = null;
window.snoozedPendingIds = new Set();
window.verifiedSlipOrderIds = new Set();

function getOrderDisplayCode(order) {
  if (order.orderCode) return order.orderCode;
  if (order.id) return order.id.slice(0, 6).toUpperCase();
  return 'ORDER';
}

function getOrderDisplayTotal(order) {
  return Number(order.totalAmount ?? order.total ?? 0);
}

function getOrderSlipSrc(order) {
  return order?.slipImage || order?.slipUrl || '';
}

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

  // ກວດສອບຄິວອໍເດີ້ pending ເພື່ອເດັ້ງ Pop-up ໃຫ້ Staff ກວດສອບອໍເດີ້ & ສະລິບ
  const pendingOrders = activeOrders.filter(o => o.status === 'pending' && !window.snoozedPendingIds.has(o.id));
  const allPendingOrders = activeOrders.filter(o => o.status === 'pending');
  const isRejectModalOpen = !document.getElementById('staffRejectModal')?.classList.contains('hidden');
  const isReviewModalOpen = !document.getElementById('staffNewOrderModal')?.classList.contains('hidden');

  if (pendingOrders.length > 0) {
    const stillReviewingSame = window.currentAlertingOrderId && pendingOrders.some(o => o.id === window.currentAlertingOrderId);
    if (!stillReviewingSame && !isRejectModalOpen && !isReviewModalOpen) {
      const nextPending = pendingOrders[0];
      window.currentAlertingOrderId = nextPending.id;
      window.triggerStaffNewOrderAlert(nextPending, allPendingOrders.length);
    } else {
      const queueBadge = document.getElementById('staffNotifQueueBadge');
      if (queueBadge) queueBadge.textContent = `ລໍຖ້າກວດສອບ (${allPendingOrders.length})`;
    }
    if (typeof startStaffAlarm === 'function') startStaffAlarm(pendingOrders[0]);
  } else {
    if (!isReviewModalOpen) window.currentAlertingOrderId = null;
    if (allPendingOrders.length === 0) {
      window.currentAlertingOrderId = null;
      window.closeStaffNewOrderModal(false);
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
  const displayCode = getOrderDisplayCode(order);
  const displayTotal = getOrderDisplayTotal(order);
  const slipSrc = getOrderSlipSrc(order);

  const itemsHtml = (order.items || []).map(item => `
    <div class="py-2 border-b border-hairline last:border-0">
      <div class="flex justify-between items-start font-lao gap-2">
        <span class="font-bold text-[13px] text-primary">
          ${item.quantity || 1}x ${item.name}
          <span class="text-forest-leaf font-medium">[${formatVariantLabel(item.variant)}]</span>
        </span>
        <span class="text-[12px] font-mono font-bold text-taupe shrink-0">${formatLAK(item.totalPrice ?? item.total ?? item.price ?? 0)}</span>
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
              <span class="font-serif-title font-bold text-[17px] text-primary">#${displayCode}</span>
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
          <span class="text-taupe flex items-center gap-1.5">
            <span>${order.paymentMethod || 'QR'}</span>
            ${slipSrc ? `
              <button type="button" onclick="openSlipAuditModal('${order.id}')" class="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-bold hover:bg-blue-100 cursor-pointer">
                ກວດສອບ Slip
              </button>
            ` : ''}
          </span>
          <span class="text-forest-emerald font-serif-title font-bold text-[15px]">${formatLAK(displayTotal)}</span>
        </div>

        <div class="grid grid-cols-2 gap-2 pt-1 font-lao">
          ${isPending ? `
            <button type="button" onclick="openRejectModal('${order.id}')" class="py-2 rounded-lg border border-red-200 text-red-700 text-[11px] font-bold hover:bg-red-50 cursor-pointer flex items-center justify-center gap-1">
              ${svgIcon('xCircle', 'w-3.5 h-3.5')}
              <span>ປະຕິເສດ</span>
            </button>
            <button type="button" onclick="openStaffOrderReviewModal('${order.id}')" class="py-2 rounded-lg bg-forest-emerald text-white text-[11px] font-bold hover:bg-forest-leaf cursor-pointer flex items-center justify-center gap-1">
              ${svgIcon('checkCircle', 'w-3.5 h-3.5')}
              <span>ກວດສອບອໍເດີ້</span>
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

// ເປີດ Pop-up ກວດສອບອໍເດີ້ + ສະລິບ ຈາກປຸ່ມເທິງກາດ
window.openStaffOrderReviewModal = function(orderId) {
  const order = (window.allStaffOrders || []).find(o => o.id === orderId);
  if (!order) return;
  const pendingCount = (window.allStaffOrders || []).filter(o => o.status === 'pending').length;
  window.currentAlertingOrderId = order.id;
  window.triggerStaffNewOrderAlert(order, Math.max(1, pendingCount));
};

// =======================================================
// POP-UP ກວດສອບອໍເດີ້ & ກວດສອບສະລິບການໂອນ ກ່ອນ CONFIRM ເຮັດເຄື່ອງດື່ມ
// =======================================================
window.triggerStaffNewOrderAlert = function(order, queueCount = 1) {
  const modal = document.getElementById('staffNewOrderModal');
  if (!modal) return;

  const displayCode = getOrderDisplayCode(order);
  const displayTotal = getOrderDisplayTotal(order);
  const slipSrc = getOrderSlipSrc(order);
  const isCash = order.paymentType === 'cash';
  const isSlipVerified = !slipSrc || isCash || window.verifiedSlipOrderIds.has(order.id);
  const box = modal.querySelector('div');

  if (box) {
    box.className = 'bg-surface-pure w-full max-w-md rounded-2xl border-2 border-forest-emerald p-5 shadow-2xl space-y-3.5 animate-scale-up max-h-[90vh] overflow-y-auto';
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
            <h3 class="font-serif-title text-[19px] text-primary font-bold mt-0.5">#${displayCode}</h3>
          </div>
        </div>
        <span class="font-mono font-bold text-forest-emerald text-[16px]">${formatLAK(displayTotal)}</span>
      </div>

      <div class="text-[12px] bg-surface p-3 rounded-xl border border-hairline space-y-1 font-lao">
        <div class="flex justify-between">
          <span class="text-taupe">ລູກຄ້າ:</span>
          <span class="font-bold text-primary">${order.customerName || 'Guest'} (${order.customerPhone || 'Walk-in'})</span>
        </div>
        <div class="flex justify-between">
          <span class="text-taupe">ຊ່ອງທາງຊຳລະ:</span>
          <span class="font-bold text-charcoal">${order.paymentMethod || 'QR'}</span>
        </div>
        ${order.fulfillmentType === 'delivery' ? `
          <div class="flex justify-between text-blue-800 font-bold">
            <span>ຈັດສົ່ງ:</span>
            <span>${order.deliveryAddress || 'ພາຍໃນ 500ມ'}</span>
          </div>
        ` : ''}
      </div>

      <!-- ກ່ອງກວດສອບສະລິບການໂອນກ່ອນ Confirm ເຮັດເຄື່ອງດື່ມ -->
      ${slipSrc ? `
        <div id="reviewSlipBox" class="p-3 rounded-xl border ${isSlipVerified ? 'bg-emerald-50 border-emerald-300' : 'bg-blue-50 border-blue-200'} space-y-2.5 font-lao">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2.5">
              <img src="${slipSrc}" onclick="openSlipAuditModal('${order.id}')" alt="Slip Preview"
                   class="w-12 h-12 rounded-lg object-cover border border-hairline bg-white cursor-pointer hover:opacity-90 shrink-0"/>
              <div>
                <p class="text-[11px] font-bold ${isSlipVerified ? 'text-emerald-900' : 'text-blue-900'}">
                  ${isSlipVerified ? 'ກວດສອບສະລິບການໂອນຖືກຕ້ອງແລ້ວ' : 'ກະລຸນາກວດສອບສະລິບການໂອນກ່ອນ'}
                </p>
                <p class="text-[10px] ${isSlipVerified ? 'text-emerald-700' : 'text-blue-700'}">
                  ຍອດທີ່ຕ້ອງຕົງກັນ: <strong>${formatLAK(displayTotal)}</strong>
                </p>
              </div>
            </div>
            <button type="button" onclick="openSlipAuditModal('${order.id}')"
                    class="px-3 py-1.5 rounded-lg ${isSlipVerified ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-blue-700 hover:bg-blue-800'} text-white text-[11px] font-bold cursor-pointer shrink-0">
              ${isSlipVerified ? 'ເບິ່ງ Slip ອີກຄັ້ງ' : 'ກວດສອບ Slip'}
            </button>
          </div>
          <label class="flex items-center gap-2 pt-2 border-t ${isSlipVerified ? 'border-emerald-200' : 'border-blue-200'} text-[11px] font-bold cursor-pointer ${isSlipVerified ? 'text-emerald-900' : 'text-blue-950'}">
            <input type="checkbox" id="chkReviewSlipVerified" ${isSlipVerified ? 'checked' : ''}
                   onchange="toggleReviewSlipVerified('${order.id}', this.checked)"
                   class="w-4 h-4 rounded text-forest-emerald focus:ring-0 cursor-pointer"/>
            <span>ຢືນຢັນວ່າກວດສອບຍອດເງິນໃນສະລິບຖືກຕ້ອງແລ້ວ</span>
          </label>
        </div>
      ` : isCash ? `
        <div class="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-900 flex items-center gap-2 font-lao">
          ${svgIcon('cash', 'w-4 h-4')}
          <span>ລູກຄ້າເລືອກຊຳລະດ້ວຍເງິນສົດໜ້າຮ້ານ</span>
        </div>
      ` : `
        <div class="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-900 flex items-center gap-2 font-lao">
          ${svgIcon('alert', 'w-4 h-4')}
          <span>ອໍເດີ້ນີ້ຍັງບໍ່ມີຮູບສະລິບແນບມາ (ກວດສອບການຊຳລະກ່ອນຢືນຢັນ)</span>
        </div>
      `}

      <div class="space-y-1.5 max-h-44 overflow-y-auto divide-y divide-hairline border border-hairline rounded-xl p-3 bg-surface-pure">
        ${(order.items || []).map(item => `
          <div class="pt-1.5 first:pt-0 text-[12px] font-lao">
            <div class="flex justify-between font-bold text-primary">
              <span>${item.quantity || 1}x ${item.name} [${formatVariantLabel(item.variant)}]</span>
              <span class="font-mono text-forest-emerald">${formatLAK(item.totalPrice ?? item.total ?? item.price ?? 0)}</span>
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
          <span>ປະຕິເສດອໍເດີ້</span>
        </button>
        <button type="button" id="btnConfirmMakeDrink" onclick="acceptStaffNewOrderFromModal()"
                class="py-2.5 rounded-xl text-[12px] font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all ${
                  isSlipVerified
                    ? 'bg-forest-emerald hover:bg-forest-leaf text-white'
                    : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                }">
          ${svgIcon('checkCircle', 'w-4 h-4')}
          <span>${isSlipVerified ? 'ຢືນຢັນເຮັດເຄື່ອງດື່ມ' : 'ກວດ Slip ກ່ອນ Confirm'}</span>
        </button>
      </div>
      <button type="button" onclick="snoozeStaffCurrentAlert()" class="w-full py-1.5 text-[11px] text-taupe hover:text-charcoal cursor-pointer font-lao">
        ປິດສຽງຊົ່ວຄາວ (ກວດສອບພາຍຫຼັງໃນລາຍການ)
      </button>
    `;
  }

  modal.classList.remove('hidden');
};

window.toggleReviewSlipVerified = function(orderId, checked) {
  if (checked) window.verifiedSlipOrderIds.add(orderId);
  else window.verifiedSlipOrderIds.delete(orderId);

  const order = (window.allStaffOrders || []).find(o => o.id === orderId);
  if (order) {
    const allPending = (window.allStaffOrders || []).filter(o => o.status === 'pending').length;
    window.triggerStaffNewOrderAlert(order, Math.max(1, allPending));
  }
};

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
  if (!id) return;

  const order = (window.allStaffOrders || []).find(o => o.id === id);
  const slipSrc = getOrderSlipSrc(order);
  const isCash = order?.paymentType === 'cash';

  // ບັງຄັບໃຫ້ກວດສອບສະລິບກ່ອນຖ້າມີສະລິບແນບມາ
  if (slipSrc && !isCash && !window.verifiedSlipOrderIds.has(id)) {
    if (typeof showAtelierToast === 'function') {
      showAtelierToast('ກະລຸນາກວດສອບສະລິບການໂອນກ່ອນຢືນຢັນເຮັດເຄື່ອງດື່ມ', 'warning');
    }
    window.openSlipAuditModal(id);
    return;
  }

  window.currentAlertingOrderId = null;
  window.closeStaffNewOrderModal(true);
  window.updateOrderStatus(id, 'preparing');
};

// =======================================================
// REJECT MODAL (ບໍ່ຊ້ອນທັບ POP-UP ກວດສອບ + ໃສ່ເຫດຜົນ & ຣີຟັນ)
// =======================================================
window.openRejectModal = function(orderId, presetReason = '') {
  window.pendingRejectOrderId = orderId;
  document.getElementById('staffNewOrderModal')?.classList.add('hidden');
  document.getElementById('slipAuditModal')?.classList.add('hidden');

  const modal = document.getElementById('staffRejectModal');
  const reasonEl = document.getElementById('rejectInputReason');
  if (reasonEl) reasonEl.value = presetReason || '';

  if (modal && !document.getElementById('quickRejectChips')) {
    const chips = document.createElement('div');
    chips.id = 'quickRejectChips';
    chips.className = 'flex flex-wrap gap-1.5 mt-2';
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
  const rejectedId = window.pendingRejectOrderId;
  window.pendingRejectOrderId = null;
  document.getElementById('staffRejectModal')?.classList.add('hidden');

  if (rejectedId && window.currentAlertingOrderId === rejectedId) {
    document.getElementById('staffNewOrderModal')?.classList.remove('hidden');
  }
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

    window.pendingRejectOrderId = null;
    document.getElementById('staffRejectModal')?.classList.add('hidden');
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
// SLIP AUDIT MODAL (ກວດສອບສະລິບແບບຊັດເຈນ ພ້ອມປຸ່ມຢືນຢັນ / ປະຕິເສດ)
// =======================================================
window.openSlipAuditModal = function(orderId) {
  const order = (window.allStaffOrders || []).find(o => o.id === orderId);
  const slipSrc = getOrderSlipSrc(order);
  if (!order || !slipSrc) return;

  window.currentAuditingSlipOrderId = orderId;
  const modal = document.getElementById('slipAuditModal');
  const img = document.getElementById('slipAuditImage');
  const ref = document.getElementById('slipAuditOrderRef');

  if (img) img.src = slipSrc;
  if (ref) ref.textContent = `Ref #${getOrderDisplayCode(order)} • ${order.paymentMethod || 'QR'} • ${formatLAK(getOrderDisplayTotal(order))}`;

  // ປັບປຸ່ມດ້ານລຸ່ມຂອງ Modal ໃຫ້ Staff ກົດຢືນຢັນ ຫຼື ປະຕິເສດສະລິບໄດ້ເລີຍ
  const footer = modal?.querySelector('.border-t');
  if (footer) {
    if (order.status === 'pending') {
      footer.className = 'p-4 border-t border-hairline bg-surface-pure grid grid-cols-2 gap-2';
      footer.innerHTML = `
        <button type="button" onclick="markSlipInvalidAndReject('${order.id}')" class="px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 text-[12px] font-bold hover:bg-red-100 cursor-pointer">
          ສະລິບບໍ່ຖືກຕ້ອງ (ປະຕິເສດ)
        </button>
        <button type="button" onclick="markSlipValidAndReturn('${order.id}')" class="px-3 py-2 rounded-lg bg-forest-emerald hover:bg-forest-leaf text-white text-[12px] font-bold cursor-pointer">
          ສະລິບຖືກຕ້ອງ
        </button>
      `;
    } else {
      footer.className = 'p-4 border-t border-hairline bg-surface-pure flex justify-end';
      footer.innerHTML = `
        <button type="button" onclick="closeSlipAuditModal()" class="px-4 py-2 rounded-lg bg-forest-emerald text-white text-[12px] font-medium cursor-pointer">ປິດໜ້າຕ່າງ</button>
      `;
    }
  }

  modal?.classList.remove('hidden');
};

window.markSlipValidAndReturn = function(orderId) {
  window.verifiedSlipOrderIds.add(orderId);
  window.closeSlipAuditModal();

  const order = (window.allStaffOrders || []).find(o => o.id === orderId);
  if (order) {
    const allPending = (window.allStaffOrders || []).filter(o => o.status === 'pending').length;
    window.currentAlertingOrderId = order.id;
    window.triggerStaffNewOrderAlert(order, Math.max(1, allPending));
  }
  if (typeof showAtelierToast === 'function') {
    showAtelierToast('ຢືນຢັນສະລິບຖືກຕ້ອງແລ້ວ — ກົດຢືນຢັນເຮັດເຄື່ອງດື່ມໄດ້ເລີຍ');
  }
};

window.markSlipInvalidAndReject = function(orderId) {
  window.verifiedSlipOrderIds.delete(orderId);
  window.closeSlipAuditModal();
  window.openRejectModal(orderId, 'ໃບໂອນເງິນ (Slip) ບໍ່ຖືກຕ້ອງ');
};

window.closeSlipAuditModal = function() {
  window.currentAuditingSlipOrderId = null;
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
