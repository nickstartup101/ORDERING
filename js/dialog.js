// ==========================================
// CUSTOM ATELIER DIALOG & POP-UP SYSTEM
// ==========================================

// 1. Pop-up ແຈ້ງເຕືອນສຳເລັດ ຫຼື ຂໍ້ຜິດພາດ (ແທນ alert())
function showAtelierAlert({ title = "ແຈ້ງເຕືອນ", message = "", type = "success", confirmText = "ຕົກລົງ" }) {
  return new Promise((resolve) => {
    // ກວດສອບ ຫຼື ສ້າງ Dialog DOM
    let dialog = document.getElementById('atelierAlertDialog');
    if (!dialog) {
      dialog = document.createElement('div');
      dialog.id = 'atelierAlertDialog';
      dialog.className = 'fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 transition-all duration-300';
      document.body.appendChild(dialog);
    }

    const icon = type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info';
    const iconColor = type === 'success' ? 'text-forest-leaf' : type === 'error' ? 'text-red-600' : 'text-amber-600';
    const iconBg = type === 'success' ? 'bg-emerald-50 border-emerald-200' : type === 'error' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200';

    dialog.innerHTML = `
      <div class="bg-surface-pure w-full max-w-sm rounded-2xl border border-hairline p-6 shadow-2xl text-center space-y-4 animate-scale-up">
        <div class="w-14 h-14 rounded-full ${iconBg} border mx-auto flex items-center justify-center ${iconColor}">
          <span class="material-symbols-outlined text-[30px]">${icon}</span>
        </div>
        <div class="space-y-1">
          <h3 class="font-serif-title text-[18px] text-primary font-semibold">${title}</h3>
          <p class="text-[12px] text-taupe font-lao leading-relaxed">${message}</p>
        </div>
        <button id="btnDialogConfirm" class="w-full py-2.5 rounded-lg bg-forest-emerald hover:bg-forest-leaf text-white text-[12px] uppercase tracking-wider font-semibold shadow-xs transition-all">
          ${confirmText}
        </button>
      </div>
    `;

    dialog.classList.remove('hidden');

    document.getElementById('btnDialogConfirm').onclick = () => {
      dialog.classList.add('hidden');
      resolve(true);
    };
  });
}

// 2. Pop-up ຖາມຢືນຢັນ (ແທນ confirm() ເຊັ່ນ: ຢືນຢັນລຶບເມນູ)
function showAtelierConfirm({ title = "ຢືນຢັນການດຳເນີນການ", message = "", confirmText = "ລຶບລາຍການ", cancelText = "ຍົກເລີກ", isDanger = true }) {
  return new Promise((resolve) => {
    let dialog = document.getElementById('atelierConfirmDialog');
    if (!dialog) {
      dialog = document.createElement('div');
      dialog.id = 'atelierConfirmDialog';
      dialog.className = 'fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 transition-all duration-300';
      document.body.appendChild(dialog);
    }

    const btnActionStyle = isDanger 
      ? 'bg-red-700 hover:bg-red-800 text-white' 
      : 'bg-forest-emerald hover:bg-forest-leaf text-white';

    dialog.innerHTML = `
      <div class="bg-surface-pure w-full max-w-sm rounded-2xl border border-hairline p-6 shadow-2xl text-center space-y-4 animate-scale-up">
        <div class="w-12 h-12 rounded-full ${isDanger ? 'bg-red-50 border-red-200 text-red-700' : 'bg-forest-leaf/10 border-forest-leaf/20 text-forest-leaf'} border mx-auto flex items-center justify-center">
          <span class="material-symbols-outlined text-[26px]">${isDanger ? 'delete_forever' : 'help'}</span>
        </div>
        <div class="space-y-1">
          <h3 class="font-serif-title text-[17px] text-primary font-semibold">${title}</h3>
          <p class="text-[12px] text-taupe font-lao leading-relaxed">${message}</p>
        </div>
        <div class="grid grid-cols-2 gap-2.5 pt-2">
          <button id="btnDialogCancel" class="py-2.5 rounded-lg border border-hairline hover:bg-surface text-charcoal text-[12px] font-medium font-lao">
            ${cancelText}
          </button>
          <button id="btnDialogProceed" class="py-2.5 rounded-lg ${btnActionStyle} text-[12px] font-medium font-lao shadow-xs transition-all">
            ${confirmText}
          </button>
        </div>
      </div>
    `;

    dialog.classList.remove('hidden');

    document.getElementById('btnDialogCancel').onclick = () => {
      dialog.classList.add('hidden');
      resolve(false);
    };

    document.getElementById('btnDialogProceed').onclick = () => {
      dialog.classList.add('hidden');
      resolve(true);
    };
  });
}
