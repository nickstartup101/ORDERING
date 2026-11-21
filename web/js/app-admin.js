// =======================================================
// LA DOLCE — ADMIN WEB AUTH & REAL-TIME SYNC
// =======================================================
let adminUser = null;

function showAdminPanel(panel) {
  const superView = document.getElementById('superAdminAppView');
  const staffView = document.getElementById('adminStaffAppView');
  if (superView) superView.classList.toggle('hidden', panel !== 'super');
  if (staffView) staffView.classList.toggle('hidden', panel !== 'staff');
}

async function handleAdminLogin() {
  const email = document.getElementById('adminLoginEmail')?.value.trim().toLowerCase();
  const password = document.getElementById('adminLoginPassword')?.value.trim();
  if (!email || !password) {
    showAtelierToast('ກະລຸນາປ້ອນ Email ແລະ Password', 'warning');
    return;
  }

  let user = null;
  if (isFirebaseReady && db) {
    try {
      const doc = await db.collection('users').doc(email).get();
      if (doc.exists && doc.data().password === password) user = { email, ...doc.data() };
    } catch (err) { console.warn('Admin login error:', err); }
  }
  if (!user) {
    const local = (typeof REGISTERED_ACCOUNTS !== 'undefined')
      ? REGISTERED_ACCOUNTS.find(u => u.email.toLowerCase() === email && u.password === password)
      : null;
    if (local) user = { ...local };
  }
  if (!user || user.role !== 'superadmin') {
    showAtelierToast('ອະນຸຍາດສະເພາະ superadmin ເທົ່ານັ້ນ', 'error');
    return;
  }

  adminUser = user;
  currentUser = user;
  localStorage.setItem('ladolce_user', JSON.stringify(user));
  document.getElementById('adminLoginScreen')?.classList.add('hidden');
  document.getElementById('adminAppShell')?.classList.remove('hidden');
  showAdminPanel('super');
  if (typeof loadAllOwnerData === 'function') loadAllOwnerData();
  showAtelierToast('ເຂົ້າສູ່ Admin Control Center ສຳເລັດ');
}

function logoutAdmin() {
  adminUser = null;
  currentUser = null;
  localStorage.removeItem('ladolce_user');
  document.getElementById('adminAppShell')?.classList.add('hidden');
  document.getElementById('adminLoginScreen')?.classList.remove('hidden');
}

function startAdminRealtimeSync() {
  if (!isFirebaseReady || !db) { setTimeout(startAdminRealtimeSync, 400); return; }
  db.collection('orders').onSnapshot(snapshot => {
    orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (typeof renderStaffOrders === 'function') renderStaffOrders(orders);
    if (typeof renderAnalytics === 'function') renderAnalytics();
  }, err => console.error('Admin orders stream error:', err));

  db.collection('menu_items').onSnapshot(snapshot => {
    menuItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (typeof renderAdminMenuList === 'function') renderAdminMenuList();
    if (typeof renderStaffRunOutMenuList === 'function') renderStaffRunOutMenuList();
  }, err => console.error('Admin menu stream error:', err));
}

window.addEventListener('DOMContentLoaded', () => {
  const stored = JSON.parse(localStorage.getItem('ladolce_user') || 'null');
  if (stored?.role === 'superadmin') {
    adminUser = stored;
    currentUser = stored;
    document.getElementById('adminLoginScreen')?.classList.add('hidden');
    document.getElementById('adminAppShell')?.classList.remove('hidden');
    showAdminPanel('super');
  }
  startAdminRealtimeSync();
  if (typeof loadAllOwnerData === 'function') loadAllOwnerData();
});
