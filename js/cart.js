// =======================================================
// LA DOLCE — CART, SELECTION & CHECKOUT ENGINE
// =======================================================

let selectedBankMethodId = null;
let uploadedSlipDataUrl = null;

// 1. ຟັງຊັນເພີ່ມສິນຄ້າເຂົ້າກະຕ່າ (Null-Safe 100%)
function confirmAddToCart() {
  if (!activeCustomizingItem) {
    alert("ກະລຸນາເລືອກສິນຄ້າກ່ອນ!");
    return;
  }

  // 1.1 ອ່ານຄ່ານົມ
  const milkRadio = document.querySelector('input[name="milkOption"]:checked');
  const milkVal = milkRadio ? milkRadio.value : 'Standard';

  // 1.2 ອ່ານຄ່າ Toppings
  const extraShotEl = document.getElementById('addonExtraShot');
  const extraShot = extraShotEl ? extraShotEl.checked : false;

  // 1.3 ຄິດໄລ່ລາຄາຕໍ່ໜ່ວຍ
  let unitPrice = 4.50;
  if (activeCustomizingItem.variants && activeCustomizingItem.variants[selectedVariant]) {
    unitPrice = parseFloat(activeCustomizingItem.variants[selectedVariant]) || 4.50;
  } else if (activeCustomizingItem.variants) {
    const prices = Object.values(activeCustomizingItem.variants).filter(p => typeof p === 'number' && p > 0);
    if (prices.length > 0) unitPrice = prices[0];
  }

  if (milkVal.includes('Oat') || milkVal.includes('Almond')) {
    unitPrice += 0.75;
  }
  if (extraShot) {
    unitPrice += 1.20;
  }

  const qty = parseInt(modalQuantity) || 1;

  const cartItem = {
    cartId: 'c_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    itemId: activeCustomizingItem.id,
    name: activeCustomizingItem.name,
    type: activeCustomizingItem.type || 'drink',
    variant: selectedVariant || 'std',
    milk: milkVal,
    sweetness: selectedSweetnessLevel || '100%',
    extraShot: extraShot,
    unitPrice: unitPrice,
    quantity: qty,
    total: unitPrice * qty,
    image: activeCustomizingItem.image || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80'
  };

  // ເພີ່ມເຂົ້າກະຕ່າ
  cart.push(cartItem);
  localStorage.setItem('ladolce_cart', JSON.stringify(cart));

  // ອັບເດດຕົວເລກ Badge ຢູ່ກະຕ່າ
  updateCartBadges();

  // ປິດ Modal
  closeCustomizeModal();

  alert(`ເພີ່ມ "${cartItem.name}" ຈຳນວນ ${cartItem.quantity} ລາຍການ ເຂົ້າກະຕ່າແລ້ວ!`);
}

// 2. ອັບເດດຕົວເລກ Badge ຢູ່ປຸ່ມກະຕ່າ
function updateCartBadges() {
  const totalCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  
  const badge = document.getElementById('cartBadgeCount');
  if (badge) badge.textContent = totalCount;

  const dot = document.getElementById('bottomNavCartDot');
  if (dot) {
    if (totalCount > 0) {
      dot.classList.remove('hidden');
    } else {
      dot.classList.add('hidden');
    }
  }

  renderCartList();
}

// 3. ສະແດງລາຍການໃນກະຕ່າ
function renderCartList() {
  const container = document.getElementById('cartListContainer');
  const subtotalEl = document.getElementById('summarySubtotal');
  const taxEl = document.getElementById('summaryTax');
  const totalEl = document.getElementById('summaryTotal');

  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="p-8 rounded-2xl bg-surface-pure border border-hairline text-center space-y-3 shadow-xs">
        <span class="material-symbols-outlined text-[42px] text-forest-leaf/60">shopping_bag</span>
        <h3 class="font-serif-title text-[18px] text-primary font-medium">ບໍ່ມີລາຍການໃນກະຕ່າ</h3>
        <p class="text-[12px] text-taupe font-lao">ກະລຸນາເລືອກເຄື່ອງດື່ມ ຫຼື ເບເກີຣີ່ທີ່ທ່ານມັກ</p>
        <button onclick="switchCustomerTab('menu')" class="px-5 py-2 rounded-lg bg-forest-emerald text-white text-[12px] font-semibold hover:bg-forest-leaf transition-all">
          ໄປທີ່ເມນູສິນຄ້າ
        </button>
      </div>
    `;
    if (subtotalEl) subtotalEl.textContent = "$0.00";
    if (taxEl) taxEl.textContent = "$0.00";
    if (totalEl) totalEl.textContent = "$0.00";
    return;
  }

  container.innerHTML = '';
  let subtotal = 0;

  cart.forEach((cItem, index) => {
    subtotal += cItem.total;
    const row = document.createElement('div');
    row.className = 'p-4 rounded-xl bg-surface-pure border border-hairline flex items-center justify-between gap-3 shadow-xs';
    row.innerHTML = `
      <div class="flex items-center gap-3 min-w-0">
        <img src="${cItem.image}" class="w-14 h-14 rounded-lg object-cover border border-hairline shrink-0"/>
        <div class="min-w-0">
          <h4 class="font-serif-title text-[14px] text-primary font-medium truncate">${cItem.name}</h4>
          <p class="text-[11px] text-taupe font-lao truncate">
            [${cItem.variant.toUpperCase()}] • ${cItem.milk} • ຫວານ ${cItem.sweetness} ${cItem.extraShot ? '• +Shot' : ''}
          </p>
          <span class="font-mono text-[12px] text-charcoal font-semibold">$${cItem.unitPrice.toFixed(2)} × ${cItem.quantity}</span>
        </div>
      </div>
      <div class="flex items-center gap-3 shrink-0">
        <span class="font-serif-title text-[15px] font-bold text-forest-emerald">$${cItem.total.toFixed(2)}</span>
        <button onclick="removeCartItem(${index})" class="w-8 h-8 rounded-lg border border-hairline hover:bg-red-50 text-red-600 flex items-center justify-center transition-colors">
          <span class="material-symbols-outlined text-[16px]">delete</span>
        </button>
      </div>
    `;
    container.appendChild(row);
  });

  const tax = subtotal * 0.08;
  const grandTotal = subtotal + tax;

  if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  if (taxEl) taxEl.textContent = `$${tax.toFixed(2)}`;
  if (totalEl) totalEl.textContent = `$${grandTotal.toFixed(2)}`;
}

function removeCartItem(idx) {
  cart.splice(idx, 1);
  localStorage.setItem('ladolce_cart', JSON.stringify(cart));
  updateCartBadges();
}

// 4. ລະບົບສະແດງທະນາຄານ ແລະ QR
function renderCustomerPaymentOptions() {
  const container = document.getElementById('customerBankSelectorGrid');
  const displayBox = document.getElementById('activeBankQRDisplay');
  if (!container || !displayBox) return;

  if (paymentMethods.length === 0) {
    container.innerHTML = `<p class="text-taupe text-[11px] col-span-full">ກະລຸນາຕິດຕໍ່ບາຣິສຕ້າເພື່ອຊຳລະເງິນສົດ</p>`;
    displayBox.classList.add('hidden');
    return;
  }

  container.innerHTML = paymentMethods.map(p => {
    const isSelected = p.id === selectedBankMethodId;
    return `
      <button type="button" onclick="selectCustomerBank('${p.id}')" 
        class="p-3 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${isSelected ? 'shadow-md scale-[1.02]' : 'opacity-70 hover:opacity-100'}"
        style="border-color: ${p.borderColor}; background-color: ${isSelected ? p.borderColor + '15' : '#FFFFFF'}">
        <div class="flex items-center justify-between">
          <span class="text-[12px] font-bold" style="color: ${p.borderColor}">${p.bankName}</span>
          ${isSelected ? `<span class="material-symbols-outlined text-[16px]" style="color: ${p.borderColor}">check_circle</span>` : ''}
        </div>
        <span class="text-[10px] text-taupe font-mono mt-1">${p.accountNumber}</span>
      </button>
    `;
  }).join('');

  if (!selectedBankMethodId) {
    displayBox.classList.remove('hidden');
    displayBox.style.borderColor = "#E7E4DD";
    displayBox.innerHTML = `
      <div class="p-6 text-center space-y-2">
        <span class="material-symbols-outlined text-[32px] text-forest-leaf/60">account_balance</span>
        <p class="text-[12px] text-primary font-medium">ກະລຸນາກົດເລືອກທະນາຄານດ້ານເທິງ</p>
        <p class="text-[10px] text-taupe">ລະບົບຈະສະແດງ QR Code ຂອງທະນາຄານນັ້ນໃຫ້ທ່ານສະແກນໂອນເງິນ</p>
      </div>
    `;
    return;
  }

  const activeBank = paymentMethods.find(p => p.id === selectedBankMethodId);
  if (activeBank) {
    displayBox.classList.remove('hidden');
    displayBox.style.borderColor = activeBank.borderColor;
    displayBox.innerHTML = `
      <div class="p-4 bg-surface-pure rounded-xl text-center space-y-3">
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold" style="background-color: ${activeBank.borderColor}15; color: ${activeBank.borderColor}">
          <span class="w-2 h-2 rounded-full" style="background-color: ${activeBank.borderColor}"></span>
          <span>ສະແກນ QR ໂອນເຂົ້າ ${activeBank.bankName}</span>
        </div>
        <div class="relative inline-block p-2 rounded-xl border-2" style="border-color: ${activeBank.borderColor}">
          <img src="${activeBank.qrImage}" class="w-48 h-48 rounded-lg object-contain mx-auto"/>
        </div>
        <div class="text-[11px] font-mono text-charcoal space-y-0.5">
          <p class="font-bold text-[13px]">${activeBank.accountNumber}</p>
          <p class="text-taupe">${activeBank.accountName}</p>
        </div>
        <span class="block text-[10px] text-emerald-800 font-medium">ຫຼັງຈາກໂອນແລ້ວ ກະລຸນາອັບໂຫຼດຮູບໃບໂອນ (Slip) ດ້ານລຸ່ມ</span>
      </div>
    `;
  }
}

function selectCustomerBank(bankId) {
  selectedBankMethodId = bankId;
  renderCustomerPaymentOptions();
}

// 5. ອັບໂຫຼດ Slip ເປັນ Base64
async function handleSlipSelected(e) {
  const file = e.target.files[0];
  if (!file) return;

  try {
    if (typeof compressImage === 'function') {
      uploadedSlipDataUrl = await compressImage(file, 800, 800, 0.75);
    } else {
      const reader = new FileReader();
      uploadedSlipDataUrl = await new Promise((res) => {
        reader.onload = () => res(reader.result);
        reader.readAsDataURL(file);
      });
    }

    const preview = document.getElementById('slipImagePreview');
    const container = document.getElementById('slipPreviewContainer');
    const statusText = document.getElementById('slipStatusText');

    if (preview) preview.src = uploadedSlipDataUrl;
    if (container) container.classList.remove('hidden');
    if (statusText) statusText.textContent = "✓ ແນບໃບໂອນເງິນແລ້ວ (ກົດເພື່ອປ່ຽນ)";

    alert("ໃບໂອນເງິນ (Slip) ຖືກແນບເຂົ້າສູ່ອໍເດີ້ແລ້ວ!");
  } catch (err) {
    alert("ບໍ່ສາມາດອັບໂຫຼດຮູບສະລິບໄດ້");
  }
}

function removeSlip() {
  uploadedSlipDataUrl = null;
  const input = document.getElementById('slipFileInput');
  const container = document.getElementById('slipPreviewContainer');
  const statusText = document.getElementById('slipStatusText');

  if (input) input.value = '';
  if (container) container.classList.add('hidden');
  if (statusText) statusText.textContent = "ອັບໂຫຼດຮູບໃບໂອນເງິນ (Slip ບໍ່ເກີນ 1MB)";
}

// 6. ຢືນຢັນສັ່ງຊື້
async function submitOrder() {
  if (cart.length === 0) {
    alert("ກະລຸນາເລືອກເມນູໃສ່ກະຕ່າກ່ອນ!");
    return;
  }

  if (!selectedBankMethodId) {
    alert("ກະລຸນາກົດເລືອກທະນາຄານທີ່ຕ້ອງການໂອນຊຳລະກ່ອນ!");
    return;
  }

  let customerName = currentUser ? currentUser.name : null;
  let customerPhone = currentUser ? currentUser.phone : null;

  if (!customerName || !customerPhone) {
    customerName = prompt("ກະລຸນາໃສ່ຊື່ຂອງທ່ານ (ສຳລັບຮຽກຮັບເຄື່ອງດື່ມ):", "Elena");
    if (!customerName) return;

    customerPhone = prompt("ກະລຸນາໃສ່ເບີໂທລະສັບຂອງທ່ານ (ກໍລະນີອໍເດີ້ມີບັນຫາ):", "+856 20 ");
    if (!customerPhone || customerPhone.length < 6) {
      alert("ກະລຸນາໃສ່ເບີໂທລະສັບທີ່ຖືກຕ້ອງ ເພື່ອໃຫ້ພະນັກງານຕິດຕໍ່ໄດ້!");
      return;
    }
  }

  if (!uploadedSlipDataUrl) {
    const proceed = confirm("ທ່ານຍັງບໍ່ໄດ້ແນບສະລິບ, ຕ້ອງການຊຳລະເງິນສົດໜ້າຮ້ານແທນບໍ່?");
    if (!proceed) return;
  }

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;
  const orderNum = Math.floor(1000 + Math.random() * 9000);

  const newOrder = {
    id: 'LD-' + orderNum,
    createdAt: new Date().toISOString(),
    customerName: customerName,
    customerPhone: customerPhone,
    customerEmail: currentUser ? currentUser.email : "guest@ladolce.com",
    items: [...cart],
    subtotal, tax, total,
    note: document.getElementById('checkoutCustomerNote')?.value || "None",
    selectedBank: selectedBankMethodId,
    slipUrl: uploadedSlipDataUrl || null,
    status: "pending",
    delayNotice: null
  };

  orders.unshift(newOrder);
  localStorage.setItem('ladolce_orders', JSON.stringify(orders));

  currentActiveOrder = newOrder;
  localStorage.setItem('ladolce_active_order', JSON.stringify(currentActiveOrder));

  if (isFirebaseReady && db) {
    try {
      await db.collection("orders").doc(newOrder.id).set(newOrder);
      console.log("✅ Order pushed to Cloud Firestore:", newOrder.id);
    } catch (e) {}
  }

  cart = [];
  localStorage.setItem('ladolce_cart', JSON.stringify(cart));
  removeSlip();
  updateCartBadges();

  alert(`ສັ່ງຊື້ສຳເລັດແລ້ວ! ເລກທີອໍເດີ້ຂອງທ່ານແມ່ນ: ${newOrder.id}`);
  switchCustomerTab('ticket');
}
