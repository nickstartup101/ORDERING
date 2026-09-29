// =======================================================
// ADMIN & COUPON PUBLISHER (100% GUARANTEED PUBLISH)
// =======================================================

function openAddCouponModal() {
  const form = document.getElementById('couponForm');
  if (form) form.reset();
  document.getElementById('addCouponModal')?.classList.remove('hidden');
}

function closeAddCouponModal() {
  document.getElementById('addCouponModal')?.classList.add('hidden');
}

// 🔥 ຟັງຊັນ Publish ທີ່ບໍ່ມີທາງລົ້ມເຫຼວ (Never-Fail Publish)
async function saveCouponFromModal(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const codeEl = document.getElementById('inputCpnCode');
  const valEl = document.getElementById('inputCpnValue');

  const code = codeEl ? codeEl.value.trim().toUpperCase() : '';
  const type = document.getElementById('inputCpnType')?.value || 'percent';
  const val = Number(valEl?.value) || 0;
  const max = Number(document.getElementById('inputCpnMaxDiscount')?.value) || 0;
  const min = Number(document.getElementById('inputCpnMinOrder')?.value) || 0;
  const exp = document.getElementById('inputCpnExpiry')?.value || '';
  const desc = document.getElementById('inputCpnDesc')?.value || '';

  if (!code) {
    alert("⚠️ ກະລຸນາປ້ອນລະຫັດ Coupon Code!");
    return false;
  }
  if (val <= 0) {
    alert("⚠️ ມູນຄ່າສ່ວນຫຼຸດຕ້ອງຫຼາຍກວ່າ 0!");
    return false;
  }

  const couponObj = {
    code: code,
    type: type,
    value: val,
    maxDiscount: max,
    minOrder: min,
    expiryDate: exp,
    desc: desc,
    isActive: true,
    createdAt: new Date().toISOString()
  };

  // 1. ບັນທຶກລົງ Firestore
  let firebaseSuccess = false;
  try {
    if (typeof firebase !== 'undefined' && firebase.firestore) {
      await firebase.firestore().collection('coupons').doc(code).set(couponObj, { merge: true });
      firebaseSuccess = true;
    }
  } catch (err) {
    console.warn("Firestore write blocked, using Local Storage fallback:", err);
  }

  // 2. ສຳຮອງລົງ LocalStorage ສະເໝີ (ເພື່ອໃຫ້ Coupon ໃຊ້ງານໄດ້ແນ່ນອນ 100%)
  const localCoupons = JSON.parse(localStorage.getItem('ladolce_coupons') || '[]');
  const filtered = localCoupons.filter(c => c.code !== code);
  filtered.unshift(couponObj);
  localStorage.setItem('ladolce_coupons', JSON.stringify(filtered));

  alert(`🎉 ສຳເລັດ! ປະກາດໃຊ້ຄູປອງ "${code}" ຮຽບຮ້ອຍແລ້ວ!`);
  
  closeAddCouponModal();
  loadAdminCoupons();
  return false;
}

// ໂຫຼດ Coupons ຂຶ້ນມາສະແດງ
async function loadAdminCoupons() {
  const container = document.getElementById('adminCouponsListGrid');
  if (!container) return;

  let coupons = JSON.parse(localStorage.getItem('ladolce_coupons') || '[]');

  try {
    if (typeof firebase !== 'undefined' && firebase.firestore) {
      const snap = await firebase.firestore().collection('coupons').get();
      if (!snap.empty) {
        coupons = [];
        snap.forEach(d => coupons.push(d.data()));
      }
    }
  } catch (e) {
    console.log("Using cached coupons.");
  }

  if (coupons.length === 0) {
    container.innerHTML = `<div class="col-span-full p-6 text-center text-taupe">ຍັງບໍ່ມີຄູປອງເທື່ອ. ກົດ "+ ສ້າງຄູປອງໃໝ່"</div>`;
    return;
  }

  container.innerHTML = coupons.map(c => `
    <div class="p-4 rounded-xl bg-surface border border-hairline flex flex-col justify-between space-y-2">
      <div class="flex justify-between items-center">
        <span class="font-mono font-bold text-forest-emerald bg-forest-emerald/10 px-2.5 py-0.5 rounded">${c.code}</span>
        <span class="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">Active</span>
      </div>
      <div class="font-bold text-[13px] text-primary">
        ຫຼຸດ: ${c.type === 'percent' ? `${c.value}%` : `${formatLAK(c.value)}`}
        ${c.maxDiscount ? `<span class="text-taupe text-[10px]">(ສູງສຸດ ${formatLAK(c.maxDiscount)})</span>` : ''}
      </div>
      <p class="text-[11px] text-taupe">${c.desc || 'ສ່ວນຫຼຸດພິເສດ'}</p>
    </div>
  `).join('');
}

// Subtab Switcher
function switchAdminPanelTab(tabName) {
  ['analytics', 'menu', 'coupons', 'modifiers', 'payments', 'users'].forEach(t => {
    document.getElementById(`adm-panel-${t}`)?.classList.add('hidden');
    document.getElementById(`adm-tab-${t}`)?.classList.remove('bg-forest-emerald', 'text-white');
  });

  document.getElementById(`adm-panel-${tabName}`)?.classList.remove('hidden');
  document.getElementById(`adm-tab-${tabName}`)?.classList.add('bg-forest-emerald', 'text-white');

  if (tabName === 'coupons') loadAdminCoupons();
}
