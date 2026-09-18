// ລະບົບສະແດງ QR Code ທະນາຄານໃຫ້ລູກຄ້າເລືອກ
let selectedBankMethodId = paymentMethods[0]?.id || null;

function renderCustomerPaymentOptions() {
  const container = document.getElementById('customerBankSelectorGrid');
  const displayBox = document.getElementById('activeBankQRDisplay');
  if (!container || !displayBox) return;

  if (paymentMethods.length === 0) {
    container.innerHTML = `<p class="text-taupe text-[11px]">ກະລຸນາຕິດຕໍ່ພະນັກງານເພື່ອຊຳລະເງິນສົດ</p>`;
    displayBox.classList.add('hidden');
    return;
  }

  if (!selectedBankMethodId || !paymentMethods.find(p => p.id === selectedBankMethodId)) {
    selectedBankMethodId = paymentMethods[0].id;
  }

  // ປຸ່ມເລືອກທະນາຄານ
  container.innerHTML = paymentMethods.map(p => `
    <button type="button" onclick="selectCustomerBank('${p.id}')" 
      class="p-2.5 rounded-lg border-2 text-left transition-all flex flex-col justify-between ${p.id === selectedBankMethodId ? 'bg-surface shadow-xs font-semibold' : 'bg-surface-pure opacity-70 hover:opacity-100'}"
      style="border-color: ${p.borderColor}">
      <span class="text-[12px] block" style="color: ${p.borderColor}">${p.bankName}</span>
      <span class="text-[10px] text-taupe font-mono">${p.accountNumber}</span>
    </button>
  `).join('');

  // ສະແດງ QR ພ້ອມກອບສີຕາມທະນາຄານທີ່ເລືອກ
  const activeBank = paymentMethods.find(p => p.id === selectedBankMethodId);
  if (activeBank) {
    displayBox.classList.remove('hidden');
    displayBox.style.borderColor = activeBank.borderColor;
    displayBox.innerHTML = `
      <div class="p-3 bg-surface-pure rounded-lg text-center space-y-2">
        <span class="text-[11px] font-bold block" style="color: ${activeBank.borderColor}">ສະແກນ QR ໂອນເຂົ້າ: ${activeBank.bankName}</span>
        <img src="${activeBank.qrImage}" class="w-44 h-44 mx-auto rounded border-2 p-1 object-contain" style="border-color: ${activeBank.borderColor}"/>
        <div class="text-[11px] font-mono text-charcoal">
          <p class="font-bold">${activeBank.accountNumber}</p>
          <p class="text-[10px] text-taupe">${activeBank.accountName}</p>
        </div>
      </div>
    `;
  }
}

function selectCustomerBank(bankId) {
  selectedBankMethodId = bankId;
  renderCustomerPaymentOptions();
}
