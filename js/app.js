// =======================================================
// APPLICATION ORCHESTRATION & CLOUD STREAM ENGINE
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

let previousPendingCount = 0;

// 🔥 Real-time Cloud Stream Sync (ແກ້ໄຂ Pop-up Ready ໃຫ້ເດັ້ງຫາລູກຄ້າ 100%)
function initCloudStream() {
  if (!isFirebaseReady || !db) return;

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
  }, err => console.warn("Menu stream:", err));

  // 2. Sync Orders Real-time
  db.collection("orders").orderBy("createdAt", "desc").onSnapshot(snapshot => {
    if (!snapshot.empty) {
      const remote = [];
      snapshot.forEach(doc => remote.push({ id: doc.id, ...doc.data() }));
      orders = remote;
      localStorage.setItem('ladolce_orders', JSON.stringify(orders));

      // 🔥 ດັກຈັບສະເພາະ Staff
      if (currentUser && currentUser.role === 'staff') {
        const pendingOrders = orders.filter(o => o.status === 'pending');
        if (pendingOrders.length > previousPendingCount) {
          const latest = pendingOrders[0];
          if (typeof triggerStaffIncomingModal === 'function') triggerStaffIncomingModal(latest);
          if (typeof startStaffAlarm === 'function') startStaffAlarm();
        } else if (pendingOrders.length === 0) {
          if (typeof stopStaffAlarm === 'function') stopStaffAlarm();
        }
        previousPendingCount = pendingOrders.length;
        if (typeof renderStaffOrders === 'function') renderStaffOrders();
      }

      // 🔥 ດັກຈັບສະເພາະ ລູກຄ້າ (ແຈ້ງເຕືອນ Ready Real-time)
      let myPhone = currentUser ? currentUser.phone : null;
      let myEmail = currentUser ? currentUser.email : null;
      if (!myPhone) {
        const guestContact = JSON.parse(localStorage.getItem('ladolce_guest_contact'));
        if (guestContact) myPhone = guestContact.phone;
      }

      // ຊອກຫາອໍເດີ້ຂອງລູກຄ້າຄົນນີ້
      const myLiveOrders = orders.filter(o => 
        (myPhone && o.customerPhone === myPhone) || (myEmail && o.customerEmail === myEmail)
      );

      myLiveOrders.forEach(liveOrder => {
        // ກວດສອບອໍເດີ້ທີ່ຫາກໍ່ປ່ຽນເປັນ Ready
        const cachedStatus = localStorage.getItem('order_status_' + liveOrder.id);
        if (liveOrder.status === 'ready' && cachedStatus !== 'ready') {
          localStorage.setItem('order_status_' + liveOrder.id, 'ready');
          if (typeof playChime === 'function') playChime(true); // ສຽງ Crystal Marimba ດັງທັນທີ!
          showCustomerReadyModal(); // Pop-up ເດັ້ງທັນທີ!
        }
      });

      // Render Ticket ທັນທີ
      if (typeof renderCustomerTicket === 'function') {
        renderCustomerTicket();
      }

      if (typeof renderAnalytics === 'function') renderAnalytics();
    }
  }, err => console.warn("Orders stream:", err));
}

// Fast App Bootstrap
window.addEventListener('DOMContentLoaded', () => {
  if (typeof renderMenu === 'function') renderMenu();
  if (typeof updateCartBadges === 'function') updateCartBadges();
  if (typeof updateStoreStatusUI === 'function') updateStoreStatusUI();
  
  if (currentUser && typeof dispatchRoleView === 'function') {
    dispatchRoleView(currentUser.role);
  }

  initCloudStream();
});
