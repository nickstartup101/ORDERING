// Firebase Configuration & System Constants
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
    console.log("Firebase initialized successfully.");
  }
} catch (e) {
  console.warn("Firebase local fallback mode active:", e);
}

// Default Atelier Menu Seed
const DEFAULT_MENU = [
  {
    id: "item-cortado",
    name: "Double Shot Cortado",
    category: "coffee",
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80",
    desc: "Equal parts velvety micro-foam and intense double-ristretto extraction.",
    variants: { hot: 4.80, iced: 5.20, frappe: null },
    available: true
  },
  {
    id: "item-pistachio-latte",
    name: "Iced Pistachio Spanish Latte",
    category: "coffee",
    image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80",
    desc: "Ethiopia Guji single-origin espresso with hand-crushed Sicilian pistachio cream.",
    variants: { hot: 6.20, iced: 6.80, frappe: 7.20 },
    available: true
  },
  {
    id: "item-matcha",
    name: "Ceremonial Uji Matcha Latte",
    category: "tea",
    image: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&auto=format&fit=crop&q=80",
    desc: "First-harvest organic green tea from Kyoto, stone-ground and whisked fresh.",
    variants: { hot: 5.80, iced: 6.20, frappe: 6.80 },
    available: true
  },
  {
    id: "item-croissant",
    name: "Pure Butter Almond Croissant",
    category: "bakery",
    image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80",
    desc: "French AOP cultured butter, twice-baked with roasted almond frangipane.",
    variants: { hot: 4.50, iced: null, frappe: null },
    available: true
  },
  {
    id: "item-coldbrew",
    name: "Tiramisu Cold Brew",
    category: "coffee",
    image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600&auto=format&fit=crop&q=80",
    desc: "16-hour slow immersion brew topped with mascarpone cheese foam and cocoa dust.",
    variants: { hot: null, iced: 6.50, frappe: 7.00 },
    available: true
  }
];

// App Shared State
let currentRole = 'customer'; // 'customer' | 'staff' | 'admin'
let currentCustomerTab = 'menu';
let menuItems = JSON.parse(localStorage.getItem('ladolce_menu')) || DEFAULT_MENU;
let orders = JSON.parse(localStorage.getItem('ladolce_orders')) || [];
let cart = JSON.parse(localStorage.getItem('ladolce_cart')) || [];
let currentUser = JSON.parse(localStorage.getItem('ladolce_user')) || null;
let currentActiveOrder = JSON.parse(localStorage.getItem('ladolce_active_order')) || null;
let uploadedSlipDataUrl = null;
