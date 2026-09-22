// =======================================================
// CART, GUEST CHECKOUT & MULTI-ORDER CREATION
// =======================================================

let selectedBankMethodId = null;
let uploadedSlipDataUrl = null;

function confirmAddToCart() {
  if (!activeCustomizingItem) return;
  let unitPrice = 35000;
  if (activeCustomizingItem.variants && activeCustomizingItem.variants[selectedVariant]) {
    unitPrice = parseFloat(activeCustomizingItem.variants[selectedVariant]) || 35000;
  }

  const milkRadio = document.querySelector('input[name="milkOption"]:checked');
  const milk = milkRadio ? milkRadio.value : 'Whole Milk';
  if (milk.includes('Oat') || milk.includes('Almond')) {
    const oatMod = modifiers.find(m => m.id === 'mod_oat');
    unitPrice += (oatMod ? oatMod.price : 15000);
  }

  const extraShotEl = document.getElementById('addonExtraShot');
  const extraShot = extraShotEl ? extraShotEl.checked : false;
  if (extraShot) {
    const shotMod = modifiers.find(m => m.id === 'mod_shot') || modifiers.find(m => m.group === 'topping');
    unitPrice += (shotMod ? shotMod.price : 12000);
  }

  const qty = parseInt(modalQuantity) || 1;

  cart.push({
    cartId: 'c_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    itemId: activeCustomizingItem.id,
    name: activeCustomizingItem.name,
    variant: selectedVariant || 'standard',
    milk: milk,
    sweetness: selectedSweetnessLevel || '100%',
    extraShot: extraShot,
    unitPrice: unitPrice,
    quantity: qty,
    total: unitPrice * qty,
    image: activeCustomizingItem.image || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600'
  });

  localStorage.setItem('ladolce_cart', JSON.stringify(cart));
  updateCartBadges();
  closeCustomizeModal();
  showToast(`ເພີ່ມ "${activeCustomizingItem.name}" ເຂົ້າກະຕ່າແລ້ວ!`);
}

function updateCartBadges() {
  const count = cart.reduce((s, i) => s + (i.quantity || 1), 0);
  const badge = document.getElementById('cartBadgeCount');
  if (badge) badge.textContent = count;
  const dot = document.getElementById('bottomNavCartDot');
  if (dot) dot.classList.toggle('hidden', count === 0);
  renderCartList();
}

function renderCartList() {
  const container = document.getElementById('cartListContainer');
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="p-8 bg-surface-pure border border-hairline rounded-2xl text-center space-y-3 shadow-xs">
        <span class="material-symbols-outlined text-[42px] text-forest-leaf/60">shopping_bag</span>
        <h3 class="font-serif-title text-[18px] text-primary font-medium">ບໍ່ມີລາຍການໃນກະຕ່າ</h3>
        <p class="text-[12px] text-taupe font-lao">ກະລຸນາເລືອກເຄື່ອງດື່ມ ຫຼື ເບເກີຣີ່ທີ່ທ່ານມັກ</p>
        <button type="button" onclick="switchCustomerTab('menu')" class="px-5 py-2 rounded-lg bg-forest-emerald text-white text-[12px] font-semibold hover:bg-forest-leaf transition-all shadow-xs">
          ໄປທີ່ເມນູສິນຄ້າ
        </button>
      </div>
    `;
    document.getElementById('summarySubtotal').textContent = "0 LAK";
    document.getElementById('summaryTotal').textContent = "0 LAK";
    document.getElementById('taxRowContainer')?.classList.add('hidden');
    return;
  }

  let subtotal = 0;
  container.innerHTML = cart.map((item, idx) => {
    subtotal += item.total;
    return `
      <div class="p-4 bg-surface-pure border border-hairline rounded-xl flex items-center justify-between shadow-xs">
        <div class="flex items-center gap-3 min-w-0">
          <img src="${item.image}" class="w-12 h-12 rounded-lg object-cover border border-hairline shrink-0"/>
          <div class="min-w-0">
            <h4 class="font-serif-title text-[14px] font-medium truncate">${item.name}</h4>
            <p class="text-[11px] text-taupe truncate">[${item.variant.toUpperCase()}] • ${item.milk} • ຫວານ ${item.sweetness} ${item.extraShot ? '• +Shot' : ''}</p>
            <span class="font-mono text-[12px] font-bold text-forest-emerald">${formatLAK(item.unitPrice)} × ${item.quantity}</span>
          </div>
        </div>
        <button type="button" onclick="cart.splice(${idx},1); localStorage.setItem('ladolce_cart',JSON.stringify(cart)); updateCartBadges();" class="text-red-600 p-2 shrink-0">
          <span class="material-symbols-outlined text-[18px]">delete</span>
        </button>
      </div>
    `;
  }).join('');

  const taxRate = (storeSettings && storeSettings.taxRatePercent) || 0;
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  document.getElementById('summarySubtotal').textContent = formatLAK(subtotal);
  const taxRow = document.getElementById('taxRowContainer');
  const taxEl = document.getElementById('summaryTax');
  if (taxRate > 0) {
    if (taxRow) taxRow.classList.remove('hidden');
    if (taxEl) taxEl.textContent = formatLAK(tax);
  } else {
    if (taxRow) taxRow.classList.add('hidden');
  }

  document.getElementById('summaryTotal').textContent = formatLAK(total);
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
        class="p-2.5 rounded-xl border-2 text-left transition-all ${isSelected ? 'border-forest-emerald bg-forest-emerald/10 font-bold shadow-xs' : 'border-hairline bg-surface-pure hover:border-forest-leaf'}">
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

  // ບັນທຶກຊື່ ແລະ ເບີໂທໄວ້ໃນເຄື່ອງຂອງ Guest ເພື່ອໃຫ້ດຶງປີ້ເກົ່າໄດ້
  localStorage.setItem('ladolce_guest_contact', JSON.stringify({ name, phone }));

  closeGuestModal();
  executeOrderCreation(name, phone);
}

// 🔥 ສ້າງອໍເດີ້ ແລະ ຮອງຮັບການສັ່ງເພີ່ມໄດ້ຫຼາຍປີ້ພ້ອມກັນ
async function executeOrderCreation(customerName, customerPhone) {
  showToast("ກຳລັງສົ່ງອໍເດີ້...");

  const subtotal = cart.reduce((s, i) => s + (i.total || 0), 0);
  const taxRate = (storeSettings && storeSettings.taxRatePercent) || 0;
  const tax = subtotal * (taxRate / 100);
  const grandTotal = subtotal + tax;

  const bank = paymentMethods.find(p => p.id === selectedBankMethodId);
  const paymentType = uploadedSlipDataUrl ? (bank ? bank.bankName : "Bank QR") : "Cash on Pickup";

  const newOrder = {
    id: 'LD-' + Math.floor(1000 + Math.random() * 9000),
    createdAt: new Date().toISOString(),
    customerName: customerName,
    customerPhone: customerPhone,
    customerEmail: currentUser ? currentUser.email : "guest@ladolce.com",
    items: [...cart],
    subtotal: subtotal,
    tax: tax,
    total: grandTotal,
    paymentMethod: paymentType,
    slipUrl: uploadedSlipDataUrl || null,
    status: "pending",
    delayNotice: null
  };

  // 1. ບັນທຶກລົງ Memory & Firestore
  orders.unshift(newOrder);

  // 2. ລ້າງກະຕ່າ ເພື່ອໃຫ້ສັ່ງອໍເດີ້ຕໍ່ໄປໄດ້ທັນທີ
  cart = [];
  localStorage.setItem('ladolce_cart', JSON.stringify(cart));
  uploadedSlipDataUrl = null;
  selectedBankMethodId = null;

  const preview = document.getElementById('slipImagePreview');
  const box = document.getElementById('slipPreviewContainer');
  const txt = document.getElementById('slipStatusText');
  const fileInput = document.getElementById('slipFileInput');
  if (preview) preview.src = '';
  if (box) box.classList.add('hidden');
  if (txt) txt.textContent = "ອັບໂຫຼດຮູບໃບໂອນເງິນ (Slip)";
  if (fileInput) fileInput.value = '';

  updateCartBadges();

  // 3. ຍິງກົງຂຶ້ນ Cloud Firestore Real-time
  if (isFirebaseReady && db) {
    try {
      await db.collection("orders").doc(newOrder.id).set(newOrder);
      console.log("✅ Order Synced to Firestore:", newOrder.id);
    } catch (err) {
      console.warn("Firestore sync warning:", err);
    }
  }

  showToast("ສັ່ງຊື້ສຳເລັດແລ້ວ! 🎉");

  if (typeof switchCustomerTab === 'function') {
    switchCustomerTab('ticket');
  }
}
