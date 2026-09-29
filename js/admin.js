// =======================================================
// SUPERADMIN ADVANCED CONTROL CENTER (COUPONS & BRANDING)
// =======================================================

let editingItemId = null;
let editingModId = null;
let editingCouponId = null;
let currentUploadedMenuImageBase64 = null;
let currentUploadedBankQRBase64 = null;
let salesFilterPeriod = 'day';

function switchAdminPanelTab(tab) {
  const tabs = [
    { id: 'analytics', icon: 'bar_chart', label: 'ຍອດຂາຍ & ລາຍງານ' },
    { id: 'menu', icon: 'restaurant_menu', label: 'ຈັດການເມນູທັງໝົດ' },
    { id: 'coupons', icon: 'confirmation_number', label: 'ຄູປອງ & ໂປຣໂມຊັ່ນ' }, // 🔥 ແທັບໃໝ່
    { id: 'modifiers', icon: 'tune', label: 'ຕົວເລືອກເສີມ' },
    { id: 'payments', icon: 'qr_code_scanner', label: 'QR ທະນາຄານ' },
    { id: 'users', icon: 'group', label: 'ຈັດການຜູ້ໃຊ້ & ສິດ' }
  ];

  tabs.forEach(t => {
    const btn = document.getElementById(`adm-tab-${t.id}`);
    const pnl = document.getElementById(`adm-panel-${t.id}`);
    if (pnl) pnl.classList.add('hidden');
    if (btn) {
      btn.className = "px-3.5 py-1.5 rounded-lg bg-surface border border-hairline text-taupe text-[12px] font-medium shrink-0 flex items-center gap-1.5 hover:text-charcoal transition-colors";
      btn.innerHTML = `<span class="material-symbols-outlined text-[16px]">${t.icon}</span><span>${t.label}</span>`;
    }
  });

  const activeBtn = document.getElementById(`adm-tab-${tab}`);
  const activePnl = document.getElementById(`adm-panel-${tab}`);
  const activeItem = tabs.find(t => t.id === tab);

  if (activePnl) activePnl.classList.remove('hidden');
  if (activeBtn && activeItem) {
    activeBtn.className = "px-3.5 py-1.5 rounded-lg bg-forest-emerald text-white text-[12px] font-bold shrink-0 flex items-center gap-1.5 shadow-xs";
    activeBtn.innerHTML = `<span class="material-symbols-outlined text-[16px]">${activeItem.icon}</span><span>${activeItem.label}</span>`;
  }

  if (tab === 'analytics') renderAnalytics();
  if (tab === 'menu') renderAdminMenu();
  if (tab === 'coupons') renderAdminCoupons();
  if (tab === 'modifiers') renderModifierSettings();
  if (tab === 'payments') renderPaymentSettings();
  if (tab === 'users') renderUsersList();
}

// -------------------------------------------------------------
// 🔥 1. ລະບົບສ້າງ ແລະ ຈັດການຄູປອງຂັ້ນສູງ (COUPON BUILDER)
// -------------------------------------------------------------
function renderAdminCoupons() {
  const container = document.getElementById('adminCouponsListGrid');
  if (!container) return;

  const now = new Date();

  container.innerHTML = activeCouponsList.map(c => {
    const isExpiredDate = c.expiryDate && new Date(c.expiryDate) < now;
    const isBudgetExceeded = c.totalBudget && c.budgetUsed >= c.totalBudget;
    const isActive = c.isActive !== false && !isExpiredDate && !isBudgetExceeded;

    return `
      <div class="p-4 bg-surface-pure border-2 ${isActive ? 'border-emerald-300' : 'border-gray-200 opacity-60'} rounded-2xl space-y-3 shadow-xs">
        <div class="flex justify-between items-start">
          <div>
            <div class="flex items-center gap-1.5">
              <span class="font-mono font-bold text-forest-emerald text-[16px] tracking-wider">${c.code}</span>
              <span class="px-2 py-0.2 rounded-full text-[9px] font-bold uppercase ${isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}">
                ${isActive ? '✓ Active' : (isBudgetExceeded ? '✕ ງົບໝົດ' : (isExpiredDate ? '✕ ໝົດອາຍຸ' : '✕ ປິດ'))}
              </span>
            </div>
            <p class="text-[12px] text-charcoal font-medium mt-0.5">${c.desc || ''}</p>
          </div>
          <button type="button" onclick="deleteCoupon('${c.id}')" class="text-red-600 hover:text-red-700 p-1"><span class="material-symbols-outlined text-[17px]">delete</span></button>
        </div>

        <div class="p-2.5 rounded-xl bg-surface border border-hairline space-y-1 text-[11px] text-taupe font-mono">
          <div class="flex justify-between">
            <span>ສ່ວນຫຼຸດ:</span>
            <strong class="text-charcoal">${c.type === 'percent' ? c.value + '%' : formatLAK(c.value)}</strong>
          </div>
          ${c.maxDiscount ? `
            <div class="flex justify-between">
              <span>ເພດານສູງສຸດ:</span>
              <strong class="text-charcoal">${formatLAK(c.maxDiscount)}</strong>
            </div>
          ` : ''}
          ${c.minOrder ? `
            <div class="flex justify-between">
              <span>ຍອດຂັ້ນຕ່ຳ:</span>
              <strong class="text-charcoal">${formatLAK(c.minOrder)}</strong>
            </div>
          ` : ''}
          ${c.totalBudget ? `
            <div class="flex justify-between">
              <span>ງົບປະມານທີ່ໃຊ້ໄປ:</span>
              <strong class="text-forest-emerald">${formatLAK(c.budgetUsed || 0)} / ${formatLAK(c.totalBudget)}</strong>
            </div>
          ` : ''}
          ${c.expiryDate ? `
            <div class="flex justify-between">
              <span>ໝົດອາຍຸ:</span>
              <strong class="text-charcoal">${new Date(c.expiryDate).toLocaleDateString()}</strong>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function openAddCouponModal() {
  document.getElementById('couponForm').reset();
  document.getElementById('addCouponModal')?.classList.remove('hidden');
}

function closeAddCouponModal() {
  document.getElementById('addCouponModal')?.classList.add('hidden');
}

async function saveCouponFromModal(e) {
  if (e) e.preventDefault();

  const code = document.getElementById('inputCpnCode')?.value.trim().toUpperCase();
  const type = document.getElementById('inputCpnType')?.value || 'percent';
  const value = parseFloat(document.getElementById('inputCpnValue')?.value) || 0;
  const maxDiscount = parseFloat(document.getElementById('inputCpnMaxDiscount')?.value) || null;
  const minOrder = parseFloat(document.getElementById('inputCpnMinOrder')?.value) || 0;
  const totalBudget = parseFloat(document.getElementById('inputCpnTotalBudget')?.value) || null;
  const expiryDate = document.getElementById('inputCpnExpiry')?.value || null;
  const desc = document.getElementById('inputCpnDesc')?.value.trim() || `ສ່ວນຫຼຸດ ${code}`;

  if (!code || value <= 0) {
    alert("ກະລຸນາປ້ອນລະຫັດໂຄດ ແລະ ມູນຄ່າສ່ວນຫຼຸດທີ່ຖືກຕ້ອງ!");
    return;
  }

  const newCoupon = {
    id: "cpn_" + code,
    code: code,
    type: type,
    value: value,
    maxDiscount: maxDiscount,
    minOrder: minOrder,
    totalBudget: totalBudget,
    budgetUsed: 0,
    expiryDate: expiryDate,
    desc: desc,
    isActive: true,
    createdAt: new Date().toISOString()
  };

  // 1. ອັບເດດ Memory
  const idx = activeCouponsList.findIndex(c => c.code === code);
  if (idx !== -1) {
    activeCouponsList[idx] = newCoupon;
  } else {
    activeCouponsList.unshift(newCoupon);
  }

  // 2. 🔥 Published ກົງຂຶ້ນ Cloud Firestore Real-time ລູກຄ້າໃຊ້ໄດ້ທັນທີ!
  if (isFirebaseReady && db) {
    try {
      await db.collection("coupons").doc(newCoupon.code).set(newCoupon, { merge: true });
      console.log("✅ Coupon Published to Cloud Firestore:", newCoupon.code);
    } catch (err) {
      console.warn(err);
    }
  }

  renderAdminCoupons();
  closeAddCouponModal();
  showToast(`🎉 ປະກາດໃຊ້ຄູປອງ "${code}" ສຳເລັດແລ້ວ!`);
}

async function deleteCoupon(id) {
  if (!confirm("ທ່ານຕ້ອງການລຶບຄູປອງນີ້ແທ້ບໍ່?")) return;
  activeCouponsList = activeCouponsList.filter(c => c.id !== id);
  if (isFirebaseReady && db) {
    const code = id.replace("cpn_", "");
    await db.collection("coupons").doc(code).delete();
  }
  renderAdminCoupons();
  showToast("ລຶບຄູປອງແລ້ວ");
}

// -------------------------------------------------------------
// 🔥 2. CAFE SUITE BRANDING (ຕັ້ງຊື່ຮ້ານ & SLOGAN ປ່ຽນທຸກຈຸດ)
// -------------------------------------------------------------
function openBrandModal() {
  document.getElementById('inputCafeName').value = storeSettings.cafeName || "LA DOLCE";
  document.getElementById('inputCafeBranch').value = storeSettings.cafeBranch || "Downtown Flagship Roastery";
  document.getElementById('brandSettingsModal')?.classList.remove('hidden');
}

function closeBrandModal() {
  document.getElementById('brandSettingsModal')?.classList.add('hidden');
}

async function saveBrandSettings(e) {
  if (e) e.preventDefault();
  const name = document.getElementById('inputCafeName')?.value.trim();
  const branch = document.getElementById('inputCafeBranch')?.value.trim();

  if (!name) { alert("ກະລຸນາໃສ່ຊື່ຮ້ານ!"); return; }

  storeSettings.cafeName = name;
  storeSettings.cafeBranch = branch || "Atelier Roastery";
  localStorage.setItem('ladolce_store_settings', JSON.stringify(storeSettings));

  // Sync Cloud Firestore
  if (isFirebaseReady && db) {
    await db.collection("store").doc("settings").set(storeSettings, { merge: true });
  }

  applyCafeBranding();
  closeBrandModal();
  showToast("ອັບເດດຊື່ຮ້ານ ແລະ ສາຂາທົ່ວລະບົບຮຽບຮ້ອຍ! 🏪");
}

// -------------------------------------------------------------
// 3. MENU, MODIFIERS, PAYMENTS & USERS
// -------------------------------------------------------------
function renderAdminMenu() {
  const container = document.getElementById('adminMenuListGrid');
  if (!container) return;
  container.className = "grid grid-cols-1 md:grid-cols-2 gap-4";

  container.innerHTML = menuItems.map(item => {
    const isAvail = item.isAvailable !== false;
    const v = item.variants || {};
    let priceText = v.hot || v.iced || v.frappe 
      ? `${v.hot ? 'H: ' + formatLAK(v.hot) : ''} ${v.iced ? '| I: ' + formatLAK(v.iced) : ''} ${v.frappe ? '| F: ' + formatLAK(v.frappe) : ''}`
      : formatLAK(v.standard || 35000);

    return `
      <div class="p-4 bg-surface-pure border border-hairline rounded-2xl flex items-center justify-between gap-4 shadow-xs ${!isAvail ? 'opacity-60 bg-gray-50' : ''}">
        <div class="relative w-[70px] h-[70px] rounded-xl overflow-hidden bg-surface-dim shrink-0 border border-hairline">
          <img src="${item.image || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600'}" class="w-full h-full object-cover ${!isAvail ? 'grayscale' : ''}"/>
          ${!isAvail ? `<span class="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] font-bold text-white uppercase">ໝົດ</span>` : ''}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <h5 class="font-serif-title font-bold text-[15px] text-primary truncate">${item.name}</h5>
            <span class="px-2 py-0.2 rounded-full text-[9px] uppercase font-bold tracking-wider ${isAvail ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}">
              ${isAvail ? 'ພ້ອມຂາຍ' : 'ສິນຄ້າໝົດ'}
            </span>
          </div>
          <p class="text-[11px] text-taupe truncate mt-0.5">${item.category} • <span class="font-mono font-bold text-forest-emerald">${priceText}</span></p>
          <div class="flex items-center gap-1.5 mt-2 flex-wrap text-[10px]">
            ${item.allowMilk !== false ? `<span class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-surface text-forest-emerald border border-hairline"><span class="material-symbols-outlined text-[12px]">local_cafe</span> ນົມ</span>` : `<span class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-gray-100 text-gray-400"><span class="material-symbols-outlined text-[12px]">block</span> ບໍ່ໃຊ້ນົມ</span>`}
            ${item.allowSweetness !== false ? `<span class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-surface text-forest-emerald border border-hairline"><span class="material-symbols-outlined text-[12px]">water_drop</span> ຫວານ</span>` : ''}
            ${item.allowTopping !== false ? `<span class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-surface text-forest-emerald border border-hairline"><span class="material-symbols-outlined text-[12px]">add_circle</span> Topping</span>` : ''}
          </div>
        </div>
        <div class="flex flex-col items-end gap-1.5 shrink-0 border-l border-hairline pl-3">
          <button type="button" onclick="toggleItemAvailability('${item.id}')" class="px-2.5 py-1 rounded-lg border text-[11px] font-bold ${isAvail ? 'border-amber-400 bg-amber-50 text-amber-900' : 'border-emerald-500 bg-emerald-50 text-emerald-900'}">
            ${isAvail ? 'ປິດ (ໝົດ)' : 'ເປີດຂາຍ'}
          </button>
          <div class="flex gap-1">
            <button type="button" onclick="openAddMenuModal('${item.id}')" class="w-8 h-8 rounded-lg bg-surface hover:bg-emerald-50 text-forest-emerald border border-hairline flex items-center justify-center"><span class="material-symbols-outlined text-[16px]">edit</span></button>
            <button type="button" onclick="deleteMenuItem('${item.id}')" class="w-8 h-8 rounded-lg bg-surface hover:bg-red-50 text-red-600 border border-hairline flex items-center justify-center"><span class="material-symbols-outlined text-[16px]">delete</span></button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function toggleItemAvailability(itemId) {
  const item = menuItems.find(i => i.id === itemId);
  if (!item) return;
  item.isAvailable = item.isAvailable === false ? true : false;
  if (isFirebaseReady && db) {
    await db.collection("menu_items").doc(itemId).update({ isAvailable: item.isAvailable });
  }
  if (typeof renderMenu === 'function') renderMenu();
  renderAdminMenu();
  showToast(item.isAvailable ? `ເປີດຂາຍ "${item.name}" ແລ້ວ` : `ປິດ "${item.name}" (ສິນຄ້າໝົດ)`);
}

function openAddMenuModal(id = null) {
  editingItemId = id;
  const form = document.getElementById('menuForm');
  if (form) form.reset();
  const preview = document.getElementById('menuImagePreview');
  if (preview) preview.classList.add('hidden');
  currentUploadedMenuImageBase64 = null;

  if (id) {
    const item = menuItems.find(i => i.id === id);
    if (item) {
      document.getElementById('inputItemName').value = item.name || '';
      document.getElementById('inputItemCategory').value = item.category || 'coffee';
      document.getElementById('inputItemDesc').value = item.desc || '';
      const v = item.variants || {};
      document.getElementById('priceStandard').value = v.standard || '';
      document.getElementById('priceHot').value = v.hot || '';
      document.getElementById('priceIced').value = v.iced || '';
      document.getElementById('priceFrappe').value = v.frappe || '';

      document.getElementById('toggleAllowMilk').checked = item.allowMilk !== false;
      document.getElementById('toggleAllowSweetness').checked = item.allowSweetness !== false;
      document.getElementById('toggleAllowTopping').checked = item.allowTopping !== false;
      document.getElementById('toggleAllowHot').checked = item.allowHot !== false && Boolean(v.hot);
      document.getElementById('toggleAllowIced').checked = item.allowIced !== false && Boolean(v.iced);
      document.getElementById('toggleAllowFrappe').checked = Boolean(v.frappe);

      currentUploadedMenuImageBase64 = item.image;
      if (preview && item.image) {
        preview.src = item.image;
        preview.classList.remove('hidden');
      }
    }
  } else {
    document.getElementById('priceStandard').value = 35000;
    document.getElementById('priceHot').value = 35000;
    document.getElementById('priceIced').value = 40000;
    document.getElementById('priceFrappe').value = '';
    document.getElementById('toggleAllowMilk').checked = true;
    document.getElementById('toggleAllowSweetness').checked = true;
    document.getElementById('toggleAllowTopping').checked = true;
    document.getElementById('toggleAllowHot').checked = true;
    document.getElementById('toggleAllowIced').checked = true;
    document.getElementById('toggleAllowFrappe').checked = false;
  }
  autoCheckStandardPriceVisibility();
  document.getElementById('addMenuModal')?.classList.remove('hidden');
}

function autoCheckStandardPriceVisibility() {
  const hot = document.getElementById('toggleAllowHot')?.checked;
  const iced = document.getElementById('toggleAllowIced')?.checked;
  const frappe = document.getElementById('toggleAllowFrappe')?.checked;
  const stdBox = document.getElementById('standardPriceBox');
  if (stdBox) stdBox.classList.toggle('hidden', Boolean(hot || iced || frappe));
}

function closeAddMenuModal() { document.getElementById('addMenuModal')?.classList.add('hidden'); }

function handleMenuImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    currentUploadedMenuImageBase64 = reader.result;
    document.getElementById('menuImagePreview').src = currentUploadedMenuImageBase64;
    document.getElementById('menuImagePreview').classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

async function saveMenuItem(e) {
  if (e) e.preventDefault();
  const name = document.getElementById('inputItemName')?.value.trim();
  const cat = document.getElementById('inputItemCategory')?.value || 'coffee';
  const desc = document.getElementById('inputItemDesc')?.value.trim() || '';
  if (!name) { alert("ກະລຸນາໃສ່ຊື່ເມນູ!"); return; }

  const allowMilk = document.getElementById('toggleAllowMilk')?.checked;
  const allowSweetness = document.getElementById('toggleAllowSweetness')?.checked;
  const allowTopping = document.getElementById('toggleAllowTopping')?.checked;
  const allowHot = document.getElementById('toggleAllowHot')?.checked;
  const allowIced = document.getElementById('toggleAllowIced')?.checked;
  const allowFrappe = document.getElementById('toggleAllowFrappe')?.checked;

  const pHot = parseFloat(document.getElementById('priceHot')?.value) || null;
  const pIced = parseFloat(document.getElementById('priceIced')?.value) || null;
  const pFrappe = parseFloat(document.getElementById('priceFrappe')?.value) || null;
  const pStd = parseFloat(document.getElementById('priceStandard')?.value) || (pHot || pIced || 35000);

  const variantsPayload = (allowHot || allowIced || allowFrappe) ? {
    hot: allowHot ? pHot : null,
    iced: allowIced ? pIced : null,
    frappe: allowFrappe ? pFrappe : null
  } : { standard: pStd };

  const itemPayload = {
    id: editingItemId || 'item_' + Date.now(),
    name: name,
    category: cat,
    variants: variantsPayload,
    allowMilk: allowMilk,
    allowSweetness: allowSweetness,
    allowTopping: allowTopping,
    allowHot: allowHot,
    allowIced: allowIced,
    allowFrappe: allowFrappe,
    desc: desc,
    image: currentUploadedMenuImageBase64 || "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600",
    isAvailable: true,
    updatedAt: new Date().toISOString()
  };

  if (isFirebaseReady && db) {
    await db.collection("menu_items").doc(itemPayload.id).set(itemPayload, { merge: true });
  }

  if (typeof renderMenu === 'function') renderMenu();
  renderAdminMenu();
  closeAddMenuModal();
  showToast("ບັນທຶກເມນູຮຽບຮ້ອຍ!");
}

async function deleteMenuItem(id) {
  if (!confirm("ທ່ານຕ້ອງການລຶບເມນູນີ້ແທ້ບໍ່?")) return;
  if (isFirebaseReady && db) await db.collection("menu_items").doc(id).delete();
  if (typeof renderMenu === 'function') renderMenu();
  renderAdminMenu();
  showToast("ລຶບເມນູແລ້ວ");
}

// Modifiers & Payments & Users
function renderModifierSettings() {
  const list = document.getElementById('modifierAdminList');
  if (!list) return;
  list.innerHTML = modifiers.map(m => `
    <div class="p-3 bg-surface border border-hairline rounded-xl flex justify-between items-center text-[12px] shadow-xs">
      <div><span class="font-bold text-charcoal block">${m.name}</span><span class="text-[10px] text-taupe font-mono">[${m.group}] +${formatLAK(m.price)}</span></div>
      <div class="flex items-center gap-1">
        <button type="button" onclick="openModifierModal('${m.id}')" class="w-7 h-7 rounded-lg bg-surface-pure border border-hairline text-forest-emerald flex items-center justify-center"><span class="material-symbols-outlined text-[15px]">edit</span></button>
        <button type="button" onclick="deleteModifier('${m.id}')" class="w-7 h-7 rounded-lg bg-surface-pure border border-hairline text-red-600 flex items-center justify-center"><span class="material-symbols-outlined text-[15px]">delete</span></button>
      </div>
    </div>
  `).join('');
}

function openModifierModal(id = null) {
  editingModId = id;
  const form = document.getElementById('modifierForm');
  if (form) form.reset();
  const title = document.getElementById('modifierModalTitle');
  if (id) {
    const mod = modifiers.find(m => m.id === id);
    if (mod) {
      if (title) title.textContent = "ແກ້ໄຂຕົວເລືອກເສີມ";
      document.getElementById('inputModName').value = mod.name;
      document.getElementById('inputModGroup').value = mod.group;
      document.getElementById('inputModPrice').value = mod.price;
    }
  } else {
    if (title) title.textContent = "ເພີ່ມຕົວເລືອກໃໝ່";
    document.getElementById('inputModPrice').value = 12000;
  }
  document.getElementById('modifierModal')?.classList.remove('hidden');
}

function closeModifierModal() { document.getElementById('modifierModal')?.classList.add('hidden'); }

function saveModifierFromModal(e) {
  if (e) e.preventDefault();
  const name = document.getElementById('inputModName')?.value.trim();
  const group = document.getElementById('inputModGroup')?.value || 'topping';
  const price = parseFloat(document.getElementById('inputModPrice')?.value) || 0;
  if (!name) return;

  if (editingModId) {
    const idx = modifiers.findIndex(m => m.id === editingModId);
    if (idx !== -1) modifiers[idx] = { ...modifiers[idx], name, group, price };
  } else {
    modifiers.push({ id: "mod_" + Date.now(), name, group, price });
  }
  localStorage.setItem('ladolce_modifiers', JSON.stringify(modifiers));
  renderModifierSettings();
  closeModifierModal();
  showToast("ບັນທຶກຕົວເລືອກເສີມຮຽບຮ້ອຍ!");
}

function deleteModifier(id) {
  if (!confirm("ທ່ານຕ້ອງການລຶບຕົວເລືອກນີ້ແທ້ບໍ່?")) return;
  modifiers = modifiers.filter(m => m.id !== id);
  localStorage.setItem('ladolce_modifiers', JSON.stringify(modifiers));
  renderModifierSettings();
}

function renderPaymentSettings() {
  const list = document.getElementById('paymentMethodsAdminList');
  if (!list) return;
  list.innerHTML = paymentMethods.map(p => `
    <div class="p-3 bg-surface-pure rounded-xl border-2 flex items-center gap-3 shadow-xs" style="border-color: ${p.borderColor}">
      <img src="${p.qrImage}" class="w-14 h-14 rounded-lg object-contain border p-1" style="border-color: ${p.borderColor}"/>
      <div class="flex-1 min-w-0"><h5 class="font-bold text-[13px]">${p.bankName}</h5><span class="text-[11px] font-mono text-taupe block truncate">${p.accountNumber}</span></div>
      <button onclick="deletePaymentMethod('${p.id}')" class="text-red-600 text-[11px]">ລຶບ</button>
    </div>
  `).join('');
}

function openAddPaymentModal() {
  document.getElementById('paymentForm').reset();
  document.getElementById('bankQrPreview').classList.add('hidden');
  document.getElementById('addPaymentModal').classList.remove('hidden');
}
function closeAddPaymentModal() { document.getElementById('addPaymentModal').classList.add('hidden'); }

function handleBankQRUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    currentUploadedBankQRBase64 = reader.result;
    document.getElementById('bankQrPreview').src = currentUploadedBankQRBase64;
    document.getElementById('bankQrPreview').classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

function savePaymentMethod(e) {
  if (e) e.preventDefault();
  const bankName = document.getElementById('inputBankName').value;
  const accountNumber = document.getElementById('inputAccountNumber').value;
  const borderColor = document.getElementById('inputBorderColor').value;
  if (!currentUploadedBankQRBase64) { alert("ກະລຸນາອັບໂຫຼດຮູບ QR!"); return; }

  paymentMethods.push({ id: "pay_" + Date.now(), bankName, accountNumber, borderColor, qrImage: currentUploadedBankQRBase64 });
  localStorage.setItem('ladolce_payment_methods', JSON.stringify(paymentMethods));
  renderPaymentSettings();
  closeAddPaymentModal();
}

function deletePaymentMethod(id) {
  paymentMethods = paymentMethods.filter(p => p.id !== id);
  localStorage.setItem('ladolce_payment_methods', JSON.stringify(paymentMethods));
  renderPaymentSettings();
}

async function renderUsersList() {
  const tbody = document.getElementById('adminUsersTableBody');
  if (!tbody) return;
  if (isFirebaseReady && db) {
    try {
      const snapshot = await db.collection("users").get();
      cloudUsers = [];
      snapshot.forEach(doc => cloudUsers.push({ id: doc.id, ...doc.data() }));
    } catch (e) {}
  }
  tbody.innerHTML = cloudUsers.map(u => `
    <tr>
      <td class="p-2.5 font-bold">${u.name}</td>
      <td class="p-2.5 font-mono text-taupe">${u.email}</td>
      <td class="p-2.5"><span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${u.role === 'superadmin' ? 'bg-amber-100 text-amber-900' : u.role === 'staff' ? 'bg-emerald-100 text-emerald-900' : 'bg-surface text-taupe'}">${u.role || 'customer'}</span></td>
      <td class="p-2.5 text-right">
        <select onchange="updateUserRole('${u.email}', this.value)" class="text-[11px] rounded border border-hairline p-1">
          <option value="customer" ${u.role === 'customer' ? 'selected' : ''}>Customer</option>
          <option value="staff" ${u.role === 'staff' ? 'selected' : ''}>Staff</option>
          <option value="superadmin" ${u.role === 'superadmin' ? 'selected' : ''}>Superadmin</option>
        </select>
      </td>
    </tr>
  `).join('');
}

async function updateUserRole(email, newRole) {
  if (isFirebaseReady && db) {
    await db.collection("users").doc(email).update({ role: newRole });
    showToast(`ອັບເດດສິດ ${email} ເປັນ ${newRole}`);
    renderUsersList();
  }
}

function setSalesFilter(period) { salesFilterPeriod = period; renderAnalytics(); }

function renderAnalytics() {
  const metricEl = document.getElementById('metricTotalSales');
  const metricOrdersCount = document.getElementById('metricTotalOrdersCount');
  const metricQrRevenue = document.getElementById('metricQrRevenue');
  const metricCashRevenue = document.getElementById('metricCashRevenue');
  const tableBody = document.getElementById('analyticsTransactionsTableBody');
  if (!metricEl) return;

  const now = new Date();
  const completed = orders.filter(o => o.status === 'completed');
  let filtered = completed.filter(o => {
    if (!o.createdAt) return false;
    const oDate = new Date(o.createdAt);
    const diffDays = Math.ceil(Math.abs(now - oDate) / (1000 * 60 * 60 * 24));
    if (salesFilterPeriod === 'day') {
      return oDate.getFullYear() === now.getFullYear() && oDate.getMonth() === now.getMonth() && oDate.getDate() === now.getDate();
    }
    if (salesFilterPeriod === 'week') return diffDays <= 7;
    if (salesFilterPeriod === 'month') return diffDays <= 30;
    return true;
  });

  const totalRev = filtered.reduce((s, o) => s + (Number(o.total) || 0), 0);
  const qrTotal = filtered.filter(o => o.slipUrl).reduce((s, o) => s + (Number(o.total) || 0), 0);
  const cashTotal = totalRev - qrTotal;

  metricEl.textContent = formatLAK(totalRev);
  if (metricOrdersCount) metricOrdersCount.textContent = `${filtered.length} ອໍເດີ້`;
  if (metricQrRevenue) metricQrRevenue.textContent = formatLAK(qrTotal);
  if (metricCashRevenue) metricCashRevenue.textContent = formatLAK(cashTotal);

  if (tableBody) {
    tableBody.innerHTML = filtered.map(o => `
      <tr class="hover:bg-surface/50 transition-colors">
        <td class="p-2.5 font-mono font-bold text-forest-emerald">${o.id}</td>
        <td class="p-2.5 text-taupe text-[11px]">${new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
        <td class="p-2.5"><span class="font-bold block">${o.customerName}</span><span class="text-[10px] text-taupe font-mono">${o.customerPhone}</span></td>
        <td class="p-2.5 text-[11px] max-w-xs truncate">${o.items.map(i => `${i.quantity}× ${i.name}`).join(', ')}</td>
        <td class="p-2.5"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${o.slipUrl ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-700'}">${o.slipUrl ? 'ໂອນ QR' : 'ເງິນສົດ'}</span></td>
        <td class="p-2.5 text-right font-mono font-bold text-forest-emerald">${formatLAK(o.total)}</td>
      </tr>
    `).join('');
  }
}

function toggleStoreStatus() {
  storeSettings.isStoreOpen = !storeSettings.isStoreOpen;
  localStorage.setItem('ladolce_store_settings', JSON.stringify(storeSettings));
  updateStoreStatusUI();
}

function updateStoreStatusUI() {
  const btn = document.getElementById('btnToggleStore');
  const badge = document.getElementById('customerStoreOpenBadge');
  if (btn) {
    btn.textContent = storeSettings.isStoreOpen ? "ຮ້ານເປີດຢູ່ (ກົດເພື່ອປິດ)" : "ຮ້ານປິດຢູ່ (ກົດເພື່ອເປີດ)";
    btn.className = storeSettings.isStoreOpen ? "px-3 py-1.5 rounded-lg bg-emerald-800 text-white text-[11px] font-medium" : "px-3 py-1.5 rounded-lg bg-red-700 text-white text-[11px] font-medium";
  }
  if (badge) {
    badge.textContent = storeSettings.isStoreOpen ? "ເປີດບໍລິການ" : "ປິດຊົ່ວຄາວ";
    badge.className = storeSettings.isStoreOpen ? "px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold" : "px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider bg-red-100 text-red-900 border border-red-300 font-bold";
  }
}
