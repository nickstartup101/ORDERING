// ==========================================
// SUPERADMIN CONTROLLER (OPTIMISTIC & REALTIME)
// ==========================================

let editingItemId = null;
let currentUploadedMenuImageBase64 = null;
let salesFilterPeriod = 'day';

// 1. Auto-Compress Image ເພື່ອໃຫ້ບັນທຶກໄວ ແລະ ບໍ່ເກີນ 1MB
function compressImage(file, maxWidth = 750, maxHeight = 750, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // ໄດ້ Base64 ຂະໜາດເບົາ ~60KB - 120KB
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

async function handleMenuImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 1024 * 1024 * 3) {
    showAtelierAlert({ title: "ຮູບພາບໃຫຍ່ເກີນໄປ", message: "ກະລຸນາເລືອກຮູບທີ່ບໍ່ເກີນ 3MB", type: "error" });
    e.target.value = '';
    return;
  }

  try {
    currentUploadedMenuImageBase64 = await compressImage(file);
    const preview = document.getElementById('menuImagePreview');
    preview.src = currentUploadedMenuImageBase64;
    preview.classList.remove('hidden');
  } catch (err) {
    showAtelierAlert({ title: "ຜິດພາດ", message: "ບໍ່ສາມາດປະມວນຜົນຮູບນີ້ໄດ້", type: "error" });
  }
}

function openAddMenuModal(itemId = null) {
  editingItemId = itemId;
  const modal = document.getElementById('addMenuModal');
  const title = document.getElementById('addMenuModalTitle');
  const form = document.getElementById('menuForm');
  const preview = document.getElementById('menuImagePreview');

  form.reset();
  currentUploadedMenuImageBase64 = null;
  preview.classList.add('hidden');

  if (itemId) {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;

    title.textContent = "ແກ້ໄຂເມນູ (Edit Menu Item)";
    document.getElementById('inputItemName').value = item.name;
    document.getElementById('inputItemType').value = item.type || 'drink';
    document.getElementById('inputItemCategory').value = item.category;
    document.getElementById('inputItemDesc').value = item.desc;
    document.getElementById('inputPrepTime').value = item.avgPrepMinutes || 5;

    toggleMenuTypeFields(item.type || 'drink');

    if (item.type === 'food') {
      document.getElementById('priceFoodStandard').value = item.variants?.standard || '';
      document.getElementById('priceFoodWarmed').value = item.variants?.warmed || '';
      document.getElementById('priceFoodSetbox').value = item.variants?.setbox || '';
    } else {
      document.getElementById('priceHot').value = item.variants?.hot || '';
      document.getElementById('priceIced').value = item.variants?.iced || '';
      document.getElementById('priceFrappe').value = item.variants?.frappe || '';
    }

    currentUploadedMenuImageBase64 = item.image;
    preview.src = item.image;
    preview.classList.remove('hidden');
  } else {
    title.textContent = "ເພີ່ມເມນູໃໝ່ (New Menu Item)";
    toggleMenuTypeFields('drink');
  }

  modal.classList.remove('hidden');
}

function toggleMenuTypeFields(type) {
  const drinkBox = document.getElementById('drinkVariantsBox');
  const foodBox = document.getElementById('foodVariantsBox');
  if (type === 'food') {
    drinkBox.classList.add('hidden');
    foodBox.classList.remove('hidden');
  } else {
    drinkBox.classList.remove('hidden');
    foodBox.classList.add('hidden');
  }
}

function closeAddMenuModal() {
  document.getElementById('addMenuModal').classList.add('hidden');
}

// 2. ບັນທຶກໄວທັນທີ (Optimistic UI Update) + ແຈ້ງເຕືອນລູກຄ້າທັນທີ
async function saveMenuItem(e) {
  e.preventDefault();
  if (!currentUploadedMenuImageBase64) {
    showAtelierAlert({ title: "ແຈ້ງເຕືອນ", message: "ກະລຸນາເລືອກຮູບພາບສິນຄ້າກ່ອນບັນທຶກ!", type: "info" });
    return;
  }

  const name = document.getElementById('inputItemName').value.trim();
  const type = document.getElementById('inputItemType').value;
  const category = document.getElementById('inputItemCategory').value;
  const desc = document.getElementById('inputItemDesc').value.trim();
  const prepTime = parseFloat(document.getElementById('inputPrepTime').value) || 5;

  let variants = {};
  if (type === 'food') {
    variants = {
      standard: parseFloat(document.getElementById('priceFoodStandard').value) || null,
      warmed: parseFloat(document.getElementById('priceFoodWarmed').value) || null,
      setbox: parseFloat(document.getElementById('priceFoodSetbox').value) || null
    };
  } else {
    variants = {
      hot: parseFloat(document.getElementById('priceHot').value) || null,
      iced: parseFloat(document.getElementById('priceIced').value) || null,
      frappe: parseFloat(document.getElementById('priceFrappe').value) || null
    };
  }

  const itemId = editingItemId ? editingItemId : 'item_' + Date.now();

  const itemPayload = {
    id: itemId,
    name, type, category, desc, variants,
    image: currentUploadedMenuImageBase64,
    avgPrepMinutes: prepTime,
    updatedAt: new Date().toISOString()
  };

  // 1. ອັບເດດ Local UI ທັນທີ ບໍ່ໃຫ້ລໍຖ້າ (Zero Lag)
  if (editingItemId) {
    const idx = menuItems.findIndex(i => i.id === editingItemId);
    if (idx !== -1) menuItems[idx] = itemPayload;
  } else {
    menuItems.unshift(itemPayload);
  }
  localStorage.setItem('ladolce_menu', JSON.stringify(menuItems));

  // ກະຈາຍ Event ໃຫ້ຝັ່ງລູກຄ້າ Render ໃໝ່ທັນທີ
  window.dispatchEvent(new CustomEvent('ladolce_menu_updated'));

  closeAddMenuModal();
  renderMenu();
  renderAdminMenu();
  renderAnalytics();

  // 2. ສະແດງ Pop-up ສຳເລັດທັນທີ
  showAtelierAlert({
    title: editingItemId ? "ແກ້ໄຂເມນູສຳເລັດ!" : "ເພີ່ມເມນູສຳເລັດ!",
    message: `ເມນູ "${name}" ຖືກບັນທຶກ ແລະ ສະແດງຢູ່ໜ້າສັ່ງຊື້ຂອງລູກຄ້າແລ້ວ.`,
    type: "success"
  });

  // 3. Sync ຂຶ້ນ Firestore ຢູ່ Background
  if (isFirebaseReady && db) {
    db.collection("menu_items").doc(itemId).set(itemPayload, { merge: true })
      .then(() => console.log("Background Firestore Sync Done:", itemId))
      .catch(err => console.warn("Firestore background sync issue:", err));
  }
}

// 3. ລຶບເມນູໄວທັນທີ ພ້ອມ Confirm Pop-up
async function deleteMenuItem(id) {
  const item = menuItems.find(i => i.id === id);
  const itemName = item ? item.name : "ເມນູນີ້";

  const isConfirmed = await showAtelierConfirm({
    title: "ຢືນຢັນການລຶບເມນູ?",
    message: `ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບ "${itemName}"? ເມນູນີ້ຈະຫາຍໄປຈາກໜ້າລູກຄ້າທັນທີ.`,
    confirmText: "ລຶບອອກທັນທີ",
    cancelText: "ຍົກເລີກ",
    isDanger: true
  });

  if (!isConfirmed) return;

  // ລຶບອອກຈາກ Local UI ທັນທີ
  menuItems = menuItems.filter(i => i.id !== id);
  localStorage.setItem('ladolce_menu', JSON.stringify(menuItems));

  window.dispatchEvent(new CustomEvent('ladolce_menu_updated'));
  renderMenu();
  renderAdminMenu();
  renderAnalytics();

  showAtelierAlert({ title: "ລຶບສຳເລັດ", message: `ເມນູ "${itemName}" ຖືກລຶບຮຽບຮ້ອຍແລ້ວ`, type: "success" });

  // Sync delete to Firestore
  if (isFirebaseReady && db) {
    db.collection("menu_items").doc(id).delete().catch(e => console.warn(e));
  }
}
