// =======================================================
// LA DOLCE — REAL-TIME CLOUD STREAM & AUTO EVENT DISPATCHER
// =======================================================

function showToast(msg, type = 'success') {
  if (typeof showAtelierToast === 'function') {
    showAtelierToast(msg, type);
    return;
  }
  const toast = document.getElementById('atelierToast');
  const text = document.getElementById('toastMsg');
  if (!toast || !text) return;
  text.textContent = msg;
  toast.classList.remove('opacity-0', 'pointer-events-none', '-translate-y-4');
  toast.classList.add('opacity-100', 'translate-y-0');
  setTimeout(() => {
    toast.classList.remove('opacity-100', 'translate-y-0');
    toast.classList.add('opacity-0', 'pointer-events-none', '-translate-y-4');
  }, 2200);
}

function showCustomerReadyModal() {
  document.getElementById('customerReadyModal')?.classList.remove('hidden');
}

function closeCustomerReadyModal() {
  document.getElementById('customerReadyModal')?.classList.add('hidden');
}

function getOrderTimestampMs(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (ts.seconds) return ts.seconds * 1000;
  const parsed = new Date(ts).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

let knownOrderStatuses = {};

function startRealtimeCloudEngine() {
  if (!isFirebaseReady || !db) {
    setTimeout(startRealtimeCloudEngine, 400);
    return;
  }

  console.log("[Firestore Live Stream] Connected");

  // 1. Sync Orders Real-time (ທັງ Staff, Customer ແລະ Admin Analytics)
  db.collection("orders").onSnapshot(snapshot => {
    const liveOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Sort ຕາມ Timestamp ຫຼ້າສຸດຢ່າງຖືກຕ້ອງ
    liveOrders.sort((a, b) => getOrderTimestampMs(b.createdAt) - getOrderTimestampMs(a.createdAt));
    orders = liveOrders;

    // ຝັ່ງ STAFF: ອັບເດດຄິວ + Pop-up + ສຽງແຈ້ງເຕືອນ
    if (currentUser && currentUser.role === 'staff') {
      if (typeof renderStaffOrders === 'function') {
        renderStaffOrders(orders);
      }
    }

    // ຝັ່ງ ລູກຄ້າ: ຫຼິ້ນສຽງກະດິ່ງເມື່ອສະຖານະປ່ຽນເປັນ ready ຫຼື rejected
    const ticketIds = JSON.parse(localStorage.getItem('customer_order_ids') || '[]');
    let myPhone = currentUser ? currentUser.phone : null;
    let myEmail = currentUser ? currentUser.email : null;
    if (!myPhone) {
      const guestContact = JSON.parse(localStorage.getItem('ladolce_guest_contact') || 'null');
      if (guestContact) myPhone = guestContact.phone;
    }

    const myOrders = orders.filter(o => {
      const matchTicket = ticketIds.includes(o.id);
      const matchPhone = myPhone && o.customerPhone && (o.customerPhone.replace(/\s+/g, '') === myPhone.replace(/\s+/g, ''));
      const matchEmail = myEmail && o.customerEmail && (o.customerEmail.toLowerCase() === myEmail.toLowerCase());
      return matchTicket || matchPhone || matchEmail;
    });

    myOrders.forEach(order => {
      const prevStatus = knownOrderStatuses[order.id];
      if (order.status === 'ready' && prevStatus && prevStatus !== 'ready') {
        if (typeof playChime === 'function') playChime(true);
      }
      knownOrderStatuses[order.id] = order.status;
    });

    // ອັບເດດໜ້າ Ticket, Profile ແລະ Admin Analytics
    if (typeof renderCustomerTicket === 'function') renderCustomerTicket();
    if (typeof renderCustomerProfile === 'function') renderCustomerProfile();
    if (typeof renderAnalytics === 'function') renderAnalytics();
  }, err => console.error("Orders Stream Error:", err));
}

// Fast App Bootstrap
window.addEventListener('DOMContentLoaded', () => {
  if (typeof renderMenu === 'function') renderMenu();
  if (typeof updateCartBadge === 'function') updateCartBadge();
  if (typeof updateStoreStatusUI === 'function') updateStoreStatusUI();

  if (currentUser && typeof dispatchRoleView === 'function') {
    dispatchRoleView(currentUser.role);
  }

  startRealtimeCloudEngine();
});
