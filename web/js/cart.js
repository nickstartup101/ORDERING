// =======================================================
// LA DOLCE — CART, QR PAYMENT, COUPON & CHECKOUT ENGINE
// =======================================================

let selectedPaymentId = null;
let selectedPaymentMethod = null;
let uploadedSlipDataUrl = '';
let appliedCoupon = null;
let currentFulfillmentType = 'pickup';
let isSubmittingOrder = false;

const FREE_DELIVERY_THRESHOLD = 100000;

function updateCartBadge() {
  const totalCount = (cart || []).reduce((sum, item) => sum + item.quantity, 0);
  const badge = document.getElementById('cartBadgeCount');
  const dot = document.getElementById('bottomNavCartDot');
  if (badge) badge.textContent = totalCount;
  if (dot) dot.classList.toggle('hidden', totalCount === 0);
}

function renderCartList() {
  const container = document.getElementById('cartListContainer');
  if (!container) return;

  if (!cart || cart.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center bg-surface-pure rounded-xl border border-hairline space-y-3 font-lao">
        <div class="w-12 h-12 rounded-full bg-surface mx-auto flex items-center justify-center text-taupe">
          ${svgIcon('bag', 'w-6 h-6')}
        </div>
        <h4 class="font-serif-title text-[16px] text-primary font-bold">ກະຕ່າຂອງທ່ານຍັງຫວ່າງຢູ່</h4>
        <p class="text-[12px] text-taupe">ເລືອກເມນູທີ່ມັກແລ້ວເພີ່ມໃສ່ກະຕ່າໄດ້ເລີຍ</p>
        <button type="button" onclick="switchCustomerTab('menu')" class="px-4 py-2 rounded-lg bg-forest-emerald text-white text-[12px] font-bold cursor-pointer">ໄປທີ່ໜ້າເມນູ</button>
      </div>
    `;
    calculateCartSummary();
    return;
  }

  container.innerHTML = cart.map(item => `
    <div class="p-3.5 sm:p-4 rounded-xl bg-surface-pure border border-hairline flex gap-3 items-start justify-between font-lao">
      <div class="flex gap-3 min-w-0">
        <div class="w-16 h-16 rounded-lg bg-surface-dim overflow-hidden shrink-0 border border-hairline">
          <img src="${item.image || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200'}" class="w-full h-full object-cover"/>
        </div>
        <div class="min-w-0">
          <h4 class="font-bold text-[14px] text-primary truncate">${item.name}</h4>
          <div class="text-[11px] text-taupe flex flex-wrap gap-x-1.5 mt-0.5">
            <span class="font-semibold text-forest-leaf">[${formatVariantLabel(item.variant)}]</span>
            ${item.sweetness ? `<span>• ຫວານ ${item.sweetness}</span>` : ''}
            ${item.milk ? `<span>• ${item.milk}</span>` : ''}
            ${item.extraShot ? `<span>• +Extra Shot</span>` : ''}
          </div>
          ${item.note ? `
            <div class="mt-1 px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-900 text-[10px] inline-flex items-center gap-1 font-semibold">
              ${svgIcon('note', 'w-3 h-3')}
              <span>ໝາຍເຫດ: ${item.note}</span>
            </div>
          ` : ''}
          <div class="font-serif-title font-bold text-forest-emerald text-[13px] mt-1">${formatLAK(item.totalPrice)}</div>
        </div>
      </div>

      <div class="flex flex-col items-end gap-2 shrink-0">
        <button type="button" onclick="removeCartItem('${item.cartItemId}')" class="text-taupe hover:text-red-600 p-1 cursor-pointer" title="ລຶບລາຍການ">
          ${svgIcon('trash', 'w-4 h-4')}
        </button>
        <div class="flex items-center border border-hairline rounded-lg bg-surface">
          <button type="button" onclick="adjustCartQty('${item.cartItemId}', -1)" class="w-7 h-7 flex items-center justify-center text-charcoal cursor-pointer">${svgIcon('minus', 'w-3.5 h-3.5')}</button>
          <span class="px-2 text-[12px] font-bold">${item.quantity}</span>
          <button type="button" onclick="adjustCartQty('${item.cartItemId}', 1)" class="w-7 h-7 flex items-center justify-center text-charcoal cursor-pointer">${svgIcon('plus', 'w-3.5 h-3.5')}</button>
        </div>
      </div>
    </div>
  `).join('');

  calculateCartSummary();
}

function adjustCartQty(cartItemId, delta) {
  const item = cart.find(i => i.cartItemId === cartItemId);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) {
    removeCartItem(cartItemId);
    return;
  }
  item.totalPrice = item.unitPrice * item.quantity;
  localStorage.setItem('ladolce_cart', JSON.stringify(cart));
  updateCartBadge();
  renderCartList();
}

function removeCartItem(cartItemId) {
  cart = cart.filter(i => i.cartItemId !== cartItemId);
  localStorage.setItem('ladolce_cart', JSON.stringify(cart));
  updateCartBadge();
  renderCartList();
}

function calculateCartSummary() {
  const subtotal = (cart || []).reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);

  let discountAmount = 0;
  if (appliedCoupon && subtotal > 0) {
    if (appliedCoupon.minOrder && subtotal < appliedCoupon.minOrder) {
      appliedCoupon = null;
      showAtelierToast('ຍອດບິນຕ່ຳກວ່າເງື່ອນໄຂຄູປອງ ຈຶ່ງຍົກເລີກສ່ວນຫຼຸດຊົ່ວຄາວ', 'warning');
    } else {
      discountAmount = appliedCoupon.type === 'percent'
        ? Math.round((subtotal * Number(appliedCoupon.value || 0)) / 100)
        : Number(appliedCoupon.value || 0);

      if (appliedCoupon.maxDiscount && discountAmount > Number(appliedCoupon.maxDiscount)) {
        discountAmount = Number(appliedCoupon.maxDiscount);
      }
      discountAmount = Math.min(discountAmount, subtotal);
    }
  }

  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const taxRate = Number(storeSettings?.taxRatePercent || 0);
  const taxAmount = taxRate > 0 ? Math.round((afterDiscount * taxRate) / 100) : 0;
  const total = afterDiscount + taxAmount;

  const subEl = document.getElementById('summarySubtotal');
  const totEl = document.getElementById('summaryTotal');
  const couponRow = document.getElementById('couponDiscountRow');
  const couponVal = document.getElementById('summaryCouponDiscount');
  const taxRow = document.getElementById('taxRowContainer');
  const taxVal = document.getElementById('summaryTax');

  if (subEl) subEl.textContent = formatLAK(subtotal);
  if (totEl) totEl.textContent = formatLAK(total);

  if (couponRow && couponVal) {
    couponRow.classList.toggle('hidden', discountAmount <= 0);
    couponVal.textContent = `-${formatLAK(discountAmount)}`;
  }

  if (taxRow && taxVal) {
    taxRow.classList.toggle('hidden', taxAmount <= 0);
    taxVal.textContent = formatLAK(taxAmount);
  }

  updateDeliveryProgressUI(subtotal);

  const qrAmountEl = document.getElementById('activeQrTotalAmount');
  if (qrAmountEl) qrAmountEl.textContent = formatLAK(total);

  return { subtotal, discountAmount, taxAmount, total };
}

function updateDeliveryProgressUI(subtotal) {
  const textEl = document.getElementById('deliveryProgressText');
  const barEl = document.getElementById('deliveryProgressBar');
  const panelEl = document.getElementById('deliveryAddressPanel');
  if (!textEl || !barEl || !panelEl) return;

  const percent = Math.min(100, Math.round((subtotal / FREE_DELIVERY_THRESHOLD) * 100));
  barEl.style.width = `${percent}%`;

  if (subtotal >= FREE_DELIVERY_THRESHOLD) {
    textEl.innerHTML = `<div class="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800">${svgIcon('bike', 'w-4 h-4')}<span>ປົດລັອກສິດສົ່ງຟຣີພາຍໃນ 500 ແມັດແລ້ວ!</span></div>`;
    panelEl.classList.remove('hidden');
  } else {
    const remain = FREE_DELIVERY_THRESHOLD - subtotal;
    textEl.innerHTML = `<div class="flex items-center justify-between text-[11px] text-taupe"><span class="flex items-center gap-1">${svgIcon('bike', 'w-3.5 h-3.5 text-forest-emerald')}<span>ສັ່ງເພີ່ມອີກ <strong class="text-forest-emerald">${formatLAK(remain)}</strong> ເພື່ອສົ່ງຟຣີ 500ມ</span></span><span class="font-bold">${percent}%</span></div>`;
    panelEl.classList.add('hidden');
    currentFulfillmentType = 'pickup';
  }
}

window.setFulfillmentType = function(type) {
  currentFulfillmentType = type;
  const pickupBtn = document.getElementById('optFulfillmentPickup');
  const delivBtn = document.getElementById('optFulfillmentDelivery');
  const fields = document.getElementById('deliveryInputFields');

  if (pickupBtn && delivBtn) {
    pickupBtn.className = `p-2 rounded-lg border-2 text-[11px] font-bold text-center bg-surface-pure flex items-center justify-center gap-1.5 cursor-pointer ${type === 'pickup' ? 'border-forest-emerald text-forest-emerald' : 'border-hairline text-taupe'}`;
    delivBtn.className = `p-2 rounded-lg border-2 text-[11px] font-bold text-center bg-surface-pure flex items-center justify-center gap-1.5 cursor-pointer ${type === 'delivery' ? 'border-forest-emerald text-forest-emerald' : 'border-hairline text-taupe'}`;
  }
  if (fields) fields.classList.toggle('hidden', type !== 'delivery');
};

// =======================================================
// MULTI-BANK QR PAYMENT SELECTOR (QR ONLY)
// =======================================================
window.renderCustomerPaymentOptions = function() {
  const grid = document.getElementById('customerBankSelectorGrid');
  const display = document.getElementById('activeBankQRDisplay');
  if (!grid || !display) return;

  const banks = (paymentMethods && paymentMethods.length > 0) ? paymentMethods : DEFAULT_PAYMENTS;
  const options = banks.map(b => ({ ...b, id: b.id || b.docId, type: 'qr' }));

  if (!selectedPaymentId || !options.some(o => o.id === selectedPaymentId)) {
    selectedPaymentId = options[0].id;
  }

  grid.innerHTML = options.map(opt => {
    const isActive = opt.id === selectedPaymentId;
    return `
      <button type="button" onclick="selectPaymentMethod('${opt.id}')"
              style="${isActive ? `border-color: ${opt.borderColor || '#0D402B'}; background-color: #FAF9F6;` : ''}"
              class="p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center gap-2 ${isActive ? 'shadow-xs font-bold text-primary' : 'border-hairline bg-surface-pure text-taupe hover:border-forest-leaf'}">
        <span style="color: ${opt.borderColor || '#0D402B'}">${svgIcon('qr', 'w-4 h-4')}</span>
        <span class="text-[11px] truncate">${opt.bankName}</span>
      </button>
    `;
  }).join('');

  selectPaymentMethod(selectedPaymentId, false);
};

window.selectPaymentMethod = function(paymentId, reRenderButtons = true) {
  selectedPaymentId = paymentId;
  const banks = (paymentMethods && paymentMethods.length > 0) ? paymentMethods : DEFAULT_PAYMENTS;
  const allOptions = banks.map(b => ({ ...b, id: b.id || b.docId, type: 'qr' }));

  const chosen = allOptions.find(o => o.id === paymentId) || allOptions[0];
  selectedPaymentMethod = chosen;

  if (reRenderButtons) {
    renderCustomerPaymentOptions();
    return;
  }

  const display = document.getElementById('activeBankQRDisplay');
  const slipInput = document.getElementById('slipFileInput');
  const slipSection = slipInput ? slipInput.closest('.border-t') : null;
  const { total } = calculateCartSummary();

  if (!display) return;
  if (slipSection) slipSection.classList.remove('hidden');

  display.style.borderColor = chosen.borderColor || '#E7E4DD';
  display.innerHTML = `
    <div class="space-y-2.5">
      <div class="flex items-center justify-between text-[12px]">
        <span class="font-bold text-primary">${chosen.bankName}</span>
        <span class="text-[11px] text-taupe">ສະແກນເພື່ອຊຳລະ</span>
      </div>

      <div class="mx-auto w-48 h-48 bg-white p-2 rounded-xl border border-hairline flex items-center justify-center">
        <img src="${chosen.qrImage}" alt="QR ${chosen.bankName}" class="w-full h-full object-contain"/>
      </div>

      ${chosen.accountNumber ? `
        <div class="flex items-center justify-center gap-2 bg-surface-pure py-1.5 px-3 rounded-lg border border-hairline">
          <span class="font-mono text-[12px] font-semibold text-charcoal">${chosen.accountNumber}</span>
          <button type="button" onclick="copyBankAccount('${chosen.accountNumber}')"
                  class="inline-flex items-center gap-1 text-[11px] font-bold text-forest-emerald hover:text-forest-leaf cursor-pointer">
            ${svgIcon('copy', 'w-3.5 h-3.5')}
            <span>ຄັດລອກ</span>
          </button>
        </div>
      ` : ''}

      <div class="pt-2 border-t border-hairline flex items-center justify-between text-[12px]">
        <span class="text-taupe">ຍອດທີ່ຕ້ອງໂອນ:</span>
        <span id="activeQrTotalAmount" class="font-serif-title font-bold text-[16px] text-forest-emerald">${formatLAK(total)}</span>
      </div>
    </div>
  `;
};

window.copyBankAccount = async function(accountNumber) {
  try {
    await navigator.clipboard.writeText(accountNumber);
    showAtelierToast(`ຄັດລອກເລກບັນຊີ ${accountNumber} ແລ້ວ`);
  } catch (_) {
    showAtelierToast(`ເລກບັນຊີ: ${accountNumber}`, 'info');
  }
};

window.applyCouponCode = async function() {
  const input = document.getElementById('couponCodeInput');
  const code = (input?.value || '').trim().toUpperCase();
  if (!code) {
    showAtelierToast('ກະລຸນາປ້ອນລະຫັດຄູປອງກ່ອນ', 'warning');
    return;
  }

  const subtotal = (cart || []).reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);
  if (subtotal <= 0) {
    showAtelierToast('ກະຕ່າຍັງຫວ່າງຢູ່ ບໍ່ສາມາດໃຊ້ຄູປອງໄດ້', 'warning');
    return;
  }

  try {
    let foundCoupon = null;
    const firestore = db || firebase.firestore();
    const snap = await firestore.collection('coupons').where('code', '==', code).limit(1).get();

    if (!snap.empty) {
      foundCoupon = { id: snap.docs[0].id, ...snap.docs[0].data() };
    } else if (code === 'LADOLCE20') {
      foundCoupon = { code: 'LADOLCE20', type: 'percent', value: 20, maxDiscount: 30000, minOrder: 0 };
    }

    if (!foundCoupon) {
      showAtelierToast('ບໍ່ພົບລະຫັດຄູປອງນີ້ໃນລະບົບ', 'error');
      return;
    }
    if (foundCoupon.isActive === false) {
      showAtelierToast('ຄູປອງນີ້ຖືກປິດການໃຊ້ງານແລ້ວ', 'error');
      return;
    }
    if (foundCoupon.expiryDate) {
      const exp = new Date(foundCoupon.expiryDate);
      exp.setHours(23, 59, 59, 999);
      if (exp < new Date()) {
        showAtelierToast('ຄູປອງນີ້ໝົດອາຍຸແລ້ວ', 'error');
        return;
      }
    }
    if (foundCoupon.minOrder && subtotal < Number(foundCoupon.minOrder)) {
      showAtelierToast(`ຕ້ອງສັ່ງຂັ້ນຕ່ຳ ${formatLAK(foundCoupon.minOrder)} ຈຶ່ງໃຊ້ໄດ້`, 'warning');
      return;
    }
    if (foundCoupon.totalBudget && Number(foundCoupon.usedBudget || 0) >= Number(foundCoupon.totalBudget)) {
      showAtelierToast('ງົບປະມານຄູປອງນີ້ໝົດແລ້ວ', 'error');
      return;
    }

    appliedCoupon = foundCoupon;
    calculateCartSummary();
    showAtelierToast(`ນຳໃຊ້ຄູປອງ ${code} ສຳເລັດ!`);
  } catch (err) {
    console.error('Coupon check error:', err);
    showAtelierToast('ກວດສອບຄູປອງບໍ່ສຳເລັດ', 'error');
  }
};

window.handleSlipSelected = function(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const statusText = document.getElementById('slipStatusText');
  if (statusText) statusText.textContent = 'ກຳລັງປະມວນຜົນຮູບ...';

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxW = 800;
      const scale = img.width > maxW ? maxW / img.width : 1;
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      uploadedSlipDataUrl = canvas.toDataURL('image/jpeg', 0.72);
      const previewBox = document.getElementById('slipPreviewContainer');
      const previewImg = document.getElementById('slipImagePreview');
      if (previewImg) previewImg.src = uploadedSlipDataUrl;
      if (previewBox) previewBox.classList.remove('hidden');
      if (statusText) statusText.textContent = 'ປ່ຽນຮູບໃບໂອນເງິນ (ແນບແລ້ວ)';
      showAtelierToast('ແນບໃບໂອນເງິນສຳເລັດ');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
};

window.handleStartCheckout = async function() {
  if (isSubmittingOrder) return;

  if (!cart || cart.length === 0) {
    await showAtelierAlert({ title: 'ກະຕ່າຫວ່າງເປົ່າ', message: 'ກະລຸນາເລືອກເມນູໃສ່ກະຕ່າກ່ອນສັ່ງຊື້', type: 'warning' });
    return;
  }

  if (storeSettings && storeSettings.isStoreOpen === false) {
    await showAtelierAlert({ title: 'ຮ້ານປິດຊົ່ວຄາວ', message: 'ຂໍອະໄພ ຕອນນີ້ຮ້ານກຳລັງປິດຮັບອໍເດີ້ຊົ່ວຄາວ', type: 'warning' });
    return;
  }

  if (!uploadedSlipDataUrl) {
    await showAtelierAlert({
      title: 'ຍັງບໍ່ໄດ້ແນບໃບໂອນເງິນ',
      message: 'ກະລຸນາສະແກນ QR ໂອນເງິນ ແລ້ວອັບໂຫຼດຮູບໃບໂອນເງິນ (Slip) ກ່ອນຢືນຢັນ',
      type: 'warning'
    });
    return;
  }

  if (currentFulfillmentType === 'delivery') {
    const addr = document.getElementById('deliveryAddressInput')?.value.trim();
    if (!addr) {
      await showAtelierAlert({ title: 'ຕ້ອງການທີ່ຢູ່ຈັດສົ່ງ', message: 'ກະລຸນາປ້ອນທີ່ຢູ່ຈັດສົ່ງພາຍໃນ 500 ແມັດ', type: 'warning' });
      return;
    }
  }

  const user = (typeof firebase !== 'undefined' && firebase.auth) ? firebase.auth().currentUser : null;
  let customerName = currentUser?.name || "Guest Customer";
  let customerPhone = currentUser?.phone || "+856 20 Walk-in";
  let customerId = user ? user.uid : (currentUser?.email || ("guest_" + Date.now()));

  if (user) {
    customerName = user.displayName || currentUser?.name || user.email.split('@')[0];
  } else if (!currentUser) {
    const guestModal = document.getElementById('guestContactModal');
    if (guestModal) {
      guestModal.classList.remove('hidden');
      return;
    }
  }

  await executeOrderPlacement(customerId, customerName, customerPhone);
};

window.submitGuestOrder = async function() {
  const name = document.getElementById('guestInputName')?.value.trim();
  const phone = document.getElementById('guestInputPhone')?.value.trim();

  if (!name || !phone) {
    showAtelierToast('ກະລຸນາປ້ອນຊື່ ແລະ ເບີໂທລະສັບ', 'warning');
    return;
  }

  document.getElementById('guestContactModal')?.classList.add('hidden');
  await executeOrderPlacement('guest_' + phone, name, phone);
};

window.closeGuestModal = function() {
  document.getElementById('guestContactModal')?.classList.add('hidden');
};

async function executeOrderPlacement(customerId, customerName, customerPhone) {
  if (isSubmittingOrder) return;
  isSubmittingOrder = true;

  const submitBtn = document.querySelector('#tab-customer-cart button[onclick="handleStartCheckout()"]');
  const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `${svgIcon('spinner', 'w-4 h-4')} <span>ກຳລັງສົ່ງອໍເດີ້...</span>`;
  }

  try {
    const { subtotal, discountAmount, taxAmount, total } = calculateCartSummary();
    const firestore = db || firebase.firestore();
    const deliveryAddress = currentFulfillmentType === 'delivery'
      ? (document.getElementById('deliveryAddressInput')?.value.trim() || '')
      : '';

    const orderData = {
      orderCode: 'LD-' + Math.floor(1000 + Math.random() * 9000),
      customerId,
      customerName,
      customerPhone,
      customerEmail: currentUser?.email || null,
      items: cart,
      subtotal,
      discountAmount,
      couponCode: appliedCoupon ? appliedCoupon.code : null,
      taxAmount,
      totalAmount: total,
      paymentType: 'qr',
      paymentMethod: selectedPaymentMethod?.bankName || 'BCEL One',
      slipImage: uploadedSlipDataUrl,
      fulfillmentType: currentFulfillmentType,
      deliveryAddress,
      status: 'pending',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await firestore.collection('orders').add(orderData);

    if (appliedCoupon && appliedCoupon.id && discountAmount > 0) {
      firestore.collection('coupons').doc(appliedCoupon.id).update({
        usedBudget: firebase.firestore.FieldValue.increment(discountAmount)
      }).catch(() => {});
    }

    const customerOrders = JSON.parse(localStorage.getItem('customer_order_ids') || '[]');
    customerOrders.unshift(docRef.id);
    localStorage.setItem('customer_order_ids', JSON.stringify(customerOrders));
    localStorage.setItem('activeOrderId', docRef.id);

    cart = [];
    appliedCoupon = null;
    uploadedSlipDataUrl = '';
    localStorage.removeItem('ladolce_cart');

    const slipInput = document.getElementById('slipFileInput');
    if (slipInput) slipInput.value = '';
    const previewBox = document.getElementById('slipPreviewContainer');
    if (previewBox) previewBox.classList.add('hidden');
    const slipStatus = document.getElementById('slipStatusText');
    if (slipStatus) slipStatus.textContent = 'ອັບໂຫຼດຮູບໃບໂອນເງິນ (Slip)';
    const couponInput = document.getElementById('couponCodeInput');
    if (couponInput) couponInput.value = '';

    updateCartBadge();
    document.getElementById('bottomNavLiveOrderPulse')?.classList.remove('hidden');

    await showAtelierAlert({
      title: 'ສັ່ງຊື້ສຳເລັດແລ້ວ!',
      message: `ລະຫັດອໍເດີ້ <strong>#${orderData.orderCode}</strong> ຖືກສົ່ງໃຫ້ພະນັກງານແລ້ວ ກະລຸນາລໍຖ້າການຢືນຢັນໃນໜ້າປີ້ຮັບເຄື່ອງ`,
      type: 'success',
      confirmText: 'ເບິ່ງສະຖານະປີ້'
    });

    switchCustomerTab('ticket');
  } catch (error) {
    console.error("Order placement error:", error);
    await showAtelierAlert({
      title: 'ສົ່ງອໍເດີ້ບໍ່ສຳເລັດ',
      message: error.message || 'ກະລຸນາລອງໃໝ່ອີກຄັ້ງ',
      type: 'error'
    });
  } finally {
    isSubmittingOrder = false;
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnHtml;
    }
  }
}

updateCartBadge();
