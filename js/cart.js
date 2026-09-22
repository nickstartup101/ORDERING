// =======================================================
// CART, CHECKOUT & DIRECT FIRESTORE SYNC ENGINE
// =======================================================

let selectedBankMethodId = null;
let uploadedSlipDataUrl = null;

// 1. 🔥 ຟັງຊັນເພີ່ມເຂົ້າກະຕ່າ (ແກ້ໄຂບໍ່ໃຫ້ປຸ່ມຄ້າງ ແລະ ປິດ Modal ທຸກຄັ້ງ 100%)
function confirmAddToCart() {
  if (!activeCustomizingItem) return;

  const modal = document.getElementById('customizeModal');

  // ສຽງ Pop
  if (typeof playChime === 'function') playChime(false);

  // ຄິດໄລ່ລາຄາ
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

  // ເພີ່ມສິນຄ້າລົງກະຕ່າ
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

  // 🔥 ປິດ Modal ທັນທີ (ບໍ່ປ່ຽນ innerHTML ຂອງປຸ່ມ ເພື່ອປ້ອງກັນບໍ່ໃຫ້ເມນູທີ 2 ຄ້າງ!)
  if (modal) {
    modal.classList.add('hidden');
  }

  // ອັບເດດ Badge ກະຕ່າ
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
        <button type="button" onclick="removeCartItem(${idx})" class="text-red-600 p-2 shrink-0">
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

  container.innerHTML = paymentMethods.map(p => `
    <button type="button" onclick="selectedBankMethodId='${p.id}'; renderCustomerPaymentOptions();" 
      class="p-2.5 rounded-xl border-2 text-left transition-all ${p.id === selectedBankMethodId ? 'border-forest-emerald bg-forest-emerald/10 font-bold shadow-xs' : 'border-hairline bg-surface-pure hover:border-forest-leaf'}">
      <span class="text-[12px] block">${p.bankName}</span>
      <span class="text-[10px] text-taupe font-mono">${p.accountNumber}</span>
    </button>
  `).join('');

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

  localStorage.setItem('ladolce_guest_contact', JSON.stringify({ name, phone }));
  closeGuestModal();
  executeOrderCreation(name, phone);
}

// 2. 🔥 ສົ່ງອໍເດີ້ຂຶ້ນ Cloud Firestore ແທ້ 100% (ແກ້ໄຂບັນຫາ Staff ຂຶ້ນ Queue is clear)
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

  console.log("🚀 [Firestore Push] Pushing new order to Cloud:", newOrder.id);

  // 1. 🔥 ຍິງກົງຂຶ້ນ Cloud Firestore Collection 'orders'
  if (isFirebaseReady && db) {
    try {
      await db.collection("orders").doc(newOrder.id).set(newOrder);
      console.log("✅ Order successfully written to Firestore:", newOrder.id);
    } catch (err) {
      console.error("❌ Firestore write error:", err);
      alert("ບໍ່ສາມາດສົ່ງອໍເດີ້ຂຶ້ນ Cloud ໄດ້: " + err.message);
      return;
    }
  }

  // 2. ບັນທຶກລົງ Local ຂອງລູກຄ້າ
  orders.unshift(newOrder);

  // 3. ລ້າງກະຕ່າ
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
  showToast("ສັ່ງຊື້ສຳເລັດແລ້ວ! 🎉");

  // 4. ນຳທາງໄປໜ້າ Ticket ທັນທີ
  if (typeof switchCustomerTab === 'function') {
    switchCustomerTab('ticket');
  }
}
