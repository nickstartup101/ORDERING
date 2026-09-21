// =======================================================
// CART, GUEST CHECKOUT & PAYMENT ENGINE (LAK CURRENCY)
// =======================================================

let selectedBankMethodId = null;
let uploadedSlipDataUrl = null;

function confirmAddToCart() {
  if (!activeCustomizingItem) return;
  let unitPrice = activeCustomizingItem.variants?.[selectedVariant] || 35000;
  const milkRadio = document.querySelector('input[name="milkOption"]:checked');
  const milk = milkRadio ? milkRadio.value : 'Standard';

  if (milk.includes('Oat') || milk.includes('Almond')) {
    unitPrice += 15000;
  }

  const extraShot = document.getElementById('addonExtraShot')?.checked;
  if (extraShot) {
    unitPrice += 12000;
  }

  cart.push({
    cartId: 'c_' + Date.now(),
    itemId: activeCustomizingItem.id,
    name: activeCustomizingItem.name,
    variant: selectedVariant,
    milk: milk,
    sweetness: selectedSweetnessLevel || '100%',
    extraShot: extraShot,
    unitPrice: unitPrice,
    quantity: modalQuantity,
    total: unitPrice * modalQuantity,
    image: activeCustomizingItem.image
  });

  localStorage.setItem('ladolce_cart', JSON.stringify(cart));
  updateCartBadges();
  closeCustomizeModal();
  showToast(`ເພີ່ມ "${activeCustomizingItem.name}" ເຂົ້າກະຕ່າແລ້ວ!`);
}

function updateCartBadges() {
  const count = cart.reduce((s, i) => s + i.quantity, 0);
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
    container.innerHTML = `<div class="p-8 bg-surface-pure border border-hairline rounded-2xl text-center"><p class="text-taupe text-[13px]">ບໍ່ມີລາຍການໃນກະຕ່າ</p></div>`;
    document.getElementById('summarySubtotal').textContent = "0 LAK";
    document.getElementById('summaryTax').textContent = "0 LAK";
    document.getElementById('summaryTotal').textContent = "0 LAK";
    return;
  }

  let subtotal = 0;
  container.innerHTML = cart.map((item, idx) => {
    subtotal += item.total;
    return `
      <div class="p-4 bg-surface-pure border border-hairline rounded-xl flex items-center justify-between shadow-xs">
        <div class="flex items-center gap-3">
          <img src="${item.image}" class="w-12 h-12 rounded-lg object-cover border border-hairline"/>
          <div>
            <h4 class="font-serif-title text-[14px] font-medium">${item.name}</h4>
            <p class="text-[11px] text-taupe">[${item.variant.toUpperCase()}] • ${item.milk} • ຫວານ ${item.sweetness} ${item.extraShot ? '• +Shot' : ''}</p>
            <span class="font-mono text-[12px] font-bold text-forest-emerald">${formatLAK(item.unitPrice)} × ${item.quantity}</span>
          </div>
        </div>
        <button type="button" onclick="cart.splice(${idx},1); localStorage.setItem('ladolce_cart',JSON.stringify(cart)); updateCartBadges();" class="text-red-600 p-2"><span class="material-symbols-outlined text-[18px]">delete</span></button>
      </div>
    `;
  }).join('');

  const tax = subtotal * 0.08;
  const total = subtotal + tax;
  document.getElementById('summarySubtotal').textContent = formatLAK(subtotal);
  document.getElementById('summaryTax').textContent = formatLAK(tax);
  document.getElementById('summaryTotal').textContent = formatLAK(total);
}

function renderCustomerPaymentOptions() {
  const container = document.getElementById('customerBankSelectorGrid');
  const display = document.getElementById('activeBankQRDisplay');
  if (!container || !display) return;

  container.innerHTML = paymentMethods.map(p => `
    <button type="button" onclick="selectedBankMethodId='${p.id}'; renderCustomerPaymentOptions();" class="p-2.5 rounded-xl border-2 text-left transition-all ${p.id === selectedBankMethodId ? 'border-forest-emerald bg-forest-emerald/10 font-bold' : 'border-hairline'}">
      <span class="text-[12px] block">${p.bankName}</span>
      <span class="text-[10px] text-taupe font-mono">${p.accountNumber}</span>
    </button>
  `).join('');

  if (selectedBankMethodId) {
    const bank = paymentMethods.find(p => p.id === selectedBankMethodId);
    display.innerHTML = `
      <div class="p-3 bg-surface-pure rounded-xl animate-slide-down">
        <img src="${bank.qrImage}" class="w-40 h-40 mx-auto rounded-lg"/>
        <p class="text-[12px] font-bold mt-2">${bank.bankName} - ${bank.accountNumber}</p>
      </div>
    `;
  } else {
    display.innerHTML = `<p class="text-[11px] text-taupe p-4">ກະລຸນາກົດເລືອກທະນາຄານດ້ານເທິງກ່ອນ</p>`;
  }
}

function handleSlipSelected(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    uploadedSlipDataUrl = reader.result;
    document.getElementById('slipImagePreview').src = uploadedSlipDataUrl;
    document.getElementById('slipPreviewContainer').classList.remove('hidden');
    document.getElementById('slipStatusText').textContent = "✓ ແນບໃບໂອນແລ້ວ";
    showToast("ອັບໂຫຼດສະລິບຮຽບຮ້ອຍ!");
  };
  reader.readAsDataURL(file);
}

function handleStartCheckout() {
  if (cart.length === 0) { showToast("ກະຕ່າຫວ່າງເປົ່າ!"); return; }
  if (!selectedBankMethodId) { showToast("ກະລຸນາເລືອກທະນາຄານກ່ອນ!"); return; }

  if (!currentUser) {
    document.getElementById('guestContactModal').classList.remove('hidden');
  } else {
    executeOrderCreation(currentUser.name, currentUser.phone);
  }
}

function closeGuestModal() {
  document.getElementById('guestContactModal').classList.add('hidden');
}

function submitGuestOrder() {
  const name = document.getElementById('guestInputName').value.trim();
  const phone = document.getElementById('guestInputPhone').value.trim();
  if (!name || !phone) {
    alert("ກະລຸນາໃສ່ຊື່ ແລະ ເບີໂທ ເພື່ອໃຫ້ພະນັກງານຕິດຕໍ່ໄດ້!");
    return;
  }
  closeGuestModal();
  executeOrderCreation(name, phone);
}

function executeOrderCreation(customerName, customerPhone) {
  const subtotal = cart.reduce((s, i) => s + i.total, 0);
  const newOrder = {
    id: 'LD-' + Math.floor(1000 + Math.random() * 9000),
    createdAt: new Date().toISOString(),
    customerName: customerName,
    customerPhone: customerPhone,
    items: [...cart],
    subtotal: subtotal,
    total: subtotal * 1.08,
    slipUrl: uploadedSlipDataUrl || null,
    status: "pending",
    delayNotice: null
  };

  orders.unshift(newOrder);
  localStorage.setItem('ladolce_orders', JSON.stringify(orders));
  currentActiveOrder = newOrder;
  localStorage.setItem('ladolce_active_order', JSON.stringify(currentActiveOrder));

  if (isFirebaseReady && db) {
    db.collection("orders").doc(newOrder.id).set(newOrder).catch(e => {});
  }

  cart = [];
  localStorage.setItem('ladolce_cart', JSON.stringify(cart));
  updateCartBadges();
  showToast("ສັ່ງຊື້ສຳເລັດແລ້ວ!");
  switchCustomerTab('ticket');
}
