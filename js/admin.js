// =======================================================
// LA DOLCE — SUPERADMIN CONTROL SUITE (100% PRODUCTION)
// =======================================================

let adminCoupons = [];
let adminModifiers = [];
let adminPayments = [];
let adminMenuItems = [];
let currentSalesFilter = 'day';

// ================= 1. SUB-TABS ROUTER =================
function switchAdminPanelTab(tabName) {
  const tabs = ['analytics', 'menu', 'coupons', 'modifiers', 'payments', 'users'];
  
  tabs.forEach(t => {
    const panel = document.getElementById(`adm-panel-${t}`);
    const btn = document.getElementById(`adm-tab-${t}`);
    if (panel) panel.classList.add('hidden');
    if (btn) {
      btn.className = 'px-3.5 py-1.5 rounded-lg bg-surface border border-hairline text-taupe text-[12px] font-medium shrink-0 flex items-center gap-1.5 hover:text-charcoal transition-colors cursor-pointer';
    }
  });

  const activePanel = document.getElementById(`adm-panel-${tabName}`);
  const activeBtn = document.getElementById(`adm-tab-${tabName}`);

  if (activePanel) activePanel.classList.remove('hidden');
  if (activeBtn) {
    activeBtn.className = 'px-3.5 py-1.5 rounded-lg bg-forest-emerald text-white text-[12px] font-bold shrink-0 flex items-center gap-1.5 shadow-xs cursor-pointer';
  }

  // Load Data ຕາມ Tab
  if (tabName === 'coupons') loadAdminCoupons();
  if (tabName === 'menu') loadAdminMenus();
  if (tabName === 'modifiers') loadAdminModifiers();
  if (tabName === 'payments') loadAdminPayments();
  if (tabName === 'analytics') loadAdminAnalytics();
  if (tabName === 'users') loadAdminUsers();
}

// ================= 2. COUPON BUILDER (100% FIXED) =================
function openAddCouponModal() {
  const form = document.getElementById('couponForm');
  if (form) form.reset();
  document.getElementById('addCouponModal')?.classList.remove('hidden');
}

function closeAddCouponModal() {
  document.getElementById('addCouponModal')?.classList.add('hidden');
}

// 🔥 ຟັງຊັນບັນທຶກ Coupon ທີ່ກົດ Publish ໄດ້ 100%
async function saveCouponFromModal(event) {
  if (event) event.preventDefault(); // 👈 ຢຸດການ reload ໜ້າເວັບ

  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalText = submitBtn ? submitBtn.innerHTML : '';

  try {
    const code = document.getElementById('inputCpnCode')?.value.trim().toUpperCase();
    const type = document.getElementById('inputCpnType')?.value || 'percent';
    const value = Number(document.getElementById('inputCpnValue')?.value) || 0;
    const maxDiscount = Number(document.getElementById('inputCpnMaxDiscount')?.value) || 0;
    const minOrder = Number(document.getElementById('inputCpnMinOrder')?.value) || 0;
    const totalBudget = Number(document.getElementById('inputCpnTotalBudget')?.value) || 0;
    const expiry = document.getElementById('inputCpnExpiry')?.value || '';
    const desc = document.getElementById('inputCpnDesc')?.value.trim() || '';

    if (!code) {
      alert("ກະລຸນາປ້ອນລະຫັດ Coupon Code!");
      return;
    }
    if (value <= 0) {
      alert("ມູນຄ່າສ່ວນຫຼຸດຕ້ອງຫຼາຍກວ່າ 0!");
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>ກຳລັງບັນທຶກ...</span>`;
    }

    const couponData = {
      code: code,
      type: type,
      value: value,
      maxDiscount: maxDiscount,
      minOrder: minOrder,
      totalBudget: totalBudget,
      usedBudget: 0,
      expiryDate: expiry,
      desc: desc,
      isActive: true,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    // ບັນທຶກລົງ Firestore
    await firebase.firestore().collection('coupons').doc(code).set(couponData, { merge: true });

    alert(`🎉 ປະກາດໃຊ້ຄູປອງ "${code}" ສຳເລັດແລ້ວ!`);
    closeAddCouponModal();
    loadAdminCoupons();

  } catch (error) {
    console.error("Coupon error:", error);
    alert("ເກີດຂໍ້ຜິດພາດ: " + error.message);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  }
}

// ໂຫຼດລາຍຊື່ Coupons
async function loadAdminCoupons() {
  const container = document.getElementById('adminCouponsListGrid');
  if (!container) return;

  try {
    const snap = await firebase.firestore().collection('coupons').orderBy('createdAt', 'desc').get();
    if (snap.empty) {
      container.innerHTML = `<div class="col-span-full p-8 text-center text-taupe">ຍັງບໍ່ມີຄູປອງເທື່ອ. ກົດ "+ ສ້າງຄູປອງໃໝ່" ເພື່ອເລີ່ມຕົ້ນ</div>`;
      return;
    }

    container.innerHTML = snap.docs.map(doc => {
      const c = doc.data();
      return `
        <div class="p-4 rounded-xl bg-surface border border-hairline flex flex-col justify-between space-y-3">
          <div>
            <div class="flex items-center justify-between">
              <span class="font-mono font-bold text-forest-emerald text-[14px] bg-forest-emerald/10 px-2 py-0.5 rounded">${c.code}</span>
              <span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded ${c.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}">
                ${c.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p class="text-[12px] font-bold text-primary mt-2">
              ຫຼຸດ ${c.type === 'percent' ? `${c.value}%` : `${formatLAK(c.value)}`}
              ${c.maxDiscount ? `<span class="text-taupe text-[10px]">(ສູງສຸດ ${formatLAK(c.maxDiscount)})</span>` : ''}
            </p>
            <p class="text-[11px] text-taupe mt-1">${c.desc || 'ບໍ່ມີຄຳອະທິບາຍ'}</p>
          </div>
          <div class="pt-2 border-t border-hairline flex items-center justify-between text-[11px]">
            <span class="text-taupe">ໝົດອາຍຸ: ${c.expiryDate || 'ບໍ່ມີກຳນົດ'}</span>
            <button type="button" onclick="deleteCoupon('${c.code}')" class="text-red-600 hover:underline font-bold">ລຶບ</button>
          </div>
        </div>
      `;
    }).join('');
  } catch (e) {
    console.error("Load coupons error:", e);
  }
}

async function deleteCoupon(code) {
  if (!confirm(`ທ່ານຕ້ອງການລຶບຄູປອງ ${code} ແທ້ບໍ່?`)) return;
  try {
    await firebase.firestore().collection('coupons').doc(code).delete();
    loadAdminCoupons();
  } catch (e) {
    alert("Error deleting coupon: " + e.message);
  }
}

// ================= 3. MENU MANAGEMENT =================
function openAddMenuModal() {
  document.getElementById('menuForm')?.reset();
  document.getElementById('menuImagePreview')?.classList.add('hidden');
  document.getElementById('addMenuModal')?.classList.remove('hidden');
}

function closeAddMenuModal() {
  document.getElementById('addMenuModal')?.classList.add('hidden');
}

function autoCheckStandardPriceVisibility() {
  const allowHot = document.getElementById('toggleAllowHot')?.checked;
  const allowIced = document.getElementById('toggleAllowIced')?.checked;
  const allowFrappe = document.getElementById('toggleAllowFrappe')?.checked;
  const standardBox = document.getElementById('standardPriceBox');
  if (standardBox) {
    standardBox.classList.toggle('hidden', allowHot || allowIced || allowFrappe);
  }
}

function handleMenuImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const preview = document.getElementById('menuImagePreview');
    if (preview) {
      preview.src = e.target.result;
      preview.classList.remove('hidden');
    }
  };
  reader.readAsDataURL(file);
}

async function saveMenuItem(event) {
  if (event) event.preventDefault();

  try {
    const name = document.getElementById('inputItemName')?.value.trim();
    const category = document.getElementById('inputItemCategory')?.value || 'coffee';
    const desc = document.getElementById('inputItemDesc')?.value.trim() || '';
    const imageSrc = document.getElementById('menuImagePreview')?.src || '';

    const allowHot = document.getElementById('toggleAllowHot')?.checked;
    const allowIced = document.getElementById('toggleAllowIced')?.checked;
    const allowFrappe = document.getElementById('toggleAllowFrappe')?.checked;

    const priceHot = Number(document.getElementById('priceHot')?.value) || 35000;
    const priceIced = Number(document.getElementById('priceIced')?.value) || 40000;
    const priceFrappe = Number(document.getElementById('priceFrappe')?.value) || 45000;
    const priceStandard = Number(document.getElementById('priceStandard')?.value) || 35000;

    const allowMilk = document.getElementById('toggleAllowMilk')?.checked;
    const allowSweetness = document.getElementById('toggleAllowSweetness')?.checked;
    const allowTopping = document.getElementById('toggleAllowTopping')?.checked;

    if (!name) {
      alert("ກະລຸນາປ້ອນຊື່ເມນູ!");
      return;
    }

    const menuItemData = {
      name,
      category,
      desc,
      image: imageSrc,
      allowHot,
      allowIced,
      allowFrappe,
      allowMilk,
      allowSweetness,
      allowTopping,
      isAvailable: true,
      variants: {
        standard: priceStandard,
        hot: allowHot ? priceHot : null,
        iced: allowIced ? priceIced : null,
        frappe: allowFrappe ? priceFrappe : null
      },
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    await firebase.firestore().collection('menus').add(menuItemData);

    alert("🎉 ບັນທຶກເມນູໃໝ່ສຳເລັດ!");
    closeAddMenuMenuModal();
    loadAdminMenus();

  } catch (e) {
    console.error("Save menu error:", e);
    alert("Error: " + e.message);
  }
}

async function loadAdminMenus() {
  const container = document.getElementById('adminMenuListGrid');
  if (!container) return;

  try {
    const snap = await firebase.firestore().collection('menus').get();
    container.innerHTML = snap.docs.map(doc => {
      const item = doc.data();
      return `
        <div class="p-3 rounded-xl bg-surface border border-hairline flex gap-3 items-center justify-between">
          <div class="flex gap-2.5 items-center">
            <img src="${item.image || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200'}" class="w-12 h-12 rounded-lg object-cover border border-hairline"/>
            <div>
              <h5 class="font-bold text-[13px] text-primary">${item.name}</h5>
              <span class="text-[11px] text-taupe capitalize">${item.category}</span>
            </div>
          </div>
          <button type="button" onclick="deleteMenuItem('${doc.id}')" class="text-red-600 hover:text-red-800 text-[12px] font-bold">ລຶບ</button>
        </div>
      `;
    }).join('');
  } catch (e) {
    console.error("Load menus error:", e);
  }
}

async function deleteMenuItem(id) {
  if (!confirm("ທ່ານຕ້ອງການລຶບເມນູນີ້ແທ້ບໍ່?")) return;
  try {
    await firebase.firestore().collection('menus').doc(id).delete();
    loadAdminMenus();
  } catch (e) {
    alert("Error: " + e.message);
  }
}

// ================= 4. MODIFIERS & ADDONS =================
function openModifierModal() {
  document.getElementById('modifierForm')?.reset();
  document.getElementById('modifierModal')?.classList.remove('hidden');
}

function closeModifierModal() {
  document.getElementById('modifierModal')?.classList.add('hidden');
}

async function saveModifierFromModal(event) {
  if (event) event.preventDefault();
  try {
    const name = document.getElementById('inputModName')?.value.trim();
    const group = document.getElementById('inputModGroup')?.value || 'milk';
    const price = Number(document.getElementById('inputModPrice')?.value) || 0;

    await firebase.firestore().collection('modifiers').add({
      name, group, price, createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    closeModifierModal();
    loadAdminModifiers();
  } catch (e) {
    alert("Error modifier: " + e.message);
  }
}

async function loadAdminModifiers() {
  const container = document.getElementById('modifierAdminList');
  if (!container) return;
  try {
    const snap = await firebase.firestore().collection('modifiers').get();
    container.innerHTML = snap.docs.map(doc => {
      const m = doc.data();
      return `
        <div class="p-3 rounded-lg bg-surface border border-hairline flex justify-between items-center text-[12px]">
          <div>
            <span class="font-bold text-primary block">${m.name}</span>
            <span class="text-[10px] text-taupe uppercase">[${m.group}]</span>
          </div>
          <span class="font-mono font-bold text-forest-emerald">+${formatLAK(m.price)}</span>
        </div>
      `;
    }).join('');
  } catch (e) {
    console.error(e);
  }
}

// ================= 5. PAYMENTS & BRANDING =================
function openBrandModal() {
  document.getElementById('brandSettingsModal')?.classList.remove('hidden');
}
function closeBrandModal() {
  document.getElementById('brandSettingsModal')?.classList.add('hidden');
}

async function saveBrandSettings(event) {
  if (event) event.preventDefault();
  const name = document.getElementById('inputCafeName')?.value.trim();
  const branch = document.getElementById('inputCafeBranch')?.value.trim();

  if (name) {
    document.querySelectorAll('.brand-name-display').forEach(el => el.textContent = name);
  }
  if (branch) {
    document.querySelectorAll('.brand-branch-display').forEach(el => el.textContent = branch);
  }
  closeBrandModal();
  alert("ອັບເດດຊື່ຮ້ານສຳເລັດ!");
}

// ================= 6. ANALYTICS LOADER =================
async function loadAdminAnalytics() {
  try {
    const snap = await firebase.firestore().collection('orders').orderBy('createdAt', 'desc').get();
    let totalSales = 0;
    let orderCount = snap.size;

    const rows = snap.docs.map(doc => {
      const o = doc.data();
      if (o.status !== 'cancelled') {
        totalSales += (o.totalAmount || 0);
      }
      return `
        <tr class="hover:bg-surface/50">
          <td class="p-2.5 font-mono text-[11px]">${o.orderCode || doc.id.substr(0,6)}</td>
          <td class="p-2.5 text-[11px] text-taupe">ມື້ນີ້</td>
          <td class="p-2.5 font-bold">${o.customerName || 'Guest'}</td>
          <td class="p-2.5 text-[11px]">${(o.items || []).map(i => `${i.quantity}x ${i.name}`).join(', ')}</td>
          <td class="p-2.5 font-mono text-forest-emerald text-right font-bold">${formatLAK(o.totalAmount)}</td>
        </tr>
      `;
    }).join('');

    const salesEl = document.getElementById('metricTotalSales');
    const countEl = document.getElementById('metricTotalOrdersCount');
    const tableEl = document.getElementById('analyticsTransactionsTableBody');

    if (salesEl) salesEl.textContent = formatLAK(totalSales);
    if (countEl) countEl.textContent = `${orderCount} ອໍເດີ້`;
    if (tableEl) tableEl.innerHTML = rows;

  } catch (e) {
    console.error("Analytics load error:", e);
  }
}
