// =======================================================
// CART, GUEST CHECKOUT & BULLETPROOF ORDER SUBMISSION
// =======================================================

let selectedBankMethodId = null;
let uploadedSlipDataUrl = null;

// 1. ເພີ່ມສິນຄ້າເຂົ້າກະຕ່າ
function confirmAddToCart() {
  if (!activeCustomizingItem) {
    showToast("ກະລຸນາເລືອກເມນູກ່ອນ!");
    return;
  }

  let unitPrice = 35000;
  if (activeCustomizingItem.variants && activeCustomizingItem.variants[selectedVariant]) {
    unitPrice = parseFloat(activeCustomizingItem.variants[selectedVariant]) || 35000;
  }

  const milkRadio = document.querySelector('input[name="milkOption"]:checked');
  const milk = milkRadio ? milkRadio.value : 'Whole Milk';
  if (milk.includes('Oat') || milk.includes('Almond')) {
    unitPrice += 15000;
  }

  const extraShotEl = document.getElementById('addonExtraShot');
  const extraShot = extraShotEl ? extraShotEl.checked : false;
  if (extraShot) {
    unitPrice += 12000;
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
    const sub = document.getElementById('summarySubtotal');
    const tax = document.getElementById('summaryTax');
    const tot = document.getElementById('summaryTotal');
    if (sub) sub.textContent = "0 LAK";
    if (tax) tax.textContent = "0 LAK";
    if (tot) tot.textContent = "0 LAK";
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

  const tax = subtotal * 0.08;
  const total = subtotal + tax;
  const sub = document.getElementById('summarySubtotal');
  const taxEl = document.getElementById('summaryTax');
  const tot = document.getElementById('summaryTotal');
  if (sub) sub.textContent = formatLAK(subtotal);
  if (taxEl) taxEl.textContent = formatLAK(tax);
  if (tot) tot.textContent = formatLAK(total);
}

// 2. ລະບົບເລືອກທະນາຄານ ແລະ QR Code
function renderCustomerPaymentOptions() {
  const container = document.getElementById('customerBankSelectorGrid');
  const display = document.getElementById('activeBankQRDisplay');
  if (!container || !display) return;

  if (paymentMethods.length === 0) {
    container.innerHTML = `<p class="text-taupe text-[11px] col-span-full">ຊຳລະດ້ວຍເງິນສົດໜ້າຮ້ານ</p>`;
    display.classList.add('hidden');
    return;
  }

  // ຕັ້ງຄ່າເລີ່ມຕົ້ນຖ້າຍັງບໍ່ເລືອກ
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

// 3. 🚀 ລະບົບກົດຢືນຢັນສັ່ງຊື້ (Member & Guest Bulletproof Flow)
function handleStartCheckout() {
  if (cart.length === 0) {
    showToast("ກະຕ່າຂອງທ່ານຍັງຫວ່າງເປົ່າ!");
    return;
  }

  // ຖ້າເປັນ Member (Login ແລ້ວ) -> ສັ່ງຊື້ທັນທີ
  if (currentUser && currentUser.name) {
    executeOrderCreation(currentUser.name, currentUser.phone || "+856 20 5512 8899");
  } else {
    // ຖ້າເປັນ Guest -> ເປີດ Modal ຖາມຊື່ ແລະ ເບີໂທ
    const modal = document.getElementById('guestContactModal');
    if (modal) {
      modal.classList.remove('hidden');
    } else {
      // Fallback ຖ້າບໍ່ມີ Modal
      const name = prompt("ກະລຸນາໃສ່ຊື່ຂອງທ່ານ (ສຳລັບຮຽກຮັບເຄື່ອງດື່ມ):", "Elena");
      if (!name) return;
      const phone = prompt("ກະລຸນາໃສ່ເບີໂທລະສັບ:", "+856 20 ");
      if (!phone) return;
      executeOrderCreation(name, phone);
    }
  }
}

function closeGuestModal() {
  const modal = document.getElementById('guestContactModal');
  if (modal) modal.classList.add('hidden');
}

function submitGuestOrder() {
  const nameInput = document.getElementById('guestInputName');
  const phoneInput = document.getElementById('guestInputPhone');

  const name = nameInput ? nameInput.value.trim() : "";
  const phone = phoneInput ? phoneInput.value.trim() : "";

  if (!name || !phone) {
    alert("ກະລຸນາໃສ່ຊື່ ແລະ ເບີໂທລະສັບ ເພື່ອໃຫ້ບາຣິສຕ້າຕິດຕໍ່ໄດ້!");
    return;
  }

  closeGuestModal();
  executeOrderCreation(name, phone);
}

// 4. ສ້າງ Order Payload ແລະ ບັນທຶກລົງ Firestore + LocalStorage
async function executeOrderCreation(customerName, customerPhone) {
  showToast("ກຳລັງສົ່ງອໍເດີ້...");

  const subtotal = cart.reduce((s, i) => s + (i.total || 0), 0);
  const tax = subtotal * 0.08;
  const grandTotal = subtotal + tax;

  const noteInput = document.getElementById('checkoutCustomerNote');
  const note = noteInput ? noteInput.value.trim() : "None";

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
    note: note || "None",
    selectedBank: selectedBankMethodId || "pay_bcel",
    slipUrl: uploadedSlipDataUrl || null,
    status: "pending",
    delayNotice: null
  };

  console.log("Submitting Order Payload:", newOrder);

  // 1. ບັນທຶກລົງ LocalStorage ທັນທີ (Zero-lag)
  orders.unshift(newOrder);
  localStorage.setItem('ladolce_orders', JSON.stringify(orders));

  currentActiveOrder = newOrder;
  localStorage.setItem('ladolce_active_order', JSON.stringify(currentActiveOrder));

  // 2. ສົ່ງຂຶ້ນ Cloud Firestore Real-time
  if (isFirebaseReady && db) {
    try {
      await db.collection("orders").doc(newOrder.id).set(newOrder);
      console.log("✅ Order successfully synced to Firestore:", newOrder.id);
    } catch (err) {
      console.warn("Firestore order sync warning (Saved locally):", err);
    }
  }

  // 3. ລ້າງກະຕ່າ
  cart = [];
  localStorage.setItem('ladolce_cart', JSON.stringify(cart));
  uploadedSlipDataUrl = null;

  const preview = document.getElementById('slipImagePreview');
  const box = document.getElementById('slipPreviewContainer');
  const txt = document.getElementById('slipStatusText');
  const fileInput = document.getElementById('slipFileInput');
  if (preview) preview.src = '';
  if (box) box.classList.add('hidden');
  if (txt) txt.textContent = "ອັບໂຫຼດຮູບໃບໂອນເງິນ (Slip)";
  if (fileInput) fileInput.value = '';

  updateCartBadges();

  // 4. ແຈ້ງເຕືອນສຳເລັດ ແລະ ພາໄປໜ້າປີ້ຮັບເຄື່ອງທັນທີ
  showToast("ສັ່ງຊື້ສຳເລັດແລ້ວ! 🎉");
  
  if (typeof switchCustomerTab === 'function') {
    switchCustomerTab('ticket');
  }
}
