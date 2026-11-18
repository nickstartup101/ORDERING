// =======================================================
// LA DOLCE — SUPERADMIN CONTROL CENTER (PURE SVG + FAST IMG)
// =======================================================

// ເພີ່ມ SVG Icons ສຳລັບ Admin & Auth ໂດຍບໍ່ຕ້ອງແກ້ config.js ໃໝ່
if (typeof ICONS !== 'undefined') {
  Object.assign(ICONS, {
    edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    store: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 3 0"/><path d="M5 11.5V20h14v-8.5"/></svg>`,
    barChart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>`,
    menuList: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
    tune: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>`,
    users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    gift: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>`,
    badge: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M15 8h2"/><path d="M15 12h2"/><path d="M7 16h10"/></svg>`
  });
}

window.adminCurrentTab = 'analytics';
window.editingMenuItemId = null;
window.salesDateFilter = 'day';

// Helper ບີບອັດຮູບພາບໃຫ້ນ້ອຍ ແລະ ໂຫຼດໄວ (< 55KB)
function compressImageFile(file, maxWidth = 540, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/webp', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 1. ປ່ຽນແຖບ Superadmin
window.switchAdminPanelTab = function(tabName) {
  window.adminCurrentTab = tabName;
  const tabs = ['analytics', 'menu', 'coupons', 'modifiers', 'payments', 'users'];

  tabs.forEach(t => {
    const panel = document.getElementById(`adm-panel-${t}`);
    const btn = document.getElementById(`adm-tab-${t}`);
    if (panel) panel.classList.add('hidden');
    if (btn) {
      btn.className = 'px-3.5 py-1.5 rounded-lg bg-surface border border-hairline text-taupe text-[12px] font-medium shrink-0 flex items-center gap-1.5 hover:text-charcoal transition-colors cursor-pointer font-lao';
    }
  });

  const activePanel = document.getElementById(`adm-panel-${tabName}`);
  const activeBtn = document.getElementById(`adm-tab-${tabName}`);
  if (activePanel) activePanel.classList.remove('hidden');
  if (activeBtn) {
    activeBtn.className = 'px-3.5 py-1.5 rounded-lg bg-forest-emerald text-white text-[12px] font-bold shrink-0 flex items-center gap-1.5 shadow-xs cursor-pointer font-lao';
  }

  if (tabName === 'analytics') window.loadAdminAnalytics();
  if (tabName === 'menu') window.loadAdminMenus();
  if (tabName === 'coupons') window.loadAdminCoupons();
  if (tabName === 'modifiers') window.loadAdminModifiers();
  if (tabName === 'payments') window.loadAdminPayments();
  if (tabName === 'users') window.loadAdminUsers();
};

// =======================================================
// 2. ຈັດການເມນູ (ເພີ່ມໃໝ່, ແກ້ໄຂ & ບີບອັດຮູບ)
// =======================================================
window.loadAdminMenus = async function() {
  const container = document.getElementById('adminMenuListGrid');
  if (!container) return;

  const firestore = db || firebase.firestore();
  try {
    const snap = await firestore.collection('menu_items').get();
    if (snap.empty) {
      container.innerHTML = `<div class="col-span-full p-8 text-center text-taupe font-lao">ຍັງບໍ່ມີເມນູໃນລະບົບ</div>`;
      return;
    }

    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    container.innerHTML = items.map(item => {
      const isAvail = item.isAvailable !== false;
      const price = Number(item.price || 35000);

      return `
        <div class="p-3.5 rounded-xl bg-surface border border-hairline flex items-center justify-between shadow-2xs font-lao gap-2">
          <div class="flex items-center gap-3 min-w-0">
            <img src="${item.image || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200'}" class="w-14 h-14 rounded-lg object-cover border border-hairline shrink-0"/>
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h5 class="font-bold text-[14px] text-primary truncate">${item.name}</h5>
                <span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase ${isAvail ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}">
                  ${isAvail ? 'ພ້ອມຂາຍ' : 'ໝົດ'}
                </span>
              </div>
              <span class="text-[11px] text-taupe capitalize">${item.category || 'coffee'} • ${formatLAK(price)}</span>
            </div>
          </div>

          <div class="flex items-center gap-1.5 shrink-0">
            <button type="button" onclick="window.toggleMenuItemAvailability('${item.id}', ${!isAvail})" class="px-2.5 py-1 rounded-lg border text-[11px] font-bold ${isAvail ? 'border-amber-300 text-amber-900 bg-amber-50' : 'border-emerald-300 text-emerald-900 bg-emerald-50'} cursor-pointer">
              ${isAvail ? 'ປິດ (ໝົດ)' : 'ເປີດຂາຍ'}
            </button>
            <button type="button" onclick="window.openEditMenuModal('${item.id}')" class="p-1.5 rounded-lg border border-hairline hover:bg-surface text-taupe hover:text-forest-emerald cursor-pointer" title="ແກ້ໄຂເມນູນີ້">
              ${svgIcon('edit', 'w-4 h-4')}
            </button>
            <button type="button" onclick="window.deleteMenuItem('${item.id}')" class="p-1.5 rounded-lg border border-hairline hover:bg-red-50 text-taupe hover:text-red-600 cursor-pointer" title="ລຶບເມນູ">
              ${svgIcon('trash', 'w-4 h-4')}
            </button>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error("Admin menus error:", err);
  }
};

window.autoCheckStandardPriceVisibility = function() {
  const hot = document.getElementById('toggleAllowHot')?.checked;
  const iced = document.getElementById('toggleAllowIced')?.checked;
  const frappe = document.getElementById('toggleAllowFrappe')?.checked;
  const box = document.getElementById('standardPriceBox');
  if (box) {
    box.style.opacity = (hot || iced || frappe) ? '0.65' : '1';
  }
};

window.openAddMenuModal = function() {
  window.editingMenuItemId = null;
  document.getElementById('menuForm')?.reset();
  const preview = document.getElementById('menuImagePreview');
  if (preview) {
    preview.src = '';
    preview.classList.add('hidden');
  }
  window.autoCheckStandardPriceVisibility();
  document.getElementById('addMenuModal')?.classList.remove('hidden');
};

window.openEditMenuModal = function(itemId) {
  const item = (menuItems || []).find(i => String(i.id) === String(itemId));
  if (!item) return;

  window.editingMenuItemId = itemId;
  document.getElementById('inputItemName').value = item.name || '';
  document.getElementById('inputItemCategory').value = item.category || 'coffee';
  document.getElementById('inputItemDesc').value = item.desc || '';

  const v = item.variants || {};
  document.getElementById('priceStandard').value = item.price || v.standard || 35000;
  document.getElementById('priceHot').value = v.hot || '';
  document.getElementById('priceIced').value = v.iced || '';
  document.getElementById('priceFrappe').value = v.frappe || '';

  // Sync strictly ຕາມຄ່າທີ່ຕັ້ງໄວ້ໃນ menu_items
  document.getElementById('toggleAllowHot').checked = item.allowHot === true;
  document.getElementById('toggleAllowIced').checked = item.allowIced === true;
  document.getElementById('toggleAllowFrappe').checked = item.allowFrappe === true;
  document.getElementById('toggleAllowMilk').checked = item.allowMilk === true;
  document.getElementById('toggleAllowSweetness').checked = item.allowSweetness !== false;
  document.getElementById('toggleAllowTopping').checked = item.allowTopping === true;

  const preview = document.getElementById('menuImagePreview');
  if (preview && item.image) {
    preview.src = item.image;
    preview.classList.remove('hidden');
  }

  window.autoCheckStandardPriceVisibility();
  document.getElementById('addMenuModal')?.classList.remove('hidden');
};

window.closeAddMenuModal = function() {
  window.editingMenuItemId = null;
  document.getElementById('addMenuModal')?.classList.add('hidden');
};

window.handleMenuImageUpload = async function(event) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const compressed = await compressImageFile(file, 540, 0.76);
    const preview = document.getElementById('menuImagePreview');
    if (preview) {
      preview.src = compressed;
      preview.classList.remove('hidden');
    }
  } catch (e) {
    console.error('Image compress error:', e);
  }
};

window.saveMenuItem = async function(event) {
  if (event) event.preventDefault();

  try {
    const name = document.getElementById('inputItemName')?.value.trim();
    const category = document.getElementById('inputItemCategory')?.value || 'coffee';
    const desc = document.getElementById('inputItemDesc')?.value.trim() || '';
    const imageSrc = document.getElementById('menuImagePreview')?.src || '';

    const allowHot = document.getElementById('toggleAllowHot')?.checked === true;
    const allowIced = document.getElementById('toggleAllowIced')?.checked === true;
    const allowFrappe = document.getElementById('toggleAllowFrappe')?.checked === true;

    const priceHot = Number(document.getElementById('priceHot')?.value) || 0;
    const priceIced = Number(document.getElementById('priceIced')?.value) || 0;
    const priceFrappe = Number(document.getElementById('priceFrappe')?.value) || 0;
    const priceStandard = Number(document.getElementById('priceStandard')?.value) || 35000;

    const allowMilk = document.getElementById('toggleAllowMilk')?.checked === true;
    const allowSweetness = document.getElementById('toggleAllowSweetness')?.checked === true;
    const allowTopping = document.getElementById('toggleAllowTopping')?.checked === true;

    if (!name) {
      showAtelierToast('ກະລຸນາປ້ອນຊື່ເມນູ!', 'warning');
      return;
    }

    const menuItemData = {
      name,
      category,
      desc,
      price: priceStandard,
      allowHot,
      allowIced,
      allowFrappe,
      allowMilk,
      allowSweetness,
      allowTopping,
      isAvailable: true,
      variants: {
        standard: priceStandard,
        hot: allowHot ? (priceHot || priceStandard) : null,
        iced: allowIced ? (priceIced || priceStandard + 5000) : null,
        frappe: allowFrappe ? (priceFrappe || priceStandard + 10000) : null
      },
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (imageSrc && !imageSrc.includes('data:,') && imageSrc.startsWith('data:') || imageSrc.startsWith('http')) {
      menuItemData.image = imageSrc;
    }

    const firestore = db || firebase.firestore();

    if (window.editingMenuItemId) {
      await firestore.collection('menu_items').doc(window.editingMenuItemId).update(menuItemData);
      showAtelierToast(`ແກ້ໄຂເມນູ "${name}" ສຳເລັດ!`);
    } else {
      await firestore.collection('menu_items').add(menuItemData);
      showAtelierToast(`ເພີ່ມເມນູ "${name}" ສຳເລັດ!`);
    }

    window.closeAddMenuModal();
    window.loadAdminMenus();
  } catch (e) {
    console.error("Save menu error:", e);
    showAtelierAlert({ title: 'ບັນທຶກບໍ່ສຳເລັດ', message: e.message, type: 'error' });
  }
};

window.toggleMenuItemAvailability = async function(id, status) {
  const firestore = db || firebase.firestore();
  await firestore.collection('menu_items').doc(id).update({ isAvailable: status });
  window.loadAdminMenus();
};

window.deleteMenuItem = async function(id) {
  const ok = await showAtelierConfirm({
    title: 'ຢືນຢັນການລຶບເມນູ',
    message: 'ທ່ານຕ້ອງການລຶບເມນູນີ້ອອກຈາກຮ້ານແທ້ບໍ່?',
    confirmText: 'ລຶບເມນູ',
    cancelText: 'ຍົກເລີກ'
  });
  if (!ok) return;
  const firestore = db || firebase.firestore();
  await firestore.collection('menu_items').doc(id).delete();
  showAtelierToast('ລຶບເມນູສຳເລັດ');
  window.loadAdminMenus();
};

// =======================================================
// 3. ຈັດການ QR ທະນາຄານ
// =======================================================
window.openAddPaymentModal = function() {
  document.getElementById('paymentForm')?.reset();
  const preview = document.getElementById('bankQrPreview');
  if (preview) {
    preview.src = '';
    preview.classList.add('hidden');
  }
  document.getElementById('addPaymentModal')?.classList.remove('hidden');
};

window.closeAddPaymentModal = function() {
  document.getElementById('addPaymentModal')?.classList.add('hidden');
};

window.handleBankQRUpload = async function(event) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const compressed = await compressImageFile(file, 600, 0.85);
    const preview = document.getElementById('bankQrPreview');
    if (preview) {
      preview.src = compressed;
      preview.classList.remove('hidden');
    }
  } catch (e) {
    console.error('QR compress error:', e);
  }
};

window.savePaymentMethod = async function(event) {
  if (event) event.preventDefault();

  try {
    const bankName = document.getElementById('inputBankName')?.value.trim();
    const accountNumber = document.getElementById('inputAccountNumber')?.value.trim();
    const borderColor = document.getElementById('inputBorderColor')?.value || '#DC2626';
    const qrPreview = document.getElementById('bankQrPreview')?.src;

    if (!bankName || !accountNumber) {
      showAtelierToast('ກະລຸນາປ້ອນຊື່ທະນາຄານ ແລະ ເລກບັນຊີ!', 'warning');
      return;
    }

    const newPayment = {
      id: 'pay_' + Date.now(),
      bankName,
      accountNumber,
      borderColor,
      qrImage: (qrPreview && (qrPreview.startsWith('data:image') || qrPreview.startsWith('http')))
        ? qrPreview
        : `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(accountNumber)}`
    };

    const firestore = db || firebase.firestore();
    await firestore.collection('payments').add(newPayment);

    showAtelierToast(`ເພີ່ມບັນຊີ "${bankName}" ສຳເລັດ!`);
    window.closeAddPaymentModal();
    window.loadAdminPayments();
  } catch (e) {
    console.error("Save payment error:", e);
    showAtelierAlert({ title: 'ຜິດພາດ', message: e.message, type: 'error' });
  }
};

window.loadAdminPayments = async function() {
  const container = document.getElementById('paymentMethodsAdminList');
  if (!container) return;

  const firestore = db || firebase.firestore();
  let list = [];
  try {
    const snap = await firestore.collection('payments').get();
    if (!snap.empty) {
      list = snap.docs.map(d => ({ docId: d.id, ...d.data() }));
    } else {
      list = paymentMethods || DEFAULT_PAYMENTS || [];
    }
  } catch (e) {
    list = paymentMethods || DEFAULT_PAYMENTS || [];
  }

  container.innerHTML = list.map(p => `
    <div class="p-4 rounded-xl bg-surface border-2 border-dashed flex flex-col items-center justify-between space-y-2 font-lao" style="border-color: ${p.borderColor || '#16593D'};">
      <img src="${p.qrImage}" class="w-28 h-28 object-contain rounded-lg border border-hairline bg-white p-1"/>
      <div class="text-center">
        <h5 class="font-bold text-[14px] text-primary">${p.bankName}</h5>
        <span class="font-mono text-[12px] text-taupe">${p.accountNumber}</span>
      </div>
      ${p.docId ? `
        <button type="button" onclick="window.deletePaymentMethod('${p.docId}')" class="text-red-500 hover:text-red-700 text-[11px] font-bold mt-1 cursor-pointer inline-flex items-center gap-1">
          ${svgIcon('trash', 'w-3.5 h-3.5')} <span>ລຶບ QR ນີ້</span>
        </button>
      ` : ''}
    </div>
  `).join('');
};

window.deletePaymentMethod = async function(docId) {
  const ok = await showAtelierConfirm({
    title: 'ລຶບຊ່ອງທາງ QR',
    message: 'ທ່ານຕ້ອງການລຶບ QR ທະນາຄານນີ້ແທ້ບໍ່?',
    confirmText: 'ລຶບ',
    cancelText: 'ຍົກເລີກ'
  });
  if (!ok) return;
  const firestore = db || firebase.firestore();
  await firestore.collection('payments').doc(docId).delete();
  showAtelierToast('ລຶບ QR ສຳເລັດ');
  window.loadAdminPayments();
};

// =======================================================
// 4. ANALYTICS, STORE STATUS & TAX SETTINGS
// =======================================================
window.setSalesFilter = function(range) {
  window.salesDateFilter = range;
  window.loadAdminAnalytics();
};

window.loadAdminAnalytics = async function() {
  const firestore = db || firebase.firestore();
  if (!firestore) return;

  try {
    const orderDocs = (Array.isArray(orders) && orders.length > 0)
      ? [...orders]
      : (await firestore.collection('orders').get()).docs.map(d => ({ id: d.id, ...d.data() }));

    orderDocs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const filterMs = window.salesDateFilter === 'month'
      ? startOfToday - 30 * 86400000
      : window.salesDateFilter === 'week'
      ? startOfToday - 7 * 86400000
      : startOfToday;

    let totalSales = 0, qrRevenue = 0, cashRevenue = 0, validOrdersCount = 0;

    const filteredDocs = orderDocs.filter(o => {
      const ms = o.createdAt?.seconds ? o.createdAt.seconds * 1000 : new Date(o.createdAt || Date.now()).getTime();
      return ms >= filterMs;
    });

    const rowsHtml = filteredDocs.map(o => {
      const isExcluded = o.status === 'cancelled' || o.status === 'rejected';
      const amount = Number(o.totalAmount || 0);
      const isQr = o.paymentType === 'qr' || Boolean(o.slipImage) || Boolean(o.slipUrl);

      if (!isExcluded) {
        totalSales += amount;
        validOrdersCount++;
        if (isQr) qrRevenue += amount;
        else cashRevenue += amount;
      }

      const dateStr = o.createdAt?.seconds
        ? new Date(o.createdAt.seconds * 1000).toLocaleTimeString('lo-LA', { hour: '2-digit', minute: '2-digit' })
        : 'ມື້ນີ້';
      const itemsSummary = (o.items || []).map(i => `${i.quantity}x ${i.name}`).join(', ');

      return `
        <tr class="hover:bg-surface/50 font-lao transition-colors border-b border-hairline ${isExcluded ? 'opacity-50' : ''}">
          <td class="p-2.5 font-mono text-[11px] font-bold text-primary">${o.orderCode || o.id.substr(0, 6)}</td>
          <td class="p-2.5 text-[11px] text-taupe">${dateStr}</td>
          <td class="p-2.5 font-medium text-[12px]">${o.customerName || 'Guest'}</td>
          <td class="p-2.5 text-[11px] text-taupe truncate max-w-[200px]">${itemsSummary || 'ບໍ່ມີລາຍການ'}</td>
          <td class="p-2.5 text-[11px]">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${isExcluded ? 'bg-red-50 text-red-700' : (isQr ? 'bg-blue-50 text-blue-800' : 'bg-gray-100 text-gray-800')}">
              ${isExcluded ? 'ປະຕິເສດ/ຍົກເລີກ' : (isQr ? (o.paymentMethod || 'QR ໂອນ') : 'ເງິນສົດ')}
            </span>
          </td>
          <td class="p-2.5 font-mono text-forest-emerald text-right font-bold text-[12px]">${formatLAK(amount)}</td>
        </tr>
      `;
    }).join('');

    const elSales = document.getElementById('metricTotalSales');
    const elCount = document.getElementById('metricTotalOrdersCount');
    const elQr = document.getElementById('metricQrRevenue');
    const elCash = document.getElementById('metricCashRevenue');

    if (elSales) elSales.textContent = formatLAK(totalSales);
    if (elCount) elCount.textContent = `${validOrdersCount} ອໍເດີ້`;
    if (elQr) elQr.textContent = formatLAK(qrRevenue);
    if (elCash) elCash.textContent = formatLAK(cashRevenue);

    const tableBody = document.getElementById('analyticsTransactionsTableBody');
    if (tableBody) tableBody.innerHTML = rowsHtml || `<tr><td colspan="6" class="p-6 text-center text-taupe font-lao">ຍັງບໍ່ມີລາຍການຂາຍໃນຊ່ວງເວລານີ້</td></tr>`;
  } catch (err) {
    console.error("Analytics error:", err);
  }
};

window.renderAnalytics = window.loadAdminAnalytics;

window.updateStoreStatusUI = function() {
  const isOpen = storeSettings?.isStoreOpen !== false;
  const adminBtn = document.getElementById('btnToggleStore');
  if (adminBtn) {
    adminBtn.textContent = isOpen ? 'ສະຖານະ: ເປີດຮ້ານ (ກົດເພື່ອປິດ)' : 'ສະຖານະ: ປິດຊົ່ວຄາວ (ກົດເພື່ອເປີດ)';
    adminBtn.className = `px-3 py-1.5 rounded-lg text-white text-[11px] font-medium cursor-pointer ${isOpen ? 'bg-emerald-800' : 'bg-red-700'}`;
  }

  const taxEl = document.getElementById('taxSettingsDisplay');
  if (taxEl) taxEl.textContent = `Tax: ${Number(storeSettings?.taxRatePercent || 0)}% (ປັບປ່ຽນ)`;

  const badge = document.getElementById('customerStoreOpenBadge');
  if (badge) {
    badge.innerHTML = isOpen
      ? `<span class="relative flex h-2 w-2"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span></span><span class="text-[11px] font-bold text-emerald-900 tracking-wide font-lao">ເປີດບໍລິການ (07:00 – 20:00)</span>`
      : `<span class="h-2 w-2 rounded-full bg-red-600"></span><span class="text-[11px] font-bold text-red-800 tracking-wide font-lao">ປິດບໍລິການຊົ່ວຄາວ</span>`;
  }
};

window.toggleStoreStatus = function() {
  storeSettings.isStoreOpen = !(storeSettings?.isStoreOpen !== false);
  localStorage.setItem('ladolce_store_settings', JSON.stringify(storeSettings));
  window.updateStoreStatusUI();
  showAtelierToast(storeSettings.isStoreOpen ? 'ເປີດຮັບອໍເດີ້ແລ້ວ' : 'ປິດຮັບອໍເດີ້ຊົ່ວຄາວ', storeSettings.isStoreOpen ? 'success' : 'warning');
};

window.updateTaxSettings = function() {
  const val = prompt('ກຳນົດອັດຕາອາກອນ Tax (%) ເຊັ່ນ 0, 7, 10:', String(storeSettings?.taxRatePercent || 0));
  if (val === null) return;
  const num = Math.max(0, Math.min(50, Number(val) || 0));
  storeSettings.taxRatePercent = num;
  localStorage.setItem('ladolce_store_settings', JSON.stringify(storeSettings));
  window.updateStoreStatusUI();
  if (typeof calculateCartSummary === 'function') calculateCartSummary();
  showAtelierToast(`ຕັ້ງຄ່າອາກອນເປັນ ${num}% ແລ້ວ`);
};

// =======================================================
// 5. COUPONS, MODIFIERS, USERS & BRANDING
// =======================================================
window.openAddCouponModal = function() {
  document.getElementById('couponForm')?.reset();
  document.getElementById('addCouponModal')?.classList.remove('hidden');
};
window.closeAddCouponModal = function() {
  document.getElementById('addCouponModal')?.classList.add('hidden');
};

window.saveCouponFromModal = async function(event) {
  if (event) event.preventDefault();
  const code = document.getElementById('inputCpnCode')?.value.trim().toUpperCase();
  const type = document.getElementById('inputCpnType')?.value || 'percent';
  const value = Number(document.getElementById('inputCpnValue')?.value) || 0;
  const maxDiscount = Number(document.getElementById('inputCpnMaxDiscount')?.value) || 0;
  const minOrder = Number(document.getElementById('inputCpnMinOrder')?.value) || 0;
  const totalBudget = Number(document.getElementById('inputCpnTotalBudget')?.value) || 0;
  const expiryDate = document.getElementById('inputCpnExpiry')?.value || '';
  const desc = document.getElementById('inputCpnDesc')?.value.trim() || '';

  if (!code || value <= 0) {
    showAtelierToast('ກະລຸນາປ້ອນລະຫັດ ແລະ ມູນຄ່າສ່ວນຫຼຸດໃຫ້ຄົບ!', 'warning');
    return;
  }

  const firestore = db || firebase.firestore();
  await firestore.collection('coupons').doc(code).set({
    code,
    type,
    value,
    maxDiscount: maxDiscount || null,
    minOrder: minOrder || 0,
    totalBudget: totalBudget || null,
    usedBudget: 0,
    expiryDate: expiryDate || null,
    desc,
    isActive: true,
    createdAt: new Date().toISOString()
  }, { merge: true });

  showAtelierToast(`ສ້າງຄູປອງ ${code} ສຳເລັດ!`);
  window.closeAddCouponModal();
  window.loadAdminCoupons();
};

window.loadAdminCoupons = async function() {
  const container = document.getElementById('adminCouponsListGrid');
  if (!container) return;
  const firestore = db || firebase.firestore();
  const snap = await firestore.collection('coupons').get();
  if (snap.empty) {
    container.innerHTML = `<div class="col-span-full p-6 text-center text-taupe font-lao">ຍັງບໍ່ມີຄູປອງໃນລະບົບ</div>`;
    return;
  }
  container.innerHTML = snap.docs.map(doc => {
    const c = doc.data();
    return `
      <div class="p-4 rounded-xl bg-surface border border-hairline flex justify-between items-start font-lao gap-2">
        <div>
          <span class="font-mono font-bold text-forest-emerald text-[14px] bg-forest-emerald/10 px-2 py-0.5 rounded">${c.code}</span>
          <p class="text-[12px] font-bold text-primary mt-1">ຫຼຸດ ${c.type === 'percent' ? `${c.value}%` : `${formatLAK(c.value)}`}</p>
          <p class="text-[10px] text-taupe mt-0.5">
            ${c.minOrder ? `ຂັ້ນຕ່ຳ ${formatLAK(c.minOrder)} • ` : ''}
            ${c.expiryDate ? `ໝົດອາຍຸ ${c.expiryDate}` : 'ບໍ່ກຳນົດວັນໝົດອາຍຸ'}
          </p>
        </div>
        <button type="button" onclick="window.deleteCoupon('${c.code}')" class="text-red-600 hover:text-red-800 p-1 cursor-pointer" title="ລຶບຄູປອງ">
          ${svgIcon('trash', 'w-4 h-4')}
        </button>
      </div>
    `;
  }).join('');
};

window.deleteCoupon = async function(code) {
  const ok = await showAtelierConfirm({ title: 'ລຶບຄູປອງ', message: `ລຶບຄູປອງ ${code} ແທ້ບໍ່?`, confirmText: 'ລຶບ', cancelText: 'ຍົກເລີກ' });
  if (!ok) return;
  const firestore = db || firebase.firestore();
  await firestore.collection('coupons').doc(code).delete();
  showAtelierToast(`ລຶບຄູປອງ ${code} ແລ້ວ`);
  window.loadAdminCoupons();
};

window.openModifierModal = function() {
  document.getElementById('modifierForm')?.reset();
  document.getElementById('modifierModal')?.classList.remove('hidden');
};
window.closeModifierModal = function() {
  document.getElementById('modifierModal')?.classList.add('hidden');
};
window.saveModifierFromModal = async function(event) {
  if (event) event.preventDefault();
  const name = document.getElementById('inputModName')?.value.trim();
  const group = document.getElementById('inputModGroup')?.value || 'milk';
  const price = Number(document.getElementById('inputModPrice')?.value) || 0;
  const firestore = db || firebase.firestore();
  await firestore.collection('modifiers').add({ name, group, price, createdAt: new Date() });
  showAtelierToast('ເພີ່ມຕົວເລືອກເສີມສຳເລັດ');
  window.closeModifierModal();
  window.loadAdminModifiers();
};

window.loadAdminModifiers = async function() {
  const container = document.getElementById('modifierAdminList');
  if (!container) return;
  const firestore = db || firebase.firestore();
  const snap = await firestore.collection('modifiers').get();
  const list = snap.empty ? (DEFAULT_MODIFIERS || []) : snap.docs.map(d => ({ id: d.id, ...d.data() }));
  container.innerHTML = list.map(m => `
    <div class="p-3 rounded-lg bg-surface border border-hairline flex justify-between items-center text-[12px] font-lao">
      <div><span class="font-bold text-primary block">${m.name}</span><span class="text-[10px] text-taupe uppercase">[${m.group}]</span></div>
      <span class="font-mono font-bold text-forest-emerald">+${formatLAK(m.price)}</span>
    </div>
  `).join('');
};

window.loadAdminUsers = async function() {
  const tableBody = document.getElementById('adminUsersTableBody');
  if (!tableBody) return;
  const firestore = db || firebase.firestore();
  let users = [...(typeof REGISTERED_ACCOUNTS !== 'undefined' ? REGISTERED_ACCOUNTS : [])];

  try {
    const snap = await firestore.collection('users').get();
    snap.docs.forEach(doc => {
      const u = doc.data();
      if (!users.some(x => x.email === u.email)) users.push(u);
    });
  } catch (_) {}

  tableBody.innerHTML = users.map(u => `
    <tr class="hover:bg-surface/50 font-lao border-b border-hairline">
      <td class="p-2.5 font-bold">${u.name}</td>
      <td class="p-2.5 font-mono text-taupe text-[11px]">${u.email}</td>
      <td class="p-2.5"><span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-900">${u.role}</span></td>
      <td class="p-2.5 text-right font-mono text-[11px] text-taupe">${u.phone || '-'}</td>
    </tr>
  `).join('');
};

window.openBrandModal = function() {
  document.getElementById('brandSettingsModal')?.classList.remove('hidden');
};
window.closeBrandModal = function() {
  document.getElementById('brandSettingsModal')?.classList.add('hidden');
};
window.saveBrandSettings = function(event) {
  if (event) event.preventDefault();
  const name = document.getElementById('inputCafeName')?.value.trim();
  const branch = document.getElementById('inputCafeBranch')?.value.trim();
  if (name) document.querySelectorAll('.brand-name-display').forEach(el => el.textContent = name);
  if (branch) document.querySelectorAll('.brand-branch-display').forEach(el => el.textContent = branch);
  window.closeBrandModal();
  showAtelierToast('ອັບເດດຊື່ຮ້ານຮຽບຮ້ອຍແລ້ວ!');
};

window.loadAllOwnerData = function() {
  window.updateStoreStatusUI();
  window.loadAdminAnalytics();
  window.loadAdminMenus();
  window.loadAdminCoupons();
  window.loadAdminModifiers();
  window.loadAdminPayments();
  window.loadAdminUsers();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', window.loadAllOwnerData);
} else {
  window.loadAllOwnerData();
}
