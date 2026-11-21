// =======================================================
// LA DOLCE — AUTHENTICATION, PROFILE & ORDER HISTORY (NO TIMEOUT)
// =======================================================

let isRegisterMode = false;
let profileSubTab = 'info';
let userDocUnsubscribe = null;

function openAuthModal(mode = 'login') {
  isRegisterMode = (mode === 'register');
  document.getElementById('authNameBox')?.classList.toggle('hidden', !isRegisterMode);
  const titleEl = document.getElementById('authModalTitle');
  const btnEl = document.getElementById('btnAuthSubmit');
  const toggleEl = document.getElementById('authToggleText');

  if (titleEl) titleEl.textContent = isRegisterMode ? "ສະໝັກສະມາຊິກ" : "Sign In";
  if (btnEl) btnEl.textContent = isRegisterMode ? "ສະໝັກສະມາຊິກ" : "Sign In";
  if (toggleEl) {
    toggleEl.textContent = isRegisterMode
      ? "ມີບັນຊີແລ້ວ? ເຂົ້າສູ່ລະບົບ (Sign In)"
      : "ຍັງບໍ່ມີບັນຊີ? ສະໝັກສະມາຊິກໃໝ່";
  }

  document.getElementById('authModal')?.classList.remove('hidden');
}

function closeAuthModal() {
  document.getElementById('authModal')?.classList.add('hidden');
}

function toggleAuthMode() {
  openAuthModal(isRegisterMode ? 'login' : 'register');
}

function startCurrentUserSync() {
  if (userDocUnsubscribe) {
    userDocUnsubscribe();
    userDocUnsubscribe = null;
  }
  if (!currentUser || !currentUser.email || !db) return;

  userDocUnsubscribe = db.collection("users").doc(currentUser.email.toLowerCase()).onSnapshot(doc => {
    if (!doc.exists) return;
    const cloudData = doc.data();
    const prevRole = currentUser.role;
    const prevPerm = JSON.stringify(currentUser.permissions || {});

    currentUser = { ...currentUser, ...cloudData };
    localStorage.setItem('ladolce_user', JSON.stringify(currentUser));

    const newPerm = JSON.stringify(currentUser.permissions || {});
    if (prevRole !== currentUser.role) {
      dispatchRoleView(currentUser.role);
    } else if (prevPerm !== newPerm && currentUser.role === 'staff') {
      if (typeof renderStaffControls === 'function') renderStaffControls();
    }
  }, err => console.warn("User sync error:", err));
}

async function handleAuthSubmit() {
  const emailInput = document.getElementById('authEmail')?.value.trim().toLowerCase();
  const passInput = document.getElementById('authPassword')?.value.trim();
  const nameInput = document.getElementById('authName')?.value.trim();

  if (!emailInput || !passInput) {
    showAtelierToast("ກະລຸນາປ້ອນອີເມວ ແລະ ລະຫັດຜ່ານ!", "warning");
    return;
  }

  showAtelierToast("ກຳລັງກວດສອບ...");

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
      permissions: { canToggleStore: false, canToggleMenu: false },
      createdAt: new Date().toISOString()
    };

    if (isFirebaseReady && db) {
      try {
        await db.collection("users").doc(emailInput).set(newUser, { merge: true });
      } catch (e) {}
    }

    currentUser = newUser;
    localStorage.setItem('ladolce_user', JSON.stringify(currentUser));
    startCurrentUserSync();
    closeAuthModal();
    dispatchRoleView(currentUser.role);
    showAtelierToast("ສະໝັກສະມາຊິກສຳເລັດ!");
  } else {
    let authenticatedUser = null;

    if (isFirebaseReady && db) {
      try {
        const doc = await db.collection("users").doc(emailInput).get();
        if (doc.exists) {
          const userData = doc.data();
          if (userData.password === passInput) {
            authenticatedUser = userData;
          } else if (userData.password && userData.password !== passInput) {
            showAtelierToast("Email ຫຼື Password ບໍ່ຖືກຕ້ອງ!", "error");
            return;
          }
        }
      } catch (_) {}
    }

    if (!authenticatedUser && typeof REGISTERED_ACCOUNTS !== 'undefined') {
      const matched = REGISTERED_ACCOUNTS.find(u => u.email.toLowerCase() === emailInput && u.password === passInput);
      if (matched) authenticatedUser = { ...matched };
    }

    if (!authenticatedUser) {
      showAtelierToast("Email ຫຼື Password ບໍ່ຖືກຕ້ອງ!", "error");
      return;
    }

    currentUser = authenticatedUser;
    localStorage.setItem('ladolce_user', JSON.stringify(currentUser));
    startCurrentUserSync();
    closeAuthModal();
    dispatchRoleView(currentUser.role);
    showAtelierToast(`ຍິນດີຕ້ອນຮັບ, ${currentUser.name}!`);
  }
}

function logoutUser() {
  if (userDocUnsubscribe) {
    userDocUnsubscribe();
    userDocUnsubscribe = null;
  }
  currentUser = null;
  localStorage.removeItem('ladolce_user');
  if (typeof stopStaffAlarm === 'function') stopStaffAlarm();
  dispatchRoleView('customer');
  showAtelierToast("ອອກຈາກລະບົບແລ້ວ");
}

function dispatchRoleView(role) {
  if (role === 'superadmin') {
    window.location.href = 'admin.html';
    return;
  }
  const customerView = document.getElementById('customerAppView');
  if (customerView) customerView.classList.remove('hidden');
  const bottomNav = document.getElementById('customerBottomNav');
  if (bottomNav) bottomNav.classList.remove('hidden');
  const roleBadge = document.getElementById('currentRoleBadge');
  if (roleBadge) roleBadge.textContent = 'Customer View';
  updateUserSessionUI();
}

function updateUserSessionUI() {
  const authBtns = document.getElementById('authHeaderButtons');
  const btnLogin = document.getElementById('btnLoginHeader');
  const userChip = document.getElementById('userProfileChip');
  const roleLinksContainer = document.getElementById('dropdownRoleLinks');

  if (currentUser) {
    if (authBtns) authBtns.classList.add('hidden');
    else if (btnLogin) btnLogin.classList.add('hidden');
    if (userChip) userChip.classList.remove('hidden');

    const avatar = document.getElementById('avatarText');
    const uName = document.getElementById('dropdownUserName');
    const uEmail = document.getElementById('dropdownUserEmail');
    const uRole = document.getElementById('dropdownUserRole');

    if (avatar) avatar.textContent = (currentUser.name || 'U').charAt(0).toUpperCase();
    if (uName) uName.textContent = currentUser.name;
    if (uEmail) uEmail.textContent = currentUser.email;
    if (uRole) uRole.textContent = currentUser.role || 'customer';

    if (roleLinksContainer) {
      if (currentUser.role === 'superadmin') {
        roleLinksContainer.innerHTML = `
          <button type="button" onclick="window.location.href='admin.html'; closeProfileDropdown();" class="w-full text-left px-3 py-2 rounded-xl text-[12px] font-bold text-forest-emerald hover:bg-surface flex items-center gap-2 transition-colors cursor-pointer">
            ${svgIcon('shield', 'w-4 h-4')}
            <span>ສູນຄວບຄຸມ (Control Center)</span>
          </button>
          <button type="button" onclick="switchCustomerTab('ticket'); closeProfileDropdown();" class="w-full text-left px-3 py-2 rounded-xl text-[12px] font-medium text-charcoal hover:bg-surface flex items-center gap-2 transition-colors cursor-pointer">
            ${svgIcon('ticket', 'w-4 h-4')}
            <span>ບິນສັ່ງຊື້ (Orders Audit)</span>
          </button>
        `;
      } else {
        roleLinksContainer.innerHTML = `
          <button type="button" onclick="switchCustomerTab('profile'); closeProfileDropdown();" class="w-full text-left px-3 py-2 rounded-xl text-[12px] font-medium text-charcoal hover:bg-surface flex items-center gap-2 transition-colors cursor-pointer">
            <span class="text-forest-emerald">${svgIcon('user', 'w-4 h-4')}</span>
            <span>ໂປຣໄຟລ໌ຂອງຂ້ອຍ</span>
          </button>
          <button type="button" onclick="switchCustomerTab('ticket'); closeProfileDropdown();" class="w-full text-left px-3 py-2 rounded-xl text-[12px] font-medium text-charcoal hover:bg-surface flex items-center gap-2 transition-colors cursor-pointer">
            <span class="text-forest-emerald">${svgIcon('ticket', 'w-4 h-4')}</span>
            <span>ປີ້ຮັບເຄື່ອງ (My Ticket)</span>
          </button>
        `;
      }
    }
  } else {
    if (authBtns) authBtns.classList.remove('hidden');
    else if (btnLogin) btnLogin.classList.remove('hidden');
    if (userChip) userChip.classList.add('hidden');
  }
}

function switchProfileSubTab(tab) {
  profileSubTab = tab;
  renderCustomerProfile();
}

function getCustomerOrderHistoryList() {
  const localIds = new Set([
    ...JSON.parse(localStorage.getItem('customer_order_ids') || '[]'),
    ...JSON.parse(localStorage.getItem('dismissed_customer_orders') || '[]')
  ]);
  const myEmail = currentUser?.email ? currentUser.email.toLowerCase() : null;
  const myPhone = currentUser?.phone ? currentUser.phone.replace(/\s+/g, '') : null;
  const myName = currentUser?.name ? currentUser.name.trim().toLowerCase() : null;

  return (orders || []).filter(o => {
    if (!o) return false;
    const isFinished = o.status === 'completed' || o.status === 'ready' || o.status === 'rejected';
    if (!isFinished) return false;

    const matchLocal = localIds.has(o.id);
    const matchEmail = myEmail && o.customerEmail && o.customerEmail.toLowerCase() === myEmail;
    const matchId = myEmail && o.customerId && String(o.customerId).toLowerCase() === myEmail;
    const matchPhone = myPhone && o.customerPhone && o.customerPhone.replace(/\s+/g, '') === myPhone;
    const matchName = myName && o.customerName && o.customerName.trim().toLowerCase() === myName;

    return matchLocal || matchEmail || matchId || matchPhone || matchName;
  });
}

function renderCustomerProfile() {
  const container = document.getElementById('profileTabContent');
  if (!container) return;

  const cafeName = (typeof brandSettings !== 'undefined' && brandSettings?.cafeName) ? brandSettings.cafeName : 'LA DOLCE';
  const brandInitials = (typeof brandSettings !== 'undefined' && brandSettings?.brandInitials) ? brandSettings.brandInitials : 'LD';

  const myHistory = getCustomerOrderHistoryList();

  if (!currentUser) {
    container.innerHTML = `
      <div class="max-w-lg mx-auto space-y-4">
        <div class="p-8 bg-surface-pure border border-hairline rounded-2xl text-center space-y-3 shadow-xs">
          <div class="w-12 h-12 rounded-full bg-surface mx-auto flex items-center justify-center text-forest-leaf/70">
            ${svgIcon('user', 'w-6 h-6')}
          </div>
          <h3 class="font-serif-title text-[18px] text-primary font-medium">ເຂົ້າສູ່ລະບົບສະມາຊິກ</h3>
          <p class="text-[12px] text-taupe font-lao">ເຂົ້າສູ່ລະບົບເພື່ອບັນທຶກຂໍ້ມູນການສັ່ງຊື້, ຮັບສິດທິພິເສດວັນເກີດ ແລະ ເບິ່ງປະຫວັດໃບບິນ</p>
          <div class="flex items-center justify-center gap-2 pt-1">
            <button type="button" onclick="openAuthModal('login')" class="px-4 py-2.5 rounded-lg border-2 border-forest-emerald text-forest-emerald text-[12px] font-semibold hover:bg-forest-emerald hover:text-white transition-all cursor-pointer">
              ເຂົ້າສູ່ລະບົບ
            </button>
            <button type="button" onclick="openAuthModal('register')" class="px-4 py-2.5 rounded-lg bg-forest-emerald text-white text-[12px] font-semibold hover:bg-forest-leaf transition-all shadow-xs cursor-pointer">
              ສະໝັກສະມາຊິກ
            </button>
          </div>
        </div>

        ${myHistory.length > 0 ? renderHistoryCardHtml(myHistory) : ''}
      </div>
    `;
    return;
  }

  const completedOnly = myHistory.filter(o => o.status === 'completed' || o.status === 'ready');
  const totalSpent = completedOnly.reduce((sum, o) => sum + (Number(o.totalAmount ?? o.total) || 0), 0);
  const totalCups = completedOnly.reduce((sum, o) => sum + (o.items ? o.items.reduce((s, i) => s + (i.quantity || 1), 0) : 0), 0);

  const today = new Date();
  let isBirthdayMonth = false;
  if (currentUser.dob) {
    const birthDate = new Date(currentUser.dob);
    if (birthDate.getMonth() === today.getMonth()) isBirthdayMonth = true;
  }

  container.innerHTML = `
    <div class="max-w-lg mx-auto space-y-4">
      <div class="p-5 bg-forest-gradient text-white rounded-2xl shadow-md space-y-2 relative overflow-hidden">
        <div class="flex justify-between items-center">
          <div>
            <span class="text-[10px] uppercase tracking-widest text-emerald-300 font-bold">${cafeName} Member</span>
            <h3 class="font-serif-title text-[20px] font-bold mt-0.5">${currentUser.name}</h3>
            <p class="text-[11px] opacity-80 font-mono">${currentUser.email}</p>
          </div>
          <span class="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center font-serif font-bold ${brandInitials.length >= 3 ? 'text-[12px]' : 'text-[16px]'}">${brandInitials}</span>
        </div>
      </div>

      ${isBirthdayMonth ? `
        <div class="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-400 space-y-2 animate-slide-down">
          <div class="flex items-center gap-2 text-amber-900 font-bold text-[13px]">
            ${svgIcon('gift', 'w-5 h-5 text-amber-700')}
            <span>Happy Birthday Month, ${currentUser.name}!</span>
          </div>
          <p class="text-[11px] text-amber-900/80 leading-relaxed font-lao">
            ສຸກສັນເດືອນເກີດຂອງທ່ານ! ${cafeName} ມອບສິດທິພິເສດ <strong>ດື່ມກາເຟ ຫຼື ເຄື່ອງດື່ມຟຣີ 1 ຈອກ</strong> ໃນເດືອນນີ້.
          </p>
          <button type="button" onclick="claimBirthdayDrink()" class="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer">
            ${svgIcon('gift', 'w-4 h-4')}
            <span>ກົດຮັບສິດດື່ມຟຣີເລີຍ</span>
          </button>
        </div>
      ` : ''}

      <div class="flex gap-2 border-b border-hairline pb-2">
        <button type="button" onclick="switchProfileSubTab('info')" class="flex-1 py-2 rounded-xl text-[12px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${profileSubTab === 'info' ? 'bg-forest-emerald text-white shadow-xs' : 'bg-surface border border-hairline text-taupe hover:text-charcoal'}">
          ${svgIcon('badge', 'w-4 h-4')}
          <span>ຂໍ້ມູນລູກຄ້າ</span>
        </button>

        <button type="button" onclick="switchProfileSubTab('history')" class="flex-1 py-2 rounded-xl text-[12px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${profileSubTab === 'history' ? 'bg-forest-emerald text-white shadow-xs' : 'bg-surface border border-hairline text-taupe hover:text-charcoal'}">
          ${svgIcon('ticket', 'w-4 h-4')}
          <span>ປະຫວັດບິນ (${myHistory.length})</span>
        </button>
      </div>

      ${profileSubTab === 'info' ? `
        <div class="space-y-4 animate-slide-down">
          <div class="grid grid-cols-2 gap-3">
            <div class="p-3.5 bg-surface-pure border border-hairline rounded-xl shadow-xs">
              <span class="text-[10px] uppercase font-bold text-taupe block">ຈຳນວນຈອກທີ່ເຄີຍສັ່ງ</span>
              <span class="font-serif-title text-[20px] font-bold text-primary mt-0.5 block">${totalCups} ຈອກ</span>
              <span class="text-[10px] text-emerald-800 inline-flex items-center gap-1 mt-0.5">${svgIcon('coffee', 'w-3 h-3')} Coffee Lover</span>
            </div>
            <div class="p-3.5 bg-surface-pure border border-hairline rounded-xl shadow-xs">
              <span class="text-[10px] uppercase font-bold text-taupe block">ຍອດຊື້ສະສົມ</span>
              <span class="font-serif-title text-[18px] font-bold text-forest-emerald mt-0.5 block">${formatLAK(totalSpent)}</span>
              <span class="text-[10px] text-taupe font-mono">${completedOnly.length} ບິນສຳເລັດ</span>
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
                  ${currentUser.isPhoneVerified ? 'ຢືນຢັນແລ້ວ' : 'ຢືນຢັນ OTP'}
                </button>
              </div>
            </div>
            <div>
              <label class="block text-taupe mb-1 font-medium">ວັນເດືອນປີເກີດ (ຮັບສິດທິພິເສດວັນເກີດ):</label>
              <input type="date" id="profDobInput" value="${currentUser.dob || ''}" class="w-full rounded-lg border border-hairline p-2"/>
            </div>
            <div>
              <label class="block text-taupe mb-1 font-medium">ລົດຊາດກາເຟທີ່ມັກ (Tasting Notes):</label>
              <input type="text" id="profRoastInput" placeholder="ເຊັ່ນ: ຄົ້ວອ່ອນ Guji, ນົມໂອດ, ຫວານ 50%" value="${currentUser.preferredRoast || ''}" class="w-full rounded-lg border border-hairline p-2"/>
            </div>
            <button type="button" onclick="saveCustomerInfoDetails()" class="w-full py-2.5 rounded-lg bg-forest-emerald text-white text-[12px] font-bold hover:bg-forest-leaf transition-all shadow-xs cursor-pointer">
              ບັນທຶກຂໍ້ມູນໂປຣໄຟລ໌
            </button>
          </div>
        </div>
      ` : renderHistoryCardHtml(myHistory)}
    </div>
  `;
}

function renderHistoryCardHtml(myHistory) {
  return `
    <div class="p-5 bg-surface-pure border border-hairline rounded-2xl space-y-3 shadow-xs animate-slide-down font-lao">
      <div class="flex justify-between items-center border-b border-hairline pb-2">
        <h4 class="font-serif-title font-bold text-[16px] text-primary">ປະຫວັດການສັ່ງຊື້</h4>
        <span class="text-[11px] text-taupe font-mono">${myHistory.length} ບິນ</span>
      </div>

      <div class="divide-y divide-hairline">
        ${myHistory.length === 0 ? `
          <p class="text-center text-taupe text-[12px] py-6">ຍັງບໍ່ມີປະຫວັດອໍເດີ້</p>
        ` : myHistory.map(o => {
          const dateStr = o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000).toLocaleDateString() : new Date(o.createdAt || Date.now()).toLocaleDateString();
          const code = o.orderCode || o.id.slice(0, 6).toUpperCase();
          const statusLabel = o.status === 'completed' ? 'ສຳເລັດ' : o.status === 'ready' ? 'ພ້ອມຮັບ' : 'ປະຕິເສດ';
          const statusColor = o.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-emerald-50 text-emerald-800';

          return `
            <div class="py-3.5 flex justify-between items-start gap-2">
              <div>
                <div class="flex items-center gap-1.5">
                  <span class="font-mono font-bold text-forest-emerald text-[13px]">#${code}</span>
                  <span class="px-1.5 py-0.5 rounded text-[9px] font-bold ${statusColor}">${statusLabel}</span>
                </div>
                <p class="text-[12px] font-medium text-charcoal mt-0.5">${(o.items || []).map(i => `${i.quantity}x ${i.name}`).join(', ')}</p>
                <span class="text-[10px] text-taupe block mt-0.5">${dateStr} • ${o.paymentMethod || 'QR'}</span>
              </div>
              <div class="text-right shrink-0">
                <span class="font-bold text-forest-emerald font-mono block text-[13px]">${formatLAK(o.totalAmount ?? o.total)}</span>
                <div class="flex items-center gap-1.5 mt-1.5 justify-end">
                  <button type="button" onclick="openOrderReceiptModal('${o.id}')" class="text-[10px] px-2.5 py-1 rounded-lg bg-surface hover:bg-forest-emerald hover:text-white border border-hairline text-charcoal font-bold inline-flex items-center gap-1 transition-colors cursor-pointer">
                    ${svgIcon('ticket', 'w-3 h-3')} <span>ໃບບິນ</span>
                  </button>
                  <button type="button" onclick="reorderPreviousItems('${o.id}')" class="text-[10px] text-forest-emerald bg-forest-emerald/10 hover:bg-forest-emerald hover:text-white px-2.5 py-1 rounded-lg font-bold transition-colors inline-flex items-center gap-1 cursor-pointer">
                    ${svgIcon('refresh', 'w-3 h-3')} <span>ສັ່ງຊ້ຳ</span>
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function saveCustomerInfoDetails() {
  const name = document.getElementById('profNameInput')?.value.trim();
  const phone = document.getElementById('profPhoneInput')?.value.trim();
  const dob = document.getElementById('profDobInput')?.value;
  const roast = document.getElementById('profRoastInput')?.value.trim();

  if (!name) {
    showAtelierToast("ກະລຸນາໃສ່ຊື່ຂອງທ່ານ!", "warning");
    return;
  }

  currentUser.name = name;
  currentUser.phone = phone || currentUser.phone;
  currentUser.dob = dob || "";
  currentUser.preferredRoast = roast || "";
  localStorage.setItem('ladolce_user', JSON.stringify(currentUser));

  if (isFirebaseReady && db) {
    db.collection("users").doc(currentUser.email).set({
      name: currentUser.name,
      phone: currentUser.phone,
      dob: currentUser.dob,
      preferredRoast: currentUser.preferredRoast
    }, { merge: true }).catch(() => {});
  }

  updateUserSessionUI();
  showAtelierToast("ບັນທຶກຂໍ້ມູນໂປຣໄຟລ໌ຮຽບຮ້ອຍ!");
}

function verifyCustomerPhone() {
  if (currentUser.isPhoneVerified) {
    showAtelierToast("ເບີໂທລະສັບນີ້ໄດ້ຮັບການຢືນຢັນແລ້ວ");
    return;
  }
  const otp = prompt("ລະບົບໄດ້ສົ່ງລະຫັດ OTP ໄປຫາເບີ " + currentUser.phone + " (ລະຫັດທົດສອບ: 8899):");
  if (otp === "8899") {
    currentUser.isPhoneVerified = true;
    localStorage.setItem('ladolce_user', JSON.stringify(currentUser));
    if (isFirebaseReady && db) db.collection("users").doc(currentUser.email).set({ isPhoneVerified: true }, { merge: true }).catch(() => {});
    renderCustomerProfile();
    showAtelierToast("ເບີໂທລະສັບຢືນຢັນສຳເລັດ!");
  } else if (otp) {
    showAtelierToast("ລະຫັດ OTP ບໍ່ຖືກຕ້ອງ!", "error");
  }
}

function claimBirthdayDrink() {
  cart.push({
    cartItemId: 'item_bday_' + Date.now(),
    id: 'bday_drink',
    name: 'Birthday Special Drink (Free Privilege)',
    variant: 'iced',
    milk: 'Whole Milk',
    sweetness: '100%',
    unitPrice: 0,
    quantity: 1,
    totalPrice: 0,
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600'
  });
  localStorage.setItem('ladolce_cart', JSON.stringify(cart));
  if (typeof updateCartBadge === 'function') updateCartBadge();
  showAtelierToast("ເພີ່ມເຄື່ອງດື່ມວັນເກີດຟຣີໃສ່ກະຕ່າແລ້ວ!");
  switchCustomerTab('cart');
}

function reorderPreviousItems(orderId) {
  const target = (orders || []).find(o => o.id === orderId);
  if (!target) return;

  (target.items || []).forEach(it => {
    cart.push({
      ...it,
      cartItemId: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      totalPrice: Number(it.totalPrice ?? (Number(it.unitPrice || 0) * Number(it.quantity || 1)))
    });
  });

  localStorage.setItem('ladolce_cart', JSON.stringify(cart));
  if (typeof updateCartBadge === 'function') updateCartBadge();
  showAtelierToast("ເພີ່ມສິນຄ້າຈາກອໍເດີ້ເກົ່າເຂົ້າກະຕ່າແລ້ວ!");
  switchCustomerTab('cart');
}

function openOrderReceiptModal(orderId) {
  const o = (orders || []).find(x => x.id === orderId);
  if (!o) return;
  const cafeName = (typeof brandSettings !== 'undefined' && brandSettings?.cafeName) ? brandSettings.cafeName : 'LA DOLCE';
  const dateStr = o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000).toLocaleString() : new Date(o.createdAt || Date.now()).toLocaleString();
  const itemsHtml = (o.items || []).map(i => `${i.quantity}x ${i.name} [${formatVariantLabel(i.variant)}]: ${formatLAK(i.totalPrice ?? i.price)}`).join('<br/>');
  showAtelierAlert({
    title: `${cafeName} e-RECEIPT #${o.orderCode || o.id}`,
    message: `ວັນທີ: ${dateStr}<br/>ລູກຄ້າ: ${o.customerName}<br/><br/>${itemsHtml}<br/><br/><strong>ຍອດລວມ: ${formatLAK(o.totalAmount ?? o.total)}</strong> (${o.paymentMethod || 'QR'})`,
    type: 'success',
    confirmText: 'ປິດໃບບິນ'
  });
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

if (currentUser) startCurrentUserSync();
