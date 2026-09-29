// =======================================================
// LA DOLCE — CART, 500M DELIVERY & ADVANCED COUPON ENGINE
// =======================================================

let selectedBankMethodId = null;
let uploadedSlipDataUrl = null;
let orderFulfillmentType = 'pickup'; // 'pickup' | 'delivery'
let appliedCoupon = null;

// ລາຍຊື່ຄູປອງເລີ່ມຕົ້ນ
let activeCouponsList = [
  { id: "cpn_LADOLCE20", code: "LADOLCE20", type: "percent", value: 20, maxDiscount: 30000, minOrder: 0, totalBudget: 500000, budgetUsed: 0, expiryDate: null, desc: "ສ່ວນຫຼຸດ 20% ສູງສຸດ 30,000 LAK", isActive: true },
  { id: "cpn_FREE20K", code: "FREE20K", type: "fixed", value: 20000, maxDiscount: 20000, minOrder: 100000, totalBudget: 1000000, budgetUsed: 0, expiryDate: null, desc: "ຫຼຸດ 20,000 LAK (ສັ່ງຂັ້ນຕ່ຳ 100,000 LAK)", isActive: true }
];

function confirmAddToCart() {
  if (!activeCustomizingItem) return;

  const modal = document.getElementById('customizeModal');
  if (typeof playChime === 'function') playChime(false);

  let unitPrice = 35000;
  if (activeCustomizingItem.variants && activeCustomizingItem.variants[selectedVariant]) {
    unitPrice = parseFloat(activeCustomizingItem.variants[selectedVariant]) || 35000;
  }

  const milkRadio = document.querySelector('input[name="milkOption"]:checked');
  const milk = milkRadio ? milkRadio.value : 'Whole Milk';
  if (milk.includes('Oat') || milk.includes('Almond')) {
    const oatMod = (typeof modifiers !== 'undefined') ? modifiers.find(m => m.id === 'mod_oat') : null;
    unitPrice += (oatMod ? oatMod.price : 15000);
  }

  const extraShotEl = document.getElementById('addonExtraShot');
  const extraShot = extraShotEl ? extraShotEl.checked : false;
  if (extraShot) {
    const shotMod = (typeof modifiers !== 'undefined') ? (modifiers.find(m => m.id === 'mod_shot') || modifiers.find(m => m.group === 'topping')) : null;
    unitPrice += (shotMod ? shotMod.price : 12000);
  }

  const qty = parseInt(modalQuantity) || 1;
  const itemSpecialNote = document.getElementById('modalItemSpecialNote')?.value.trim() || '';

  cart.push({
    cartId: 'c_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    itemId: activeCustomizingItem.id,
    name: activeCustomizingItem.name,
    variant: selectedVariant || 'standard',
    milk: milk,
    sweetness: selectedSweetnessLevel || '100%',
    extraShot: extraShot,
    specialNote: itemSpecialNote,
    unitPrice: unitPrice,
    quantity: qty,
    total: unitPrice * qty,
    image: activeCustomizingItem.image || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600'
  });

  localStorage.setItem('ladolce_cart', JSON.stringify(cart));
  if (modal) modal.classList.add('hidden');

  updateCartBadges(true);
  showToast(`✓ ເພີ່ມ "${activeCustomizingItem.name}" (${qty} ລາຍການ) ເຂົ້າກະຕ່າແລ້ວ!`);
}

function updateCartBadges(shouldAnimate = false) {
  const count = cart.reduce((s, i) => s + (i.quantity || 1), 0);
  const badge = document.getElementById('cartBadgeCount');
  const bottomDot = document.getElementById('bottomNavCartDot');

  if (badge) {
    badge.textContent = count;
    if (shouldAnimate) {
      badge.classList.remove('animate-bounce');
      void badge.offsetWidth;
      badge.classList.add('animate-bounce');
    }
  }

  if (bottomDot) bottomDot.classList.toggle('hidden', count === 0);
  renderCartList();
}

// 🔥 Render Cart List: ຮູບ 65x65px ລັອກແໜ້ນໜາ ບໍ່ລົ້ນຈໍ
function renderCartList() {
  const container = document.getElementById('cartListContainer');
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="p-8 bg-surface-pure border border-hairline rounded-2xl text-center space-y-3 shadow-xs">
        <span class="material-symbols-outlined text-[42px] text-forest-leaf/60">shopping_bag</span>
        <h3 class="font-serif-title text-[18px] text-primary font-medium">ບໍ່ມີລາຍການໃນກະຕ່າ</h3>
        <p class="text-[12px] text-taupe font-lao">ກະລຸນາເລືອກເຄື່ອງດື່ມ ຫຼື ເບເກີຣີ່ທີ່ທ່ານມັກ</p>
        <button type="button" onclick="switchCustomerTab('menu')" class="px-5 py-2 rounded-lg bg-forest-emerald text-white text-[12px] font-semibold hover:bg-forest-leaf transition-all shadow-xs cursor-pointer">
          ໄປທີ່ເມນູສິນຄ້າ
        </button>
      </div>
    `;
    document.getElementById('summarySubtotal').textContent = "0 LAK";
    document.getElementById('summaryTotal').textContent = "0 LAK";
    document.getElementById('deliveryUnlockBox')?.classList.add('hidden');
    return;
  }

  let subtotal = 0;
  let totalCups = 0;

  container.innerHTML = cart.map((item, idx) => {
    subtotal += item.total;
    totalCups += item.quantity;
    return `
      <div class="p-4 bg-surface-pure border border-hairline rounded-2xl flex items-center justify-between gap-3 shadow-xs">
        <div class="w-[65px] h-[65px] rounded-xl overflow-hidden bg-surface-dim border border-hairline shrink-0">
          <img src="${item.image}" class="w-full h-full object-cover"/>
        </div>

        <div class="flex-1 min-w-0">
          <h4 class="font-serif-title text-[14px] font-bold text-primary truncate">${item.name}</h4>
          <p class="text-[11px] text-taupe truncate mt-0.5">[${item.variant.toUpperCase()}] • ${item.milk} • ຫວານ ${item.sweetness} ${item.extraShot ? '• +Shot' : ''}</p>
          ${item.specialNote ? `
            <p class="text-[10px] text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 truncate mt-1 flex items-center gap-1">
              <span class="material-symbols-outlined text-[13px]">chat</span>
              <span>"${item.specialNote}"</span>
            </p>
          ` : ''}
          <span class="font-mono text-[12px] font-bold text-forest-emerald block mt-1">${formatLAK(item.unitPrice)} × ${item.quantity}</span>
        </div>

        <button type="button" onclick="removeCartItem(${idx})" class="w-8 h-8 rounded-lg bg-surface hover:bg-red-50 text-red-600 border border-hairline flex items-center justify-center shrink-0 transition-colors cursor-pointer">
          <span class="material-symbols-outlined text-[17px]">delete</span>
        </button>
      </div>
    `;
  }).join('');

  // ກວດສອບປົດລັອກສົ່ງຟຣີ 500 ແມັດ
  checkDeliveryUnlockStatus(totalCups, subtotal);

  // ຄິດໄລ່ສ່ວນຫຼຸດຄູປອງ (Capped Discount)
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percent') {
      const rawDiscount = subtotal * (appliedCoupon.value / 100);
      discountAmount = appliedCoupon.maxDiscount ? Math.min(rawDiscount, appliedCoupon.maxDiscount) : rawDiscount;
    } else {
      discountAmount = Math.min(subtotal, appliedCoupon.value);
    }
  }

  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const taxRate = (storeSettings && storeSettings.taxRatePercent) || 0;
  const tax = discountedSubtotal * (taxRate / 100);
  const total = discountedSubtotal + tax;

  document.getElementById('summarySubtotal').textContent = formatLAK(subtotal);

  const couponRow = document.getElementById('couponDiscountRow');
  const couponDiscountEl = document.getElementById('summaryCouponDiscount');
  if (appliedCoupon && discountAmount > 0) {
    if (couponRow) couponRow.classList.remove('hidden');
    if (couponDiscountEl) couponDiscountEl.textContent = `-${formatLAK(discountAmount)}`;
  } else {
    if (couponRow) couponRow.classList.add('hidden');
  }

  document.getElementById('summaryTotal').textContent = formatLAK(total);
}

// ກວດສອບເງື່ອນໄຂສົ່ງຟຣີ 500 ແມັດ (3 ຈອກ ຫຼື 120,000 LAK) - ໃຊ້ Google Symbols
function checkDeliveryUnlockStatus(cups, subtotal) {
  const box = document.getElementById('deliveryUnlockBox');
  const unlockedPanel = document.getElementById('deliveryAddressPanel');
  const progressText = document.getElementById('deliveryProgressText');
  const progressBar = document.getElementById('deliveryProgressBar');

  if (!box || !unlockedPanel) return;
  box.classList.remove('hidden');

  const isCupsQualified = cups >= 3;
  const isAmountQualified = subtotal >= 120000;
  const isUnlocked = isCupsQualified || isAmountQualified;

  if (isUnlocked) {
    box.className = "p-3.5 rounded-xl bg-emerald-50 border-2 border-emerald-400 space-y-2.5 transition-all";
    if (progressText) {
      progressText.innerHTML = `
        <div>
          <span class="text-emerald-900 font-bold flex items-center gap-1.5 text-[12px]">
            <span class="material-symbols-outlined text-[18px]">verified</span>
            <span>ຍິນດີດ້ວຍ! ທ່ານປົດລັອກສິດ "ຈັດສົ່ງ Delivery" ແລ້ວ</span>
          </span>
          <span class="text-[11px] text-emerald-800 font-semibold block mt-0.5 flex items-center gap-1">
            <span class="material-symbols-outlined text-[14px]">two_wheeler</span>
            <span><strong>ບໍລິການສົ່ງຟຣີ</strong> ໃນບໍລິເວນ 500 ແມັດ ອ້ອມຮອບຮ້ານ!</span>
          </span>
        </div>
      `;
    }
    if (progressBar) progressBar.style.width = "100%";
    unlockedPanel.classList.remove('hidden');
  } else {
    box.className = "p-3.5 rounded-xl bg-surface border border-hairline space-y-2 transition-all";
    const cupsNeeded = Math.max(0, 3 - cups);
    const amountNeeded = Math.max(0, 120000 - subtotal);
    
    const cupPercent = (cups / 3) * 100;
    const amountPercent = (subtotal / 120000) * 100;
    const maxPercent = Math.min(100, Math.max(cupPercent, amountPercent));

    if (progressText) {
      progressText.innerHTML = `
        <span class="text-taupe text-[11px] block leading-relaxed flex items-center gap-1 flex-wrap">
          <span class="material-symbols-outlined text-[15px] text-forest-emerald">two_wheeler</span>
          <span><strong>ເງື່ອນໄຂສົ່ງຟຣີ (ໄລຍະ 500ມ):</strong> ສັ່ງອີກ <strong>${cupsNeeded} ຈອກ</strong> ຫຼື ເພີ່ມອີກ <strong>${formatLAK(amountNeeded)}</strong> ເພື່ອປົດລັອກຈັດສົ່ງຟຣີ!</span>
        </span>
      `;
    }
    if (progressBar) progressBar.style.width = `${maxPercent}%`;
    unlockedPanel.classList.add('hidden');
    orderFulfillmentType = 'pickup';
  }
}

function setFulfillmentType(type) {
  orderFulfillmentType = type;
  document.getElementById('optFulfillmentPickup')?.classList.toggle('border-forest-emerald', type === 'pickup');
  document.getElementById('optFulfillmentDelivery')?.classList.toggle('border-forest-emerald', type === 'delivery');
  document.getElementById('deliveryInputFields')?.classList.toggle('hidden', type !== 'delivery');
}

// ລະບົບຄູປອງຂັ້ນສູງ
function applyCouponCode() {
  const input = document.getElementById('couponCodeInput');
  const code = input ? input.value.trim().toUpperCase() : '';

  if (!code) {
    showToast("ກະລຸນາປ້ອນລະຫັດ Coupon!");
    return;
  }

  const match = activeCouponsList.find(c => c.code === code && c.isActive !== false);
  if (!match) {
    alert("ລະຫັດຄູປອງບໍ່ຖືກຕ້ອງ ຫຼື ບໍ່ມີໃນລະບົບ!");
    return;
  }

  if (match.expiryDate && new Date(match.expiryDate) < new Date()) {
    alert("ຄູປອງນີ້ໝົດອາຍຸການໃຊ້ງານແລ້ວ!");
    return;
  }

  if (match.totalBudget && (match.budgetUsed >= match.totalBudget)) {
    alert("ຄູປອງນີ້ຖືກໃຊ້ຄົບຕາມວົງເງິນໂປຣໂມຊັ່ນແລ້ວ (Expired)!");
    return;
  }

  const subtotal = cart.reduce((s, i) => s + (Number(i.total) || 0), 0);
  if (match.minOrder && subtotal < match.minOrder) {
    alert(`ຄູປອງນີ້ຮຽກຮ້ອງຍອດບິນຂັ້ນຕ່ຳ ${formatLAK(match.minOrder)} ຂຶ້ນໄປ!`);
    return;
  }

  appliedCoupon = match;
  renderCartList();
  showToast(`✓ ນຳໃຊ້ຄູປອງ "${match.code}" (${match.desc}) ສຳເລັດ!`);
}

function removeCouponCode() {
  appliedCoupon = null;
  const input = document.getElementById('couponCodeInput');
  if (input) input.value = '';
  renderCartList();
  showToast("ຍົກເລີກຄູປອງແລ້ວ");
}

function removeCartItem(idx) {
  cart.splice(idx, 1);
  localStorage.setItem('ladolce_cart', JSON.stringify(cart));
  updateCartBadges(false);
  renderCartList();
}

function renderCustomerPaymentOptions() {
  const container = document.getElementById('customerBankSelectorGrid');
  const display = document.getElementById('activeBankQRDisplay');
  if (!container || !display) return;

  if (paymentMethods.length === 0) {
    container.innerHTML = `<p class="text-taupe text-[11px] col-span-full">ຊຳລະດ້ວຍເງິນສົດໜ້າຮ້ານ</p>`;
    display.classList.add('hidden');
    return;
  }

  if (!selectedBankMethodId && paymentMethods.length > 0) {
    selectedBankMethodId = paymentMethods[0].id;
  }

  container.innerHTML = paymentMethods.map(p => {
    const isSelected = p.id === selectedBankMethodId;
    return `
      <button type="button" onclick="selectedBankMethodId='${p.id}'; renderCustomerPaymentOptions();" 
        class="p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer ${isSelected ? 'border-forest-emerald bg-forest-emerald/10 font-bold shadow-xs' : 'border-hairline bg-surface-pure hover:border-forest-leaf'}">
        <span class="text-[12px] block">${p.bankName}</span>
        <span class="text-[10px] text-taupe font-mono">${p.accountNumber}</span>
      </button>
    `;
  }).join('');

  const bank = paymentMethods.find(p => p.id === selectedBankMethodId) || paymentMethods[0];
  if (bank) {
    display.classList.remove('hidden');
    display.style.borderColor = bank.borderColor || "#0D402B";
    display.innerHTML = `
      <div class="p-3 bg-surface-pure rounded-xl animate-slide-down text-center space-y-2">
        <span class="text-[11px] font-bold block text-forest-emerald">ສະແກນ QR ໂອນເຂົ້າ ${bank.bankName}</span>
        <img src="${bank.qrImage}" class="w-40 h-40 mx-auto rounded-lg object-contain border p-1" style="border-color: ${bank.borderColor}"/>
        <div class="text-[11px] font-mono text-charcoal">
          <p class="font-bold">${bank.accountNumber}</p>
          <p class="text-[10px] text-taupe">${bank.accountName || 'LA DOLCE'}</p>
        </div>
      </div>
    `;
  }
}

function handleSlipSelected(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    uploadedSlipDataUrl = reader.result;
    const preview = document.getElementById('slipImagePreview');
    const box = document.getElementById('slipPreviewContainer');
    const txt = document.getElementById('slipStatusText');

    if (preview) preview.src = uploadedSlipDataUrl;
    if (box) box.classList.remove('hidden');
    if (txt) txt.textContent = "✓ ແນບໃບໂອນແລ້ວ (ກົດເພື່ອປ່ຽນ)";
    showToast("ອັບໂຫຼດສະລິບຮຽບຮ້ອຍ!");
  };
  reader.readAsDataURL(file);
}

function handleStartCheckout() {
  if (cart.length === 0) {
    showToast("ກະຕ່າຂອງທ່ານຍັງຫວ່າງເປົ່າ!");
    return;
  }

  if (orderFulfillmentType === 'delivery') {
    const address = document.getElementById('deliveryAddressInput')?.value.trim();
    if (!address) {
      alert("ກະລຸນາປ້ອນທີ່ຢູ່ຈັດສົ່ງ (ບ້ານ, ເມືອງ, ຫຼື ຈຸດສັງເກດ ພາຍໃນ 500 ແມັດ)!");
      document.getElementById('deliveryAddressInput')?.focus();
      return;
    }
  }

  if (currentUser && currentUser.name) {
    executeOrderCreation(currentUser.name, currentUser.phone || "+856 20 5512 8899");
  } else {
    document.getElementById('guestContactModal')?.classList.remove('hidden');
  }
}

function closeGuestModal() {
  document.getElementById('guestContactModal')?.classList.add('hidden');
}

function submitGuestOrder() {
  const name = document.getElementById('guestInputName')?.value.trim();
  const phone = document.getElementById('guestInputPhone')?.value.trim();

  if (!name || !phone) {
    alert("ກະລຸນາໃສ່ຊື່ ແລະ ເບີໂທລະສັບ!");
    return;
  }

  localStorage.setItem('ladolce_guest_contact', JSON.stringify({ name, phone }));
  closeGuestModal();
  executeOrderCreation(name, phone);
}

// ສົ່ງອໍເດີ້ຂຶ້ນ Firestore ແລະ ຕັດງົບປະມານຄູປອງ
async function executeOrderCreation(customerName, customerPhone) {
  showToast("ກຳລັງສົ່ງອໍເດີ້...");

  const subtotal = cart.reduce((s, i) => s + (Number(i.total) || 0), 0);
  
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percent') {
      const raw = subtotal * (appliedCoupon.value / 100);
      discountAmount = appliedCoupon.maxDiscount ? Math.min(raw, appliedCoupon.maxDiscount) : raw;
    } else {
      discountAmount = Math.min(subtotal, appliedCoupon.value);
    }
  }

  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const taxRate = (storeSettings && storeSettings.taxRatePercent) || 0;
  const tax = discountedSubtotal * (taxRate / 100);
  const grandTotal = discountedSubtotal + tax;

  const bank = paymentMethods.find(p => p.id === selectedBankMethodId);
  const paymentType = uploadedSlipDataUrl ? (bank ? bank.bankName : "Bank QR") : "Cash on Pickup";
  const deliveryAddress = orderFulfillmentType === 'delivery' ? (document.getElementById('deliveryAddressInput')?.value.trim() || '') : null;

  const newOrder = {
    id: 'LD-' + Math.floor(1000 + Math.random() * 9000),
    createdAt: new Date().toISOString(),
    customerName: customerName || "Customer",
    customerPhone: customerPhone || "+856 20 5512 8899",
    customerEmail: currentUser ? currentUser.email : "guest@ladolce.com",
    items: JSON.parse(JSON.stringify(cart)),
    subtotal: Number(subtotal) || 0,
    discount: Number(discountAmount) || 0,
    couponCode: appliedCoupon ? appliedCoupon.code : null,
    tax: Number(tax) || 0,
    total: Number(grandTotal) || 0,
    fulfillmentType: orderFulfillmentType,
    deliveryAddress: deliveryAddress,
    paymentMethod: paymentType,
    slipUrl: uploadedSlipDataUrl || null,
    status: "pending",
    delayNotice: null
  };

  // ຕັດງົບປະມານຄູປອງ
  if (appliedCoupon && typeof deductCouponBudget === 'function') {
    deductCouponBudget(appliedCoupon, discountAmount);
  }

  // ລ້າງກະຕ່າ
  cart = [];
  localStorage.setItem('ladolce_cart', JSON.stringify(cart));
  uploadedSlipDataUrl = null;
  selectedBankMethodId = null;
  appliedCoupon = null;

  const preview = document.getElementById('slipImagePreview');
  const box = document.getElementById('slipPreviewContainer');
  const txt = document.getElementById('slipStatusText');
  const fileInput = document.getElementById('slipFileInput');
  if (preview) preview.src = '';
  if (box) box.classList.add('hidden');
  if (txt) txt.textContent = "ອັບໂຫຼດຮູບໃບໂອນເງິນ (Slip)";
  if (fileInput) fileInput.value = '';

  updateCartBadges(false);

  // ຍິງຂຶ້ນ Firestore Real-time
  if (typeof isFirebaseReady !== 'undefined' && isFirebaseReady && db) {
    db.collection("orders").doc(newOrder.id).set(newOrder).catch(err => console.warn(err));
  }

  showToast("ສັ່ງຊື້ສຳເລັດແລ້ວ! 🎉");

  if (typeof switchCustomerTab === 'function') {
    switchCustomerTab('ticket');
  }
}
