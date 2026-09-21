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

// Real-time Cloud Firestore Listener (Instant 0.05s)
let previousPendingCount = 0;

function initCloudStream() {
  if (!isFirebaseReady || !db) return;

  // 1. Sync Menu Items ແທ້ຈາກ Firestore
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

  // 2. Sync Orders (ສຽງ & Pop-up ແຍກ Staff vs Customer 100%)
  db.collection("orders").orderBy("createdAt", "desc").onSnapshot(snapshot => {
    if (!snapshot.empty) {
      const remote = [];
      snapshot.forEach(doc => remote.push({ id: doc.id, ...doc.data() }));
      orders = remote;
      localStorage.setItem('ladolce_orders', JSON.stringify(orders));

      // 🔥 ດັກຈັບສະເພາະເຄື່ອງຂອງ Staff / Admin:
      if (currentUser && (currentUser.role === 'staff' || currentUser.role === 'superadmin')) {
        const pendingOrders = orders.filter(o => o.status === 'pending');
        
        // ຖ້າມີອໍເດີ້ pending ໃໝ່ເພີ່ມຂຶ້ນມາ
        if (pendingOrders.length > previousPendingCount) {
          const latest = pendingOrders[0];
          if (typeof triggerStaffIncomingModal === 'function') {
            triggerStaffIncomingModal(latest); // ເດັ້ງ Pop-up ສຳລັບ Staff
          }
          if (typeof startStaffAlarm === 'function') {
            startStaffAlarm(); // ສຽງ Alarm ດັງວົນຊ້ຳສະເພາະ Staff
          }
        } else if (pendingOrders.length === 0) {
          if (typeof stopStaffAlarm === 'function') stopStaffAlarm();
        }
        
        previousPendingCount = pendingOrders.length;
        if (typeof renderStaffOrders === 'function') renderStaffOrders();
      }

      // 🔥 ດັກຈັບສະເພາະປີ້ຂອງລູກຄ້າ:
      if (currentActiveOrder) {
        const live = orders.find(o => o.id === currentActiveOrder.id);
        if (live) {
          // ອໍເດີ້ມີການປ່ຽນແປງສະຖານະ
          if (live.status !== currentActiveOrder.status || live.delayNotice !== currentActiveOrder.delayNotice) {
            currentActiveOrder = live;
            localStorage.setItem('ladolce_active_order', JSON.stringify(currentActiveOrder));
            
            // ຖ້າ Barista ກົດພ້ອມຮັບ (Ready) -> ເດັ້ງ Pop-up ພ້ອມສຽງກະດິ່ງຫາລູກຄ້າ!
            if (live.status === 'ready') {
              if (typeof playChime === 'function') playChime(true);
              showCustomerReadyModal();
            }

            // ຖ້າສຳເລັດແລ້ວ (Completed) -> Clear ປີ້ອອກເພື່ອຍ້າຍໄປ Profile
            if (live.status === 'completed') {
              currentActiveOrder = null;
              localStorage.removeItem('ladolce_active_order');
            }

            if (typeof renderCustomerTicket === 'function') renderCustomerTicket();
          }
        }
      }

      // ອັບເດດຍອດຂາຍປະຈຳວັນ
      if (typeof renderAnalytics === 'function') renderAnalytics();
    }
  }, err => console.warn("Orders stream issue:", err));
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
