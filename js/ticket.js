// Render ສະຖານະອໍເດີ້ລູກຄ້າ (My Ticket)
function renderCustomerTicket() {
  const container = document.getElementById('activeTicketContainer');
  if (!container) return;

  if (!currentActiveOrder) {
    container.innerHTML = `
      <div class="p-8 rounded-2xl bg-surface-pure border border-hairline text-center space-y-3">
        <span class="material-symbols-outlined text-[36px] text-forest-leaf">receipt_long</span>
        <h3 class="font-serif-title text-[18px] text-primary">ບໍ່ມີອໍເດີ້ທີ່ກຳລັງດຳເນີນການ</h3>
        <p class="text-[12px] text-taupe font-lao">ເມື່ອທ່ານສັ່ງເຄື່ອງດື່ມ, ປີ້ຮັບເຄື່ອງ ແລະ ສະຖານະ Real-time ຈະສະແດງຢູ່ນີ້</p>
      </div>
    `;
    return;
  }

  const isPending = currentActiveOrder.status === 'pending';
  const isCrafting = currentActiveOrder.status === 'crafting';
  const isReady = currentActiveOrder.status === 'ready';
  const isCompleted = currentActiveOrder.status === 'completed';
  const isCancelled = currentActiveOrder.status === 'cancelled';

  let statusHeadline = "Order Sent to Atelier";
  let statusSub = "ລໍຖ້າບາຣິສຕ້າກວດສອບສະລິບ ແລະ ຮັບອໍເດີ້";
  let headerBg = "bg-forest-emerald";

  if (isCrafting) {
    statusHeadline = "Crafting in Progress ☕";
    statusSub = "ບາຣິສຕ້າກຳລັງສະກັດກາເຟ ແລະ ປຸງແຕ່ງຢ່າງພິຖີພິຖັນ";
    headerBg = "bg-forest-emerald";
  } else if (isReady) {
    statusHeadline = "Ready for Pick-up! 🎉";
    statusSub = "ເຄື່ອງດື່ມຂອງທ່ານພ້ອມແລ້ວ! ເຊີນຮັບໄດ້ທີ່ Counter 02";
    headerBg = "bg-emerald-800";
  } else if (isCancelled) {
    statusHeadline = "Order Cancelled ⚠️";
    statusSub = currentActiveOrder.cancelReason || "ອໍເດີ້ຖືກຍົກເລີກ ກະລຸນາຕິດຕໍ່ພະນັກງານໜ້າຮ້ານ";
    headerBg = "bg-red-800";
  }

  container.innerHTML = `
    <div class="bg-surface-pure border border-hairline rounded-2xl overflow-hidden shadow-md space-y-4">
      <div class="p-5 ${headerBg} text-white transition-colors">
        <div class="flex items-center justify-between text-[11px] mb-2">
          <span class="uppercase tracking-widest font-bold">${currentActiveOrder.status}</span>
          <span class="font-mono">${currentActiveOrder.id}</span>
        </div>
        <h3 class="font-serif-title text-[22px] font-semibold leading-snug">${statusHeadline}</h3>
        <p class="text-[12px] opacity-85 font-lao mt-0.5">${statusSub}</p>

        ${currentActiveOrder.delayNotice ? `
          <div class="mt-3 p-2.5 rounded-lg bg-amber-500/20 border border-amber-300/40 text-[11px] text-amber-200 font-lao">
            ⏳ ${currentActiveOrder.delayNotice}
          </div>
        ` : ''}
      </div>

      ${!isCancelled ? `
        <div class="px-5">
          <div class="grid grid-cols-4 gap-1.5 py-1">
            <div class="h-1.5 rounded-full bg-forest-emerald"></div>
            <div class="h-1.5 rounded-full ${isCrafting || isReady || isCompleted ? 'bg-forest-emerald' : 'bg-hairline'}"></div>
            <div class="h-1.5 rounded-full ${isReady || isCompleted ? 'bg-emerald-600' : 'bg-hairline'}"></div>
            <div class="h-1.5 rounded-full ${isCompleted ? 'bg-forest-emerald' : 'bg-hairline'}"></div>
          </div>
          <div class="flex justify-between text-[10px] text-taupe uppercase tracking-wider pt-1 font-lao">
            <span>ຮັບອໍເດີ້</span>
            <span>ກຳລັງຊົງ</span>
            <span>ພ້ອມຮັບ</span>
            <span>ສຳເລັດ</span>
          </div>
        </div>
      ` : ''}

      <div class="px-5 space-y-2 text-[12px]">
        <div class="flex justify-between font-serif-title text-[14px] text-primary border-b border-hairline pb-1">
          <span>ລາຍການສິນຄ້າ (${currentActiveOrder.customerName} - ${currentActiveOrder.customerPhone})</span>
          <span class="font-mono font-bold">$${currentActiveOrder.total.toFixed(2)}</span>
        </div>
        ${currentActiveOrder.items.map(item => `
          <div class="flex justify-between py-1 text-taupe">
            <span>${item.quantity}× ${item.name} (${item.variant})</span>
            <span class="font-mono">$${item.total.toFixed(2)}</span>
          </div>
        `).join('')}
      </div>

      <div class="p-5 pt-2 text-center">
        <div class="p-3 bg-surface rounded-xl border border-hairline flex flex-col items-center gap-2">
          <div class="w-full max-w-[260px] h-10 barcode-pattern"></div>
          <span class="font-mono text-[11px] text-taupe tracking-[0.25em]">${currentActiveOrder.id}</span>
        </div>
      </div>
    </div>
  `;
}
