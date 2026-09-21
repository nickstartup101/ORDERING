// =======================================================
// SUPERADMIN: ITEM-LEVEL CUSTOMIZATION CONTROLLER
// =======================================================

// 1. ເປີດ Modal ເພີ່ມ/ແກ້ໄຂເມນູ ພ້ອມ Option Toggles
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
      
      // ລາຄາແຍກຕາມຮູບແບບ
      document.getElementById('priceHot').value = item.variants?.hot || '';
      document.getElementById('priceIced').value = item.variants?.iced || '';
      document.getElementById('priceFrappe').value = item.variants?.frappe || '';
      document.getElementById('priceStandard').value = item.variants?.standard || '';

      // Toggles ຕົວເລືອກສະເພາະເມນູນີ້
      document.getElementById('toggleAllowMilk').checked = item.allowMilk !== false;
      document.getElementById('toggleAllowSweetness').checked = item.allowSweetness !== false;
      document.getElementById('toggleAllowHot').checked = item.allowHot !== false;
      document.getElementById('toggleAllowIced').checked = item.allowIced !== false;
      document.getElementById('toggleAllowFrappe').checked = item.allowFrappe === true;

      currentUploadedMenuImageBase64 = item.image;
      if (preview && item.image) {
        preview.src = item.image;
        preview.classList.remove('hidden');
      }
    }
  } else {
    // ຄ່າເລີ່ມຕົ້ນເມື່ອເພີ່ມໃໝ່
    document.getElementById('toggleAllowMilk').checked = true;
    document.getElementById('toggleAllowSweetness').checked = true;
    document.getElementById('toggleAllowHot').checked = true;
    document.getElementById('toggleAllowIced').checked = true;
    document.getElementById('toggleAllowFrappe').checked = false;
  }

  document.getElementById('addMenuModal')?.classList.remove('hidden');
}

function closeAddMenuModal() {
  document.getElementById('addMenuModal')?.classList.add('hidden');
}

// 2. ບັນທຶກເມນູ ພ້ອມບັນທຶກການຕັ້ງຄ່າ Option Toggles ລົງ Firestore
async function saveMenuItem(e) {
  if (e) e.preventDefault();
  const name = document.getElementById('inputItemName')?.value.trim();
  const cat = document.getElementById('inputItemCategory')?.value || 'coffee';
  const desc = document.getElementById('inputItemDesc')?.value.trim() || '';

  if (!name) {
    alert("ກະລຸນາໃສ່ຊື່ເມນູ!");
    return;
  }

  // ອ່ານຄ່າລາຄາ
  const pHot = parseFloat(document.getElementById('priceHot')?.value) || null;
  const pIced = parseFloat(document.getElementById('priceIced')?.value) || null;
  const pFrappe = parseFloat(document.getElementById('priceFrappe')?.value) || null;
  const pStd = parseFloat(document.getElementById('priceStandard')?.value) || (pHot || pIced || 35000);

  // ອ່ານຄ່າ Option Toggles ສະເພາະເມນູນີ້
  const allowMilk = document.getElementById('toggleAllowMilk')?.checked;
  const allowSweetness = document.getElementById('toggleAllowSweetness')?.checked;
  const allowHot = document.getElementById('toggleAllowHot')?.checked;
  const allowIced = document.getElementById('toggleAllowIced')?.checked;
  const allowFrappe = document.getElementById('toggleAllowFrappe')?.checked;

  const itemPayload = {
    id: editingItemId || 'item_' + Date.now(),
    name: name,
    category: cat,
    desc: desc,
    variants: {
      standard: pStd,
      hot: allowHot ? (pHot || pStd) : null,
      iced: allowIced ? (pIced || pStd + 5000) : null,
      frappe: allowFrappe ? (pFrappe || pStd + 10000) : null
    },
    allowMilk: allowMilk,
    allowSweetness: allowSweetness,
    allowHot: allowHot,
    allowIced: allowIced,
    allowFrappe: allowFrappe,
    image: currentUploadedMenuImageBase64 || "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600",
    isAvailable: true,
    updatedAt: new Date().toISOString()
  };

  if (editingItemId) {
    const idx = menuItems.findIndex(i => i.id === editingItemId);
    if (idx !== -1) menuItems[idx] = itemPayload;
  } else {
    menuItems.unshift(itemPayload);
  }

  localStorage.setItem('ladolce_menu', JSON.stringify(menuItems));

  // Sync to Cloud Firestore Real-time
  if (isFirebaseReady && db) {
    await db.collection("menu_items").doc(itemPayload.id).set(itemPayload, { merge: true });
  }

  if (typeof renderMenu === 'function') renderMenu();
  renderAdminMenu();
  closeAddMenuModal();
  showToast("ບັນທຶກການຕັ້ງຄ່າເມນູຮຽບຮ້ອຍ!");
}

// 3. Render ລາຍການເມນູຝັ່ງ Admin
function renderAdminMenu() {
  const container = document.getElementById('adminMenuListGrid');
  if (!container) return;

  container.innerHTML = menuItems.map(item => {
    const isAvail = item.isAvailable !== false;
    return `
      <div class="p-3.5 bg-surface-pure border border-hairline rounded-xl flex justify-between items-center shadow-xs">
        <div class="flex items-center gap-3 min-w-0">
          <img src="${item.image}" class="w-13 h-13 rounded-lg object-cover border border-hairline shrink-0 ${!isAvail ? 'grayscale opacity-60' : ''}"/>
          <div class="min-w-0">
            <h5 class="font-serif-title font-bold text-[14px] truncate">${item.name}</h5>
            <span class="text-[10px] text-taupe block">${item.category} • ${formatLAK(item.variants?.standard || 35000)}</span>
            <div class="flex items-center gap-1 mt-1 text-[9px]">
              <span class="px-1.5 py-0.2 rounded font-bold ${isAvail ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}">
                ${isAvail ? '✓ ພ້ອມຂາຍ' : '✕ ໝົດ'}
              </span>
              ${item.allowMilk === false ? '<span class="px-1.5 py-0.2 rounded bg-gray-100 text-gray-600">ບໍ່ມີນົມ</span>' : ''}
              ${item.allowSweetness === false ? '<span class="px-1.5 py-0.2 rounded bg-gray-100 text-gray-600">ບໍ່ປັບຫວານ</span>' : ''}
            </div>
          </div>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <button type="button" onclick="toggleItemAvailability('${item.id}')" class="px-2 py-1 rounded-lg border text-[11px] font-bold transition-all ${isAvail ? 'border-amber-400 bg-amber-50 text-amber-900' : 'border-emerald-500 bg-emerald-50 text-emerald-900'}">
            ${isAvail ? 'ປິດ (ໝົດ)' : 'ເປີດຂາຍ'}
          </button>
          <button type="button" onclick="openAddMenuModal('${item.id}')" class="w-8 h-8 rounded-lg bg-surface border border-hairline text-forest-emerald flex items-center justify-center"><span class="material-symbols-outlined text-[16px]">edit</span></button>
          <button type="button" onclick="deleteMenuItem('${item.id}')" class="w-8 h-8 rounded-lg bg-surface border border-hairline text-red-600 flex items-center justify-center"><span class="material-symbols-outlined text-[16px]">delete</span></button>
        </div>
      </div>
    `;
  }).join('');
}

async function toggleItemAvailability(itemId) {
  const item = menuItems.find(i => i.id === itemId);
  if (!item) return;

  item.isAvailable = item.isAvailable === false ? true : false;
  localStorage.setItem('ladolce_menu', JSON.stringify(menuItems));

  if (isFirebaseReady && db) {
    await db.collection("menu_items").doc(itemId).update({ isAvailable: item.isAvailable });
  }

  if (typeof renderMenu === 'function') renderMenu();
  renderAdminMenu();
  showToast(item.isAvailable ? `ເປີດຂາຍ "${item.name}" ແລ້ວ` : `ປິດ "${item.name}" (ສິນຄ້າໝົດ)`);
}

async function deleteMenuItem(id) {
  if (!confirm("ທ່ານຕ້ອງການລຶບເມນູນີ້ແທ້ບໍ່?")) return;
  menuItems = menuItems.filter(i => i.id !== id);
  localStorage.setItem('ladolce_menu', JSON.stringify(menuItems));
  if (isFirebaseReady && db) await db.collection("menu_items").doc(id).delete();
  if (typeof renderMenu === 'function') renderMenu();
  renderAdminMenu();
  showToast("ລຶບເມນູແລ້ວ");
}
