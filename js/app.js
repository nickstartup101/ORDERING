// =======================================================
// TAB SWITCHING & DROPDOWN ENGINE
// =======================================================

function switchCustomerTab(tabName) {
  console.log("Switching to tab:", tabName);

  // 1. ເຊື່ອງທຸກ Section
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

  // 2. ເປີດສະເພາະ Section ທີ່ເລືອກ
  const activeTab = document.getElementById(`tab-customer-${tabName}`);
  const activeBtn = document.getElementById(`nav-btn-${tabName}`);

  if (activeTab) {
    activeTab.classList.remove('hidden');
  } else {
    console.error("Tab element not found: tab-customer-" + tabName);
  }

  if (activeBtn) {
    activeBtn.classList.add('text-forest-emerald', 'font-semibold');
    activeBtn.classList.remove('text-taupe');
  }

  // 3. Render ຂໍ້ມູນສະເພາະແຕ່ລະແທັບ
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

// 4. Slide-down Dropdown Handlers
function toggleProfileDropdown(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById('profileDropdownMenu');
  if (menu) {
    menu.classList.toggle('hidden');
  }
}

function closeProfileDropdown() {
  const menu = document.getElementById('profileDropdownMenu');
  if (menu) menu.classList.add('hidden');
}

// ຄລິກພື້ນທີ່ຫວ່າງຂ້າງນອກແລ້ວ Dropdown ພັບເກັບອັດຕະໂນມັດ
document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('profileDropdownMenu');
  const trigger = document.getElementById('userProfileChip');
  if (dropdown && !dropdown.contains(e.target) && trigger && !trigger.contains(e.target)) {
    closeProfileDropdown();
  }
});
