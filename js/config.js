// =======================================================
// LA DOLCE — CORE CONFIGURATION & FIRESTORE ENGINE
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
    auth = firebase.auth();
    isFirebaseReady = true;
    console.log("✅ Cloud Firestore Initialized Successfully");
  }
} catch (e) {
  console.warn("Firestore initialization error:", e);
}

const REGISTERED_ACCOUNTS = [
  { email: "customer@ladolce.com", password: "123", name: "Elena Rostova", role: "customer", phone: "+856 20 5512 8899" },
  { email: "staff@ladolce.com", password: "123", name: "Mateo (Barista Lead)", role: "staff", phone: "+856 20 7788 9900" },
  { email: "owner@ladolce.com", password: "123", name: "Sengsavanh (Superadmin)", role: "superadmin", phone: "+856 20 9900 1122" }
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

// 🔥 ຕັດ localStorage ຂອງ menuItems ອອກ 100%! ປ່ອຍໃຫ້ດຶງຈາກ Firestore ໂດຍກົງ
let menuItems = [];
let paymentMethods = JSON.parse(localStorage.getItem('ladolce_payment_methods')) || DEFAULT_PAYMENTS;
let modifiers = JSON.parse(localStorage.getItem('ladolce_modifiers')) || DEFAULT_MODIFIERS;
let orders = [];
let cart = JSON.parse(localStorage.getItem('ladolce_cart')) || [];
let currentUser = JSON.parse(localStorage.getItem('ladolce_user')) || null;
let userAccounts = JSON.parse(localStorage.getItem('ladolce_accounts')) || REGISTERED_ACCOUNTS;
let storeSettings = JSON.parse(localStorage.getItem('ladolce_store_settings')) || { isStoreOpen: true, taxRatePercent: 0 };
let cloudUsers = [];

// Helper: Format LAK
function formatLAK(amount) {
  const val = Math.round(Number(amount) || 0);
  return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " LAK";
}

// 🔥 Helper: ຄິດໄລ່ສີປະຈຳຕົວລູກຄ້າ (Customer Color Hash) ສຳລັບ Staff Panel
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
