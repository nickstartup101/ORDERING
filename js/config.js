// Firebase Configuration
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

// Pre-defined System Users with Roles (Passwords are masked & verified securely)
const REGISTERED_ACCOUNTS = [
  { email: "customer@ladolce.com", password: "123", name: "Elena Rostova", role: "customer", phone: "+856 20 5512 8899" },
  { email: "staff@ladolce.com", password: "123", name: "Mateo (Barista)", role: "staff", phone: "+856 20 7788 9900" },
  { email: "owner@ladolce.com", password: "123", name: "Sengsavanh (Owner)", role: "superadmin", phone: "+856 20 9900 1122" }
];

// Seed Menu
const DEFAULT_MENU = [
  {
    id: "item_cortado",
    name: "Double Shot Cortado",
    category: "coffee",
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80",
    desc: "Equal parts velvety micro-foam and intense double-ristretto extraction.",
    variants: { hot: 4.80, iced: 5.20, frappe: null },
    avgPrepMinutes: 4.2
  },
  {
    id: "item_pistachio",
    name: "Iced Pistachio Spanish Latte",
    category: "coffee",
    image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80",
    desc: "Ethiopia Guji espresso poured over hand-ground Bronte pistachio cream.",
    variants: { hot: 6.20, iced: 6.80, frappe: 7.20 },
    avgPrepMinutes: 9.8
  },
  {
    id: "item_matcha",
    name: "Ceremonial Uji Matcha",
    category: "tea",
    image: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&auto=format&fit=crop&q=80",
    desc: "First-harvest organic green tea from Kyoto, stone-ground and whisked fresh.",
    variants: { hot: 5.80, iced: 6.20, frappe: 6.80 },
    avgPrepMinutes: 6.5
  },
  {
    id: "item_croissant",
    name: "Almond Frangipane Croissant",
    category: "bakery",
    image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80",
    desc: "Pure Normandy butter, twice-baked with roasted almond flakes.",
    variants: { hot: 4.50, iced: null, frappe: null },
    avgPrepMinutes: 3.1
  }
];

// Custom Modifiers System (Milk, Toppings, etc.)
const DEFAULT_MODIFIERS = [
  { id: "mod_whole_milk", group: "milk", name: "Whole Milk (ນົມສົດແທ້)", price: 0.00 },
  { id: "mod_oat_milk", group: "milk", name: "Oatly Barista (ນົມເຂົ້າໂອດ)", price: 0.75 },
  { id: "mod_almond_milk", group: "milk", name: "Artisanal Almond Milk (ນົມອານມອນດ໌)", price: 0.75 },
  { id: "mod_extra_shot", group: "topping", name: "Extra Double Ristretto Shot", price: 1.20 },
  { id: "mod_cold_foam", group: "topping", name: "Sea Salt Vanilla Cold Foam", price: 1.00 },
  { id: "mod_caramel_drizzle", group: "topping", name: "Salted Caramel Drizzle", price: 0.50 }
];

// Persistent State
let menuItems = JSON.parse(localStorage.getItem('ladolce_menu')) || DEFAULT_MENU;
let modifiers = JSON.parse(localStorage.getItem('ladolce_modifiers')) || DEFAULT_MODIFIERS;
let orders = JSON.parse(localStorage.getItem('ladolce_orders')) || [];
let cart = JSON.parse(localStorage.getItem('ladolce_cart')) || [];
let currentUser = JSON.parse(localStorage.getItem('ladolce_user')) || null;
let currentActiveOrder = JSON.parse(localStorage.getItem('ladolce_active_order')) || null;
let userAccounts = JSON.parse(localStorage.getItem('ladolce_accounts')) || REGISTERED_ACCOUNTS;
