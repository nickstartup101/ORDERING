// =======================================================
// LA DOLCE — FULL CLOUD FIRESTORE REALTIME SYNC ENGINE
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

// ດຶງຂໍ້ມູນ Cloud Firestore ແບບ Real-time Snapshot ທັງ 3 Collections
function initCloudStream() {
  if (typeof isFirebaseReady === 'undefined' || !isFirebaseReady || !db) {
    console.warn("Firestore not ready, using local data.");
    return;
  }

  console.log("🚀 Starting Cloud Firestore Live Stream...");

  // 1. ດຶງ Collection 'menu_items' (ເມນູສິນຄ້າສົດໆຈາກ Cloud)
  db.collection("menu_items").onSnapshot(snapshot => {
    if (!snapshot.empty) {
      const remoteMenu = [];
      snapshot.forEach(doc => remoteMenu.push({ id: doc.id, ...doc.data() }));
      menuItems = remoteMenu;
      localStorage.setItem('ladolce_menu', JSON.stringify(menuItems));
      console.log(`📦 Synced ${menuItems.length} menu items from Firestore`);
      
      if (typeof renderMenu === 'function') renderMenu();
      if (typeof renderAdminMenu === 'function') renderAdminMenu();
    } else {
      console.log("No menu_items on cloud, using local fallback");
      if (typeof renderMenu === 'function') renderMenu();
    }
  }, err => console.error("Menu stream error:", err));

  // 2. ດຶງ Collection 'orders' (ອໍເດີ້ທັງໝົດ ແລະ ດັກສຽງເຕືອນ Barista)
  db.collection("orders").orderBy("createdAt", "desc").onSnapshot(snapshot => {
    if (!snapshot.empty) {
      const remoteOrders = [];
      snapshot.forEach(doc => remoteOrders.push({ id: doc.id, ...doc.data() }));
      orders = remoteOrders;
      localStorage.setItem('ladolce_orders', JSON.stringify(orders));
      console.log(`📑 Synced ${orders.length} orders from Firestore`);

      // ດັກຈັບ: ຖ້າມີອໍເດີ້ pending ໃໝ່ -> ສັ່ງສຽງເຕືອນ Staff ທັນທີ
      if (currentUser && (currentUser.role === 'staff' || currentUser.role === 'superadmin')) {
        const hasPending = orders.some(o => o.status === 'pending');
        if (hasPending) {
          if (typeof startStaffAlarm === 'function') startStaffAlarm();
        } else {
          if (typeof stopStaffAlarm === 'function') stopStaffAlarm();
        }
        if (typeof renderStaffOrders === 'function') renderStaffOrders();
      }

      // Sync ຫາປີ້ຂອງລູກຄ້າ Real-time
      if (currentActiveOrder) {
        const live = orders.find(o => o.id === currentActiveOrder.id);
        if (live && live.status !== currentActiveOrder.status) {
          currentActiveOrder = live;
          localStorage.setItem('ladolce_active_order', JSON.stringify(currentActiveOrder));
          if (typeof renderCustomerTicket === 'function') renderCustomerTicket();
          if (live.status === 'ready' && typeof playChime === 'function') playChime(true);
        }
      }

      // ຄິດໄລ່ຍອດຂາຍລວມ (LAK)
      const completed = orders.filter(o => o.status === 'completed');
      const totalRevenue = completed.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      const metricEl = document.getElementById('metricTotalSales');
      if (metricEl) metricEl.textContent = formatLAK(totalRevenue);
    }
  }, err => console.error("Orders stream error:", err));

  // 3. ດຶງ Collection 'users' (ລາຍຊື່ຜູ້ໃຊ້ສຳລັບ Superadmin)
  db.collection("users").onSnapshot(snapshot => {
    if (!snapshot.empty) {
      const remoteUsers = [];
      snapshot.forEach(doc => remoteUsers.push({ id: doc.id, ...doc.data() }));
      cloudUsers = remoteUsers;
      console.log(`👥 Synced ${cloudUsers.length} users from Firestore`);
      if (typeof renderUsersList === 'function') renderUsersList();
    }
  }, err => console.error("Users stream error:", err));
}

// Bootstrap
window.addEventListener('DOMContentLoaded', () => {
  // Render ທັນທີຈາກ Cache
  if (typeof renderMenu === 'function') renderMenu();
  if (typeof updateCartBadges === 'function') updateCartBadges();
  if (typeof updateStoreStatusUI === 'function') updateStoreStatusUI();
  
  if (currentUser && typeof dispatchRoleView === 'function') {
    dispatchRoleView(currentUser.role);
  }

  // ເຊື່ອມຕໍ່ Cloud Stream ສົດໆ
  initCloudStream();
});
