// =======================================================
// LA DOLCE — REALTIME CLOUD WEBSOCKET STREAM ENGINE
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

// ຕົວແປຈື່ຈຳສະຖານະອໍເດີ້ ເພື່ອບໍ່ໃຫ້ເຕືອນຊ້ຳ
let knownOrderStatuses = {};

// 🔥 REAL-TIME FIRESTORE LISTENER (ເຮັດວຽກທັນທີ 100%)
function startRealtimeCloudEngine() {
  if (!isFirebaseReady || !db) {
    console.warn("Waiting for Firebase...");
    setTimeout(startRealtimeCloudEngine, 500);
    return;
  }

  console.log("⚡ [Firestore Live Stream] Connecting...");

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
  }, err => console.warn("Menu stream issue:", err));

  // 2. 🔥 LIVE SYNC ORDERS (ແກ້ໄຂບໍ່ໃຊ້ orderBy ເພື່ອປ້ອງກັນ Index Error)
  db.collection("orders").onSnapshot(snapshot => {
    const liveOrders = [];
    snapshot.forEach(doc => {
      liveOrders.push({ id: doc.id, ...doc.data() });
    });

    // Sort ຕາມວັນທີຫຼ້າສຸດຢູ່ໃນ Memory ແທນ
    liveOrders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    orders = liveOrders;
    localStorage.setItem('ladolce_orders', JSON.stringify(orders));

    console.log("📡 [Live Orders Received]:", orders.length, "orders");

    // ==========================================
    // 1. ຝັ່ງ STAFF: ດັກຈັບອໍເດີ້ໃໝ່ເຂົ້າມາ (Pending)
    // ==========================================
    if (currentUser && currentUser.role === 'staff') {
      const pendingList = orders.filter(o => o.status === 'pending');

      // ຊອກຫາອໍເດີ້ໃໝ່ທີ່ຍັງບໍ່ທັນໄດ້ແຈ້ງເຕືອນ Staff
      const newOrders = pendingList.filter(o => !knownOrderStatuses[o.id]);

      if (newOrders.length > 0) {
        const latestNewOrder = newOrders[0];
        console.log("🔔 [Staff Push Alert] New Order:", latestNewOrder.id);

        // 1. ດັງສຽງ Alarm ວົນຊ້ຳ
        if (typeof startStaffAlarm === 'function') startStaffAlarm();

        // 2. ເດັ້ງ Pop-up ເຕັມຈໍ Staff
        if (typeof triggerStaffIncomingModal === 'function') {
          triggerStaffIncomingModal(latestNewOrder);
        }

        newOrders.forEach(o => knownOrderStatuses[o.id] = 'pending');
      } else if (pendingList.length === 0) {
        if (typeof stopStaffAlarm === 'function') stopStaffAlarm();
      }

      if (typeof renderStaffOrders === 'function') renderStaffOrders();
    }

    // ==========================================
    // 2. ຝັ່ງ ລູກຄ້າ: ດັກຈັບສະຖານະ READY & COMPLETED
    // ==========================================
    let myPhone = currentUser ? currentUser.phone : null;
    let myEmail = currentUser ? currentUser.email : null;
    if (!myPhone) {
      const guestContact = JSON.parse(localStorage.getItem('ladolce_guest_contact'));
      if (guestContact) myPhone = guestContact.phone;
    }

    // ຊອກຫາອໍເດີ້ທັງໝົດຂອງລູກຄ້າຄົນນີ້
    const myOrders = orders.filter(o => {
      const matchPhone = myPhone && o.customerPhone && (o.customerPhone.replace(/\s+/g, '') === myPhone.replace(/\s+/g, ''));
      const matchEmail = myEmail && o.customerEmail && (o.customerEmail.toLowerCase() === myEmail.toLowerCase());
      return matchPhone || matchEmail;
    });

    myOrders.forEach(order => {
      const prevStatus = knownOrderStatuses[order.id];

      // 🔥 ຖ້າສະຖານະປ່ຽນເປັນ READY -> ເດັ້ງ Pop-up ພ້ອມສຽງກະດິ່ງ Crystal Marimba ທັນທີ!
      if (order.status === 'ready' && prevStatus !== 'ready') {
        knownOrderStatuses[order.id] = 'ready';
        console.log("☕ [Customer Push Alert] Drink Ready for Order:", order.id);

        if (typeof playChime === 'function') playChime(true);
        showCustomerReadyModal();
      } else if (order.status === 'completed') {
        knownOrderStatuses[order.id] = 'completed';
      } else {
        knownOrderStatuses[order.id] = order.status;
      }
    });

    // ອັບເດດໜ້າ Ticket ທັນທີ Real-time
    if (typeof renderCustomerTicket === 'function') {
      renderCustomerTicket();
    }

    // ອັບເດດໜ້າ Profile ທັນທີ Real-time
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

  // ເຊື່ອມຕໍ່ Live Stream ທັນທີ!
  startRealtimeCloudEngine();
});
