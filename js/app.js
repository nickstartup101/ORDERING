// Reliable Tab Switching Engine
function switchCustomerTab(tabName) {
  const tabs = ['menu', 'cart', 'ticket', 'profile'];
  tabs.forEach(t => {
    const el = document.getElementById(`tab-customer-${t}`);
    const btn = document.getElementById(`nav-btn-${t}`);
    if (el) el.classList.add('hidden');
    if (btn) {
      btn.classList.remove('text-primary', 'font-semibold');
      btn.classList.add('text-taupe');
    }
  });

  const activeTab = document.getElementById(`tab-customer-${tabName}`);
  const activeBtn = document.getElementById(`nav-btn-${tabName}`);
  if (activeTab) activeTab.classList.remove('hidden');
  if (activeBtn) {
    activeBtn.classList.add('text-primary', 'font-semibold');
    activeBtn.classList.remove('text-taupe');
  }

  if (tabName === 'cart') renderCartList();
  if (tabName === 'ticket') renderCustomerTicket();
  if (tabName === 'profile') renderCustomerProfile();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Initial Boot
window.addEventListener('DOMContentLoaded', () => {
  setLanguage(currentLang);
  renderMenu();
  updateCartBadges();
  updateUserSessionUI();

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
