// =======================================================
// LA DOLCE — CORE CONFIGURATION, BRAND & STORE SYNC
// =======================================================

const firebaseConfig = {
  apiKey: "AIzaSyA7wNI6iwyqcv1gwKkzZ_1YEEGNMnYqABc",
  authDomain: "ladolceordering.firebaseapp.com",
  projectId: "ladolceordering",
  storageBucket: "ladolceordering.firebasestorage.app",
  messagingSenderId: "901115903068",
  appId: "1:901115903068:web:983f7100ad9d3b120b7a99",
  measurementId: "G-N4J9E1JEZ3"
};

let db = null;
let auth = null;
let isFirebaseReady = false;

try {
  if (typeof firebase !== "undefined") {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    try {
      db.settings({ experimentalForceLongPolling: true });
    } catch (settingErr) {
      console.warn("Firestore settings note:", settingErr);
    }
    auth = firebase.auth();
    isFirebaseReady = true;
    console.log("Cloud Firestore Initialized Successfully");
  }
} catch (e) {
  console.warn("Firestore initialization error:", e);
}

const ICONS = {
  storefront: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 3 0"/><path d="M5 11.5V20h14v-8.5"/><path d="M9 20v-5h6v5"/></svg>`,
  bike: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h3"/></svg>`,
  bag: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
  coffee: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></svg>`,
  ticket: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M8 7h8"/><path d="M8 11h8"/><path d="M8 15h5"/></svg>`,
  user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  checkCircle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  xCircle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  alert: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
  refresh: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  minus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  copy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
  upload: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
  note: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`,
  bell: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
  cash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>`,
  qr: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM17 17h4v4h-4zM14 20h3"/></svg>`,
  coupon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>`,
  chevronDown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,
  logout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  spinner: `<svg class="animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M22 12a10 10 0 0 0-10-10" stroke-linecap="round"/></svg>`,
  edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  store: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 3 0"/><path d="M5 11.5V20h14v-8.5"/></svg>`,
  barChart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>`,
  menuList: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
  tune: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>`,
  users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  gift: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>`,
  badge: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M15 8h2"/><path d="M15 12h2"/><path d="M7 16h10"/></svg>`
};

function svgIcon(name, className = "w-4 h-4") {
  const raw = ICONS[name] || ICONS.info;
  return raw.replace('<svg ', `<svg class="${className} shrink-0" `);
}

const REGISTERED_ACCOUNTS = [
  { email: "customer@ladolce.com", password: "123", name: "Nick Test", role: "customer", phone: "+856 20 5512 8899", permissions: {} },
  { email: "staff@ladolce.com", password: "123", name: "Cashiers (Barista Lead)", role: "staff", phone: "+856 20 7788 9900", permissions: { canToggleStore: false, canToggleMenu: false } },
  { email: "owner@ladolce.com", password: "123", name: "Namfon (Superadmin)", role: "superadmin", phone: "+856 20 9900 1122", permissions: { canToggleStore: true, canToggleMenu: true } }
];

const DEFAULT_PAYMENTS = [
  { id: "pay_bcel", bankName: "BCEL One", accountNumber: "010-12-00-12345678", borderColor: "#DC2626", qrImage: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=BCEL_ONEPAY_LADOLCE" },
  { id: "pay_ldb", bankName: "LDB Bank", accountNumber: "030-01-22-98765432", borderColor: "#2563EB", qrImage: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=LDB_PAY_LADOLCE" }
];

const DEFAULT_MODIFIERS = [
  { id: "mod_whole", group: "milk", name: "Whole Milk (ນົມສົດແທ້)", price: 0 },
  { id: "mod_oat", group: "milk", name: "Oatly Barista (ນົມເຂົ້າໂອດ)", price: 15000 },
  { id: "mod_almond", group: "milk", name: "Almond Milk (ນົມອານມອນດ໌)", price: 15000 },
  { id: "mod_shot", group: "topping", name: "Extra Double Ristretto Shot", price: 12000 }
];

let menuItems = [];
let paymentMethods = JSON.parse(localStorage.getItem('ladolce_payment_methods')) || DEFAULT_PAYMENTS;
let modifiers = JSON.parse(localStorage.getItem('ladolce_modifiers')) || DEFAULT_MODIFIERS;
let orders = [];
let cart = JSON.parse(localStorage.getItem('ladolce_cart')) || [];
let currentUser = JSON.parse(localStorage.getItem('ladolce_user')) || null;
let userAccounts = JSON.parse(localStorage.getItem('ladolce_accounts')) || REGISTERED_ACCOUNTS;
let storeSettings = JSON.parse(localStorage.getItem('ladolce_store_settings')) || { isStoreOpen: true, taxRatePercent: 0 };
let brandSettings = JSON.parse(localStorage.getItem('ladolce_brand_settings')) || {
  cafeName: 'LA DOLCE',
  cafeBranch: 'Downtown Flagship Roastery',
  brandInitials: 'LD'
};
let cloudUsers = [];

function generateBrandInitials(name) {
  const clean = String(name || '').trim();
  if (!clean) return 'LD';
  const ignoreWords = new Set(['cafe', 'coffee', 'roastery', 'atelier', 'shop', 'house', 'bar', 'tea']);
  const allWords = clean.split(/\s+/).filter(Boolean);
  const meaningful = allWords.filter(w => !ignoreWords.has(w.toLowerCase()));
  const words = meaningful.length > 0 ? meaningful : allWords;

  if (words.length >= 2) {
    return words.slice(0, 3).map(w => w.charAt(0).toUpperCase()).join('');
  }
  const word = words[0].replace(/[^a-zA-Z0-9\u0E80-\u0EFF]/g, '');
  if (word.length <= 3) return word.toUpperCase();
  const first = word.charAt(0);
  const restConsonants = word.slice(1).replace(/[aeiouAEIOU]/g, '');
  const initials = (first + restConsonants).slice(0, 3);
  return (initials.length >= 2 ? initials : word.slice(0, 3)).toUpperCase();
}

function applyBrandSettingsUI() {
  const cafeName = brandSettings?.cafeName || 'LA DOLCE';
  const cafeBranch = brandSettings?.cafeBranch || 'Downtown Flagship Roastery';
  const initials = brandSettings?.brandInitials || generateBrandInitials(cafeName);

  document.title = `${cafeName} — ${cafeBranch}`;
  document.querySelectorAll('.brand-name-display').forEach(el => el.textContent = cafeName);
  document.querySelectorAll('.brand-branch-display').forEach(el => {
    el.textContent = `${cafeName} • ${cafeBranch}`;
  });
  document.querySelectorAll('.brand-initial-display').forEach(el => {
    el.textContent = initials;
    el.style.fontSize = initials.length >= 3 ? '11px' : '15px';
  });

  if (typeof renderStaffHeaderBrand === 'function') renderStaffHeaderBrand();
  if (typeof renderCustomerProfile === 'function') renderCustomerProfile();
  if (typeof renderCustomerTicket === 'function') renderCustomerTicket();
}

window.updateStoreStatusUI = function() {
  const isOpen = storeSettings?.isStoreOpen !== false;
  const adminBtn = document.getElementById('btnToggleStore');
  if (adminBtn) {
    adminBtn.textContent = isOpen ? 'ສະຖານະ: ເປີດຮ້ານ (ກົດເພື່ອປິດ)' : 'ສະຖານະ: ປິດຊົ່ວຄາວ (ກົດເພື່ອເປີດ)';
    adminBtn.className = `px-3 py-1.5 rounded-lg text-white text-[11px] font-medium cursor-pointer ${isOpen ? 'bg-emerald-800' : 'bg-red-700'}`;
  }

  const taxEl = document.getElementById('taxSettingsDisplay');
  if (taxEl) taxEl.textContent = `Tax: ${Number(storeSettings?.taxRatePercent || 0)}% (ປັບປ່ຽນ)`;

  const badge = document.getElementById('customerStoreOpenBadge');
  if (badge) {
    badge.innerHTML = isOpen
      ? `<span class="relative flex h-2 w-2"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span></span><span class="text-[11px] font-bold text-emerald-900 tracking-wide font-lao">ເປີດບໍລິການ (07:00 – 20:00)</span>`
      : `<span class="h-2 w-2 rounded-full bg-red-600"></span><span class="text-[11px] font-bold text-red-800 tracking-wide font-lao">ປິດບໍລິການຊົ່ວຄາວ</span>`;
  }
};

// ປິດ/ເປີດຮ້ານ (ໃຊ້ໄດ້ທັງ Staff ທີ່ໄດ້ຮັບສິດ ແລະ Superadmin ພ້ອມ Sync ໄປລູກຄ້າ)
window.toggleStoreStatus = async function() {
  const nextOpen = !(storeSettings?.isStoreOpen !== false);
  storeSettings.isStoreOpen = nextOpen;
  localStorage.setItem('ladolce_store_settings', JSON.stringify(storeSettings));
  window.updateStoreStatusUI();
  if (typeof renderStaffStoreControl === 'function') renderStaffStoreControl();

  try {
    const firestore = db || firebase.firestore();
    await firestore.collection('settings').doc('store').set({
      isStoreOpen: nextOpen,
      taxRatePercent: Number(storeSettings?.taxRatePercent || 0),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    if (typeof showAtelierToast === 'function') {
      showAtelierToast(nextOpen ? 'ເປີດຮັບອໍເດີ້ແລ້ວ' : 'ປິດຮັບອໍເດີ້ຊົ່ວຄາວ', nextOpen ? 'success' : 'warning');
    }
  } catch (e) {
    console.error('Toggle store error:', e);
    if (typeof showAtelierAlert === 'function') {
      showAtelierAlert({
        title: 'ປ່ຽນສະຖານະຮ້ານຂຶ້ນ Cloud ບໍ່ສຳເລັດ',
        message: `ກວດສອບ Firestore Rules ຂອງ settings: ${e.message}`,
        type: 'error'
      });
    }
  }
};

if (db) {
  db.collection('payments').onSnapshot(snap => {
    if (!snap.empty) {
      paymentMethods = snap.docs.map(d => ({ docId: d.id, id: d.data().id || d.id, ...d.data() }));
      localStorage.setItem('ladolce_payment_methods', JSON.stringify(paymentMethods));
      if (typeof renderCustomerPaymentOptions === 'function') renderCustomerPaymentOptions();
      if (typeof loadAdminPayments === 'function' && window.adminCurrentTab === 'payments') loadAdminPayments();
    }
  }, err => console.warn("Payments sync error:", err));

  db.collection('settings').doc('brand').onSnapshot(doc => {
    if (doc.exists) {
      const d = doc.data();
      brandSettings = {
        cafeName: d.cafeName || 'LA DOLCE',
        cafeBranch: d.cafeBranch || 'Downtown Flagship Roastery',
        brandInitials: d.brandInitials || generateBrandInitials(d.cafeName || 'LA DOLCE')
      };
      localStorage.setItem('ladolce_brand_settings', JSON.stringify(brandSettings));
      applyBrandSettingsUI();
    }
  }, err => console.warn("Brand sync error:", err));

  db.collection('settings').doc('store').onSnapshot(doc => {
    if (doc.exists) {
      storeSettings = { ...storeSettings, ...doc.data() };
      localStorage.setItem('ladolce_store_settings', JSON.stringify(storeSettings));
      window.updateStoreStatusUI();
      if (typeof renderStaffStoreControl === 'function') renderStaffStoreControl();
      if (typeof calculateCartSummary === 'function') calculateCartSummary();
    }
  }, err => console.warn("Store settings sync error:", err));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    applyBrandSettingsUI();
    window.updateStoreStatusUI();
  });
} else {
  applyBrandSettingsUI();
  window.updateStoreStatusUI();
}

function formatLAK(amount) {
  const val = Math.round(Number(amount) || 0);
  return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " LAK";
}

function formatVariantLabel(variant) {
  if (variant === 'hot') return 'ຮ້ອນ';
  if (variant === 'iced') return 'ເຢັນ';
  if (variant === 'frappe') return 'ປັ່ນ';
  return 'ມາດຕະຖານ';
}

const CUSTOMER_PALETTE = [
  { bg: 'bg-emerald-50', border: 'border-emerald-400', text: 'text-emerald-900', ring: 'ring-emerald-400' },
  { bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-900', ring: 'ring-blue-400' },
  { bg: 'bg-amber-50', border: 'border-amber-400', text: 'text-amber-900', ring: 'ring-amber-400' },
  { bg: 'bg-purple-50', border: 'border-purple-400', text: 'text-purple-900', ring: 'ring-purple-400' },
  { bg: 'bg-rose-50', border: 'border-rose-400', text: 'text-rose-900', ring: 'ring-rose-400' },
  { bg: 'bg-cyan-50', border: 'border-cyan-400', text: 'text-cyan-900', ring: 'ring-cyan-400' }
];

function getCustomerColorTheme(phoneOrName) {
  if (!phoneOrName) return CUSTOMER_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < phoneOrName.length; i++) {
    hash = phoneOrName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % CUSTOMER_PALETTE.length;
  return CUSTOMER_PALETTE[index];
}
