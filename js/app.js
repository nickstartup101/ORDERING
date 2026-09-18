// =======================================================
// LA DOLCE ATELIER — MAIN APP CONTROLLER
// =======================================================

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

window.addEventListener('ladolce_menu_updated', () => {
  if (typeof renderMenu === 'function') renderMenu();
  if (typeof renderAdminMenu === 'function') renderAdminMenu();
  if (typeof renderAnalytics === 'function') renderAnalytics();
});

// Real-time Cloud Synchronization
function initCloudSync() {
  if (typeof isFirebaseReady === 'undefined' || !isFirebaseReady || !db) return;

  // Sync Menu
  db.collection("menu_items").onSnapshot((snapshot) => {
    if (!snapshot.empty) {
      const remoteItems = [];
      snapshot.forEach(doc => remoteItems.push({ id: doc.id, ...doc.data() }));
      menuItems = remoteItems;
      localStorage.setItem('ladolce_menu', JSON.stringify(menuItems));
      
      if (typeof renderMenu === 'function') renderMenu();
      if (typeof renderAdminMenu === 'function') renderAdminMenu();
    }
  }, (err) => console.log("Firestore menu stream:", err));

  // Sync Orders (ພ້ອມດັກສຽງເຕືອນ ແລະ Push Notification ສຳລັບ Staff)
  db.collection("orders").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
    if (!snapshot.empty) {
      const remoteOrders = [];
      snapshot.forEach(doc => remoteOrders.push({ id: doc.id, ...doc.data() }));
      orders = remoteOrders;
      localStorage.setItem('ladolce_orders', JSON.stringify(orders));

      // ດັກຈັບສຳລັບ Staff: ເດັ້ງ Notification ທັນທີເຖິງວ່າຈະພັບແອັບຢູ່
      if (currentUser && (currentUser.role === 'staff' || currentUser.role === 'superadmin')) {
        const pendingOrders = orders.filter(o => o.status === 'pending');
        if (pendingOrders.length > 0) {
          const latestOrder = pendingOrders[0];
          if (typeof triggerBackgroundOrderNotification === 'function') {
            triggerBackgroundOrderNotification(latestOrder);
          }
          if (typeof startStaffAlarm === 'function') {
            startStaffAlarm();
          }
        } else {
          if (typeof stopStaffAlarm === 'function') {
            stopStaffAlarm();
          }
        }
      }

      // Sync ຝັ່ງລູກຄ້າ Real-time (ດັງກະດິ່ງເມື່ອອໍເດີ້ພ້ອມຮັບ)
      if (currentActiveOrder) {
        const liveActive = orders.find(o => o.id === currentActiveOrder.id);
        if (liveActive && liveActive.status !== currentActiveOrder.status) {
          currentActiveOrder = liveActive;
          localStorage.setItem('ladolce_active_order', JSON.stringify(currentActiveOrder));
          
          if (typeof renderCustomerTicket === 'function') renderCustomerTicket();

          if (liveActive.status === 'ready') {
            if (typeof playBoutiqueChime === 'function') playBoutiqueChime(true);
            alert("☕ ເຄື່ອງດື່ມຂອງທ່ານພ້ອມແລ້ວ! ເຊີນຮັບໄດ້ທີ່ Counter 02");
          } else if (liveActive.status === 'cancelled') {
            alert("⚠️ ອໍເດີ້ຂອງທ່ານຖືກຍົກເລີກ: " + (liveActive.cancelReason || "ກະລຸນາຕິດຕໍ່ບາຣິສຕ້າ"));
          }
        }
      }

      if (typeof renderStaffOrders === 'function') renderStaffOrders();
      if (typeof renderAnalytics === 'function') renderAnalytics();
    }
  }, (err) => console.log("Firestore orders stream:", err));
}

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

// Bootstrap
window.addEventListener('DOMContentLoaded', () => {
  const savedUser = localStorage.getItem('ladolce_user');
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      console.log("Session Restored:", currentUser.email, "Role:", currentUser.role);
    } catch (e) {
      currentUser = null;
    }
  }

  if (typeof setLanguage === 'function' && typeof currentLang !== 'undefined') {
    setLanguage(currentLang);
  }

  if (typeof renderMenu === 'function') renderMenu();
  if (typeof updateCartBadges === 'function') updateCartBadges();
  if (typeof updateUserSessionUI === 'function') updateUserSessionUI();
  if (typeof renderPaymentSettings === 'function') renderPaymentSettings();
  if (typeof renderModifierSettings === 'function') renderModifierSettings();
  if (typeof renderCustomerPaymentOptions === 'function') renderCustomerPaymentOptions();
  if (typeof updateStoreStatusUI === 'function') updateStoreStatusUI();
  if (typeof resetSessionTimer === 'function') resetSessionTimer();

  if (currentUser && currentUser.role && typeof dispatchRoleView === 'function') {
    dispatchRoleView(currentUser.role);
  } else if (typeof dispatchRoleView === 'function') {
    dispatchRoleView('customer');
  }

  initCloudSync();

  document.body.addEventListener('click', function unlockAudio() {
    if (typeof getAudioContext === 'function') getAudioContext();
    document.body.removeEventListener('click', unlockAudio);
  }, { once: true });
});
