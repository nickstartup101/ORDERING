// ລະບົບກະຕ່າ ແລະ ການສັ່ງຊື້
function confirmAddToCart() {
  if (!activeCustomizingItem) return;

  const milkRadio = document.querySelector('input[name="milkOption"]:checked');
  const milkVal = milkRadio ? milkRadio.value : 'Standard';
  const extraShot = document.getElementById('addonExtraShot')?.checked;
  const coldFoam = document.getElementById('addonColdFoam')?.checked;

  let unitPrice = activeCustomizingItem.variants[selectedVariant] || 4.50;
  if (milkVal.includes('Oat') || milkVal.includes('Almond')) unitPrice += 0.75;
  if (extraShot) unitPrice += 1.20;
  if (coldFoam) unitPrice += 1.00;

  const cartItem = {
    cartId: 'c_' + Date.now(),
    itemId: activeCustomizingItem.id,
    name: activeCustomizingItem.name,
    variant: selectedVariant,
    milk: milkVal,
    sweetness: selectedSweetnessLevel,
    extraShot: extraShot,
    coldFoam: coldFoam,
    unitPrice: unitPrice,
    quantity: modalQuantity,
    total: unitPrice * modalQuantity,
    image: activeCustomizingItem.image
  };

  cart.push(cartItem);
  localStorage.setItem('ladolce_cart', JSON.stringify(cart));
  updateCartBadges();
  closeCustomizeModal();
  showToast(`${cartItem.name} ເພີ່ມໃສ່ກະຕ່າແລ້ວ`);
}

function updateCartBadges() {
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById('cartBadgeCount').textContent = totalCount;

  const navDot = document.getElementById('bottomNavCartDot');
  if (totalCount > 0) {
    navDot.classList.remove('hidden');
  } else {
    navDot.classList.add('hidden');
  }

  renderCartList();
}

function renderCartList() {
  const container = document.getElementById('cartListContainer');
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="p-8 rounded-lg bg-surface-pure border border-hairline text-center space-y-3">
        <span class="material-symbols-outlined text-[36px] text-taupe">shopping_bag</span>
        <p class="font-serif text-[16px] text-primary">ບໍ່ມີລາຍການໃນກະຕ່າ</p>
        <p class="text-[12px] text-taupe font-lao">ກະລຸນາເລືອກເຄື່ອງດື່ມ ຫຼື ເບເກີຣີ່ທີ່ທ່ານມັກ</p>
        <button onclick="switchCustomerTab('menu')" class="mt-2 px-4 py-2 rounded bg-primary text-white text-[11px] uppercase tracking-wider font-medium font-lao">
          ໄປທີ່ເມນູ
        </button>
      </div>
    `;
    document.getElementById('summarySubtotal').textContent = "$0.00";
    document.getElementById('summaryTax').textContent = "$0.00";
    document.getElementById('summaryTotal').textContent = "$0.00";
    return;
  }

  container.innerHTML = '';
  let subtotal = 0;

  cart.forEach((cItem, index) => {
    subtotal += cItem.total;
    const row = document.createElement('div');
    row.className = 'p-3.5 rounded-lg bg-surface-pure border border-hairline flex items-center justify-between gap-3 shadow-xs';
    row.innerHTML = `
      <div class="flex items-center gap-3">
        <img src="${cItem.image}" alt="${cItem.name}" class="w-12 h-12 rounded object-cover border border-hairline"/>
        <div>
          <h4 class="font-serif text-[14px] text-primary font-medium">${cItem.name}</h4>
          <p class="text-[11px] text-taupe font-lao leading-tight">
            ${cItem.variant.toUpperCase()} • ${cItem.milk} • ຫວານ ${cItem.sweetness}
            ${cItem.extraShot ? ' • +Shot' : ''} ${cItem.coldFoam ? ' • +Foam' : ''}
          </p>
          <span class="font-mono text-[12px] text-charcoal">$${cItem.unitPrice.toFixed(2)} × ${cItem.quantity}</span>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span class="font-serif text-[15px] font-medium text-primary mr-1">$${cItem.total.toFixed(2)}</span>
        <button onclick="removeCartItem(${index})" class="w-7 h-7 rounded border border-hairline flex items-center justify-center text-taupe hover:text-red-700">
          <span class="material-symbols-outlined text-[15px]">delete</span>
        </button>
      </div>
    `;
    container.appendChild(row);
  });

  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  document.getElementById('summarySubtotal').textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById('summaryTax').textContent = `$${tax.toFixed(2)}`;
  document.getElementById('summaryTotal').textContent = `$${total.toFixed(2)}`;
}

function removeCartItem(idx) {
  cart.splice(idx, 1);
  localStorage.setItem('ladolce_cart', JSON.stringify(cart));
  updateCartBadges();
}

function handleSlipSelected(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    uploadedSlipDataUrl = evt.target.result;
    document.getElementById('slipImagePreview').src = uploadedSlipDataUrl;
    document.getElementById('slipPreviewContainer').classList.remove('hidden');
    document.getElementById('slipStatusText').textContent = "ປ່ຽນຮູບໃບໂອນ (Change Slip)";
    showToast("ໃບໂອນເງິນຖືກອັບໂຫຼດແລ້ວ");
  };
  reader.readAsDataURL(file);
}

function removeSlip() {
  uploadedSlipDataUrl = null;
  document.getElementById('slipFileInput').value = '';
  document.getElementById('slipPreviewContainer').classList.add('hidden');
  document.getElementById('slipStatusText').textContent = "ອັບໂຫຼດຮູບໃບໂອນເງິນ (Slip)";
}

function submitOrder() {
  if (cart.length === 0) {
    alert("ກະລຸນາເລືອກສິນຄ້າໃສ່ກະຕ່າກ່ອນ!");
    return;
  }

  if (!uploadedSlipDataUrl) {
    if (!confirm("ທ່ານຍັງບໍ່ໄດ້ແນບໃບໂອນເງິນ (Slip). ຕ້ອງການຢືນຢັນສັ່ງຊື້ ແລະ ຊຳລະເງິນສົດທີ່ໜ້າຮ້ານແທນບໍ່?")) {
      return;
    }
  }

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;
  const orderNum = Math.floor(1000 + Math.random() * 9000);

  const newOrder = {
    id: 'LD-' + orderNum,
    createdAt: new Date().toISOString(),
    customerName: currentUser ? currentUser.name : "Guest Elena",
    customerPhone: currentUser ? currentUser.phone : "+856 20 5512 8899",
    customerEmail: currentUser ? currentUser.email : "guest@ladolce.com",
    items: [...cart],
    subtotal: subtotal,
    tax: tax,
    total: total,
    note: document.getElementById('checkoutCustomerNote')?.value || "None",
    slipUrl: uploadedSlipDataUrl || null,
    status: "pending",
    estimatedMinutes: 10,
    delayNotice: null
  };

  if (isFirebaseReady && db) {
    db.collection("orders").doc(newOrder.id).set(newOrder).catch(err => {
      console.warn("Writing order locally:", err);
    });
  }

  orders.unshift(newOrder);
  localStorage.setItem('ladolce_orders', JSON.stringify(orders));

  currentActiveOrder = newOrder;
  localStorage.setItem('ladolce_active_order', JSON.stringify(currentActiveOrder));

  cart = [];
  localStorage.setItem('ladolce_cart', JSON.stringify(cart));
  removeSlip();
  updateCartBadges();

  startStaffAlarm();
  showToast("ອໍເດີ້ຖືກສົ່ງເຖິງບາຣິສຕ້າແລ້ວ!");
  switchCustomerTab('ticket');
}
