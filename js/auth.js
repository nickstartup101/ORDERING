// =======================================================
// LA DOLCE — ADVANCED MEMBER PROFILE & BIRTHDAY PRIVILEGE
// =======================================================

let isRegisterMode = false;
let sessionTimer = null;
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 ນາທີ
let profileSubTab = 'info'; // 'info' | 'history'

function openAuthModal() {
  document.getElementById('authModal')?.classList.remove('hidden');
}

function closeAuthModal() {
  document.getElementById('authModal')?.classList.add('hidden');
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
  const emailInput = document.getElementById('authEmail')?.value.trim().toLowerCase();
  const passInput = document.getElementById('authPassword')?.value.trim();
  const nameInput = document.getElementById('authName')?.value.trim();

  if (!emailInput || !passInput) {
    alert("ກະລຸນາປ້ອນອີເມວ ແລະ ລະຫັດຜ່ານ!");
    return;
  }

  showToast("ກຳລັງກວດສອບ...");

  if (isRegisterMode) {
    const newUser = {
      email: emailInput,
      password: passInput,
      name: nameInput || "Customer",
      role: "customer",
      phone: "+856 20 " + Math.floor(10000000 + Math.random() * 90000000),
      isPhoneVerified: false,
      dob: "",
      preferredRoast: "Light Roast (Ethiopia Guji), Oat Milk",
      beans: 50,
      createdAt: new Date().toISOString()
    };

    if (isFirebaseReady && db) {
      try {
        await db.collection("users").doc(emailInput).set(newUser, { merge: true });
      } catch (e) {}
    }

    currentUser = newUser;
    localStorage.setItem('ladolce_user', JSON.stringify(currentUser));
    closeAuthModal();
    dispatchRoleView(currentUser.role);
    showToast("ລົງທະບຽນສຳເລັດ!");
  } else {
    let authenticatedUser = null;

    if (typeof REGISTERED_ACCOUNTS !== 'undefined') {
      const matched = REGISTERED_ACCOUNTS.find(u => u.email.toLowerCase() === emailInput && u.password === passInput);
      if (matched) authenticatedUser = matched;
    }

    if (!authenticatedUser && isFirebaseReady && db) {
      try {
        const doc = await db.collection("users").doc(emailInput).get();
        if (doc.exists) {
          const userData = doc.data();
          if (userData.password === passInput) {
            authenticatedUser = userData;
          }
        }
      } catch (cloudErr) {}
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

  if (role === 'staff') {
    if (typeof renderStaffOrders === 'function') renderStaffOrders();
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }
  if (role === 'superadmin') {
    if (typeof renderAdminMenu === 'function') renderAdminMenu();
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

// -------------------------------------------------------------
// 🔥 PROFILE SUB-TABS & ADVANCED MEMBER REWARDS
// -------------------------------------------------------------
function switchProfileSubTab(tab) {
  profileSubTab = tab;
  renderCustomerProfile();
}

function renderCustomerProfile() {
  const container = document.getElementById('profileTabContent');
  if (!container) return;

  if (!currentUser) {
    container.innerHTML = `
      <div class="p-8 bg-surface-pure border border-hairline rounded-2xl text-center space-y-3 shadow-xs">
        <span class="material-symbols-outlined text-[42px] text-forest-leaf/60">account_circle</span>
        <h3 class="font-serif-title text-[18px] text-primary font-medium">ເຂົ້າສູ່ລະບົບສະມາຊິກ</h3>
        <p class="text-[12px] text-taupe font-lao">ເຂົ້າສູ່ລະບົບເພື່ອສະສົມຄະແນນ Beans, ຮັບຂອງຂວັນວັນເກີດ ແລະ ເບິ່ງປະຫວັດໃບບິນ</p>
        <button type="button" onclick="openAuthModal()" class="px-5 py-2.5 rounded-lg bg-forest-emerald text-white text-[12px] font-semibold hover:bg-forest-leaf transition-all shadow-xs cursor-pointer">
          ເຂົ້າສູ່ລະບົບ / ລົງທະບຽນ
        </button>
      </div>
    `;
    return;
  }

  // ດຶງປະຫວັດບິນທີ່ສຳເລັດ
  const myHistory = orders.filter(o => 
    (o.customerEmail === currentUser.email || o.customerPhone === currentUser.phone) &&
    o.status === 'completed'
  );

  const totalSpent = myHistory.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const totalCups = myHistory.reduce((sum, o) => sum + (o.items ? o.items.reduce((s, i) => s + (i.quantity || 1), 0) : 0), 0);

  // 🔥 ກວດສອບວັນເກີດ: ຖ້າຮອດເດືອນວັນເກີດ ຈະມີ Birthday Privilege Card ເດັ້ງຂຶ້ນມາ!
  const today = new Date();
  let isBirthdayMonth = false;
  if (currentUser.dob) {
    const birthDate = new Date(currentUser.dob);
    if (birthDate.getMonth() === today.getMonth()) {
      isBirthdayMonth = true;
    }
  }

  container.innerHTML = `
    <div class="max-w-lg mx-auto space-y-4">
      
      <!-- Luxury Gold Card -->
      <div class="p-5 bg-forest-gradient text-white rounded-2xl shadow-md space-y-3.5 relative overflow-hidden">
        <div class="flex justify-between items-start">
          <div>
            <span class="text-[10px] uppercase tracking-widest text-emerald-300 font-bold">Atelier Connoisseur</span>
            <h3 class="font-serif-title text-[20px] font-bold mt-0.5">${currentUser.name}</h3>
            <p class="text-[11px] opacity-80 font-mono">${currentUser.email}</p>
          </div>
          <span class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-serif text-[16px] font-bold">LD</span>
        </div>
        
        <div class="p-3 rounded-xl bg-white/10 border border-white/10 flex justify-between items-center text-[12px]">
          <div>
            <span class="block text-[10px] opacity-75">ຄະແນນສະສົມ (Beans Loyalty):</span>
            <span class="font-serif-title text-[18px] font-bold text-emerald-300">${currentUser.beans || 50} <span class="text-[11px] font-sans font-normal opacity-80">/ 400 Beans</span></span>
          </div>
          <button type="button" onclick="redeemBeanReward()" class="px-3 py-1 rounded-full bg-emerald-400 text-forest-emerald font-bold text-[10px] hover:bg-emerald-300 transition-colors cursor-pointer">
            ແລກກາເຟຟຣີ
          </button>
        </div>
      </div>

      <!-- 🎂 Birthday Privilege Card (ກາດອວຍພອນວັນເກີດ ແລກຟຣີ 1 ຈອກ) -->
      ${isBirthdayMonth ? `
        <div class="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-400 p-4 space-y-2 relative overflow-hidden animate-slide-down">
          <div class="flex items-center gap-2 text-amber-900 font-bold text-[13px]">
            <span class="text-[20px]">🎂</span>
            <span>Happy Birthday Month, ${currentUser.name}!</span>
          </div>
          <p class="text-[11px] text-amber-900/80 leading-relaxed font-lao">
            ສຸກສັນເດືອນເກີດຂອງທ່ານ! LA DOLCE ມອບສິດທິພິເສດ <strong>ດື່ມກາເຟ ຫຼື ເຄື່ອງດື່ມຟຣີ 1 ຈອກ</strong> ໃນເດືອນນີ້.
          </p>
          <button type="button" onclick="claimBirthdayDrink()" class="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold transition-all shadow-xs cursor-pointer">
            🎁 ກົດຮັບສິດດື່ມຟຣີເລີຍ
          </button>
        </div>
      ` : ''}

      <!-- Sub-tabs: "Customer Info" vs "Order History" -->
      <div class="flex gap-2 border-b border-hairline pb-2">
        <button type="button" onclick="switchProfileSubTab('info')" class="flex-1 py-2 rounded-xl text-[12px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${profileSubTab === 'info' ? 'bg-forest-emerald text-white shadow-xs' : 'bg-surface border border-hairline text-taupe hover:text-charcoal'}">
          <span class="material-symbols-outlined text-[16px]">badge</span>
          <span>ຂໍ້ມູນລູກຄ້າ (Customer Info)</span>
        </button>

        <button type="button" onclick="switchProfileSubTab('history')" class="flex-1 py-2 rounded-xl text-[12px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${profileSubTab === 'history' ? 'bg-forest-emerald text-white shadow-xs' : 'bg-surface border border-hairline text-taupe hover:text-charcoal'}">
          <span class="material-symbols-outlined text-[16px]">receipt_long</span>
          <span>ປະຫວັດບິນ (${myHistory.length})</span>
        </button>
      </div>

      <!-- 3. TAB 1: CUSTOMER INFO -->
      ${profileSubTab === 'info' ? `
        <div class="space-y-4 animate-slide-down">
          <div class="grid grid-cols-2 gap-3">
            <div class="p-3.5 bg-surface-pure border border-hairline rounded-xl shadow-xs">
              <span class="text-[10px] uppercase font-bold text-taupe block">ຈຳນວນຈອກທີ່ເຄີຍສັ່ງ</span>
              <span class="font-serif-title text-[20px] font-bold text-primary mt-0.5 block">${totalCups} ຈອກ</span>
              <span class="text-[10px] text-emerald-800">☕ Coffee Lover</span>
            </div>
            <div class="p-3.5 bg-surface-pure border border-hairline rounded-xl shadow-xs">
              <span class="text-[10px] uppercase font-bold text-taupe block">ຍອດຊື້ສະສົມ</span>
              <span class="font-serif-title text-[18px] font-bold text-forest-emerald mt-0.5 block">${formatLAK(totalSpent)}</span>
              <span class="text-[10px] text-taupe font-mono">${myHistory.length} ບິນສຳເລັດ</span>
            </div>
          </div>

          <div class="p-5 bg-surface-pure border border-hairline rounded-2xl space-y-3 shadow-xs text-[12px]">
            <h4 class="font-serif-title font-bold text-[15px] text-primary border-b border-hairline pb-2">ລາຍລະອຽດບັນຊີສະມາຊິກ</h4>

            <div>
              <label class="block text-taupe mb-1 font-medium">ຊື່ເຕັມ (Full Name):</label>
              <input type="text" id="profNameInput" value="${currentUser.name || ''}" class="w-full rounded-lg border border-hairline p-2 text-charcoal font-medium"/>
            </div>

            <div>
              <label class="block text-taupe mb-1 font-medium">ເບີໂທລະສັບ:</label>
              <div class="flex items-center gap-2">
                <input type="tel" id="profPhoneInput" value="${currentUser.phone || ''}" class="flex-1 rounded-lg border border-hairline p-2 font-mono"/>
                <button type="button" onclick="verifyCustomerPhone()" class="px-3 py-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${currentUser.isPhoneVerified ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-surface hover:bg-forest-emerald hover:text-white border-forest-emerald text-forest-emerald'}">
                  ${currentUser.isPhoneVerified ? '✓ ຢືນຢັນແລ້ວ' : 'ຢືນຢັນ OTP'}
                </button>
              </div>
            </div>

            <div>
              <label class="block text-taupe mb-1 font-medium">ວັນເດືອນປີເກີດ (🎂 ຮັບສິດທິພິເສດວັນເກີດ):</label>
              <input type="date" id="profDobInput" value="${currentUser.dob || ''}" class="w-full rounded-lg border border-hairline p-2"/>
            </div>

            <div>
              <label class="block text-taupe mb-1 font-medium">ລົດຊາດກາເຟທີ່ມັກ (Tasting Notes / Favorite Roast):</label>
              <input type="text" id="profRoastInput" placeholder="ເຊັ່ນ: ຄົ້ວອ່ອນ Guji, ນົມໂອດ, ຫວານ 50%" value="${currentUser.preferredRoast || ''}" class="w-full rounded-lg border border-hairline p-2"/>
            </div>

            <button type="button" onclick="saveCustomerInfoDetails()" class="w-full py-2.5 rounded-lg bg-forest-emerald text-white text-[12px] font-bold hover:bg-forest-leaf transition-all shadow-xs cursor-pointer">
              ບັນທຶກຂໍ້ມູນໂປຣໄຟລ໌
            </button>
          </div>
        </div>
      ` : `
        <!-- 4. TAB 2: ORDER HISTORY (ໃບບິນ e-Receipt & ສັ່ງຊ້ຳ) -->
        <div class="p-5 bg-surface-pure border border-hairline rounded-2xl space-y-3 shadow-xs animate-slide-down">
          <div class="flex justify-between items-center border-b border-hairline pb-2">
            <h4 class="font-serif-title font-bold text-[16px] text-primary">ປະຫວັດໃບບິນທີ່ສັ່ງສຳເລັດ</h4>
            <span class="text-[11px] text-taupe font-mono">${myHistory.length} ບິນ</span>
          </div>

          <div class="divide-y divide-hairline">
            ${myHistory.length === 0 ? `
              <p class="text-center text-taupe text-[12px] py-6">ຍັງບໍ່ມີປະຫວັດອໍເດີ້ທີ່ສຳເລັດ</p>
            ` : myHistory.map(o => `
              <div class="py-3.5 flex justify-between items-start gap-2">
                <div>
                  <span class="font-mono font-bold text-forest-emerald text-[13px]">${o.id}</span>
                  <p class="text-[12px] font-medium text-charcoal">${(o.items || []).map(i => `${i.quantity}× ${i.name}`).join(', ')}</p>
                  <span class="text-[10px] text-taupe block mt-0.5">${new Date(o.createdAt).toLocaleDateString()} • ${o.paymentMethod || 'LAK'}</span>
                </div>
                <div class="text-right shrink-0">
                  <span class="font-bold text-forest-emerald font-mono block text-[13px]">${formatLAK(o.total)}</span>
                  <div class="flex items-center gap-1.5 mt-1.5 justify-end">
                    <button type="button" onclick="openOrderReceiptModal('${o.id}')" class="text-[10px] px-2.5 py-1 rounded-lg bg-surface hover:bg-forest-emerald hover:text-white border border-hairline text-charcoal font-bold inline-flex items-center gap-0.5 transition-colors cursor-pointer">
                      <span class="material-symbols-outlined text-[13px]">receipt</span> ໃບບິນ
                    </button>
                    <button type="button" onclick="reorderPreviousItems('${o.id}')" class="text-[10px] text-forest-emerald bg-forest-emerald/10 hover:bg-forest-emerald hover:text-white px-2.5 py-1 rounded-lg font-bold transition-colors inline-flex items-center gap-0.5 cursor-pointer">
                      <span class="material-symbols-outlined text-[13px]">refresh</span> ສັ່ງຊ້ຳ
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `}

    </div>
  `;
}

// ບັນທຶກ Customer Info ຂຶ້ນ Firestore
function saveCustomerInfoDetails() {
  const name = document.getElementById('profNameInput')?.value.trim();
  const phone = document.getElementById('profPhoneInput')?.value.trim();
  const dob = document.getElementById('profDobInput')?.value;
  const roast = document.getElementById('profRoastInput')?.value.trim();

  if (!name) {
    alert("ກະລຸນາໃສ່ຊື່ຂອງທ່ານ!");
    return;
  }

  currentUser.name = name;
  currentUser.phone = phone || currentUser.phone;
  currentUser.dob = dob || "";
  currentUser.preferredRoast = roast || "";

  localStorage.setItem('ladolce_user', JSON.stringify(currentUser));

  if (isFirebaseReady && db) {
    db.collection("users").doc(currentUser.email).update({
      name: currentUser.name,
      phone: currentUser.phone,
      dob: currentUser.dob,
      preferredRoast: currentUser.preferredRoast
    }).then(() => console.log("Profile updated on Firestore"));
  }

  updateUserSessionUI();
  showToast("ບັນທຶກຂໍ້ມູນໂປຣໄຟລ໌ຮຽບຮ້ອຍ! 🎉");
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

function claimBirthdayDrink() {
  alert("🎉 ຍິນດີດ້ວຍ! ສິດທິພິເສດເຄື່ອງດື່ມວັນເກີດຟຣີ 1 ຈອກ ຖືກເພີ່ມເຂົ້າສູ່ກະຕ່າຂອງທ່ານແລ້ວ!");
  cart.push({
    cartId: 'c_bday_' + Date.now(),
    itemId: 'bday_drink',
    name: '🎂 Birthday Special Drink (Free Privilege)',
    variant: 'iced',
    milk: 'Whole Milk',
    sweetness: '100%',
    extraShot: false,
    unitPrice: 0,
    quantity: 1,
    total: 0,
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600'
  });
  localStorage.setItem('ladolce_cart', JSON.stringify(cart));
  if (typeof updateCartBadges === 'function') updateCartBadges();
  switchCustomerTab('cart');
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

function openOrderReceiptModal(orderId) {
  const o = orders.find(x => x.id === orderId);
  if (!o) return;
  alert(`🧾 [LA DOLCE e-RECEIPT]\n-------------------------\nເລກບິນ: ${o.id}\nວັນທີ: ${new Date(o.createdAt).toLocaleString()}\nລູກຄ້າ: ${o.customerName}\nເບີໂທ: ${o.customerPhone}\n\nລາຍການ:\n${o.items.map(i=> `- ${i.quantity}x ${i.name} [${i.variant}]: ${formatLAK(i.total)}`).join('\n')}\n-------------------------\nຍອດລວມທັງໝົດ: ${formatLAK(o.total)}\nຊຳລະຜ່ານ: ${o.paymentMethod || 'LAK'}\nສະຖານະ: ສຳເລັດແລ້ວ (Completed)\n\nຂອບໃຈທີ່ມາອຸດໜູນ LA DOLCE!`);
}

function toggleProfileDropdown(e) {
  if (e) e.stopPropagation();
  document.getElementById('profileDropdownMenu')?.classList.toggle('hidden');
}

function closeProfileDropdown() {
  document.getElementById('profileDropdownMenu')?.classList.add('hidden');
}

document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('profileDropdownMenu');
  const trigger = document.getElementById('userProfileChip');
  if (dropdown && !dropdown.contains(e.target) && trigger && !trigger.contains(e.target)) {
    closeProfileDropdown();
  }
});
