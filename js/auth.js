// =======================================================
// AUTHENTICATION & ROLE DISPATCHER
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
  const nameBox = document.getElementById('authNameBox');
  const title = document.getElementById('authModalTitle');
  const btn = document.getElementById('btnAuthSubmit');
  const toggle = document.getElementById('authToggleText');

  if (isRegisterMode) {
    if (nameBox) nameBox.classList.remove('hidden');
    if (title) title.textContent = "ລົງທະບຽນໃໝ່";
    if (btn) btn.textContent = "ລົງທະບຽນ (Sign Up)";
    if (toggle) toggle.textContent = "ມີບັນຊີແລ້ວ? ເຂົ້າສູ່ລະບົບ";
  } else {
    if (nameBox) nameBox.classList.add('hidden');
    if (title) title.textContent = "ເຂົ້າສູ່ລະບົບ";
    if (btn) btn.textContent = "ເຂົ້າສູ່ລະບົບ (Sign In)";
    if (toggle) toggle.textContent = "ຍັງບໍ່ມີບັນຊີ? ລົງທະບຽນໃໝ່ທີ່ນີ້";
  }
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
  const emailInput = document.getElementById('authEmail')?.value.trim();
  const passInput = document.getElementById('authPassword')?.value.trim();
  const nameInput = document.getElementById('authName')?.value.trim();

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
      uid: 'u_' + Date.now(),
      email: emailInput,
      password: passInput,
      name: nameInput || "Valued Customer",
      role: "customer",
      phone: "+856 20 " + Math.floor(10000000 + Math.random() * 90000000),
      isPhoneVerified: false,
      dob: "",
      profileImage: null,
      beans: 50,
      createdAt: new Date().toISOString()
    };

    userAccounts.push(newUser);
    localStorage.setItem('ladolce_accounts', JSON.stringify(userAccounts));
    currentUser = newUser;

    if (typeof isFirebaseReady !== 'undefined' && isFirebaseReady && db) {
      try {
        await db.collection("users").doc(newUser.email).set(newUser, { merge: true });
        console.log("✅ New customer registered to Cloud Firestore:", newUser.email);
      } catch (e) {}
    }

  } else {
    let user = userAccounts.find(u => 
      u.email.toLowerCase() === emailInput.toLowerCase() && u.password === passInput
    );

    if (!user && typeof isFirebaseReady !== 'undefined' && isFirebaseReady && db) {
      try {
        const doc = await db.collection("users").doc(emailInput).get();
        if (doc.exists && doc.data().password === passInput) {
          user = doc.data();
          userAccounts.push(user);
          localStorage.setItem('ladolce_accounts', JSON.stringify(userAccounts));
        }
      } catch (e) {}
    }

    if (!user) {
      alert("ອີເມວ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ!");
      return;
    }
    currentUser = user;
  }

  localStorage.setItem('ladolce_user', JSON.stringify(currentUser));
  resetSessionTimer();
  closeAuthModal();
  updateUserSessionUI();
  dispatchRoleView(currentUser.role);
}

function logoutUser() {
  currentUser = null;
  localStorage.removeItem('ladolce_user');
  if (sessionTimer) clearTimeout(sessionTimer);
  updateUserSessionUI();
  dispatchRoleView('customer');
  alert("ທ່ານໄດ້ອອກຈາກລະບົບຮຽບຮ້ອຍແລ້ວ");
}

function dispatchRoleView(role) {
  const customerView = document.getElementById('customerAppView');
  const staffView = document.getElementById('adminStaffAppView');
  const superAdminView = document.getElementById('superAdminAppView');
  const bottomNav = document.getElementById('customerBottomNav');
  const roleBadge = document.getElementById('currentRoleBadge');

  if (customerView) customerView.classList.add('hidden');
  if (staffView) staffView.classList.add('hidden');
  if (superAdminView) superAdminView.classList.add('hidden');
  if (bottomNav) bottomNav.classList.add('hidden');

  if (role === 'staff') {
    if (staffView) staffView.classList.remove('hidden');
    if (roleBadge) roleBadge.textContent = "Barista Display";
    
    // ຂໍສິດແຈ້ງເຕືອນໜ້າຈໍລັອກທັນທີຕອນ Staff ເຂົ້າລະບົບ
    if (typeof requestStaffNotificationPermission === 'function') {
      requestStaffNotificationPermission();
    }

    if (typeof renderStaffOrders === 'function') renderStaffOrders();
  } else if (role === 'superadmin') {
    if (superAdminView) superAdminView.classList.remove('hidden');
    if (roleBadge) roleBadge.textContent = "SuperAdmin Suite";
    if (typeof renderAnalytics === 'function') renderAnalytics();
    if (typeof renderAdminMenu === 'function') renderAdminMenu();
    if (typeof renderModifierSettings === 'function') renderModifierSettings();
  } else {
    if (customerView) customerView.classList.remove('hidden');
    if (bottomNav) bottomNav.classList.remove('hidden');
    if (roleBadge) roleBadge.textContent = "Customer View";
    if (typeof switchCustomerTab === 'function') switchCustomerTab('menu');
  }
}

function updateUserSessionUI() {
  const btnLogin = document.getElementById('btnLoginHeader');
  const userChip = document.getElementById('userProfileChip');

  if (!btnLogin || !userChip) return;

  if (currentUser) {
    btnLogin.classList.add('hidden');
    userChip.classList.remove('hidden');
    if (currentUser.profileImage) {
      userChip.innerHTML = `<img src="${currentUser.profileImage}" class="w-8 h-8 rounded-full object-cover border-2 border-forest-emerald"/>`;
    } else {
      userChip.innerHTML = `<div class="w-8 h-8 rounded-full bg-forest-emerald text-white flex items-center justify-center font-serif text-[13px]">${currentUser.name.charAt(0).toUpperCase()}</div>`;
    }
  } else {
    btnLogin.classList.remove('hidden');
    userChip.classList.add('hidden');
  }
}

function renderCustomerProfile() {
  const container = document.getElementById('tab-customer-profile');
  if (!container) return;

  if (!currentUser) {
    container.innerHTML = `
      <div class="max-w-md mx-auto p-8 rounded-2xl bg-surface-pure border border-hairline text-center space-y-4 shadow-xs">
        <span class="material-symbols-outlined text-[48px] text-forest-leaf">account_circle</span>
        <h3 class="font-serif-title text-[20px] text-primary font-medium">ເຂົ້າສູ່ລະບົບເພື່ອຈັດການໂປຣໄຟລ໌</h3>
        <p class="text-[12px] text-taupe font-lao">ສະສົມແຕ້ມ Beans, ຕິດຕາມປະຫວັດການສັ່ງຊື້ ແລະ ຮັບສິດທິພິເສດວັນເກີດ</p>
        <button onclick="openAuthModal()" class="px-6 py-2.5 rounded-lg bg-forest-emerald text-white text-[12px] uppercase font-semibold tracking-wider hover:bg-forest-leaf transition-all">
          ເຂົ້າສູ່ລະບົບ / ລົງທະບຽນ
        </button>
      </div>
    `;
    return;
  }

  const avatarDisplay = currentUser.profileImage 
    ? `<img src="${currentUser.profileImage}" class="w-20 h-20 rounded-full object-cover border-2 border-forest-emerald shadow-xs"/>`
    : `<div class="w-20 h-20 rounded-full bg-forest-emerald text-white flex items-center justify-center font-serif text-[28px] shadow-xs">${currentUser.name.charAt(0).toUpperCase()}</div>`;

  container.innerHTML = `
    <div class="max-w-lg mx-auto space-y-5">
      <div class="p-6 rounded-2xl bg-surface-pure border border-hairline space-y-5 shadow-xs">
        <div class="flex items-center gap-4">
          <div class="relative group">
            ${avatarDisplay}
            <label class="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-forest-emerald text-white flex items-center justify-center cursor-pointer shadow-xs hover:bg-forest-leaf transition-transform hover:scale-110">
              <span class="material-symbols-outlined text-[14px]">photo_camera</span>
              <input type="file" accept="image/*" class="hidden" onchange="handleProfilePhotoUpload(event)"/>
            </label>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-serif-title text-[19px] text-primary font-medium truncate">${currentUser.name}</h3>
            <p class="text-[12px] text-taupe font-mono truncate">${currentUser.email}</p>
            <span class="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-medium">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Connoisseur Tier • Gold
            </span>
          </div>
          <button onclick="logoutUser()" class="text-[11px] text-red-700 hover:underline uppercase font-medium">ອອກຈາກລະບົບ</button>
        </div>

        <div class="p-3.5 rounded-xl bg-surface border border-hairline space-y-2">
          <div class="flex justify-between items-baseline">
            <span class="text-[11px] uppercase tracking-wider font-semibold text-primary">ຄະແນນສະສົມ (Bean Loyalty)</span>
            <span class="font-serif-title text-[15px] font-bold text-forest-emerald">${currentUser.beans || 340} <span class="text-[11px] font-sans text-taupe font-normal">/ 400 Beans</span></span>
          </div>
          <div class="w-full bg-hairline h-2 rounded-full overflow-hidden">
            <div class="bg-forest-leaf h-full rounded-full transition-all duration-700" style="width: 85%;"></div>
          </div>
          <span class="text-[10px] text-taupe block">ອີກ 60 beans ຮັບຟຣີ Pour-over ກາເຟພິເສດ 1 ຈອກ</span>
        </div>

        <div class="space-y-3 pt-2 border-t border-hairline text-[12px]">
          <h4 class="font-serif-title text-[15px] text-primary font-medium">ຂໍ້ມູນສ່ວນຕົວ & ການຢືນຢັນ</h4>
          <div>
            <label class="block text-taupe mb-1">ຊື່ເຕັມ (Full Name):</label>
            <input type="text" id="profInputName" value="${currentUser.name}" class="w-full rounded-lg border border-hairline p-2"/>
          </div>
          <div>
            <label class="block text-taupe mb-1">ເບີໂທລະສັບ (Phone Number):</label>
            <div class="flex gap-2">
              <input type="text" id="profInputPhone" value="${currentUser.phone || ''}" class="flex-1 rounded-lg border border-hairline p-2 font-mono"/>
              <button onclick="verifyPhoneAction()" class="px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-colors ${currentUser.isPhoneVerified ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-forest-emerald text-forest-emerald hover:bg-forest-emerald hover:text-white'}">
                ${currentUser.isPhoneVerified ? '✓ ຢືນຢັນແລ້ວ' : 'ຢືນຢັນ OTP'}
              </button>
            </div>
          </div>
          <div>
            <label class="block text-taupe mb-1">ວັນເດືອນປີເກີດ (Date of Birth):</label>
            <input type="date" id="profInputDob" value="${currentUser.dob || ''}" class="w-full rounded-lg border border-hairline p-2"/>
          </div>
          <button onclick="saveProfileDetails()" class="w-full py-2 rounded-lg bg-forest-emerald text-white text-[12px] font-medium hover:bg-forest-leaf transition-all shadow-xs">
            ບັນທຶກຂໍ້ມູນໂປຣໄຟລ໌
          </button>
        </div>

        <div class="space-y-3 pt-3 border-t border-hairline text-[12px]">
          <h4 class="font-serif-title text-[15px] text-primary font-medium">ປ່ຽນລະຫັດຜ່ານໃໝ່</h4>
          <div class="grid grid-cols-2 gap-2">
            <input type="password" id="profNewPass" placeholder="ລະຫັດຜ່ານໃໝ່" class="rounded-lg border border-hairline p-2"/>
            <input type="password" id="profConfirmPass" placeholder="ຢືນຢັນລະຫັດຜ່ານ" class="rounded-lg border border-hairline p-2"/>
          </div>
          <button onclick="changeCustomerPassword()" class="w-full py-2 rounded-lg border border-forest-emerald text-forest-emerald hover:bg-forest-emerald hover:text-white transition-all text-[11px] font-medium">
            ອັບເດດລະຫັດຜ່ານ
          </button>
        </div>
      </div>

      <div class="p-6 rounded-2xl bg-surface-pure border border-hairline space-y-3 shadow-xs">
        <h4 class="font-serif-title text-[16px] text-primary font-medium">ປະຫວັດການສັ່ງຊື້ຂອງທ່ານ</h4>
        <div id="customerHistoryList" class="divide-y divide-hairline border border-hairline rounded-xl bg-surface"></div>
      </div>
    </div>
  `;

  renderCustomerHistoryList();
}

async function handleProfilePhotoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  try {
    if (typeof compressImage === 'function') {
      currentUser.profileImage = await compressImage(file, 300, 300, 0.8);
    }
    saveCurrentUserData();
    renderCustomerProfile();
    updateUserSessionUI();
    alert("ອັບເດດຮູບໂປຣໄຟລ໌ຮຽບຮ້ອຍແລ້ວ!");
  } catch (err) {}
}

function verifyPhoneAction() {
  if (currentUser.isPhoneVerified) {
    alert("ເບີໂທລະສັບນີ້ໄດ້ຮັບການຢືນຢັນແລ້ວ");
    return;
  }
  const otp = prompt("ລະບົບໄດ້ສົ່ງລະຫັດ OTP ໄປຫາເບີ " + currentUser.phone + " (ລະຫັດທົດສອບແມ່ນ: 8899):");
  if (otp === "8899") {
    currentUser.isPhoneVerified = true;
    saveCurrentUserData();
    renderCustomerProfile();
    alert("ເບີໂທລະສັບຂອງທ່ານໄດ້ຮັບການຢືນຢັນ OTP ຮຽບຮ້ອຍແລ້ວ!");
  } else if (otp) {
    alert("ລະຫັດ OTP ບໍ່ຖືກຕ້ອງ!");
  }
}

function saveProfileDetails() {
  const name = document.getElementById('profInputName')?.value.trim();
  const phone = document.getElementById('profInputPhone')?.value.trim();
  const dob = document.getElementById('profInputDob')?.value;

  if (!name) return;

  currentUser.name = name;
  currentUser.phone = phone;
  currentUser.dob = dob;

  saveCurrentUserData();
  renderCustomerProfile();
  updateUserSessionUI();
  alert("ບັນທຶກຂໍ້ມູນໂປຣໄຟລ໌ຮຽບຮ້ອຍແລ້ວ!");
}

function changeCustomerPassword() {
  const newPass = document.getElementById('profNewPass')?.value;
  const confirmPass = document.getElementById('profConfirmPass')?.value;

  if (!newPass || newPass.length < 3) {
    alert("ລະຫັດຜ່ານໃໝ່ຕ້ອງມີຢ່າງໜ້ອຍ 3 ຕົວອັກສອນ!");
    return;
  }

  if (newPass !== confirmPass) {
    alert("ລະຫັດຜ່ານທັງສອງຊ່ອງບໍ່ກົງກັນ!");
    return;
  }

  currentUser.password = newPass;
  saveCurrentUserData();
  if (document.getElementById('profNewPass')) document.getElementById('profNewPass').value = '';
  if (document.getElementById('profConfirmPass')) document.getElementById('profConfirmPass').value = '';
  alert("ປ່ຽນລະຫັດຜ່ານໃໝ່ຮຽບຮ້ອຍແລ້ວ!");
}

function saveCurrentUserData() {
  localStorage.setItem('ladolce_user', JSON.stringify(currentUser));
  const idx = userAccounts.findIndex(u => u.email.toLowerCase() === currentUser.email.toLowerCase());
  if (idx !== -1) {
    userAccounts[idx] = currentUser;
    localStorage.setItem('ladolce_accounts', JSON.stringify(userAccounts));
  }
  if (typeof isFirebaseReady !== 'undefined' && isFirebaseReady && db) {
    db.collection("users").doc(currentUser.email).set(currentUser, { merge: true }).catch(e => {});
  }
}

function renderCustomerHistoryList() {
  const container = document.getElementById('customerHistoryList');
  if (!container) return;

  const myOrders = orders.filter(o => o.customerPhone === currentUser.phone || o.customerEmail === currentUser.email);

  if (myOrders.length === 0) {
    container.innerHTML = `<div class="p-4 text-center text-taupe text-[12px] font-lao">ຍັງບໍ່ມີປະຫວັດການສັ່ງຊື້</div>`;
    return;
  }

  container.innerHTML = myOrders.slice(0, 5).map(o => `
    <div class="p-3.5 flex items-center justify-between text-[12px]">
      <div>
        <span class="font-mono font-bold text-forest-emerald">${o.id}</span>
        <p class="text-[11px] text-taupe font-lao">${o.items.map(it => it.name).join(', ')}</p>
      </div>
      <div class="text-right">
        <span class="font-mono font-bold text-charcoal">$${o.total.toFixed(2)}</span>
        <span class="block text-[10px] uppercase font-bold text-emerald-800">${o.status}</span>
      </div>
    </div>
  `).join('');
}
