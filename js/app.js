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

// Pop-up ສຳລັບລູກຄ້າ ເມື່ອເຄື່ອງດື່ມພ້ອມຮັບ
function showCustomerReadyModal() {
  document.getElementById('customerReadyModal')?.classList.remove('hidden');
}

function closeCustomerReadyModal() {
  document.getElementById('customerReadyModal')?.classList.add('hidden');
}

let previousPendingCount = 0;

// Real-time Cloud Firestore Listener
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

  // 2. Sync Orders (ສຽງ & Pop-up ແຍກຢ່າງເຂັ້ມງວດ 100%)
  db.collection("orders").orderBy("createdAt", "desc").onSnapshot(snapshot => {
    if (!snapshot.empty) {
      const remote = [];
      snapshot.forEach(doc => remote.push({ id: doc.id, ...doc.data() }));
      orders = remote;
      localStorage.setItem('ladolce_orders', JSON.stringify(orders));

      // 🔥 1. ສຽງ & Pop-up ເຮັດວຽກສະເພາະເຄື່ອງຂອງ STAFF (BARISTA) ເທົ່ານັ້ນ!
      if (currentUser && currentUser.role === 'staff') {
        const pendingOrders = orders.filter(o => o.status === 'pending');
        
        if (pendingOrders.length > previousPendingCount) {
          const latest = pendingOrders[0];
          // Pop-up ເດັ້ງເຕັມຈໍ Staff
          if (typeof triggerStaffIncomingModal === 'function') {
            triggerStaffIncomingModal(latest);
          }
          // ສຽງ Alarm ດັງວົນຊ້ຳສະເພາະ Staff
          if (typeof startStaffAlarm === 'function') {
            startStaffAlarm();
          }
        } else if (pendingOrders.length === 0) {
          if (typeof stopStaffAlarm === 'function') stopStaffAlarm();
        }
        
        previousPendingCount = pendingOrders.length;
        if (typeof renderStaffOrders === 'function') renderStaffOrders();
      }

      // 🔥 2. ສຽງ & Pop-up ເຮັດວຽກສະເພາະເຄື່ອງຂອງ ລູກຄ້າ:
      if (currentActiveOrder) {
        const live = orders.find(o => o.id === currentActiveOrder.id);
        if (live) {
          // ເມື່ອມີການປ່ຽນແປງສະຖານະ ຫຼື ມີ Delay Alert
          if (live.status !== currentActiveOrder.status || live.delayNotice !== currentActiveOrder.delayNotice) {
            currentActiveOrder = live;
            localStorage.setItem('ladolce_active_order', JSON.stringify(currentActiveOrder));
            
            // ☕ ເຄື່ອງດື່ມພ້ອມຮັບ -> ເດັ້ງ Pop-up ພ້ອມສຽງກະດິ່ງຫາລູກຄ້າ!
            if (live.status === 'ready') {
              if (typeof playChime === 'function') playChime(true);
              showCustomerReadyModal();
            }

            // ✨ ສຳເລັດແລ້ວ -> Clear ປີ້ອອກເພື່ອຍ້າຍໄປ Profile
            if (live.status === 'completed') {
              currentActiveOrder = null;
              localStorage.removeItem('ladolce_active_order');
            }

            if (typeof renderCustomerTicket === 'function') renderCustomerTicket();
          }
        }
      }

      if (typeof renderAnalytics === 'function') renderAnalytics();
    }
  }, err => console.warn("Orders stream:", err));
}

// App Bootstrap
window.addEventListener('DOMContentLoaded', () => {
  if (typeof renderMenu === 'function') renderMenu();
  if (typeof updateCartBadges === 'function') updateCartBadges();
  if (typeof updateStoreStatusUI === 'function') updateStoreStatusUI();
  
  if (currentUser && typeof dispatchRoleView === 'function') {
    dispatchRoleView(currentUser.role);
  }

  initCloudStream();
});
