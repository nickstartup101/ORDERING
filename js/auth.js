// =======================================================
// AUTHENTICATION, ROLES & DROPDOWN ENGINE
// =======================================================

let isRegisterMode = false;
let sessionTimer = null;
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 ນາທີ

function openAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.remove('hidden');
}

function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.add('hidden');
}

function toggleAuthMode() {
  isRegisterMode = !isRegisterMode;
  document.getElementById('authNameBox')?.classList.toggle('hidden', !isRegisterMode);
  document.getElementById('authModalTitle').textContent = isRegisterMode ? "ລົງທະບຽນ" : "ເຂົ້າສູ່ລະບົບ";
  document.getElementById('btnAuthSubmit').textContent = isRegisterMode ? "Sign Up" : "Sign In";
}

function resetSessionTimer() {
  if (sessionTimer) clearTimeout(sessionTimer);
  if (currentUser) {
    sessionTimer = setTimeout(() => {
      autoLogoutSession();
    }, SESSION_TIMEOUT_MS);
  }
}

['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'].forEach(evt => {
  document.addEventListener(evt, resetSessionTimer, { passive: true });
});

function autoLogoutSession() {
  if (!currentUser) return;
  currentUser = null;
  localStorage.removeItem('ladolce_user');
  updateUserSessionUI();
  dispatchRoleView('customer');
  alert("ໝົດເວລາເຊດຊັນ 30 ນາທີ ລະບົບໄດ້ອອກຈາກລະບົບອັດຕະໂນມັດ");
}

async function handleAuthSubmit() {
  const email = document.getElementById('authEmail')?.value.trim();
  const pass = document.getElementById('authPassword')?.value.trim();
  const name = document.getElementById('authName')?.value.trim();

  if (!email || !pass) {
    alert("ກະລຸນາປ້ອນອີເມວ ແລະ ລະຫັດຜ່ານ!");
    return;
  }

  showToast("ກຳລັງກວດສອບ...");

  if (isRegisterMode) {
    const newUser = {
      email: email,
      password: pass,
      name: name || "Customer",
      role: "customer",
      phone: "+856 20 " + Math.floor(10000000 + Math.random() * 90000000),
      beans: 50,
      createdAt: new Date().toISOString()
    };

    if (isFirebaseReady && db) {
      try {
        await db.collection("users").doc(email).set(newUser, { merge: true });
        console.log("Registered to Firestore:", email);
      } catch (e) {
        console.warn(e);
      }
    }

    currentUser = newUser;
    localStorage.setItem('ladolce_user', JSON.stringify(currentUser));
    closeAuthModal();
    dispatchRoleView(currentUser.role);
    showToast("ລົງທະບຽນສຳເລັດ!");
  } else {
    let authenticatedUser = null;

    if (isFirebaseReady && db) {
      try {
        const doc = await db.collection("users").doc(email).get();
        if (doc.exists) {
          const userData = doc.data();
          if (userData.password === pass) {
            authenticatedUser = userData;
          }
        }
      } catch (cloudErr) {
        console.warn("Firestore fetch issue:", cloudErr);
      }
    }

    if (!authenticatedUser && typeof REGISTERED_ACCOUNTS !== 'undefined') {
      const matched = REGISTERED_ACCOUNTS.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === pass);
      if (matched) authenticatedUser = matched;
    }

    if (!authenticatedUser) {
      alert("Email ຫຼື Password ບໍ່ຖືກຕ້ອງ!");
      return;
    }

    currentUser = authenticatedUser;
    localStorage.setItem('ladolce_user', JSON.stringify(currentUser));
    resetSessionTimer();
    closeAuthModal();
    dispatchRoleView(currentUser.role);
    showToast(`ຍິນດີຕ້ອນຮັບ, ${currentUser.name}!`);
  }
}

function logoutUser() {
  currentUser = null;
  localStorage.removeItem('ladolce_user');
  if (sessionTimer) clearTimeout(sessionTimer);
  dispatchRoleView('customer');
  showToast("ອອກຈາກລະບົບແລ້ວ");
}

function dispatchRoleView(role) {
  document.getElementById('customerAppView')?.classList.toggle('hidden', role !== 'customer');
  document.getElementById('adminStaffAppView')?.classList.toggle('hidden', role !== 'staff');
  document.getElementById('superAdminAppView')?.classList.toggle('hidden', role !== 'superadmin');
  document.getElementById('customerBottomNav')?.classList.toggle('hidden', role !== 'customer');
  
  const roleBadge = document.getElementById('currentRoleBadge');
  if (roleBadge) {
    roleBadge.textContent = role === 'staff' ? "Barista Display" : role === 'superadmin' ? "Superadmin" : "Customer View";
  }

  updateUserSessionUI();

  if (role === 'staff' && typeof renderStaffOrders === 'function') renderStaffOrders();
  if (role === 'superadmin') {
    if (typeof renderAdminMenu === 'function') renderAdminMenu();
    if (typeof renderModifierSettings === 'function') renderModifierSettings();
    if (typeof renderPaymentSettings === 'function') renderPaymentSettings();
  }
}

function updateUserSessionUI() {
  const btnLogin = document.getElementById('btnLoginHeader');
  const userChip = document.getElementById('userProfileChip');

  if (currentUser) {
    if (btnLogin) btnLogin.classList.add('hidden');
    if (userChip) userChip.classList.remove('hidden');

    const avatar = document.getElementById('avatarText');
    const uName = document.getElementById('dropdownUserName');
    const uEmail = document.getElementById('dropdownUserEmail');
    const uRole = document.getElementById('dropdownUserRole');

    if (avatar) avatar.textContent = currentUser.name.charAt(0).toUpperCase();
    if (uName) uName.textContent = currentUser.name;
    if (uEmail) uEmail.textContent = currentUser.email;
    if (uRole) uRole.textContent = currentUser.role || 'customer';
  } else {
    if (btnLogin) btnLogin.classList.remove('hidden');
    if (userChip) userChip.classList.add('hidden');
  }
}

// Slide-down Profile Dropdown
function toggleProfileDropdown(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById('profileDropdownMenu');
  if (menu) menu.classList.toggle('hidden');
}

function closeProfileDropdown() {
  const menu = document.getElementById('profileDropdownMenu');
  if (menu) menu.classList.add('hidden');
}

document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('profileDropdownMenu');
  const trigger = document.getElementById('userProfileChip');
  if (dropdown && !dropdown.contains(e.target) && trigger && !trigger.contains(e.target)) {
    closeProfileDropdown();
  }
});
