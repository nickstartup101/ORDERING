// =======================================================
// LA DOLCE ATELIER — MAIN CONTROLLER & APPLICATION BOOTSTRAP
// =======================================================

// 1. ລະບົບປ່ຽນ Tab ໜ້າຈໍລູກຄ້າ (Menu, Cart, Ticket, Profile)
function switchCustomerTab(tabName) {
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

  const activeTab = document.getElementById(`tab-customer-${tabName}`);
  const activeBtn = document.getElementById(`nav-btn-${tabName}`);
  
  if (activeTab) activeTab.classList.remove('hidden');
  if (activeBtn) {
    activeBtn.classList.add('text-forest-emerald', 'font-semibold');
    activeBtn.classList.remove('text-taupe');
  }

  // Render ຂໍ້ມູນສະເພາະແຕ່ລະ Tab ເມື່ອກົດເຂົ້າໄປ
  if (tabName === 'cart' && typeof renderCartList === 'function') {
    renderCartList();
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

// 2. ດັກຟັງການປ່ຽນແປງເມນູ (Broadcast Event) ໃຫ້ Render ທັນທີທັງສອງຝັ່ງ ບໍ່ຕ້ອງກົດ F5
window.addEventListener('ladolce_menu_updated', () => {
  if (typeof renderMenu === 'function') renderMenu();
  if (typeof renderAdminMenu === 'function') renderAdminMenu();
  if (typeof renderAnalytics === 'function') renderAnalytics();
});

// 3. Real-time Synchronization ກັບ Firebase Firestore
function initCloudSync() {
  if (!isFirebaseReady || !db) return;

  // Sync Menu Items ຈາກ Cloud Real-time
  db.collection("menu_items").onSnapshot((snapshot) => {
    if (!snapshot.empty) {
      const remoteItems = [];
      snapshot.forEach(doc => remoteItems.push({ id: doc.id, ...doc.data() }));
      menuItems = remoteItems;
      localStorage.setItem('ladolce_menu', JSON.stringify(menuItems));
      
      if (typeof renderMenu === 'function') renderMenu();
      if (typeof renderAdminMenu === 'function') renderAdminMenu();
    }
  }, (err) => console.log("Firestore menu stream fallback:", err));

  // Sync Orders ຈາກ Cloud Real-time
  db.collection("orders").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
    if (!snapshot.empty) {
      const remoteOrders = [];
      snapshot.forEach(doc => remoteOrders.push({ id: doc.id, ...doc.data() }));
      orders = remoteOrders;
      localStorage.setItem('ladolce_orders', JSON.stringify(orders));

      // ກວດສອບອໍເດີ້ລູກຄ້າປັດຈຸບັນ ເພື່ອດັງກະດິ່ງແຈ້ງເຕືອນ
      if (currentUser && currentActiveOrder) {
        const liveActive = orders.find(o => o.id === currentActiveOrder.id);
        if (liveActive && liveActive.status !== currentActiveOrder.status) {
          currentActiveOrder = liveActive;
          localStorage.setItem('ladolce_active_order', JSON.stringify(currentActiveOrder));
          
          if (typeof renderCustomerTicket === 'function') renderCustomerTicket();

          if (liveActive.status === 'ready') {
            if (typeof playBoutiqueChime === 'function') playBoutiqueChime(true);
            if (typeof showAtelierAlert === 'function') {
              showAtelierAlert({
                title: "ເຄື່ອງດື່ມພ້ອມແລ້ວ! ☕",
                message: "ເຄື່ອງດື່ມຂອງທ່ານພ້ອມແລ້ວ! ເຊີນຮັບໄດ້ທີ່ Counter 02 Downtown Roastery",
                type: "success"
              });
            }
          }
        }
      }

      if (typeof renderStaffOrders === 'function') renderStaffOrders();
      if (typeof renderAnalytics === 'function') renderAnalytics();
    }
  }, (err) => console.log("Firestore orders stream fallback:", err));
}

// 4. Floating Toast Notification ສຳຮອງ
function showToast(msg) {
  const toast = document.getElementById('toast');
  const text = document.getElementById('toastMsg');
  if (!toast || !text) return;

  text.textContent = msg;
  toast.classList.remove('opacity-0', 'pointer-events-none', '-translate-y-2');
  toast.classList.add('opacity-100', 'translate-y-0');

  setTimeout(() => {
    toast.classList.remove('opacity-100', 'translate-y-0');
    toast.classList.add('opacity-0', 'pointer-events-none', '-translate-y-2');
  }, 2500);
}

// 5. APPLICATION BOOTSTRAP (ເລີ່ມຕົ້ນການເຮັດວຽກເມື່ອເປີດໜ້າເວັບ)
window.addEventListener('DOMContentLoaded', () => {
  // ກູ້ຄືນ Session ເກົ່າທີ່ເຄີຍ Login ໄວ້ (ແກ້ໄຂບັນຫາ F5 ແລ້ວຫຼຸດອອກຈາກລະບົບ)
  const savedUser = localStorage.getItem('ladolce_user');
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      console.log("Session Restored:", currentUser.email, "Role:", currentUser.role);
    } catch (e) {
      currentUser = null;
    }
  }

  // ໂຫຼດພາສາທີ່ຕັ້ງໄວ້
  if (typeof setLanguage === 'function' && typeof currentLang !== 'undefined') {
    setLanguage(currentLang);
  }

  // Render ສ່ວນປະກອບຫຼັກທັງໝົດ
  if (typeof renderMenu === 'function') renderMenu();
  if (typeof updateCartBadges === 'function') updateCartBadges();
  if (typeof updateUserSessionUI === 'function') updateUserSessionUI();
  if (typeof renderPaymentSettings === 'function') renderPaymentSettings();
  if (typeof renderModifierSettings === 'function') renderModifierSettings();
  if (typeof renderCustomerPaymentOptions === 'function') renderCustomerPaymentOptions();
  if (typeof updateStoreStatusUI === 'function') updateStoreStatusUI();
  if (typeof resetSessionTimer === 'function') resetSessionTimer();

  // ນຳທາງເຂົ້າໜ້າ Dashboard ຕາມ Role ທີ່ Login ຄ້າງໄວ້ທັນທີ
  if (currentUser && currentUser.role && typeof dispatchRoleView === 'function') {
    dispatchRoleView(currentUser.role);
  } else if (typeof dispatchRoleView === 'function') {
    dispatchRoleView('customer');
  }

  // ເລີ່ມຕົ້ນ Cloud Sync
  initCloudSync();

  // ປົດລັອກສຽງ Web Audio API ເມື່ອມີການແຕະໜ້າຈໍເທື່ອທຳອິດ
  document.body.addEventListener('click', function unlockAudio() {
    if (typeof getAudioContext === 'function') getAudioContext();
    document.body.removeEventListener('click', unlockAudio);
  }, { once: true });
});
