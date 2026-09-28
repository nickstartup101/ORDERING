// =======================================================
// CUSTOMER TICKET LOGIC (SHOWING APPLIED REMARK TO USER)
// =======================================================

let activeTicketUnsubscribe = null;

function renderCustomerTicket() {
  const container = document.getElementById('activeTicketContainer');
  if (!container) return;

  const activeOrderId = localStorage.getItem('activeOrderId');
  if (!activeOrderId) {
    container.innerHTML = `
      <div class="p-8 text-center bg-surface-pure rounded-2xl border border-hairline space-y-3">
        <span class="material-symbols-outlined text-[48px] text-taupe">receipt_long</span>
        <h4 class="font-serif-title text-[17px] text-primary">ບໍ່ມີອໍເດີ້ທີ່ກຳລັງດຳເນີນການ</h4>
        <p class="text-[12px] text-taupe">ທ່ານຍັງບໍ່ໄດ້ສັ່ງຊື້ເທື່ອ ຫຼື ອໍເດີ້ກ່ອນໜ້ານີ້ສຳເລັດແລ້ວ</p>
        <button type="button" onclick="switchCustomerTab('menu')" class="px-4 py-2 rounded-lg bg-forest-emerald text-white text-[12px] font-bold">ສັ່ງເຄື່ອງດື່ມເລີຍ</button>
      </div>
    `;
    return;
  }

  // ດັກຟັງສະຖານະອໍເດີ້ Realtime
  if (activeTicketUnsubscribe) activeTicketUnsubscribe();

  activeTicketUnsubscribe = firebase.firestore().collection('orders').doc(activeOrderId)
    .onSnapshot(doc => {
      if (!doc.exists) {
        localStorage.removeItem('activeOrderId');
        renderCustomerTicket();
        return;
      }

      const order = doc.data();
      container.innerHTML = `
        <div class="p-6 rounded-2xl bg-surface-pure border border-hairline shadow-md space-y-5">
          <div class="text-center space-y-1 pb-3 border-b border-hairline">
            <span class="text-[10px] uppercase tracking-widest text-forest-leaf font-bold">Order Receipt</span>
            <h3 class="font-serif-title text-[24px] text-primary font-bold">${order.orderCode}</h3>
            <span class="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
              order.status === 'pending' ? 'bg-amber-100 text-amber-900' :
              order.status === 'preparing' ? 'bg-blue-100 text-blue-900' :
              order.status === 'ready' ? 'bg-emerald-100 text-emerald-900' : 'bg-gray-100 text-gray-800'
            }">
              ສະຖານະ: ${order.status === 'pending' ? 'ລໍຖ້າຮ້ານຮັບ' : (order.status === 'preparing' ? 'ກຳລັງປຸງແຕ່ງ' : (order.status === 'ready' ? 'ພ້ອມຮັບເຄື່ອງແລ້ວ' : 'ສຳເລັດແລ້ວ'))}
            </span>
          </div>

          <!-- ລາຍການສິນຄ້າ -->
          <div class="space-y-3 divide-y divide-hairline">
            ${(order.items || []).map(item => `
              <div class="pt-2.5 first:pt-0">
                <div class="flex justify-between items-baseline font-bold text-[13px]">
                  <span>${item.quantity}x ${item.name}</span>
                  <span class="font-mono text-forest-emerald">${formatLAK(item.totalPrice)}</span>
                </div>
                <div class="text-[11px] text-taupe mt-0.5">
                  [${item.variant}] ${item.sweetness ? `• ${item.sweetness}` : ''} ${item.milk ? `• ${item.milk}` : ''}
                </div>

                <!-- 🔥 ສະແດງ Remark ທີ່ລູກຄ້າໃສ່ -->
                ${item.note ? `
                  <div class="mt-1 px-2 py-1 rounded bg-surface border border-hairline text-taupe text-[11px]">
                    <span class="font-bold text-forest-emerald">ໝາຍເຫດ:</span> ${item.note}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>

          <div class="pt-3 border-t border-hairline flex justify-between items-baseline">
            <span class="font-bold text-[14px]">ຍອດລວມທັງໝົດ:</span>
            <span class="font-serif-title font-bold text-[20px] text-forest-emerald">${formatLAK(order.totalAmount)}</span>
          </div>
        </div>
      `;
    });
}
