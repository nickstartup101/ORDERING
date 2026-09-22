// =======================================================
// MULTI-TICKET PASS & LIVE REALTIME STATUS CAROUSEL
// =======================================================

function renderCustomerTicket() {
  const container = document.getElementById('activeTicketContainer');
  if (!container) return;

  // ດຶງອໍເດີ້ທີ່ຍັງບໍ່ທັນສຳເລັດຂອງລູກຄ້າຄົນນີ້ (ຮອງຮັບທັງ Member ແລະ Guest)
  let myPhone = currentUser ? currentUser.phone : null;
  let myEmail = currentUser ? currentUser.email : null;

  if (!myPhone) {
    const guestContact = JSON.parse(localStorage.getItem('ladolce_guest_contact'));
    if (guestContact) myPhone = guestContact.phone;
  }

  const myActiveOrders = orders.filter(o => 
    (o.status === 'pending' || o.status === 'crafting' || o.status === 'ready') &&
    ((myPhone && o.customerPhone === myPhone) || (myEmail && o.customerEmail === myEmail))
  );

  if (myActiveOrders.length === 0) {
    container.innerHTML = `
      <div class="p-8 bg-surface-pure border border-hairline rounded-2xl text-center space-y-3 shadow-xs">
        <span class="material-symbols-outlined text-[42px] text-forest-leaf/60">receipt_long</span>
        <h3 class="font-serif-title text-[18px] text-primary font-medium">ບໍ່ມີອໍເດີ້ທີ່ກຳລັງດຳເນີນການ</h3>
        <p class="text-[12px] text-taupe font-lao">ເມື່ອທ່ານສັ່ງເຄື່ອງດື່ມ, ປີ້ຮັບເຄື່ອງ ແລະ ສະຖານະ Real-time ຈະສະແດງຢູ່ນີ້</p>
        <button type="button" onclick="switchCustomerTab('menu')" class="px-5 py-2 rounded-lg bg-forest-emerald text-white text-[12px] font-semibold hover:bg-forest-leaf transition-all shadow-xs">
          ສັ່ງເຄື່ອງດື່ມເລີຍ
        </button>
      </div>
    `;
    return;
  }

  // 🔥 Render Multi-Ticket Stack (ສະແດງຫຼາຍປີ້ພ້ອມກັນ)
  container.innerHTML = `
    <div class="space-y-4">
      <div class="flex justify-between items-center px-1">
        <span class="text-[12px] font-bold text-primary font-serif-title">ປີ້ຮັບເຄື່ອງທີ່ກຳລັງດຳເນີນການ</span>
        <span class="px-2.5 py-0.5 rounded-full bg-forest-emerald text-white text-[10px] font-bold font-mono">
          ${myActiveOrders.length} ອໍເດີ້ພວມຊົງ
        </span>
      </div>

      <div class="space-y-5">
        ${myActiveOrders.map(order => {
          const status = order.status;
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
          }

          return `
            <div class="bg-surface-pure border-2 ${status === 'ready' ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-hairline'} rounded-2xl overflow-hidden shadow-sm space-y-4">
              <div class="p-5 ${bgClass} text-white">
                <div class="flex justify-between text-[11px] mb-1">
                  <span class="uppercase tracking-wider font-bold">${status}</span>
                  <span class="font-mono">${order.id}</span>
                </div>
                <h3 class="font-serif-title text-[20px] font-bold leading-snug">${statusTitle}</h3>
                <p class="text-[12px] opacity-85 mt-0.5">${statusDesc}</p>

                <!-- Delay Notice Banner -->
                ${order.delayNotice ? `
                  <div class="mt-3 p-2.5 rounded-xl bg-amber-500/20 border border-amber-300/40 text-[11px] text-amber-200 font-medium flex items-center gap-2 animate-pulse">
                    <span class="material-symbols-outlined text-[16px]">hourglass_top</span>
                    <span>${order.delayNotice}</span>
                  </div>
                ` : ''}
              </div>

              <!-- Realtime Stepper with Pulse -->
              <div class="px-5">
                <div class="grid grid-cols-4 gap-1.5 py-1">
                  <div class="h-1.5 rounded-full ${status === 'pending' ? 'bg-forest-emerald animate-pulse' : 'bg-forest-emerald'}"></div>
                  <div class="h-1.5 rounded-full ${status === 'crafting' ? 'bg-forest-emerald animate-pulse' : (status === 'ready' || status === 'completed' ? 'bg-forest-emerald' : 'bg-hairline')}"></div>
                  <div class="h-1.5 rounded-full ${status === 'ready' ? 'bg-emerald-600 animate-pulse' : (status === 'completed' ? 'bg-emerald-600' : 'bg-hairline')}"></div>
                  <div class="h-1.5 rounded-full ${status === 'completed' ? 'bg-forest-emerald' : 'bg-hairline'}"></div>
                </div>
                <div class="flex justify-between text-[10px] text-taupe uppercase tracking-wider pt-1">
                  <span>ຮັບແລ້ວ</span><span>ກຳລັງຊົງ</span><span>ພ້ອມຮັບ</span><span>ສຳເລັດ</span>
                </div>
              </div>

              <div class="px-5 space-y-2 text-[12px]">
                <div class="flex justify-between font-serif-title text-[14px] text-primary border-b border-hairline pb-1">
                  <span>ລາຍການ (${order.customerName})</span>
                  <span class="font-mono font-bold">${formatLAK(order.total)}</span>
                </div>
                ${order.items.map(i => `
                  <div class="flex justify-between py-0.5 text-taupe">
                    <span>${i.quantity}× ${i.name} [${(i.variant||'std').toUpperCase()}]</span>
                    <span class="font-mono">${formatLAK(i.total)}</span>
                  </div>
                `).join('')}
              </div>

              <div class="p-5 pt-2 text-center border-t border-hairline bg-surface/50">
                <div class="p-3 bg-surface-pure rounded-xl border border-hairline">
                  <div class="w-full h-9 barcode-pattern mb-1"></div>
                  <span class="font-mono text-[11px] font-bold text-forest-emerald tracking-[0.25em]">${order.id}</span>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- ປຸ່ມສັ່ງເພີ່ມອີກອໍເດີ້ -->
      <div class="pt-2 text-center">
        <button type="button" onclick="switchCustomerTab('menu')" class="px-5 py-2.5 rounded-xl border-2 border-forest-emerald text-forest-emerald hover:bg-forest-emerald hover:text-white transition-all text-[12px] font-bold inline-flex items-center gap-1.5 shadow-xs">
          <span class="material-symbols-outlined text-[17px]">add_shopping_cart</span>
          <span>ສັ່ງເຄື່ອງດື່ມ ຫຼື ອາຫານເພີ່ມອີກ</span>
        </button>
      </div>
    </div>
  `;
}
