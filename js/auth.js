// Secure Login & Registration without exposed PINs
function openAuthModal() {
  document.getElementById('authModal').classList.remove('hidden');
}

function closeAuthModal() {
  document.getElementById('authModal').classList.add('hidden');
}

let isRegisterMode = false;
function toggleAuthMode() {
  isRegisterMode = !isRegisterMode;
  const nameBox = document.getElementById('authNameBox');
  const title = document.getElementById('authModalTitle');
  const btn = document.getElementById('btnAuthSubmit');
  const toggle = document.getElementById('authToggleText');

  if (isRegisterMode) {
    nameBox.classList.remove('hidden');
    title.textContent = t('register');
    btn.textContent = t('register');
    toggle.textContent = "Already have an account? Sign In";
  } else {
    nameBox.classList.add('hidden');
    title.textContent = t('login');
    btn.textContent = t('login');
    toggle.textContent = "New customer? Create an account";
  }
}

function handleAuthSubmit() {
  const emailInput = document.getElementById('authEmail').value.trim();
  const passInput = document.getElementById('authPassword').value.trim();
  const nameInput = document.getElementById('authName').value.trim();

  if (!emailInput || !passInput) {
    alert("ກະລຸນາປ້ອນອີເມວ ແລະ ລະຫັດຜ່ານ!");
    return;
  }

  if (isRegisterMode) {
    const existing = userAccounts.find(u => u.email.toLowerCase() === emailInput.toLowerCase());
    if (existing) {
      alert("ອີເມວນີ້ມີໃນລະບົບແລ້ວ!");
      return;
    }

    const newUser = {
      email: emailInput,
      password: passInput,
      name: nameInput || "Valued Customer",
      role: "customer",
      phone: "+856 20 " + Math.floor(10000000 + Math.random() * 90000000)
    };

    userAccounts.push(newUser);
    localStorage.setItem('ladolce_accounts', JSON.stringify(userAccounts));
    currentUser = newUser;
  } else {
    // Authenticate
    const user = userAccounts.find(u => 
      u.email.toLowerCase() === emailInput.toLowerCase() && u.password === passInput
    );

    if (!user) {
      alert("ອີເມວ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ!");
      return;
    }
    currentUser = user;
  }

  localStorage.setItem('ladolce_user', JSON.stringify(currentUser));
  closeAuthModal();
  updateUserSessionUI();
  dispatchRoleView(currentUser.role);
  showToast(`Welcome, ${currentUser.name}`);
}

function logoutUser() {
  currentUser = null;
  localStorage.removeItem('ladolce_user');
  updateUserSessionUI();
  dispatchRoleView('customer');
  showToast("ອອກຈາກລະບົບແລ້ວ");
}

function dispatchRoleView(role) {
  const customerView = document.getElementById('customerAppView');
  const staffView = document.getElementById('adminStaffAppView');
  const superAdminView = document.getElementById('superAdminAppView');
  const bottomNav = document.getElementById('customerBottomNav');
  const roleBadge = document.getElementById('currentRoleBadge');

  customerView.classList.add('hidden');
  staffView.classList.add('hidden');
  superAdminView.classList.add('hidden');
  bottomNav.classList.add('hidden');

  if (role === 'staff') {
    staffView.classList.remove('hidden');
    roleBadge.textContent = "Barista Display";
    renderStaffOrders();
  } else if (role === 'superadmin') {
    superAdminView.classList.remove('hidden');
    roleBadge.textContent = "SuperAdmin Suite";
    renderAnalytics();
    renderAdminMenu();
    renderModifierSettings();
  } else {
    customerView.classList.remove('hidden');
    bottomNav.classList.remove('hidden');
    roleBadge.textContent = "Customer View";
    switchCustomerTab('menu');
  }
}

function updateUserSessionUI() {
  const btnLogin = document.getElementById('btnLoginHeader');
  const userChip = document.getElementById('userProfileChip');
  const avatarTxt = document.getElementById('avatarText');

  if (currentUser) {
    btnLogin.classList.add('hidden');
    userChip.classList.remove('hidden');
    avatarTxt.textContent = currentUser.name.charAt(0).toUpperCase();
  } else {
    btnLogin.classList.remove('hidden');
    userChip.classList.add('hidden');
  }
}
