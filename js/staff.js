// =======================================================
// BARISTA KITCHEN DISPLAY & BACKGROUND NOTIFICATION ENGINE
// =======================================================

// 1. ລະບົບຂໍສິດແຈ້ງເຕືອນໜ້າຈໍລັອກ (Lock Screen Notification)
function requestStaffNotificationPermission() {
  if ("Notification" in window) {
    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          console.log("✅ Staff Notification permission granted!");
        }
      });
    }
  }
}

// 2. ສົ່ງ Notification ເດັ້ງໜ້າຈໍ ພ້ອມສັ່ນ ແລະ ສຽງເຕືອນ ເມື່ອພັບແອັບ
function triggerBackgroundOrderNotification(order) {
  // ສັ່ງດັງສຽງ
  if (typeof playStaffPulseTone === 'function') {
    playStaffPulseTone();
  }

  // ສັ່ງສັ່ນໂທລະສັບ
  if (navigator.vibrate) {
    navigator.vibrate([300, 150, 300, 150, 400]);
  }

  // ເດັ້ງ Push Notification ໜ້າຈໍລັອກ
  if ("Notification" in window && Notification.permission === "granted") {
    const notif = new Notification(`🔔 ມີອໍເດີ້ໃໝ່ເຂົ້າມາ! #${order.id}`, {
      body: `ລູກຄ້າ: ${order.customerName} (${order.customerPhone})\nຍອດລວມ: $${order.total.toFixed(2)} | ກົດເພື່ອເຂົ້າກວດສະລິບ`,
      icon: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=128",
      tag: "order_" + order.id,
      requireInteraction: true
    });

    notif.onclick = function() {
      window.focus();
      this.close();
    };
  }
}

// 3. Render ຄິວອໍເດີ້ສຳລັບ Barista
function renderStaffOrders() {
  const container = document.getElementById('staffOrdersContainer');
  if (!container) return;

  const activeList = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');

  if (activeList.length === 0) {
    container.innerHTML = `
      <div class="col-span-full p-8 rounded-2xl bg-surface-pure border border-hairline text-center space-y-2">
        <span class="material-symbols-outlined text-[36px] text-forest-leaf">check_circle</span>
        <h3 class="font-serif-title text-[18px] text-primary">Queue is clear</h3>
        <p class="text-[12px] text-taupe font-lao">ບໍ່ມີອໍເດີ້ຄ້າງໃນຄິວຕອນນີ້</p>
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
    card.className = `p-4 rounded-2xl bg-surface-pure border-2 ${isPending ? 'border-red-400 ring-2 ring-red-100 animate-pulse' : 'border-hairline'} shadow-xs space-y-3`;
    card.innerHTML = `
      <div class="flex items-center justify-between border-b border-hairline pb-2">
        <div>
          <span class="font-mono text-[14px] font-bold text-forest-emerald">${order.id}</span>
          <div class="flex items-center gap-1.5 mt-0.5">
            <span class="text-[12px] font-semibold text-charcoal font-lao">${order.customerName}</span>
            <a href="tel:${order.customerPhone}" class="text-[11px] text-forest-emerald bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-mono font-bold flex items-center gap-0.5">
              <span class="material-symbols-outlined text-[12px]">call</span>
              ${order.customerPhone}
            </a>
          </div>
        </div>
        <span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${isPending ? 'bg-red-100 text-red-800' : isCrafting ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}">
          ${order.status}
        </span>
      </div>

      <div class="space-y-1.5 text-[12px] divide-y divide-hairline">
        ${order.items.map(it => `
          <div class="pt-1 flex justify-between items-start">
            <div>
              <span class="font-medium text-charcoal font-lao">${it.quantity}× ${it.name} [${(it.variant || 'std').toUpperCase()}]</span>
              <p class="text-[10px] text-taupe font-lao">${it.milk || ''} • ຫວານ ${it.sweetness || '100%'} ${it.extraShot ? '• +Shot' : ''}</p>
            </div>
            <span class="font-mono font-medium">$${it.total.toFixed(2)}</span>
          </div>
        `).join('')}
      </div>

      ${order.note && order.note !== 'None' ? `
        <div class="p-2 rounded-lg bg-surface border border-hairline text-[11px] text-charcoal font-lao">
          <strong>ໝາຍເຫດ:</strong> ${order.note}
        </div>
      ` : ''}

      <div class="flex items-center justify-between pt-2 border-t border-hairline text-[12px]">
        <span class="font-mono font-bold text-forest-emerald">Total: $${order.total.toFixed(2)}</span>
        ${order.slipUrl ? `
          <button onclick="viewSlip('${order.slipUrl}', '${order.id}')" class="px-2.5 py-1 rounded-lg bg-forest-leaf/10 text-forest-leaf hover:bg-forest-leaf hover:text-white border border-forest-leaf/30 text-[11px] font-medium flex items-center gap-1 transition-colors">
            <span class="material-symbols-outlined text-[14px]">receipt_long</span>
            <span>ກວດເບິ່ງ Slip</span>
          </button>
        ` : '<span class="text-[10px] text-taupe font-lao">ຊຳລະເງິນສົດ</span>'}
      </div>

      <div class="pt-2 border-t border-hairline flex flex-wrap gap-1.5">
        ${isPending ? `
          <button onclick="updateOrderStatus('${order.id}', 'crafting')" class="flex-1 py-2 rounded-lg bg-forest-emerald text-white text-[11px] uppercase tracking-wider font-semibold hover:bg-forest-leaf transition-colors font-lao shadow-xs">
            ຮັບອໍເດີ້ (Accept)
          </button>
          <button onclick="rejectOrder('${order.id}')" class="px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-[11px] font-semibold transition-colors font-lao">
            ປະຕິເສດ (Reject)
          </button>
        ` : ''}

        ${isCrafting ? `
          <button onclick="sendDelayNotice('${order.id}')" class="px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-[11px] text-amber-900 font-lao">
            +5m ລ່າຊ້າ
          </button>
          <button onclick="updateOrderStatus('${order.id}', 'ready')" class="flex-1 py-2 rounded-lg bg-emerald-800 text-white text-[11px] uppercase tracking-wider font-semibold hover:bg-emerald-900 transition-colors font-lao shadow-xs">
            ເຄື່ອງດື່ມພ້ອມແລ້ວ! (Ready)
          </button>
        ` : ''}

        ${isReady ? `
          <button onclick="updateOrderStatus('${order.id}', 'completed')" class="w-full py-2 rounded-lg bg-primary text-white text-[11px] uppercase tracking-wider font-semibold font-lao hover:bg-primary-dark transition-colors">
            ມອບໃຫ້ລູກຄ້າສຳເລັດ (Complete)
          </button>
        ` : ''}
      </div>
    `;
    container.appendChild(card);
  });
}

// 4. ປະຕິເສດອໍເດີ້ ກໍລະນີສະລິບປອມ
async function rejectOrder(orderId) {
  const reason = prompt("ກະລຸນາໃສ່ເຫດຜົນທີ່ປະຕິເສດອໍເດີ້:", "ໃບສະລິບໂອນເງິນບໍ່ຖືກຕ້ອງ ກະລຸນາຕິດຕໍ່ບາຣິສຕ້າ");
  if (!reason) return;

  if (typeof stopStaffAlarm === 'function') stopStaffAlarm();

  const targetOrder = orders.find(o => o.id === orderId);
  if (targetOrder) {
    targetOrder.status = 'cancelled';
    targetOrder.cancelReason = reason;
  }

  if (typeof isFirebaseReady !== 'undefined' && isFirebaseReady && db) {
    try {
      await db.collection("orders").doc(orderId).update({
        status: 'cancelled',
        cancelReason: reason
      });
      console.log("✅ Order Rejected on Firestore:", orderId);
    } catch (e) {
      console.error(e);
    }
  }

  localStorage.setItem('ladolce_orders', JSON.stringify(orders));
  renderStaffOrders();
  alert(`ອໍເດີ້ ${orderId} ຖືກປະຕິເສດແລ້ວ`);
}

function viewSlip(url, orderId) {
  document.getElementById('slipAuditImage').src = url;
  document.getElementById('slipAuditOrderRef').textContent = "Order ID: " + orderId;
  document.getElementById('slipAuditModal').classList.remove('hidden');
}

function closeSlipAuditModal() {
  document.getElementById('slipAuditModal').classList.add('hidden');
}

// 5. ອັບເດດສະຖານະອໍເດີ້ Real-time
async function updateOrderStatus(orderId, nextStatus) {
  if (typeof stopStaffAlarm === 'function') stopStaffAlarm();

  const targetOrder = orders.find(o => o.id === orderId);
  if (!targetOrder) return;

  targetOrder.status = nextStatus;
  if (nextStatus === 'completed') {
    targetOrder.completedAt = new Date().toISOString();
  }

  if (typeof isFirebaseReady !== 'undefined' && isFirebaseReady && db) {
    try {
      await db.collection("orders").doc(orderId).update({
        status: nextStatus,
        completedAt: nextStatus === 'completed' ? new Date().toISOString() : null
      });
      console.log("✅ Firestore Status Updated Real-time:", orderId, nextStatus);
    } catch (e) {
      console.warn("Firestore update error:", e);
    }
  }

  localStorage.setItem('ladolce_orders', JSON.stringify(orders));
  renderStaffOrders();

  if (nextStatus === 'ready') {
    if (typeof playBoutiqueChime === 'function') playBoutiqueChime(true);
    alert(`ອໍເດີ້ ${orderId} ພ້ອມແລ້ວ! ສົ່ງສຽງກະດິ່ງແຈ້ງເຕືອນລູກຄ້າແລ້ວ`);
  }
}

async function sendDelayNotice(orderId) {
  const targetOrder = orders.find(o => o.id === orderId);
  if (!targetOrder) return;

  targetOrder.delayNotice = "ຄິວຫຼາຍ ຂໍເວລາເພີ່ມ 5 ນາທີ ເພື່ອຄວາມສົດໃໝ່";

  if (typeof isFirebaseReady !== 'undefined' && isFirebaseReady && db) {
    try {
      await db.collection("orders").doc(orderId).update({ delayNotice: targetOrder.delayNotice });
    } catch (e) {}
  }

  localStorage.setItem('ladolce_orders', JSON.stringify(orders));
  renderStaffOrders();
  alert(`ສົ່ງແຈ້ງເຕືອນລ່າຊ້າ +5 ນາທີ ໄປຍັງລູກຄ້າ ${orderId} ແລ້ວ`);
}
