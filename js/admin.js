// =======================================================
// LA DOLCE — SUPERADMIN CONTROL PANEL (100% FIXED)
// =======================================================

console.log("🚀 [admin.js] Loaded successfully");

// 1. ປ່ຽນແທັບໃນໜ້າ Admin (ແກ້ switchAdminPanelTab is not defined)
window.switchAdminPanelTab = function(tabName) {
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

  if (tabName === 'coupons') window.loadAdminCoupons();
  if (tabName === 'menu' && typeof loadAdminMenus === 'function') loadAdminMenus();
};

// 2. ເປີດ/ປິດ Modal ຄູປອງ
window.openAddCouponModal = function() {
  const form = document.getElementById('couponForm');
  if (form) form.reset();
  document.getElementById('addCouponModal')?.classList.remove('hidden');
};

window.closeAddCouponModal = function() {
  document.getElementById('addCouponModal')?.classList.add('hidden');
};

// 3. 🔥 Publish Coupon ລົງ Firestore 100%
window.saveCouponFromModal = async function(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const submitBtn = event && event.target ? event.target.querySelector('button[type="submit"]') : null;
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
      alert("⚠️ ກະລຸນາປ້ອນລະຫັດ Coupon Code!");
      return;
    }
    if (value <= 0) {
      alert("⚠️ ມູນຄ່າສ່ວນຫຼຸດຕ້ອງຫຼາຍກວ່າ 0!");
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
      createdAt: new Date().toISOString()
    };

    const firestore = db || firebase.firestore();
    await firestore.collection('coupons').doc(code).set(couponData, { merge: true });

    alert(`🎉 ປະກາດໃຊ້ຄູປອງ "${code}" ສຳເລັດແລ້ວ!`);
    window.closeAddCouponModal();
    window.loadAdminCoupons();

  } catch (error) {
    console.error("Coupon publish error:", error);
    alert("ເກີດຂໍ້ຜິດພາດ: " + error.message);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  }
};

// 4. ໂຫຼດລາຍການຄູປອງ
window.loadAdminCoupons = async function() {
  const container = document.getElementById('adminCouponsListGrid');
  if (!container) return;

  try {
    const firestore = db || firebase.firestore();
    const snap = await firestore.collection('coupons').get();

    if (snap.empty) {
      container.innerHTML = `<div class="col-span-full p-8 text-center text-taupe font-lao">ຍັງບໍ່ມີຄູປອງເທື່ອ. ກົດ "+ ສ້າງຄູປອງໃໝ່" ເພື່ອເລີ່ມຕົ້ນ</div>`;
      return;
    }

    container.innerHTML = snap.docs.map(doc => {
      const c = doc.data();
      return `
        <div class="p-4 rounded-xl bg-surface border border-hairline flex flex-col justify-between space-y-3 font-lao">
          <div>
            <div class="flex items-center justify-between">
              <span class="font-mono font-bold text-forest-emerald text-[14px] bg-forest-emerald/10 px-2 py-0.5 rounded">${c.code}</span>
              <span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded ${c.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}">
                ${c.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p class="text-[13px] font-bold text-primary mt-2">
              ຫຼຸດ ${c.type === 'percent' ? `${c.value}%` : `${formatLAK(c.value)}`}
              ${c.maxDiscount ? `<span class="text-taupe text-[11px]">(ສູງສຸດ ${formatLAK(c.maxDiscount)})</span>` : ''}
            </p>
            <p class="text-[11px] text-taupe mt-1">${c.desc || 'ບໍ່ມີຄຳອະທິບາຍ'}</p>
          </div>
          <div class="pt-2 border-t border-hairline flex items-center justify-between text-[11px]">
            <span class="text-taupe">ໝົດອາຍຸ: ${c.expiryDate || 'ບໍ່ມີກຳນົດ'}</span>
            <button type="button" onclick="window.deleteCoupon('${c.code}')" class="text-red-600 hover:underline font-bold cursor-pointer">ລຶບ</button>
          </div>
        </div>
      `;
    }).join('');
  } catch (e) {
    console.error("Load coupons error:", e);
  }
};

window.deleteCoupon = async function(code) {
  if (!confirm(`ທ່ານຕ້ອງການລຶບຄູປອງ ${code} ແທ້ບໍ່?`)) return;
  try {
    const firestore = db || firebase.firestore();
    await firestore.collection('coupons').doc(code).delete();
    window.loadAdminCoupons();
  } catch (e) {
    alert("Error: " + e.message);
  }
};
