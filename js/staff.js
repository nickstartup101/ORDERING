// Barista Kitchen Display (PIN: 7878)
function renderStaffOrders() {
  const container = document.getElementById('staffOrdersContainer');
  const badge = document.getElementById('staffOrderCountBadge');
  if (!container) return;

  const activeList = orders.filter(o => o.status !== 'completed');
  badge.textContent = activeList.length;

  if (activeList.length === 0) {
    container.innerHTML = `
      <div class="col-span-full p-8 rounded-lg bg-surface-pure border border-hairline text-center space-y-2">
        <span class="material-symbols-outlined text-[32px] text-taupe">check_circle</span>
        <p class="font-serif text-[16px] text-primary">Queue is clear</p>
        <p class="text-[12px] text-taupe font-lao">ຍັງບໍ່ມີອໍເດີ້ຄ້າງໃນລະບົບ</p>
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  activeList.forEach(order => {
    const isPending = order.status === 'pending';
    const isCrafting = order.status === 'crafting';
    const isReady = order.status === 'ready';

    const card = document.createElement('div');
    card.className = `p-4 rounded-lg bg-surface-pure border ${isPending ? 'border-red-300 ring-2 ring-red-100' : 'border-hairline'} shadow-sm space-y-3`;
    card.innerHTML = `
      <div class="flex items-center justify-between border-b border-hairline pb-2">
        <div>
          <span class="font-mono text-[13px] font-semibold text-primary">${order.id}</span>
          <span class="text-[11px] text-taupe block font-lao">${order.customerName} (${order.customerPhone})</span>
        </div>
        <span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${isPending ? 'bg-red-100 text-red-800' : isCrafting ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}">
          ${order.status}
        </span>
      </div>

      <div class="space-y-1.5 text-[12px] divide-y divide-hairline">
        ${order.items.map(it => `
          <div class="pt-1 flex justify-between">
            <div>
              <span class="font-medium text-charcoal font-lao">${it.quantity}× ${it.name} [${it.variant.toUpperCase()}]</span>
              <p class="text-[10px] text-taupe font-lao">${it.milk} • ຫວານ ${it.sweetness} ${it.extraShot ? '• +Shot' : ''}</p>
            </div>
            <span class="font-mono font-medium">$${it.total.toFixed(2)}</span>
          </div>
        `).join('')}
      </div>

      ${order.note && order.note !== 'None' ? `
        <div class="p-2 rounded bg-surface border border-hairline text-[11px] text-charcoal font-lao">
          <strong>ໝາຍເຫດ:</strong> ${order.note}
        </div>
      ` : ''}

      <div class="flex items-center justify-between pt-2 border-t border-hairline text-[12px]">
        <span class="font-mono font-semibold text-primary">Total: $${order.total.toFixed(2)}</span>
        ${order.slipUrl ? `
          <button onclick="viewSlip('${order.slipUrl}', '${order.id}')" class="px-2.5 py-1 rounded bg-surface-dim hover:bg-hairline text-primary border border-hairline text-[11px] font-medium font-lao flex items-center gap-1">
            <span class="material-symbols-outlined text-[14px]">receipt</span>
            <span>ກວດເບິ່ງ Slip</span>
          </button>
        ` : '<span class="text-[10px] text-taupe font-lao">ຊຳລະເງິນສົດ</span>'}
      </div>

      <div class="pt-2 border-t border-hairline flex flex-wrap gap-1.5">
        ${isPending ? `
          <button onclick="updateOrderStatus('${order.id}', 'crafting')" class="flex-1 py-2 rounded bg-primary text-white text-[11px] uppercase tracking-wider font-semibold hover:bg-primary-hover font-lao">
            ຮັບອໍເດີ້ (Accept)
          </button>
        ` : ''}

        ${isCrafting ? `
          <button onclick="sendDelayNotice('${order.id}')" class="px-2 py-1.5 rounded border border-hairline hover:bg-surface text-[11px] text-amber-800 font-lao">
            +5m ລ່າຊ້າ
          </button>
          <button onclick="updateOrderStatus('${order.id}', 'ready')" class="flex-1 py-2 rounded bg-emerald-800 text-white text-[11px] uppercase tracking-wider font-semibold hover:bg-emerald-900 font-lao">
            ເຄື່ອງດື່ມພ້ອມແລ້ວ! (Ready)
          </button>
        ` : ''}

        ${isReady ? `
          <button onclick="updateOrderStatus('${order.id}', 'completed')" class="w-full py-2 rounded bg-charcoal text-white text-[11px] uppercase tracking-wider font-semibold font-lao">
            ມອບໃຫ້ລູກຄ້າສຳເລັດ (Complete)
          </button>
        ` : ''}
      </div>
    `;
    container.appendChild(card);
  });
}

function viewSlip(url, orderId) {
  document.getElementById('slipAuditImage').src = url;
  document.getElementById('slipAuditOrderRef').textContent = "Order: " + orderId;
  document.getElementById('slipAuditModal').classList.remove('hidden');
}

function closeSlipAuditModal() {
  document.getElementById('slipAuditModal').classList.add('hidden');
}

function updateOrderStatus(orderId, nextStatus) {
  stopStaffAlarm();

  const targetOrder = orders.find(o => o.id === orderId);
  if (!targetOrder) return;

  targetOrder.status = nextStatus;
  if (nextStatus === 'completed') {
    targetOrder.completedAt = new Date().toISOString();
  }

  if (isFirebaseReady && db) {
    db.collection("orders").doc(orderId).update({
      status: nextStatus,
      completedAt: nextStatus === 'completed' ? new Date().toISOString() : null
    }).catch(e => console.warn(e));
  }

  localStorage.setItem('ladolce_orders', JSON.stringify(orders));
  renderStaffOrders();
  renderCustomerTicket();
  renderAnalytics();

  if (nextStatus === 'ready') {
    playBoutiqueChime(true);
    showToast(`ແຈ້ງເຕືອນລູກຄ້າ ${orderId} ມາຮັບເຄື່ອງດື່ມແລ້ວ!`);
  } else {
    showToast(`ອັບເດດສະຖານະ ${orderId} ເປັນ ${nextStatus}`);
  }
}

function sendDelayNotice(orderId) {
  const targetOrder = orders.find(o => o.id === orderId);
  if (!targetOrder) return;

  targetOrder.delayNotice = "ຄິວຫຼາຍ ຂໍເວລາເພີ່ມ 5 ນາທີ ເພື່ອຄວາມສົດໃໝ່";
  if (isFirebaseReady && db) {
    db.collection("orders").doc(orderId).update({ delayNotice: targetOrder.delayNotice });
  }
  localStorage.setItem('ladolce_orders', JSON.stringify(orders));
  renderStaffOrders();
  renderCustomerTicket();
  showToast("ສົ່ງຂໍ້ຄວາມແຈ້ງເຕືອນ Delay ຫາລູກຄ້າແລ້ວ");
}
