// =======================================================
// LA DOLCE — CART & CHECKOUT (MULTI-TICKET LINKED)
// =======================================================

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
        <span class="material-symbols-outlined text-[48px] text-taupe">shopping_bag</span>
        <h4 class="font-serif-title text-[16px] text-primary font-bold">ກະຕ່າຂອງທ່ານຍັງຫວ່າງຢູ່</h4>
        <p class="text-[12px] text-taupe">ເລືອກເມນູທີ່ມັກແລ້ວເພີ່ມໃສ່ກະຕ່າໄດ້ເລີຍ</p>
        <button type="button" onclick="switchCustomerTab('menu')" class="px-4 py-2 rounded-lg bg-forest-emerald text-white text-[12px] font-bold cursor-pointer">ໄປທີ່ໜ້າເມນູ</button>
      </div>
    `;
    calculateCartSummary();
    return;
  }

  container.innerHTML = cart.map(item => `
    <div class="p-4 rounded-xl bg-surface-pure border border-hairline flex gap-3.5 items-start justify-between font-lao">
      <div class="flex gap-3">
        <div class="w-16 h-16 rounded-lg bg-surface-dim overflow-hidden shrink-0">
          <img src="${item.image || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200'}" class="w-full h-full object-cover"/>
        </div>
        <div>
          <h4 class="font-bold text-[14px] text-primary">${item.name}</h4>
          <div class="text-[11px] text-taupe space-x-1 mt-0.5">
            <span class="font-medium text-forest-leaf">[${item.variant === 'hot' ? 'ຮ້ອນ' : (item.variant === 'iced' ? 'ເຢັນ' : 'ປັ່ນ')}]</span>
            ${item.sweetness ? `<span>• ຫວານ ${item.sweetness}</span>` : ''}
            ${item.milk ? `<span>• ${item.milk}</span>` : ''}
          </div>
          ${item.note ? `
            <div class="mt-1 px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-900 text-[10px] inline-flex items-center gap-1 font-bold">
              <span>📝 ໝາຍເຫດ: ${item.note}</span>
            </div>
          ` : ''}
          <div class="font-serif-title font-bold text-forest-emerald text-[13px] mt-1">${formatLAK(item.totalPrice)}</div>
        </div>
      </div>

      <div class="flex flex-col items-end gap-2">
        <button type="button" onclick="removeCartItem('${item.cartItemId}')" class="text-taupe hover:text-red-600 cursor-pointer">
          <span class="material-symbols-outlined text-[18px]">delete</span>
        </button>
        <div class="flex items-center border border-hairline rounded-lg bg-surface">
          <button type="button" onclick="adjustCartQty('${item.cartItemId}', -1)" class="w-7 h-7 flex items-center justify-center text-charcoal cursor-pointer"><span class="material-symbols-outlined text-[13px]">remove</span></button>
          <span class="px-2 text-[12px] font-bold">${item.quantity}</span>
          <button type="button" onclick="adjustCartQty('${item.cartItemId}', 1)" class="w-7 h-7 flex items-center justify-center text-charcoal cursor-pointer"><span class="material-symbols-outlined text-[13px]">add</span></button>
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
  const subtotal = (cart || []).reduce((sum, item) => sum + item.totalPrice, 0);
  const total = subtotal;
  const subEl = document.getElementById('summarySubtotal');
  const totEl = document.getElementById('summaryTotal');
  if (subEl) subEl.textContent = formatLAK(subtotal);
  if (totEl) totEl.textContent = formatLAK(total);
  return { subtotal, total };
}

// 🔥 ກົດ Check Out ສັ່ງຊື້
window.handleStartCheckout = async function() {
  if (!cart || cart.length === 0) {
    alert("⚠️ ກະລຸນາເລືອກເມນູໃສ່ກະຕ່າກ່ອນ!");
    return;
  }

  const user = firebase.auth().currentUser;
  let customerName = "Guest Customer";
  let customerPhone = "+856 20 Walk-in";
  let customerId = user ? user.uid : "guest_" + Date.now();

  if (user) {
    customerName = user.displayName || user.email.split('@')[0];
  } else {
    // ຖ້າບໍ່ທັນ Login ໃຫ້ເປີດ Modal ຖາມຊື່
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
    alert("ກະລຸນາປ້ອນຊື່ ແລະ ເບີໂທລະສັບ!");
    return;
  }

  document.getElementById('guestContactModal')?.classList.add('hidden');
  await executeOrderPlacement('guest_' + phone, name, phone);
};

window.closeGuestModal = function() {
  document.getElementById('guestContactModal')?.classList.add('hidden');
};

// 🔥 ບັນທຶກອໍເດີ້ລົງ Firestore ພ້ອມສົ່ງໄປໜ້າ Ticket
async function executeOrderPlacement(customerId, customerName, customerPhone) {
  try {
    const { subtotal, total } = calculateCartSummary();
    const firestore = db || firebase.firestore();

    const orderData = {
      orderCode: 'LD-' + Math.floor(1000 + Math.random() * 9000),
      customerId: customerId,
      customerName: customerName,
      customerPhone: customerPhone,
      items: cart,
      subtotal: subtotal,
      totalAmount: total,
      status: 'pending', // 👈 ເລີ່ມຕົ້ນດ້ວຍ pending ເພື່ອໃຫ້ Staff ເຫັນ Pop-up
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    // 1. ບັນທຶກລົງ Firestore
    const docRef = await firestore.collection('orders').add(orderData);

    // 2. 🔥🔥🔥 ບັນທຶກ Order ID ເຂົ້າ LocalStorage ຂອງລູກຄ້າ (ແກ້ລູກຄ້າບໍ່ເຫັນ Ticket) 🔥🔥🔥
    const customerOrders = JSON.parse(localStorage.getItem('customer_order_ids') || '[]');
    customerOrders.unshift(docRef.id);
    localStorage.setItem('customer_order_ids', JSON.stringify(customerOrders));
    localStorage.setItem('activeOrderId', docRef.id);

    // 3. ລ້າງກະຕ່າ
    cart = [];
    localStorage.removeItem('ladolce_cart');
    updateCartBadge();

    alert("🎉 ສັ່ງຊື້ສຳເລັດແລ້ວ! ກຳລັງພາທ່ານໄປທີ່ໜ້າປີ້ຮັບເຄື່ອງ...");

    // 4. ພາໄປໜ້າ Ticket ທັນທີ
    switchCustomerTab('ticket');

  } catch (error) {
    console.error("Order placement error:", error);
    alert("ເກີດຂໍ້ຜິດພາດໃນການສັ່ງຊື້: " + error.message);
  }
}
