// ຢືນຢັນສັ່ງຊື້ (ຮອງຮັບ Guest ລູກຄ້າບໍ່ຕ້ອງ Login)
async function submitOrder() {
  if (cart.length === 0) {
    alert("ກະລຸນາເລືອກເມນູໃສ່ກະຕ່າກ່ອນ!");
    return;
  }

  if (!selectedBankMethodId) {
    alert("ກະລຸນາກົດເລືອກທະນາຄານທີ່ຕ້ອງການໂອນຊຳລະກ່ອນ!");
    return;
  }

  // ຖ້າລູກຄ້າບໍ່ໄດ້ Login -> ບັງຄັບໃຫ້ໃສ່ ຊື່ ແລະ ເບີໂທ ເພື່ອໃຫ້ Staff ຕິດຕໍ່ໄດ້
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

  // ບັນທຶກລົງ Local
  orders.unshift(newOrder);
  localStorage.setItem('ladolce_orders', JSON.stringify(orders));

  // ຈື່ຈຳອໍເດີ້ລູກຄ້າປັດຈຸບັນ
  currentActiveOrder = newOrder;
  localStorage.setItem('ladolce_active_order', JSON.stringify(currentActiveOrder));

  // 1. ສົ່ງຂຶ້ນ Cloud Firestore Real-time ທັນທີ (ໃຫ້ Staff ໄດ້ຍິນສຽງເຕືອນ)
  if (isFirebaseReady && db) {
    try {
      await db.collection("orders").doc(newOrder.id).set(newOrder);
      console.log("✅ Order pushed to Cloud Firestore:", newOrder.id);
    } catch (e) {
      console.warn("Firestore order write error:", e);
    }
  }

  // ລ້າງກະຕ່າ
  cart = [];
  localStorage.setItem('ladolce_cart', JSON.stringify(cart));
  removeSlip();
  updateCartBadges();

  alert(`ສັ່ງຊື້ສຳເລັດແລ້ວ! ເລກທີອໍເດີ້ຂອງທ່ານແມ່ນ: ${newOrder.id}`);
  switchCustomerTab('ticket');
}
