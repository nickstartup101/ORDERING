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

// Real-time Cloud Firestore Listener (Instant 0.05s)
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

  // 2. Sync Orders & Repeating Alarm ສຳລັບ Staff
  db.collection("orders").orderBy("createdAt", "desc").onSnapshot(snapshot => {
    if (!snapshot.empty) {
      const remote = [];
      snapshot.forEach(doc => remote.push({ id: doc.id, ...doc.data() }));
      orders = remote;
      localStorage.setItem('ladolce_orders', JSON.stringify(orders));

      // ດັກສຽງເຕືອນ Barista
      if (currentUser && (currentUser.role === 'staff' || currentUser.role === 'superadmin')) {
        const hasPending = orders.some(o => o.status === 'pending');
        if (hasPending) {
          if (typeof startStaffAlarm === 'function') startStaffAlarm();
        } else {
          if (typeof stopStaffAlarm === 'function') stopStaffAlarm();
        }
        if (typeof renderStaffOrders === 'function') renderStaffOrders();
      }

      // Sync ປີ້ລູກຄ້າ Real-time
      if (currentActiveOrder) {
        const live = orders.find(o => o.id === currentActiveOrder.id);
        if (live && live.status !== currentActiveOrder.status) {
          currentActiveOrder = live;
          localStorage.setItem('ladolce_active_order', JSON.stringify(currentActiveOrder));
          if (typeof renderCustomerTicket === 'function') renderCustomerTicket();
          if (live.status === 'ready' && typeof playChime === 'function') playChime(true);
        }
      }

      // ຍອດຂາຍ
      const total = orders.filter(o => o.status === 'completed').reduce((s, o) => s + o.total, 0);
      const totalSalesEl = document.getElementById('metricTotalSales');
      if (totalSalesEl) totalSalesEl.textContent = formatLAK(total);
    }
  }, err => console.warn("Orders stream issue:", err));
}

// Fast App Bootstrap
window.addEventListener('DOMContentLoaded', () => {
  // ໂຫຼດເມນູຂຶ້ນທັນທີ 0.001s
  if (typeof renderMenu === 'function') renderMenu();
  if (typeof updateCartBadges === 'function') updateCartBadges();
  if (typeof updateStoreStatusUI === 'function') updateStoreStatusUI();
  
  if (currentUser && typeof dispatchRoleView === 'function') {
    dispatchRoleView(currentUser.role);
  }

  // Sync Cloud Firestore ຢູ່ Background
  initCloudStream();
});
