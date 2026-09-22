// =======================================================
// APPLICATION ORCHESTRATION & LIVE FIRESTORE STREAM ENGINE
// =======================================================

function showToast(msg) {
  const toast = document.getElementById('atelierToast');
  const text = document.getElementById('toastMsg');
  if (!toast || !text) return;
  text.textContent = msg;
  toast.classList.remove('opacity-0', 'pointer-events-none', '-translate-y-2');
  toast.classList.add('opacity-100', 'translate-y-0');
  setTimeout(() => {
    toast.classList.remove('opacity-100', 'translate-y-0');
    toast.classList.add('opacity-0', 'pointer-events-none', '-translate-y-2');
  }, 1800);
}

function showCustomerReadyModal() {
  document.getElementById('customerReadyModal')?.classList.remove('hidden');
}

function closeCustomerReadyModal() {
  document.getElementById('customerReadyModal')?.classList.add('hidden');
}

let previousPendingOrders = new Set();
let notifiedReadyOrders = new Set();

// 🔥 GLOBAL REAL-TIME FIRESTORE LISTENER (ເຊື່ອມຕໍ່ທັນທີຕອນເປີດແອັບ)
function startRealtimeCloudEngine() {
  if (!isFirebaseReady || !db) {
    console.warn("Firebase not ready yet, retrying in 500ms...");
    setTimeout(startRealtimeCloudEngine, 500);
    return;
  }

  console.log("⚡ [Realtime Engine] Live WebSocket Connected!");

  // 1. Sync Menu Items
  db.collection("menu_items").onSnapshot(snapshot => {
    if (!snapshot.empty) {
      const remoteMenu = [];
      snapshot.forEach(doc => remoteMenu.push({ id: doc.id, ...doc.data() }));
      menuItems = remoteMenu;
      localStorage.setItem('ladolce_menu', JSON.stringify(menuItems));
      if (typeof renderMenu === 'function') renderMenu();
      if (typeof renderAdminMenu === 'function') renderAdminMenu();
    }
  }, err => console.error("Menu stream error:", err));

  // 2. 🔥 Sync Orders Real-time ແທ້ 100% (ທັງ Staff ແລະ ລູກຄ້າ)
  db.collection("orders").orderBy("createdAt", "desc").onSnapshot(snapshot => {
    const liveOrders = [];
    snapshot.forEach(doc => liveOrders.push({ id: doc.id, ...doc.data() }));
    orders = liveOrders;
    localStorage.setItem('ladolce_orders', JSON.stringify(orders));

    console.log("📡 [Live Orders Stream] Received", orders.length, "orders from Firestore");

    // ==========================================
    // 1. ຝັ່ງ STAFF: ດັກຈັບອໍເດີ້ໃໝ່ (Pending)
    // ==========================================
    if (currentUser && currentUser.role === 'staff') {
      const pendingList = orders.filter(o => o.status === 'pending');
      const newOrders = pendingList.filter(o => !previousPendingOrders.has(o.id));

      if (newOrders.length > 0) {
        const latestNewOrder = newOrders[0];
        console.log("🔔 [Staff Alert] New Incoming Order:", latestNewOrder.id);
        
        // ສຽງ Alarm ດັງວົນຊ້ຳ
        if (typeof startStaffAlarm === 'function') startStaffAlarm();
        
        // Pop-up ເດັ້ງເຕັມຈໍ Staff
        if (typeof triggerStaffIncomingModal === 'function') {
          triggerStaffIncomingModal(latestNewOrder);
        }

        newOrders.forEach(o => previousPendingOrders.add(o.id));
      } else if (pendingList.length === 0) {
        if (typeof stopStaffAlarm === 'function') stopStaffAlarm();
      }

      if (typeof renderStaffOrders === 'function') renderStaffOrders();
    }

    // ==========================================
    // 2. ຝັ່ງ ລູກຄ້າ: ດັກຈັບສະຖານະ Ready & Completed
    // ==========================================
    let myPhone = currentUser ? currentUser.phone : null;
    let myEmail = currentUser ? currentUser.email : null;
    if (!myPhone) {
      const guestContact = JSON.parse(localStorage.getItem('ladolce_guest_contact'));
      if (guestContact) myPhone = guestContact.phone;
    }

    const myCurrentOrders = orders.filter(o => 
      (myPhone && o.customerPhone === myPhone) || (myEmail && o.customerEmail === myEmail)
    );

    myCurrentOrders.forEach(myOrder => {
      // ຖ້າ Staff ກົດ Ready ແລ້ວ -> ເດັ້ງ Pop-up ພ້ອມສຽງ Crystal Marimba ຫາລູກຄ້າທັນທີ!
      if (myOrder.status === 'ready' && !notifiedReadyOrders.has(myOrder.id)) {
        notifiedReadyOrders.add(myOrder.id);
        console.log("☕ [Customer Alert] Drink Ready for Order:", myOrder.id);
        
        if (typeof playChime === 'function') playChime(true);
        showCustomerReadyModal();
      }
    });

    // ອັບເດດໜ້າ Ticket ທັນທີ Real-time ໂດຍບໍ່ຕ້ອງ Refresh
    if (typeof renderCustomerTicket === 'function') {
      renderCustomerTicket();
    }

    // ອັບເດດໜ້າ Profile ທັນທີ
    if (typeof renderCustomerProfile === 'function') {
      renderCustomerProfile();
    }

    // ອັບເດດຍອດຂາຍ
    if (typeof renderAnalytics === 'function') renderAnalytics();

  }, err => console.error("Orders Stream Error:", err));
}

// Fast App Bootstrap
window.addEventListener('DOMContentLoaded', () => {
  if (typeof renderMenu === 'function') renderMenu();
  if (typeof updateCartBadges === 'function') updateCartBadges();
  if (typeof updateStoreStatusUI === 'function') updateStoreStatusUI();
  
  if (currentUser && typeof dispatchRoleView === 'function') {
    dispatchRoleView(currentUser.role);
  }

  // ເຊື່ອມຕໍ່ Realtime Stream ທັນທີຕອນເປີດແອັບ
  startRealtimeCloudEngine();
});
