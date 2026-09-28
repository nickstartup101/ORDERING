// =======================================================
// LA DOLCE — CART, 500M DELIVERY & ADVANCED COUPON ENGINE
// =======================================================

let cart = [];
let appliedCoupon = null;
let fulfillmentType = 'pickup';
let uploadedSlipUrl = '';

function addToCartStore(item) {
  cart.push(item);
  updateCartBadge();
  if (typeof renderCartList === 'function') renderCartList();
}

function updateCartBadge() {
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const badge = document.getElementById('cartBadgeCount');
  const dot = document.getElementById('bottomNavCartDot');
  
  if (badge) {
    badge.textContent = totalCount;
    badge.classList.toggle('scale-125', true);
    setTimeout(() => badge.classList.remove('scale-125'), 200);
  }
  if (dot) {
    dot.classList.toggle('hidden', totalCount === 0);
  }
}

function removeCartItem(cartItemId) {
  cart = cart.filter(item => item.cartItemId !== cartItemId);
  updateCartBadge();
  renderCartList();
}

function adjustCartItemQty(cartItemId, delta) {
  const item = cart.find(i => i.cartItemId === cartItemId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    removeCartItem(cartItemId);
    return;
  }
  item.totalPrice = item.unitPrice * item.quantity;
  updateCartBadge();
  renderCartList();
}

function renderCartList() {
  const container = document.getElementById('cartListContainer');
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center bg-surface-pure rounded-xl border border-hairline space-y-3">
        <span class="material-symbols-outlined text-[48px] text-taupe">shopping_bag</span>
        <h4 class="font-serif-title text-[16px] text-primary">ກະຕ່າຂອງທ່ານຍັງຫວ່າງຢູ່</h4>
        <p class="text-[12px] text-taupe">ເລືອກເຄື່ອງດື່ມ ຫຼື ເບເກີຣີ່ທີ່ທ່ານມັກແລ້ວເພີ່ມໃສ່ກະຕ່າໄດ້ເລີຍ</p>
        <button type="button" onclick="switchCustomerTab('menu')" class="px-4 py-2 rounded-lg bg-forest-emerald text-white text-[12px] font-bold">ໄປທີ່ໜ້າເມນູ</button>
      </div>
    `;
    calculateCartSummary();
    return;
  }

  container.innerHTML = cart.map(item => `
    <div class="p-4 rounded-xl bg-surface-pure border border-hairline flex gap-3.5 items-start justify-between">
      <div class="flex gap-3">
        <img src="${item.image || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200'}" class="w-16 h-16 rounded-lg object-cover border border-hairline shrink-0"/>
        <div>
          <h4 class="font-bold text-[14px] text-primary">${item.name}</h4>
          <div class="text-[11px] text-taupe space-x-1 mt-0.5">
            <span class="font-medium text-forest-leaf">[${item.variant === 'hot' ? 'ຮ້ອນ' : (item.variant === 'iced' ? 'ເຢັນ' : (item.variant === 'frappe' ? 'ປັ່ນ' : 'ມາດຕະຖານ'))}]</span>
            ${item.sweetness ? `<span>• ຫວານ ${item.sweetness}</span>` : ''}
            ${item.milk && item.milk !== 'Whole Milk' ? `<span>• ${item.milk}</span>` : ''}
            ${item.hasExtraShot ? `<span class="text-forest-emerald font-semibold">• +Extra Shot</span>` : ''}
          </div>

          <!-- 🔥 ສະແດງ Remark ໃຫ້ລູກຄ້າກວດສອບ -->
          ${item.note ? `
            <div class="mt-1 px-2 py-0.5 rounded bg-amber-50/80 border border-amber-200 text-amber-900 text-[10px] inline-flex items-center gap-1">
              <span class="material-symbols-outlined text-[12px]">edit_note</span>
              <span>ໝາຍເຫດ: ${item.note}</span>
            </div>
          ` : ''}

          <div class="font-serif-title font-bold text-forest-emerald text-[13px] mt-1.5">${formatLAK(item.totalPrice)}</div>
        </div>
      </div>

      <div class="flex flex-col items-end gap-2">
        <button type="button" onclick="removeCartItem('${item.cartItemId}')" class="text-taupe hover:text-red-600 text-[14px] cursor-pointer">
          <span class="material-symbols-outlined text-[17px]">delete</span>
        </button>
        <div class="flex items-center border border-hairline rounded-lg bg-surface">
          <button type="button" onclick="adjustCartItemQty('${item.cartItemId}', -1)" class="w-7 h-7 flex items-center justify-center text-charcoal hover:bg-surface-pure cursor-pointer"><span class="material-symbols-outlined text-[13px]">remove</span></button>
          <span class="px-2 text-[12px] font-bold">${item.quantity}</span>
          <button type="button" onclick="adjustCartItemQty('${item.cartItemId}', 1)" class="w-7 h-7 flex items-center justify-center text-charcoal hover:bg-surface-pure cursor-pointer"><span class="material-symbols-outlined text-[13px]">add</span></button>
        </div>
      </div>
    </div>
  `).join('');

  calculateCartSummary();
}

function calculateCartSummary() {
  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  let discount = 0;

  if (appliedCoupon) {
    if (appliedCoupon.type === 'percent') {
      discount = (subtotal * appliedCoupon.value) / 100;
      if (appliedCoupon.maxDiscount && discount > appliedCoupon.maxDiscount) {
        discount = appliedCoupon.maxDiscount;
      }
    } else {
      discount = appliedCoupon.value;
    }
  }

  const total = Math.max(0, subtotal - discount);

  document.getElementById('summarySubtotal').textContent = formatLAK(subtotal);
  document.getElementById('summaryTotal').textContent = formatLAK(total);

  const couponRow = document.getElementById('couponDiscountRow');
  if (couponRow) {
    couponRow.classList.toggle('hidden', discount <= 0);
    document.getElementById('summaryCouponDiscount').textContent = `-${formatLAK(discount)}`;
  }

  return { subtotal, discount, total };
}

// 🔥 3. ສົ່ງອໍເດີ້ຂຶ້ນ FIRESTORE ພ້ອມ FIELD NOTE ທຸກລາຍການ
async function handleStartCheckout() {
  if (cart.length === 0) {
    alert("ກະຕ່າຂອງທ່ານຍັງຫວ່າງຢູ່!");
    return;
  }

  // ກວດສອບ Auth ຫຼື Guest
  const user = firebase.auth().currentUser;
  let customerName = "Guest Customer";
  let customerPhone = "";
  let customerId = user ? user.uid : "guest";

  if (user) {
    customerName = user.displayName || user.email.split('@')[0];
  } else {
    const guestModal = document.getElementById('guestContactModal');
    if (guestModal) {
      guestModal.classList.remove('hidden');
      return;
    }
  }

  await executeCheckout(customerId, customerName, customerPhone);
}

async function submitGuestOrder() {
  const name = document.getElementById('guestInputName')?.value.trim();
  const phone = document.getElementById('guestInputPhone')?.value.trim();

  if (!name || !phone) {
    alert("ກະລຸນາປ້ອນຊື່ ແລະ ເບີໂທລະສັບ!");
    return;
  }

  document.getElementById('guestContactModal')?.classList.add('hidden');
  await executeCheckout('guest_' + phone, name, phone);
}

async function executeCheckout(customerId, customerName, customerPhone) {
  try {
    const { subtotal, discount, total } = calculateCartSummary();
    const deliveryAddress = document.getElementById('deliveryAddressInput')?.value.trim() || '';

    // 🔥 ປະກອບລາຍການສິນຄ້າ ພ້ອມ REMARK ຢ່າງຄົບຖ້ວນ
    const orderItems = cart.map(item => ({
      cartItemId: item.cartItemId,
      id: item.id,
      name: item.name,
      variant: item.variant,
      sweetness: item.sweetness,
      milk: item.milk,
      hasExtraShot: item.hasExtraShot,
      note: item.note || '', // 👈 🔥 ສົ່ງ NOTE ຂຶ້ນ Firestore
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice
    }));

    const orderDoc = {
      orderCode: 'LD-' + Math.floor(1000 + Math.random() * 9000),
      customerId: customerId,
      customerName: customerName,
      customerPhone: customerPhone,
      items: orderItems,
      subtotal: subtotal,
      discount: discount,
      totalAmount: total,
      fulfillmentType: fulfillmentType,
      deliveryAddress: fulfillmentType === 'delivery' ? deliveryAddress : '',
      slipUrl: uploadedSlipUrl || '',
      status: 'pending', // pending, preparing, ready, completed, cancelled
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await firebase.firestore().collection('orders').add(orderDoc);
    
    // ບັນທຶກ Active Order ID ໄວ້ໃນ LocalStorage ເພື່ອໃຫ້ໜ້າ Ticket ຕິດຕາມສະຖານະ
    localStorage.setItem('activeOrderId', docRef.id);

    // ລ້າງກະຕ່າ
    cart = [];
    updateCartBadge();
    
    // ປ່ຽນໄປໜ້າ Ticket
    switchCustomerTab('ticket');

  } catch (error) {
    console.error("Order error:", error);
    alert("ເກີດຂໍ້ຜິດພາດໃນການສັ່ງຊື້: " + error.message);
  }
}
