// =======================================================
// LA DOLCE — CORE CONFIGURATION & STORE SETTINGS
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
    console.log("✅ Cloud Firestore Ready");
  }
} catch (e) {
  console.warn("Firestore fallback mode:", e);
}

const REGISTERED_ACCOUNTS = [
  { email: "customer@ladolce.com", password: "123", name: "Elena Rostova", role: "customer", phone: "+856 20 5512 8899" },
  { email: "staff@ladolce.com", password: "123", name: "Mateo (Barista)", role: "staff", phone: "+856 20 7788 9900" },
  { email: "owner@ladolce.com", password: "123", name: "Sengsavanh (Superadmin)", role: "superadmin", phone: "+856 20 9900 1122" }
];

const DEFAULT_PAYMENTS = [
  { id: "pay_bcel", bankName: "BCEL One", accountNumber: "010-12-00-12345678", borderColor: "#DC2626", qrImage: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=BCEL_ONEPAY_LADOLCE" },
  { id: "pay_ldb", bankName: "LDB Bank", accountNumber: "030-01-22-98765432", borderColor: "#2563EB", qrImage: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=LDB_PAY_LADOLCE" }
];

// ຕົວເລືອກເສີມເລີ່ມຕົ້ນ (ລວມທັງ Extra Shot ທີ່ Admin ແກ້ໄຂລາຄາໄດ້)
const DEFAULT_MODIFIERS = [
  { id: "mod_whole", group: "milk", name: "Whole Milk (ນົມສົດແທ້)", price: 0 },
  { id: "mod_oat", group: "milk", name: "Oatly Barista (ນົມເຂົ້າໂອດ)", price: 15000 },
  { id: "mod_almond", group: "milk", name: "Almond Milk (ນົມອານມອນດ໌)", price: 15000 },
  { id: "mod_shot", group: "topping", name: "Extra Double Ristretto Shot", price: 12000 }
];

const DEFAULT_MENU = [
  { id: "item_cortado", name: "Double Shot Cortado", type: "drink", category: "coffee", image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80", desc: "Single-origin double espresso with micro-foam", variants: { standard: 35000, hot: 35000, iced: 40000 }, isAvailable: true },
  { id: "item_pistachio", name: "Iced Pistachio Spanish Latte", type: "drink", category: "coffee", image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80", desc: "Espresso with hand-ground Bronte pistachio cream", variants: { standard: 45000, hot: 45000, iced: 50000 }, isAvailable: true },
  { id: "item_croissant", name: "Almond Croissant", type: "food", category: "bakery", image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80", desc: "Twice-baked almond frangipane butter croissant", variants: { standard: 32000 }, isAvailable: true }
];

// 🔥 Store Settings: Tax Rate ເລີ່ມຕົ້ນຕັ້ງເປັນ 0% ຕາມທີ່ຕ້ອງການ
let storeSettings = JSON.parse(localStorage.getItem('ladolce_store_settings')) || {
  isStoreOpen: true,
  taxRatePercent: 0 // ຕອນນີ້ຮ້ານຍັງບໍ່ມີ Tax = 0%
};

let menuItems = JSON.parse(localStorage.getItem('ladolce_menu')) || DEFAULT_MENU;
let paymentMethods = JSON.parse(localStorage.getItem('ladolce_payment_methods')) || DEFAULT_PAYMENTS;
let modifiers = JSON.parse(localStorage.getItem('ladolce_modifiers')) || DEFAULT_MODIFIERS;
let orders = JSON.parse(localStorage.getItem('ladolce_orders')) || [];
let cart = JSON.parse(localStorage.getItem('ladolce_cart')) || [];
let currentUser = JSON.parse(localStorage.getItem('ladolce_user')) || null;
let currentActiveOrder = JSON.parse(localStorage.getItem('ladolce_active_order')) || null;
let userAccounts = JSON.parse(localStorage.getItem('ladolce_accounts')) || REGISTERED_ACCOUNTS;
let cloudUsers = [];

function formatLAK(amount) {
  const val = Math.round(Number(amount) || 0);
  return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " LAK";
}
