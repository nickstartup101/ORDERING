// =======================================================
// LA DOLCE — STAFF-ONLY APP AUTH & REAL-TIME SYNC
// =======================================================
let staffUser = null;
let staffUserUnsubscribe = null;

function showStaffWorkspace() {
  document.getElementById('staffLoginScreen')?.classList.add('hidden');
  document.getElementById('staffAppShell')?.classList.remove('hidden');
  document.getElementById('adminStaffAppView')?.classList.remove('hidden');
}

async function handleStaffLogin() {
  const email = document.getElementById('staffLoginEmail')?.value.trim().toLowerCase();
  const password = document.getElementById('staffLoginPassword')?.value.trim();
  if (!email || !password) {
    showAtelierToast('ກະລຸນາປ້ອນ Email ແລະ Password', 'warning');
    return;
  }

  let user = null;
  if (isFirebaseReady && db) {
    try {
      const doc = await db.collection('users').doc(email).get();
      if (doc.exists && doc.data().password === password) user = { email, ...doc.data() };
    } catch (err) { console.warn('Staff login error:', err); }
  }
  if (!user) {
    const local = (typeof REGISTERED_ACCOUNTS !== 'undefined')
      ? REGISTERED_ACCOUNTS.find(u => u.email.toLowerCase() === email && u.password === password)
      : null;
    if (local) user = { ...local };
  }
  if (!user || !['staff','superadmin'].includes(user.role)) {
    showAtelierToast('ອະນຸຍາດສະເພາະ staff ຫຼື superadmin ເທົ່ານັ້ນ', 'error');
    return;
  }

  staffUser = user;
  currentUser = user;
  localStorage.setItem('ladolce_user', JSON.stringify(user));
  showStaffWorkspace();
  startCurrentUserSync();
  initStaffPushNotifications();
  showAtelierToast('ເຂົ້າສູ່ Kitchen Display ສຳເລັດ');
}

function startCurrentUserSync() {
  if (staffUserUnsubscribe) staffUserUnsubscribe();
  staffUserUnsubscribe = null;
  if (!currentUser?.email || !isFirebaseReady || !db) return;
  staffUserUnsubscribe = db.collection('users').doc(currentUser.email.toLowerCase()).onSnapshot(doc => {
    if (!doc.exists) return;
    const cloudData = doc.data();
    currentUser = { ...currentUser, ...cloudData };
    staffUser = currentUser;
    localStorage.setItem('ladolce_user', JSON.stringify(currentUser));
    if (typeof renderStaffControls === 'function') renderStaffControls();
  }, err => console.warn('Staff permissions sync error:', err));
}

async function logoutStaff() {
  try {
    await deactivateStaffPushToken();
  } catch (err) {
    console.error('Unable to deactivate staff push token:', err);
    showAtelierToast('ປິດການແຈ້ງເຕືອນ Push ບໍ່ສຳເລັດ', 'warning');
  }
  if (staffUserUnsubscribe) staffUserUnsubscribe();
  staffUser = null;
  currentUser = null;
  localStorage.removeItem('ladolce_user');
  document.getElementById('staffAppShell')?.classList.add('hidden');
  document.getElementById('adminStaffAppView')?.classList.add('hidden');
  document.getElementById('staffLoginScreen')?.classList.remove('hidden');
}

function startStaffRealtimeSync() {
  if (!isFirebaseReady || !db) { setTimeout(startStaffRealtimeSync, 400); return; }
  db.collection('orders').onSnapshot(snapshot => {
    orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (typeof renderStaffOrders === 'function') renderStaffOrders(orders);
    if (typeof flushPendingStaffPushOrderReview === 'function') flushPendingStaffPushOrderReview();
  }, err => console.error('Staff orders stream error:', err));

  db.collection('menu_items').onSnapshot(snapshot => {
    menuItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (typeof renderStaffRunOutMenuList === 'function' && window.staffMenuPanelOpen) renderStaffRunOutMenuList();
  }, err => console.error('Staff menu stream error:', err));
}

window.addEventListener('DOMContentLoaded', () => {
  const stored = JSON.parse(localStorage.getItem('ladolce_user') || 'null');
  if (stored && ['staff','superadmin'].includes(stored.role)) {
    staffUser = stored;
    currentUser = stored;
    showStaffWorkspace();
    startCurrentUserSync();
    initStaffPushNotifications();
  }
  startStaffRealtimeSync();
  if (typeof renderStaffHeaderBrand === 'function') renderStaffHeaderBrand();
  if (typeof renderStaffControls === 'function') renderStaffControls();
});
