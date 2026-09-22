// =======================================================
// STAFF KDS WITH CUSTOMER MATCH INDICATOR
// =======================================================

let staffSubTab = 'active';
let activeRejectOrderId = null;
let currentModalOrderId = null;

function switchStaffSubTab(tab) {
  staffSubTab = tab;
  document.getElementById('staff-tab-active').className = tab === 'active' ? "px-4 py-1.5 rounded-lg bg-forest-emerald text-white text-[12px] font-bold" : "px-4 py-1.5 rounded-lg bg-surface border border-hairline text-taupe text-[12px]";
  document.getElementById('staff-tab-history').className = tab === 'history' ? "px-4 py-1.5 rounded-lg bg-forest-emerald text-white text-[12px] font-bold" : "px-4 py-1.5 rounded-lg bg-surface border border-hairline text-taupe text-[12px]";
  document.getElementById('staffOrdersContainer').classList.toggle('hidden', tab !== 'active');
  document.getElementById('staffHistoryContainer').classList.toggle('hidden', tab !== 'history');
  renderStaffOrders();
}

function renderStaffOrders() {
  const activeContainer = document.getElementById('staffOrdersContainer');
  const historyContainer = document.getElementById('staffHistoryContainer');
  if (!activeContainer || !historyContainer) return;

  const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
  const completedOrders = orders.filter(o => o.status === 'completed');

  // ນັບຈຳນວນອໍເດີ້ຂອງລູກຄ້າແຕ່ລະຄົນໃນຄິວປັດຈຸບັນ
  const customerOrderCounts = {};
  activeOrders.forEach(o => {
    const key = o.customerPhone || o.customerName;
    customerOrderCounts[key] = (customerOrderCounts[key] || 0) + 1;
  });

  // Active Queue
  if (activeOrders.length === 0) {
    activeContainer.innerHTML = `<div class="col-span-full p-8 bg-surface-pure border border-hairline rounded-2xl text-center"><p class="text-taupe">Queue is clear</p></div>`;
  } else {
    activeContainer.innerHTML = activeOrders.map(o => {
      const customerKey = o.customerPhone || o.customerName;
      const totalFromCustomer = customerOrderCounts[customerKey] || 1;
      const theme = getCustomerColorTheme(customerKey); // ສີປະຈຳຕົວລູກຄ້າ

      return `
        <div class="p-4 bg-surface-pure border-2 ${o.status === 'pending' ? 'border-red-400 animate-pulse' : 'border-hairline'} rounded-2xl space-y-3 relative overflow-hidden shadow-xs">
          
          <!-- 🔥 Customer Match Indicator Header (ແຖບສີຈັບຄູ່ລູກຄ້າຄົນດຽວກັນ) -->
          <div class="p-2 rounded-xl ${theme.bg} border ${theme.border} flex items-center justify-between">
            <div class="flex items-center gap-1.5">
              <span class="w-6 h-6 rounded-full bg-white border ${theme.border} flex items-center justify-center font-bold text-[11px] ${theme.text}">
                ${o.customerName.charAt(0).toUpperCase()}
              </span>
              <div>
                <span class="text-[12px] font-bold ${theme.text} block leading-tight">${o.customerName}</span>
                <a href="tel:${o.customerPhone}" class="text-[10px] font-mono opacity-80 hover:underline">📞 ${o.customerPhone}</a>
              </div>
            </div>

            ${totalFromCustomer > 1 ? `
              <span class="px-2 py-0.5 rounded-full bg-white border ${theme.border} text-[9px] font-bold ${theme.text} shadow-2xs">
                🔗 ຄິວພວງ (${totalFromCustomer} ປີ້)
              </span>
            ` : ''}
          </div>

          <div class="flex justify-between items-center border-b border-hairline pb-2">
            <span class="font-mono font-bold text-forest-emerald text-[14px]">${o.id}</span>
            <span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-amber-100 text-amber-900">${o.status}</span>
          </div>

          <div class="text-[11px] divide-y divide-hairline">
            ${o.items.map(i => `<div class="py-1 flex justify-between"><span>${i.quantity}× ${i.name} [${(i.variant||'std').toUpperCase()}]</span><span>${formatLAK(i.total)}</span></div>`).join('')}
          </div>

          <div class="flex justify-between items-center pt-2 border-t border-hairline">
            <span class="font-mono font-bold">${formatLAK(o.total)}</span>
            ${o.slipUrl ? `<button onclick="viewSlip('${o.slipUrl}','${o.id}')" class="px-2.5 py-1 rounded bg-forest-emerald/10 text-forest-emerald text-[11px] font-bold">ກວດສະລິບ</button>` : '<span class="text-[10px] text-taupe">ເງິນສົດ</span>'}
          </div>

          <div class="pt-2 border-t border-hairline flex flex-wrap gap-2">
            ${o.status === 'pending' ? `
              <button onclick="updateOrderStatus('${o.id}','crafting')" class="flex-1 py-1.5 rounded-lg bg-forest-emerald text-white text-[11px] font-bold">ຮັບອໍເດີ້</button>
              <button onclick="openRejectModal('${o.id}')" class="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-[11px] font-bold">ປະຕິເສດ</button>
            ` : ''}
            ${o.status === 'crafting' ? `
              <button onclick="sendDelayNotice('${o.id}')" class="px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-[11px] text-amber-900 font-bold flex items-center gap-1">
                <span class="material-symbols-outlined text-[14px]">hourglass_top</span>
                <span>+5m ລ່າຊ້າ</span>
              </button>
              <button onclick="updateOrderStatus('${o.id}','ready')" class="flex-1 py-1.5 rounded-lg bg-emerald-800 text-white text-[11px] font-bold">ພ້ອມຮັບ</button>
            ` : ''}
            ${o.status === 'ready' ? `<button onclick="updateOrderStatus('${o.id}','completed')" class="w-full py-1.5 rounded-lg bg-primary text-white text-[11px] font-bold">ມອບແລ້ວ (Completed)</button>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  // Completed History
  if (completedOrders.length === 0) {
    historyContainer.innerHTML = `<div class="col-span-full p-8 bg-surface-pure border border-hairline rounded-2xl text-center"><p class="text-taupe">ຍັງບໍ່ມີປະຫວັດອໍເດີ້ທີ່ສຳເລັດ</p></div>`;
  } else {
    historyContainer.innerHTML = completedOrders.map(o => `
      <div class="p-4 bg-surface-pure border border-hairline rounded-2xl space-y-2 opacity-85">
        <div class="flex justify-between"><span class="font-mono font-bold text-forest-emerald">${o.id}</span><span class="text-emerald-800 text-[11px] font-bold">✓ ສຳເລັດແລ້ວ</span></div>
        <p class="text-[12px] font-bold">${o.customerName} (${o.customerPhone})</p>
        <p class="text-[11px] text-taupe">${o.items.map(i=>i.name).join(', ')}</p>
        <span class="font-mono font-bold block text-[13px] pt-1 border-t border-hairline">${formatLAK(o.total)}</span>
      </div>
    `).join('');
  }
}

function viewSlip(url, id) {
  document.getElementById('slipAuditImage').src = url;
  document.getElementById('slipAuditOrderRef').textContent = "Order ID: " + id;
  document.getElementById('slipAuditModal').classList.remove('hidden');
}

function closeSlipAuditModal() {
  document.getElementById('slipAuditModal').classList.add('hidden');
}

async function updateOrderStatus(id, status) {
  stopStaffAlarm();
  const order = orders.find(o => o.id === id);
  if (order) {
    order.status = status;
    if (status === 'completed') {
      order.completedAt = new Date().toISOString();
    }
    
    if (isFirebaseReady && db) {
      await db.collection("orders").doc(id).update({
        status: status,
        completedAt: status === 'completed' ? new Date().toISOString() : null
      });
    }

    renderStaffOrders();
    if (typeof renderAnalytics === 'function') renderAnalytics();
    showToast(`ອັບເດດ ${id} ເປັນ ${status}`);
  }
}

async function sendDelayNotice(id) {
  const order = orders.find(o => o.id === id);
  if (order) {
    order.delayNotice = "ຄິວຫຼາຍ ຂໍເວລາເພີ່ມ 5 ນາທີ ເພື່ອຄວາມສົດໃໝ່";
    if (isFirebaseReady && db) {
      await db.collection("orders").doc(id).update({ delayNotice: order.delayNotice });
    }
    showToast("ສົ່ງແຈ້ງເຕືອນລ່າຊ້າຫາລູກຄ້າແລ້ວ!");
  }
}

function openRejectModal(id) {
  activeRejectOrderId = id;
  document.getElementById('rejectInputReason').value = "ໃບສະລິບໂອນເງິນບໍ່ຖືກຕ້ອງ";
  document.getElementById('staffRejectModal').classList.remove('hidden');
}

function closeRejectModal() {
  document.getElementById('staffRejectModal').classList.add('hidden');
}

async function confirmRejectOrder() {
  const reason = document.getElementById('rejectInputReason').value.trim();
  if (!reason) return;
  stopStaffAlarm();

  const order = orders.find(o => o.id === activeRejectOrderId);
  if (order) {
    order.status = 'cancelled';
    order.cancelReason = reason;

    if (isFirebaseReady && db) {
      await db.collection("orders").doc(activeRejectOrderId).update({
        status: 'cancelled',
        cancelReason: reason
      });
    }

    renderStaffOrders();
    closeRejectModal();
    showToast("ປະຕິເສດອໍເດີ້ແລ້ວ");
  }
}

function triggerStaffIncomingModal(order) {
  currentModalOrderId = order.id;
  document.getElementById('staffNotifOrderId').textContent = "Order #" + order.id;
  document.getElementById('staffNotifCustomer').textContent = `${order.customerName} (${order.customerPhone})`;
  document.getElementById('staffNotifTotal').textContent = formatLAK(order.total);
  document.getElementById('staffNewOrderModal')?.classList.remove('hidden');
}

function closeStaffNewOrderModal() {
  stopStaffAlarm();
  document.getElementById('staffNewOrderModal')?.classList.add('hidden');
}

function acceptStaffNewOrderFromModal() {
  if (currentModalOrderId) {
    updateOrderStatus(currentModalOrderId, 'crafting');
  }
  closeStaffNewOrderModal();
}
