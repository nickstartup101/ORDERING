// =======================================================
// DIGITAL TICKET PASS & LIVE PROGRESSION STATUS
// =======================================================

function renderCustomerTicket() {
  const container = document.getElementById('activeTicketContainer');
  if (!container) return;

  if (!currentActiveOrder) {
    container.innerHTML = `
      <div class="p-8 bg-surface-pure border border-hairline rounded-2xl text-center space-y-2">
        <span class="material-symbols-outlined text-[36px] text-forest-leaf">receipt_long</span>
        <p class="text-taupe text-[13px]">ບໍ່ມີອໍເດີ້ທີ່ກຳລັງດຳເນີນການ</p>
      </div>
    `;
    return;
  }

  const status = currentActiveOrder.status;
  let statusTitle = "Order Received";
  let statusDesc = "ລໍຖ້າບາຣິສຕ້າກວດສະລິບ ແລະ ຮັບອໍເດີ້";
  let bgClass = "bg-forest-emerald";

  if (status === 'crafting') {
    statusTitle = "Crafting in Progress ☕";
    statusDesc = "ບາຣິສຕ້າກຳລັງສະກັດກາເຟ ແລະ ປຸງແຕ່ງ";
  } else if (status === 'ready') {
    statusTitle = "Ready for Pick-up! 🎉";
    statusDesc = "ເຄື່ອງດື່ມພ້ອມແລ້ວ! ເຊີນຮັບໄດ້ທີ່ Counter 02";
    bgClass = "bg-emerald-800";
  } else if (status === 'completed') {
    statusTitle = "Order Complete ✨";
    statusDesc = "ຂອບໃຈທີ່ມາອຸດໜູນ LA DOLCE";
  } else if (status === 'cancelled') {
    statusTitle = "Order Cancelled ⚠️";
    statusDesc = currentActiveOrder.cancelReason || "ອໍເດີ້ຖືກຍົກເລີກ";
    bgClass = "bg-red-800";
  }

  container.innerHTML = `
    <div class="bg-surface-pure border border-hairline rounded-2xl overflow-hidden shadow-sm space-y-4">
      <div class="p-5 ${bgClass} text-white">
        <div class="flex justify-between text-[11px] mb-1">
          <span class="uppercase tracking-wider font-bold">${status}</span>
          <span class="font-mono">${currentActiveOrder.id}</span>
        </div>
        <h3 class="font-serif-title text-[22px] font-bold leading-snug">${statusTitle}</h3>
        <p class="text-[12px] opacity-85 mt-0.5">${statusDesc}</p>
      </div>

      ${status !== 'cancelled' ? `
        <div class="px-5">
          <div class="grid grid-cols-4 gap-1.5 py-1">
            <div class="h-1.5 rounded-full bg-forest-emerald"></div>
            <div class="h-1.5 rounded-full ${status === 'crafting' || status === 'ready' || status === 'completed' ? 'bg-forest-emerald' : 'bg-hairline'}"></div>
            <div class="h-1.5 rounded-full ${status === 'ready' || status === 'completed' ? 'bg-emerald-600' : 'bg-hairline'}"></div>
            <div class="h-1.5 rounded-full ${status === 'completed' ? 'bg-forest-emerald' : 'bg-hairline'}"></div>
          </div>
          <div class="flex justify-between text-[10px] text-taupe uppercase tracking-wider pt-1">
            <span>ຮັບແລ້ວ</span><span>ກຳລັງຊົງ</span><span>ພ້ອມຮັບ</span><span>ສຳເລັດ</span>
          </div>
        </div>
      ` : ''}

      <div class="px-5 space-y-2 text-[12px]">
        <div class="flex justify-between font-serif-title text-[14px] text-primary border-b border-hairline pb-1">
          <span>ລາຍການ: ${currentActiveOrder.customerName} (${currentActiveOrder.customerPhone})</span>
          <span class="font-mono font-bold">${formatLAK(currentActiveOrder.total)}</span>
        </div>
        ${currentActiveOrder.items.map(i => `
          <div class="flex justify-between py-0.5 text-taupe">
            <span>${i.quantity}× ${i.name}</span>
            <span class="font-mono">${formatLAK(i.total)}</span>
          </div>
        `).join('')}
      </div>

      <div class="p-5 pt-2 text-center">
        <div class="p-3 bg-surface rounded-xl border border-hairline">
          <div class="w-full h-10 barcode-pattern mb-1"></div>
          <span class="font-mono text-[11px]">${currentActiveOrder.id}</span>
        </div>
      </div>
    </div>
  `;
}
