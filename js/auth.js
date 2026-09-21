// =======================================================
// AUTHENTICATION, ROLE DISPATCHER & ADVANCED PROFILE
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
      isPhoneVerified: false,
      dob: "",
      beans: 50,
      createdAt: new Date().toISOString()
    };

    if (isFirebaseReady && db) {
      try {
        await db.collection("users").doc(email).set(newUser, { merge: true });
      } catch (e) {}
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
      } catch (cloudErr) {}
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
  if (role === 'superadmin' && typeof renderAdminMenu === 'function') {
    renderAdminMenu();
    if (typeof renderModifierSettings === 'function') renderModifierSettings();
    if (typeof renderPaymentSettings === 'function') renderPaymentSettings();
  }
}

function updateUserSessionUI() {
  const btnLogin = document.getElementById('btnLoginHeader');
  const userChip = document.getElementById('userProfileChip');
  const roleLinksContainer = document.getElementById('dropdownRoleLinks');

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

    if (roleLinksContainer) {
      if (currentUser.role === 'superadmin') {
        roleLinksContainer.innerHTML = `
          <button type="button" onclick="dispatchRoleView('superadmin'); closeProfileDropdown();" class="w-full text-left px-3 py-2 rounded-xl text-[12px] font-bold text-forest-emerald hover:bg-surface flex items-center gap-2 transition-colors cursor-pointer">
            <span class="material-symbols-outlined text-[17px]">admin_panel_settings</span>
            <span>ສູນຄວບຄຸມ (Control Center)</span>
          </button>
          <button type="button" onclick="dispatchRoleView('staff'); closeProfileDropdown();" class="w-full text-left px-3 py-2 rounded-xl text-[12px] font-medium text-charcoal hover:bg-surface flex items-center gap-2 transition-colors cursor-pointer">
            <span class="material-symbols-outlined text-[17px]">coffee_maker</span>
            <span>ໜ້າຈໍຄົວ (Kitchen Display)</span>
          </button>
          <button type="button" onclick="dispatchRoleView('customer'); switchCustomerTab('ticket'); closeProfileDropdown();" class="w-full text-left px-3 py-2 rounded-xl text-[12px] font-medium text-charcoal hover:bg-surface flex items-center gap-2 transition-colors cursor-pointer">
            <span class="material-symbols-outlined text-[17px]">receipt_long</span>
            <span>ບິນສັ່ງຊື້ (Orders Audit)</span>
          </button>
        `;
      } else if (currentUser.role === 'staff') {
        roleLinksContainer.innerHTML = `
          <button type="button" onclick="dispatchRoleView('staff'); closeProfileDropdown();" class="w-full text-left px-3 py-2 rounded-xl text-[12px] font-bold text-forest-emerald hover:bg-surface flex items-center gap-2 transition-colors cursor-pointer">
            <span class="material-symbols-outlined text-[17px]">coffee_maker</span>
            <span>ໜ້າຈໍຄົວ (Kitchen Display)</span>
          </button>
          <button type="button" onclick="dispatchRoleView('customer'); switchCustomerTab('ticket'); closeProfileDropdown();" class="w-full text-left px-3 py-2 rounded-xl text-[12px] font-medium text-charcoal hover:bg-surface flex items-center gap-2 transition-colors cursor-pointer">
            <span class="material-symbols-outlined text-[17px]">receipt_long</span>
            <span>ບິນຮັບເຄື່ອງ (Ticket)</span>
          </button>
        `;
      } else {
        roleLinksContainer.innerHTML = `
          <button type="button" onclick="switchCustomerTab('profile'); closeProfileDropdown();" class="w-full text-left px-3 py-2 rounded-xl text-[12px] font-medium text-charcoal hover:bg-surface flex items-center gap-2 transition-colors cursor-pointer">
            <span class="material-symbols-outlined text-[17px] text-forest-emerald">account_circle</span>
            <span>ໂປຣໄຟລ໌ຂອງຂ້ອຍ</span>
          </button>
          <button type="button" onclick="switchCustomerTab('ticket'); closeProfileDropdown();" class="w-full text-left px-3 py-2 rounded-xl text-[12px] font-medium text-charcoal hover:bg-surface flex items-center gap-2 transition-colors cursor-pointer">
            <span class="material-symbols-outlined text-[17px] text-forest-emerald">receipt_long</span>
            <span>ປີ້ຮັບເຄື່ອງ (My Ticket)</span>
          </button>
        `;
      }
    }
  } else {
    if (btnLogin) btnLogin.classList.remove('hidden');
    if (userChip) userChip.classList.add('hidden');
  }
}

// 7. Render Customer Profile (ພ້ອມວັນເກີດ, ຢືນຢັນເບີໂທ, Reorder)
function renderCustomerProfile() {
  const container = document.getElementById('profileTabContent');
  if (!container) return;

  if (!currentUser) {
    container.innerHTML = `
      <div class="max-w-md mx-auto p-8 rounded-2xl bg-surface-pure border border-hairline text-center space-y-4 shadow-xs">
        <span class="material-symbols-outlined text-[48px] text-forest-leaf">account_circle</span>
        <h3 class="font-serif-title text-[20px] text-primary font-medium">ເຂົ້າສູ່ລະບົບສະມາຊິກ</h3>
        <p class="text-[12px] text-taupe font-lao">ເຂົ້າສູ່ລະບົບເພື່ອສະສົມຄະແນນ ແລະ ເບິ່ງປະຫວັດການສັ່ງຊື້</p>
        <button onclick="openAuthModal()" class="px-6 py-2.5 rounded-lg bg-forest-emerald text-white text-[12px] uppercase font-semibold">ເຂົ້າສູ່ລະບົບ</button>
      </div>
    `;
    return;
  }

  // ດຶງອໍເດີ້ທີ່ສຳເລັດແລ້ວຂອງລູກຄ້າຄົນນີ້
  const myHistory = orders.filter(o => 
    (o.customerEmail === currentUser.email || o.customerPhone === currentUser.phone) &&
    o.status === 'completed'
  );

  container.innerHTML = `
    <div class="max-w-lg mx-auto space-y-5">
      <!-- Member Luxury Card -->
      <div class="p-6 bg-forest-gradient text-white rounded-2xl shadow-md space-y-4 relative overflow-hidden">
        <div class="flex justify-between items-start">
          <div>
            <span class="text-[10px] uppercase tracking-widest text-emerald-300 font-bold">Atelier Connoisseur</span>
            <h3 class="font-serif-title text-[22px] font-bold mt-0.5">${currentUser.name}</h3>
            <p class="text-[11px] opacity-80 font-mono">${currentUser.email}</p>
          </div>
          <span class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-serif text-[16px] font-bold">LD</span>
        </div>
        
        <div class="p-3.5 rounded-xl bg-white/10 border border-white/10 flex justify-between items-center text-[12px]">
          <div>
            <span class="block text-[10px] opacity-75">ຄະແນນສະສົມ (Beans Loyalty):</span>
            <span class="font-serif-title text-[18px] font-bold text-emerald-300">${currentUser.beans || 340} <span class="text-[11px] font-sans font-normal opacity-80">/ 400 Beans</span></span>
          </div>
          <span class="text-[10px] px-2.5 py-1 rounded-full bg-emerald-400 text-forest-emerald font-bold">Gold Tier</span>
        </div>
      </div>

      <!-- Member Details & Birthday Form -->
      <div class="p-5 bg-surface-pure border border-hairline rounded-2xl space-y-3.5 shadow-xs text-[12px]">
        <h4 class="font-serif-title font-bold text-[15px] text-primary border-b border-hairline pb-2">ຂໍ້ມູນສະມາຊິກ & ສິດທິພິເສດ</h4>
        
        <div>
          <label class="block text-taupe mb-1">ເບີໂທລະສັບຕິດຕໍ່:</label>
          <div class="flex items-center gap-2">
            <input type="text" id="profPhoneInput" value="${currentUser.phone || ''}" class="flex-1 rounded-lg border border-hairline p-2 font-mono"/>
            <button type="button" onclick="verifyCustomerPhone()" class="px-3 py-2 rounded-lg text-[11px] font-bold border transition-all ${currentUser.isPhoneVerified ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-surface hover:bg-forest-emerald hover:text-white border-forest-emerald text-forest-emerald'}">
              ${currentUser.isPhoneVerified ? '✓ ຢືນຢັນແລ້ວ' : 'ຢືນຢັນ OTP'}
            </button>
          </div>
        </div>

        <div>
          <label class="block text-taupe mb-1">ວັນເດືອນປີເກີດ (ສຳລັບຮັບເຄື່ອງດື່ມຟຣີວັນເກີດ 🎂):</label>
          <input type="date" id="profDobInput" value="${currentUser.dob || ''}" class="w-full rounded-lg border border-hairline p-2"/>
        </div>

        <button type="button" onclick="saveProfileExtras()" class="w-full py-2 rounded-lg bg-forest-emerald text-white text-[12px] font-bold hover:bg-forest-leaf transition-all shadow-xs">
          ບັນທຶກຂໍ້ມູນ
        </button>
      </div>

      <!-- Order History List with Reorder Button -->
      <div class="p-5 bg-surface-pure border border-hairline rounded-2xl space-y-3 shadow-xs">
        <div class="flex justify-between items-center border-b border-hairline pb-2">
          <h4 class="font-serif-title font-bold text-[16px] text-primary">ປະຫວັດການສັ່ງຊື້ (Completed Orders)</h4>
          <span class="text-[11px] text-taupe font-mono">${myHistory.length} orders</span>
        </div>

        <div class="divide-y divide-hairline">
          ${myHistory.length === 0 ? `
            <p class="text-center text-taupe text-[12px] py-4">ຍັງບໍ່ມີປະຫວັດອໍເດີ້ທີ່ສຳເລັດ</p>
          ` : myHistory.map(o => `
            <div class="py-3 flex justify-between items-center">
              <div>
                <span class="font-mono font-bold text-forest-emerald text-[13px]">${o.id}</span>
                <p class="text-[12px] font-medium text-charcoal">${o.items.map(i => `${i.quantity}× ${i.name}`).join(', ')}</p>
                <span class="text-[10px] text-taupe">${new Date(o.createdAt).toLocaleDateString()}</span>
              </div>
              <div class="text-right">
                <span class="font-bold text-forest-emerald font-mono block text-[13px]">${formatLAK(o.total)}</span>
                <button type="button" onclick="reorderPreviousItems('${o.id}')" class="text-[10px] text-forest-emerald bg-forest-emerald/10 hover:bg-forest-emerald hover:text-white px-2.5 py-1 rounded-lg font-bold transition-colors mt-1 inline-flex items-center gap-1">
                  <span class="material-symbols-outlined text-[12px]">refresh</span>
                  <span>ສັ່ງຊ້ຳ (Reorder)</span>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function verifyCustomerPhone() {
  if (currentUser.isPhoneVerified) {
    alert("ເບີໂທລະສັບນີ້ໄດ້ຮັບການຢືນຢັນແລ້ວ!");
    return;
  }
  const otp = prompt("ລະບົບໄດ້ສົ່ງລະຫັດ OTP ໄປຫາເບີ " + currentUser.phone + " (ລະຫັດທົດສອບແມ່ນ: 8899):");
  if (otp === "8899") {
    currentUser.isPhoneVerified = true;
    localStorage.setItem('ladolce_user', JSON.stringify(currentUser));
    if (isFirebaseReady && db) db.collection("users").doc(currentUser.email).update({ isPhoneVerified: true });
    renderCustomerProfile();
    showToast("ເບີໂທລະສັບຢືນຢັນສຳເລັດ!");
  } else if (otp) {
    alert("ລະຫັດ OTP ບໍ່ຖືກຕ້ອງ!");
  }
}

function saveProfileExtras() {
  const phone = document.getElementById('profPhoneInput')?.value.trim();
  const dob = document.getElementById('profDobInput')?.value;

  currentUser.phone = phone || currentUser.phone;
  currentUser.dob = dob || "";

  localStorage.setItem('ladolce_user', JSON.stringify(currentUser));
  if (isFirebaseReady && db) {
    db.collection("users").doc(currentUser.email).update({ phone: currentUser.phone, dob: currentUser.dob });
  }

  showToast("ບັນທຶກຂໍ້ມູນໂປຣໄຟລ໌ຮຽບຮ້ອຍ!");
}

function reorderPreviousItems(orderId) {
  const target = orders.find(o => o.id === orderId);
  if (!target) return;

  target.items.forEach(it => {
    cart.push({ ...it, cartId: 'c_' + Date.now() + Math.random().toString(36).substr(2, 4) });
  });

  localStorage.setItem('ladolce_cart', JSON.stringify(cart));
  if (typeof updateCartBadges === 'function') updateCartBadges();
  showToast("ເພີ່ມສິນຄ້າຈາກອໍເດີ້ເກົ່າເຂົ້າກະຕ່າແລ້ວ!");
  switchCustomerTab('cart');
}

// Slide-down Profile Dropdown Handlers
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
