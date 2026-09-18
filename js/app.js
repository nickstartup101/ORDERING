// ==========================================
// APPLICATION ORCHESTRATION
// ==========================================

// ຟັງ Event ເມື່ອມີການເພີ່ມ/ແກ້ໄຂ/ລົບ ເມນູ ໃຫ້ Render ທັນທີທັງສອງຝັ່ງ
window.addEventListener('ladolce_menu_updated', () => {
  renderMenu();
  renderAdminMenu();
  renderAnalytics();
});

// Sync Firestore Real-time Snapshots
function initCloudSync() {
  if (!isFirebaseReady || !db) return;

  // Sync Menu Items
  db.collection("menu_items").onSnapshot((snapshot) => {
    if (!snapshot.empty) {
      const remoteItems = [];
      snapshot.forEach(doc => remoteItems.push({ id: doc.id, ...doc.data() }));
      menuItems = remoteItems;
      localStorage.setItem('ladolce_menu', JSON.stringify(menuItems));
      renderMenu();
      renderAdminMenu();
    }
  }, (err) => console.log("Firestore menu stream fallback:", err));

  // Sync Orders
  db.collection("orders").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
    if (!snapshot.empty) {
      const remoteOrders = [];
      snapshot.forEach(doc => remoteOrders.push({ id: doc.id, ...doc.data() }));
      orders = remoteOrders;
      localStorage.setItem('ladolce_orders', JSON.stringify(orders));

      // ກວດສອບອໍເດີ້ລູກຄ້າປັດຈຸບັນ
      if (currentUser && currentActiveOrder) {
        const liveActive = orders.find(o => o.id === currentActiveOrder.id);
        if (liveActive && liveActive.status !== currentActiveOrder.status) {
          currentActiveOrder = liveActive;
          localStorage.setItem('ladolce_active_order', JSON.stringify(currentActiveOrder));
          renderCustomerTicket();
          if (liveActive.status === 'ready') {
            playBoutiqueChime(true);
            showAtelierAlert({
              title: "ເຄື່ອງດື່ມພ້ອມແລ້ວ! ☕",
              message: "ເຄື່ອງດື່ມຂອງທ່ານພ້ອມແລ້ວ! ເຊີນຮັບໄດ້ທີ່ Counter 02 Downtown Roastery",
              type: "success"
            });
          }
        }
      }

      renderStaffOrders();
      renderAnalytics();
    }
  }, (err) => console.log("Firestore orders stream fallback:", err));
}

// Bootstrap
window.addEventListener('DOMContentLoaded', () => {
  renderMenu();
  updateCartBadges();
  updateUserSessionUI();
  renderPaymentSettings();
  renderModifierSettings();
  renderCustomerPaymentOptions();
  updateStoreStatusUI();
  resetSessionTimer();
  initCloudSync();

  if (currentUser) {
    dispatchRoleView(currentUser.role);
  } else {
    dispatchRoleView('customer');
  }

  // Audio Context Unlock
  document.body.addEventListener('click', function unlock() {
    getAudioContext();
    document.body.removeEventListener('click', unlock);
  }, { once: true });
});
