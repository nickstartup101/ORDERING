// ລະບົບ Authentication, Role Switcher (PIN 7878 / 2324)
let isRegisterMode = false;

function openRoleSwitcher() {
  document.getElementById('roleModal').classList.remove('hidden');
}

function closeRoleSwitcher() {
  document.getElementById('roleModal').classList.add('hidden');
}

function verifyRolePin(type) {
  if (type === 'staff') {
    const pin = document.getElementById('staffPinInput').value;
    if (pin === '7878') {
      switchRole('staff');
      closeRoleSwitcher();
      document.getElementById('staffPinInput').value = '';
    } else {
      alert('ລະຫັດ PIN ພະນັກງານບໍ່ຖືກຕ້ອງ! (PIN ແມ່ນ 7878)');
    }
  } else if (type === 'admin') {
    const pin = document.getElementById('adminPinInput').value;
    if (pin === '2324') {
      switchRole('admin');
      closeRoleSwitcher();
      document.getElementById('adminPinInput').value = '';
    } else {
      alert('ລະຫັດ PIN Superadmin ບໍ່ຖືກຕ້ອງ! (PIN ແມ່ນ 2324)');
    }
  }
}

function switchRole(role) {
  currentRole = role;
  closeRoleSwitcher();

  document.getElementById('customerAppView').classList.add('hidden');
  document.getElementById('adminStaffAppView').classList.add('hidden');
  document.getElementById('superAdminAppView').classList.add('hidden');
  document.getElementById('customerBottomNav').classList.add('hidden');

  const roleBadge = document.getElementById('currentRoleBadge');

  if (role === 'customer') {
    document.getElementById('customerAppView').classList.remove('hidden');
    document.getElementById('customerBottomNav').classList.remove('hidden');
    roleBadge.textContent = "Customer View";
    stopStaffAlarm();
  } else if (role === 'staff') {
    document.getElementById('adminStaffAppView').classList.remove('hidden');
    roleBadge.textContent = "Staff Kitchen (7878)";
    renderStaffOrders();
  } else if (role === 'admin') {
    document.getElementById('superAdminAppView').classList.remove('hidden');
    roleBadge.textContent = "SuperAdmin (2324)";
    renderAnalytics();
    renderAdminMenu();
    stopStaffAlarm();
  }
}

function openAuthModal() {
  document.getElementById('authModal').classList.remove('hidden');
}

function closeAuthModal() {
  document.getElementById('authModal').classList.add('hidden');
}

function toggleAuthMode() {
  isRegisterMode = !isRegisterMode;
  const title = document.getElementById('authTitle');
  const subtitle = document.getElementById('authSubtitle');
  const nameField = document.getElementById('authNameField');
  const btnSubmit = document.getElementById('btnAuthSubmit');
  const toggleText = document.getElementById('btnAuthToggleText');

  if (isRegisterMode) {
    title.textContent = "ລົງທະບຽນໃໝ່";
    subtitle.textContent = "ສ້າງບັນຊີເພື່ອສະສົມຄະແນນ ແລະ ຈື່ຈຳເມນູທີ່ມັກ";
    nameField.classList.remove('hidden');
    btnSubmit.textContent = "ລົງທະບຽນ (Sign Up)";
    toggleText.textContent = "ມີບັນຊີແລ້ວ? ເຂົ້າສູ່ລະບົບ";
  } else {
    title.textContent = "ເຂົ້າສູ່ລະບົບ";
    subtitle.textContent = "ລະບຸຕົວຕົນເພື່ອສະສົມຄະແນນ ແລະ ຕິດຕາມອໍເດີ້";
    nameField.classList.add('hidden');
    btnSubmit.textContent = "ເຂົ້າສູ່ລະບົບ (Sign In)";
    toggleText.textContent = "ຍັງບໍ່ມີບັນຊີ? ລົງທະບຽນໃໝ່ທີ່ນີ້";
  }
}

function handleAuthSubmit() {
  const email = document.getElementById('authEmailInput').value || "elena@ladolce.com";
  const name = isRegisterMode 
    ? (document.getElementById('authNameInput').value || "Elena Rostova") 
    : (email.split('@')[0]);

  currentUser = {
    name: name,
    email: email,
    phone: "+856 20 5512 8899"
  };

  localStorage.setItem('ladolce_user', JSON.stringify(currentUser));
  updateAuthUI();
  closeAuthModal();
  showToast(`ຍິນດີຕ້ອນຮັບ, ${currentUser.name}!`);
}

function updateAuthUI() {
  const btnPrompt = document.getElementById('btnLoginPrompt');
  const profileChip = document.getElementById('userProfileChip');
  const avatarText = document.getElementById('avatarText');

  if (currentUser) {
    btnPrompt.classList.add('hidden');
    profileChip.classList.remove('hidden');
    avatarText.textContent = currentUser.name.charAt(0).toUpperCase();
  } else {
    btnPrompt.classList.remove('hidden');
    profileChip.classList.add('hidden');
  }
}

function logoutCustomer() {
  currentUser = null;
  localStorage.removeItem('ladolce_user');
  updateAuthUI();
  renderCustomerProfile();
  showToast("ອອກຈາກລະບົບແລ້ວ");
}
