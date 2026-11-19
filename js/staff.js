window.renderStaffControls = function() {
  const staffView = document.getElementById('adminStaffAppView');
  if (!staffView) return;

  const isSuper = currentUser?.role === 'superadmin';
  const perms = currentUser?.permissions || {};
  const canStore = isSuper || perms.canToggleStore === true;
  const canMenu = isSuper || perms.canToggleMenu === true;

  let bar = document.getElementById('staffPermissionControlsBar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'staffPermissionControlsBar';
    const tabsBar = document.getElementById('staff-tab-active')?.parentElement || staffView.querySelector('.border-b');
    if (tabsBar && tabsBar.parentElement === staffView) {
      staffView.insertBefore(bar, tabsBar);
    } else {
      staffView.prepend(bar);
    }
  }

  const isOpen = storeSettings?.isStoreOpen !== false;

  bar.className = 'p-3 rounded-xl bg-surface-pure border border-hairline flex flex-wrap items-center justify-between gap-2.5 shadow-xs font-lao';
  bar.innerHTML = `
    <span class="text-[11px] font-bold text-taupe uppercase tracking-wider flex items-center gap-1.5">
      ${svgIcon('shield', 'w-4 h-4 text-forest-emerald')}
      <span>ສິດຈັດການຮ້ານ (Staff Controls):</span>
    </span>
    <div class="flex flex-wrap items-center gap-2">
      ${(!canStore && !canMenu) ? `
        <span class="text-[11px] text-taupe bg-surface px-2.5 py-1 rounded-lg border border-hairline">
          ຍັງບໍ່ໄດ້ຮັບສິດເປີດ/ປິດຮ້ານ ຫຼື ປິດເມນູ (ໃຫ້ Superadmin ຕິກມອບສິດໃນໜ້າ Users)
        </span>
      ` : ''}
      ${canStore ? `
        <button type="button" onclick="toggleStoreStatus()"
                class="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white cursor-pointer flex items-center gap-1.5 ${isOpen ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-red-700 hover:bg-red-800'}">
          ${svgIcon('store', 'w-3.5 h-3.5')}
          <span>${isOpen ? 'ສະຖານະ: ເປີດຮ້ານ (ກົດເພື່ອປິດ)' : 'ສະຖານະ: ປິດຊົ່ວຄາວ (ກົດເພື່ອເປີດ)'}</span>
        </button>
      ` : ''}
      ${canMenu ? `
        <button type="button" onclick="toggleStaffRunOutPanel()"
                class="px-3 py-1.5 rounded-lg text-[11px] font-bold border cursor-pointer flex items-center gap-1.5 ${window.staffMenuPanelOpen ? 'bg-forest-emerald text-white border-forest-emerald' : 'bg-surface text-primary border-hairline hover:border-forest-emerald'}">
          ${svgIcon('menuList', 'w-3.5 h-3.5')}
          <span>ຈັດການເມນູໝົດ (Run Out)</span>
        </button>
      ` : ''}
    </div>
  `;

  window.renderStaffStoreControl();
  if (canMenu && window.staffMenuPanelOpen) window.renderStaffRunOutMenuList();
};
