// ==========================================
// CART & PAYMENT ENGINE
// ==========================================

let selectedBankMethodId = null; // ບັງຄັບໃຫ້ເລີ່ມຕົ້ນເປັນ null ເພື່ອໃຫ້ລູກຄ້າກົດເລືອກກ່ອນ
let uploadedSlipDataUrl = null;

function renderCustomerPaymentOptions() {
  const container = document.getElementById('customerBankSelectorGrid');
  const displayBox = document.getElementById('activeBankQRDisplay');
  if (!container || !displayBox) return;

  if (paymentMethods.length === 0) {
    container.innerHTML = `<p class="text-taupe text-[11px] col-span-full">ກະລຸນາຕິດຕໍ່ບາຣິສຕ້າເພື່ອຊຳລະເງິນສົດ</p>`;
    displayBox.classList.add('hidden');
    return;
  }

  // 1. ສະແດງປຸ່ມທະນາຄານໃຫ້ເລືອກ
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

  // 2. ຖ້າຍັງບໍ່ເລືອກທະນາຄານ ໃຫ້ເຊື່ອງ QR ແລະ ສະແດງຄຳແນະນຳ
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

  // 3. ເມື່ອເລືອກແລ້ວ ສະແດງ QR ພ້ອມກອບສີຕາມທະນາຄານນັ້ນ
  const activeBank = paymentMethods.find(p => p.id === selectedBankMethodId);
  if (activeBank) {
    displayBox.classList.remove('hidden');
    displayBox.style.borderColor = activeBank.borderColor;
    displayBox.innerHTML = `
      <div class="p-4 bg-surface-pure rounded-xl text-center space-y-3 animate-scale-up">
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

// 4. ອັບໂຫຼດສະລິບ ແລະ ບີບອັດເປັນ Base64 ອັດຕະໂນມັດ
async function handleSlipSelected(e) {
  const file = e.target.files[0];
  if (!file) return;

  try {
    // ບີບອັດຮູບສະລິບໃຫ້ເຫຼືອ ~100KB ເພື່ອໃຫ້ບັນທຶກລົງຖານຂໍ້ມູນໄດ້ໄວ
    uploadedSlipDataUrl = await compressImage(file, 800, 800, 0.75);
    document.getElementById('slipImagePreview').src = uploadedSlipDataUrl;
    document.getElementById('slipPreviewContainer').classList.remove('hidden');
    document.getElementById('slipStatusText').textContent = "✓ ແນບໃບໂອນເງິນແລ້ວ (ກົດເພື່ອປ່ຽນ)";
    showAtelierAlert({ title: "ອັບໂຫຼດສຳເລັດ", message: "ໃບໂອນເງິນ (Slip) ຖືກແນບເຂົ້າສູ່ອໍເດີ້ແລ້ວ!", type: "success" });
  } catch (err) {
    showAtelierAlert({ title: "ຜິດພາດ", message: "ບໍ່ສາມາດປະມວນຜົນຮູບສະລິບນີ້ໄດ້", type: "error" });
  }
}

function removeSlip() {
  uploadedSlipDataUrl = null;
  document.getElementById('slipFileInput').value = '';
  document.getElementById('slipPreviewContainer').classList.add('hidden');
  document.getElementById('slipStatusText').textContent = "ອັບໂຫຼດຮູບໃບໂອນເງິນ (Slip ບໍ່ເກີນ 1MB)";
}

// 5. ຢືນຢັນການສັ່ງຊື້
async function submitOrder() {
  if (cart.length === 0) {
    showAtelierAlert({ title: "ກະຕ່າຫວ່າງເປົ່າ", message: "ກະລຸນາເລືອກເມນູໃສ່ກະຕ່າກ່ອນຢືນຢັນການສັ່ງ!", type: "info" });
    return;
  }

  if (!selectedBankMethodId) {
    showAtelierAlert({ title: "ກະລຸນາເລືອກທະນາຄານ", message: "ກະລຸນາກົດເລືອກທະນາຄານທີ່ທ່ານຕ້ອງການໂອນຊຳລະກ່ອນ!", type: "info" });
    return;
  }

  if (!uploadedSlipDataUrl) {
    const proceedWithoutSlip = await showAtelierConfirm({
      title: "ຍັງບໍ່ໄດ້ແນບໃບໂອນ (Slip)",
      message: "ທ່ານຍັງບໍ່ໄດ້ອັບໂຫຼດຮູບສະລິບໂອນເງິນ. ຕ້ອງການສັ່ງຊື້ ແລະ ຊຳລະເງິນສົດທີ່ໜ້າຮ້ານແທນບໍ່?",
      confirmText: "ສັ່ງຊື້ເລີຍ",
      cancelText: "ແນບສະລິບກ່ອນ",
      isDanger: false
    });
    if (!proceedWithoutSlip) return;
  }

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;
  const orderNum = Math.floor(1000 + Math.random() * 9000);

  const newOrder = {
    id: 'LD-' + orderNum,
    createdAt: new Date().toISOString(),
    customerName: currentUser ? currentUser.name : "Guest Customer",
    customerPhone: currentUser ? currentUser.phone : "+856 20 5512 8899",
    customerEmail: currentUser ? currentUser.email : "guest@ladolce.com",
    items: [...cart],
    subtotal, tax, total,
    note: document.getElementById('checkoutCustomerNote')?.value || "None",
    selectedBank: selectedBankMethodId,
    slipUrl: uploadedSlipDataUrl || null,
    status: "pending",
    delayNotice: null
  };

  // ເພີ່ມລົງ Local orders
  orders.unshift(newOrder);
  localStorage.setItem('ladolce_orders', JSON.stringify(orders));

  currentActiveOrder = newOrder;
  localStorage.setItem('ladolce_active_order', JSON.stringify(currentActiveOrder));

  // Sync to Firestore
  if (isFirebaseReady && db) {
    db.collection("orders").doc(newOrder.id).set(newOrder).catch(e => console.warn(e));
  }

  // ລ້າງກະຕ່າ
  cart = [];
  localStorage.setItem('ladolce_cart', JSON.stringify(cart));
  removeSlip();
  updateCartBadges();

  startStaffAlarm();

  showAtelierAlert({
    title: "ສັ່ງຊື້ສຳເລັດແລ້ວ! 🎉",
    message: `ອໍເດີ້ເລກທີ ${newOrder.id} ຖືກສົ່ງໄປຍັງບາຣິສຕ້າຮຽບຮ້ອຍແລ້ວ. ທ່ານສາມາດຕິດຕາມສະຖານະການຊົງໄດ້ທີ່ໜ້າ "ປີ້ຮັບເຄື່ອງ".`,
    type: "success"
  }).then(() => {
    switchCustomerTab('ticket');
  });
}
