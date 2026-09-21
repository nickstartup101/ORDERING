// =======================================================
// APPLICATION ROUTER & TAB SWITCHING CONTROLLER
// =======================================================

function switchCustomerTab(tabName) {
  console.log("Navigating to:", tabName);

  // 1. ເຊື່ອງທຸກແທັບ
  const tabs = ['menu', 'cart', 'ticket', 'profile'];
  tabs.forEach(t => {
    const el = document.getElementById(`tab-customer-${t}`);
    const btn = document.getElementById(`nav-btn-${t}`);
    if (el) el.classList.add('hidden');
    if (btn) {
      btn.classList.remove('text-forest-emerald', 'font-semibold');
      btn.classList.add('text-taupe');
    }
  });

  // 2. ເປີດສະເພາະແທັບທີ່ເລືອກ
  const activeTab = document.getElementById(`tab-customer-${tabName}`);
  const activeBtn = document.getElementById(`nav-btn-${tabName}`);

  if (activeTab) {
    activeTab.classList.remove('hidden');
  }

  if (activeBtn) {
    activeBtn.classList.add('text-forest-emerald', 'font-semibold');
    activeBtn.classList.remove('text-taupe');
  }

  // 3. Render ຂໍ້ມູນແຕ່ລະແທັບ
  if (tabName === 'menu' && typeof renderMenu === 'function') {
    renderMenu();
  }
  if (tabName === 'cart') {
    if (typeof renderCartList === 'function') renderCartList();
    if (typeof renderCustomerPaymentOptions === 'function') renderCustomerPaymentOptions();
  }
  if (tabName === 'ticket' && typeof renderCustomerTicket === 'function') {
    renderCustomerTicket();
  }
  if (tabName === 'profile' && typeof renderCustomerProfile === 'function') {
    renderCustomerProfile();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Global Toast
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

// Cloud Real-time Listener
function initCloudStream() {
  if (!isFirebaseReady || !db) return;

  // 1. Sync Menu
  db.collection("menu_items").onSnapshot(snapshot => {
    if (!snapshot.empty) {
      const remoteMenu = [];
      snapshot.forEach(doc => remoteMenu.push({ id: doc.id, ...doc.data() }));
      menuItems = remoteMenu;
      localStorage.setItem('ladolce_menu', JSON.stringify(menuItems));
      if (typeof renderMenu === 'function') renderMenu();
      if (typeof renderAdminMenu === 'function') renderAdminMenu();
    }
  }, err => console.warn(err));

  // 2. Sync Orders & Staff Alarm
  db.collection("orders").orderBy("createdAt", "desc").onSnapshot(snapshot => {
    if (!snapshot.empty) {
      const remote = [];
      snapshot.forEach(doc => remote.push({ id: doc.id, ...doc.data() }));
      orders = remote;
      localStorage.setItem('ladolce_orders', JSON.stringify(orders));

      if (currentUser && (currentUser.role === 'staff' || currentUser.role === 'superadmin')) {
        const hasPending = orders.some(o => o.status === 'pending');
        if (hasPending) {
          if (typeof startStaffAlarm === 'function') startStaffAlarm();
        } else {
          if (typeof stopStaffAlarm === 'function') stopStaffAlarm();
        }
        if (typeof renderStaffOrders === 'function') renderStaffOrders();
      }

      if (currentActiveOrder) {
        const live = orders.find(o => o.id === currentActiveOrder.id);
        if (live && live.status !== currentActiveOrder.status) {
          currentActiveOrder = live;
          localStorage.setItem('ladolce_active_order', JSON.stringify(currentActiveOrder));
          if (typeof renderCustomerTicket === 'function') renderCustomerTicket();
          if (live.status === 'ready' && typeof playChime === 'function') playChime(true);
        }
      }

      const total = orders.filter(o => o.status === 'completed').reduce((s, o) => s + o.total, 0);
      const totalSalesEl = document.getElementById('metricTotalSales');
      if (totalSalesEl) totalSalesEl.textContent = formatLAK(total);
    }
  }, err => console.warn(err));
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
