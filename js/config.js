// ລະບົບຖານຂໍ້ມູນ ແລະ ການຕັ້ງຄ່າຫຼັກ
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
  }
} catch (e) {
  console.warn("Local storage simulation mode active:", e);
}

// ບັນຊີເຂົ້າລະບົບ (ສາມາດປ່ຽນລະຫັດຢູ່ນີ້ໄດ້ເລີຍ)
const REGISTERED_ACCOUNTS = [
  { email: "customer@ladolce.com", password: "123", name: "Elena Rostova", role: "customer", phone: "+856 20 5512 8899" },
  { email: "staff@ladolce.com", password: "123", name: "Mateo (Barista Lead)", role: "staff", phone: "+856 20 7788 9900" },
  { email: "owner@ladolce.com", password: "123", name: "Sengsavanh (Superadmin)", role: "superadmin", phone: "+856 20 9900 1122" }
];

// ເມນູເລີ່ມຕົ້ນ (ຮອງຮັບທັງ Drink & Food)
const DEFAULT_MENU = [
  {
    id: "item_cortado",
    name: "Double Shot Cortado",
    type: "drink", // 'drink' | 'food'
    category: "coffee",
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80",
    desc: "Single-origin Guji double espresso ຕັດດ້ວຍນົມໂຟມລະອຽດ",
    variants: { hot: 4.80, iced: 5.20, frappe: null },
    avgPrepMinutes: 3.8
  },
  {
    id: "item_pistachio",
    name: "Iced Pistachio Spanish Latte",
    type: "drink",
    category: "coffee",
    image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80",
    desc: "ກາເຟເອັສເປຣສໂຊ່ຜະສົມຄຣີມຖົ່ວພິສຕາຊິໂອຈາກ Sicily",
    variants: { hot: 6.20, iced: 6.80, frappe: 7.20 },
    avgPrepMinutes: 8.5
  },
  {
    id: "item_croissant",
    name: "Pure Butter Almond Croissant",
    type: "food",
    category: "bakery",
    image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80",
    desc: "ຄຣົວຊອງເນີຍສົດຝຣັ່ງ ແຊກໄສ້ອານມອນດ໌ອົບກອບ",
    variants: { standard: 4.50, warmed: 4.80, setbox: 8.50 },
    avgPrepMinutes: 3.0
  },
  {
    id: "item_sourdough",
    name: "Smoked Salmon Sourdough Tartine",
    type: "food",
    category: "bakery",
    image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop&q=80",
    desc: "ເຂົ້າຈີ່ຊາວໂດຣອົບສົດ ໜ້າແຊວມອນລົມຄວັນ ແລະ ຄຣີມຊີສ",
    variants: { standard: 8.90, warmed: 9.20, setbox: null },
    avgPrepMinutes: 12.0
  }
];

// ຕົວເລືອກເສີມ Modifiers (ນົມ, ຄວາມຫວານ, Toppings, ຄວາມຮ້ອນອາຫານ)
const DEFAULT_MODIFIERS = [
  { id: "mod_whole", group: "milk", name: "Whole Milk (ນົມສົດແທ້)", price: 0.00 },
  { id: "mod_oat", group: "milk", name: "Oatly Barista (ນົມເຂົ້າໂອດ)", price: 0.75 },
  { id: "mod_almond", group: "milk", name: "Almond Milk (ນົມອານມອນດ໌)", price: 0.75 },
  { id: "mod_shot", group: "topping", name: "Extra Double Ristretto Shot", price: 1.20 },
  { id: "mod_foam", group: "topping", name: "Sea Salt Vanilla Cold Foam", price: 1.00 },
  { id: "mod_warm", group: "food_prep", name: "ອຸ່ນຮ້ອນພິເສດ (Extra Toasted)", price: 0.00 }
];

// ບັນຊີທະນາຄານ ແລະ ຮູບ QR Code ພ້ອມສີຂອບທະນາຄານ
const DEFAULT_PAYMENT_METHODS = [
  {
    id: "pay_bcel",
    bankName: "BCEL One (OnePay)",
    accountNumber: "010-12-00-12345678",
    accountName: "LA DOLCE ROASTERY CO.,LTD",
    borderColor: "#DC2626", // ສີແດງ BCEL
    qrImage: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=BCEL_ONEPAY_LADOLCE_MERCHANT_010120012345678"
  },
  {
    id: "pay_ldb",
    bankName: "LDB Trust Bank",
    accountNumber: "030-01-22-98765432",
    accountName: "LA DOLCE ATELIER",
    borderColor: "#2563EB", // ສີຟ້າ LDB
    qrImage: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=LDB_PAY_LADOLCE_MERCHANT_030012298765432"
  },
  {
    id: "pay_jdb",
    bankName: "JDB YesPay",
    accountNumber: "550-99-44-11223344",
    accountName: "LA DOLCE COFFEE",
    borderColor: "#D97706", // ສີທອງ/ສົ້ມ JDB
    qrImage: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=JDB_YESPAY_LADOLCE_MERCHANT_550994411223344"
  }
];

// Persistent State Holders
let menuItems = JSON.parse(localStorage.getItem('ladolce_menu')) || DEFAULT_MENU;
let modifiers = JSON.parse(localStorage.getItem('ladolce_modifiers')) || DEFAULT_MODIFIERS;
let paymentMethods = JSON.parse(localStorage.getItem('ladolce_payment_methods')) || DEFAULT_PAYMENT_METHODS;
let orders = JSON.parse(localStorage.getItem('ladolce_orders')) || [];
let cart = JSON.parse(localStorage.getItem('ladolce_cart')) || [];
let currentUser = JSON.parse(localStorage.getItem('ladolce_user')) || null;
let currentActiveOrder = JSON.parse(localStorage.getItem('ladolce_active_order')) || null;
let userAccounts = JSON.parse(localStorage.getItem('ladolce_accounts')) || REGISTERED_ACCOUNTS;

// ຕົວຄວບຄຸມລະບົບຮ້ານ (Store Settings ສາມາດປັບໂດຍ Superadmin)
let storeSettings = JSON.parse(localStorage.getItem('ladolce_store_settings')) || {
  isStoreOpen: true,
  estimatedWaitMinutes: 10,
  taxRatePercent: 8.0,
  announcementNotice: ""
};
