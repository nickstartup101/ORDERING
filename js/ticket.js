// Digital Ticket Pass & Live Tracking Status
function renderCustomerTicket() {
  const container = document.getElementById('activeTicketContainer');
  if (!container) return;

  if (!currentActiveOrder) {
    container.innerHTML = `
      <div class="p-8 rounded-xl bg-surface-pure border border-hairline text-center space-y-3">
        <span class="material-symbols-outlined text-[36px] text-taupe">confirmation_number</span>
        <h3 class="font-serif text-[17px] text-primary">ບໍ່ມີອໍເດີ້ທີ່ກຳລັງດຳເນີນການ</h3>
        <p class="text-[12px] text-taupe font-lao">ເມື່ອທ່ານສັ່ງເຄື່ອງດື່ມ, ປີ້ຮັບເຄື່ອງ ແລະ ສະຖານະ Real-time ຈະປະກົດຢູ່ນີ້</p>
        <button onclick="switchCustomerTab('menu')" class="px-4 py-2 rounded bg-primary text-white text-[11px] uppercase tracking-wider font-medium font-lao">
          ສັ່ງເຄື່ອງດື່ມຕອນນີ້
        </button>
      </div>
    `;
    document.getElementById('bottomNavLiveOrderPulse').classList.add('hidden');
    return;
  }

  document.getElementById('bottomNavLiveOrderPulse').classList.remove('hidden');

  const isPending = currentActiveOrder.status === 'pending';
  const isCrafting = currentActiveOrder.status === 'crafting';
  const isReady = currentActiveOrder.status === 'ready';
  const isCompleted = currentActiveOrder.status === 'completed';

  let statusHeadline = "Order Sent to Atelier";
  let statusSub = "ລໍຖ້າບາຣິສຕ້າກວດສອບສະລິບ ແລະ ຮັບອໍເດີ້";
  let statusBadge = "Pending Review";

  if (isCrafting) {
    statusHeadline = "Crafting in Progress";
    statusSub = "ບາຣິສຕ້າກຳລັງສະກັດຊັອດກາເຟ ແລະ ຕີຟອງນົມ";
    statusBadge = "Brewing";
  } else if (isReady) {
    statusHeadline = "Ready for Pick-up!";
    statusSub = "ເຄື່ອງດື່ມຂອງທ່ານພ້ອມແລ້ວ! ເຊີນຮັບໄດ້ທີ່ Counter 02";
    statusBadge = "Please Collect";
  } else if (isCompleted) {
    statusHeadline = "Order Complete";
    statusSub = "ຂອບໃຈທີ່ມາອຸດໜູນ LA DOLCE Atelier";
    statusBadge = "Enjoy!";
  }

  container.innerHTML = `
    <div class="bg-surface-pure border border-hairline rounded-xl overflow-hidden shadow-md space-y-4">
      <div class="p-5 ${isReady ? 'bg-emerald-900 text-white' : 'bg-primary text-white'} transition-colors">
        <div class="flex items-center justify-between text-[11px] mb-2">
          <span class="uppercase tracking-widest text-emerald-300 font-medium flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full ${isReady ? 'bg-emerald-300 animate-ping' : 'bg-amber-300'}"></span>
            ${statusBadge}
          </span>
          <span class="font-mono">${currentActiveOrder.id}</span>
        </div>
        <h3 class="font-serif text-[22px] font-normal leading-snug">${statusHeadline}</h3>
        <p class="text-[12px] opacity-80 font-lao mt-0.5">${statusSub}</p>

        ${currentActiveOrder.delayNotice ? `
          <div class="mt-3 p-2.5 rounded bg-amber-500/20 border border-amber-300/40 text-[11px] text-amber-200 font-lao flex items-center gap-2">
            <span class="material-symbols-outlined text-[15px]">timer</span>
            <span>ແຈ້ງເຕືອນລ່າຊ້າ: ${currentActiveOrder.delayNotice}</span>
          </div>
        ` : ''}
      </div>

      <div class="px-5">
        <div class="grid grid-cols-4 gap-1.5 py-1">
          <div class="h-1.5 rounded-full bg-primary"></div>
          <div class="h-1.5 rounded-full ${isCrafting || isReady || isCompleted ? 'bg-primary' : 'bg-hairline'}"></div>
          <div class="h-1.5 rounded-full ${isReady || isCompleted ? 'bg-emerald-600' : 'bg-hairline'}"></div>
          <div class="h-1.5 rounded-full ${isCompleted ? 'bg-primary' : 'bg-hairline'}"></div>
        </div>
        <div class="flex justify-between text-[10px] text-taupe uppercase tracking-wider pt-1 font-lao">
          <span>ຮັບອໍເດີ້</span>
          <span>ກຳລັງຊົງ</span>
          <span>ພ້ອມຮັບ</span>
          <span>ສຳເລັດ</span>
        </div>
      </div>

      <div class="relative flex items-center justify-between h-4 my-1">
        <div class="w-3 h-6 rounded-r-full bg-surface border-r border-t border-b border-hairline -ml-[1px]"></div>
        <div class="flex-1 border-b border-dashed border-hairline mx-2"></div>
        <div class="w-3 h-6 rounded-l-full bg-surface border-l border-t border-b border-hairline -mr-[1px]"></div>
      </div>

      <div class="px-5 space-y-2 text-[12px]">
        <div class="flex justify-between font-serif text-[14px] text-primary border-b border-hairline pb-1">
          <span>Selected Drinks & Pastries</span>
          <span class="font-mono text-[13px]">$${currentActiveOrder.total.toFixed(2)}</span>
        </div>
        ${currentActiveOrder.items.map(item => `
          <div class="flex justify-between py-1 text-muted-ink">
            <span>${item.quantity}× ${item.name} (${item.variant})</span>
            <span class="font-mono">$${item.total.toFixed(2)}</span>
          </div>
        `).join('')}
      </div>

      <div class="p-5 pt-2 text-center">
        <div class="p-3 bg-surface rounded border border-hairline flex flex-col items-center gap-2">
          <div class="w-full max-w-[260px] h-10 barcode-pattern"></div>
          <span class="font-mono text-[11px] text-taupe tracking-[0.25em]">${currentActiveOrder.id}</span>
        </div>
        <p class="text-[11px] text-taupe font-lao mt-2">ສະແກນ ຫຼື ສະແດງລະຫັດນີ້ຕໍ່ບາຣິສຕ້າທີ່ Counter 02</p>
      </div>
    </div>
  `;
}
