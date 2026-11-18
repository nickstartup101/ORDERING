// ==========================================
// CUSTOM ATELIER DIALOG & TOAST (PURE SVG)
// ==========================================

let toastTimer = null;

function showAtelierToast(message, type = "success") {
  let toast = document.getElementById('atelierToast');
  if (!toast) return;

  const iconName = type === 'error' ? 'xCircle' : type === 'warning' ? 'alert' : 'checkCircle';
  const iconColor = type === 'error' ? 'text-red-400' : type === 'warning' ? 'text-amber-300' : 'text-emerald-400';

  toast.innerHTML = `
    <span class="${iconColor}">${svgIcon(iconName, 'w-5 h-5')}</span>
    <span class="font-lao">${message}</span>
  `;

  toast.classList.remove('opacity-0', '-translate-y-4', 'pointer-events-none');
  toast.classList.add('opacity-100', 'translate-y-0');

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.add('opacity-0', '-translate-y-4', 'pointer-events-none');
    toast.classList.remove('opacity-100', 'translate-y-0');
  }, 2800);
}

function showAtelierAlert({ title = "ແຈ້ງເຕືອນ", message = "", type = "success", confirmText = "ຕົກລົງ" }) {
  return new Promise((resolve) => {
    let dialog = document.getElementById('atelierAlertDialog');
    if (!dialog) {
      dialog = document.createElement('div');
      dialog.id = 'atelierAlertDialog';
      dialog.className = 'fixed inset-0 z-[100] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 transition-all duration-300';
      document.body.appendChild(dialog);
    }

    const iconName = type === 'success' ? 'checkCircle' : type === 'error' ? 'xCircle' : 'info';
    const iconColor = type === 'success' ? 'text-forest-leaf' : type === 'error' ? 'text-red-600' : 'text-amber-600';
    const iconBg = type === 'success' ? 'bg-emerald-50 border-emerald-200' : type === 'error' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200';

    dialog.innerHTML = `
      <div class="bg-surface-pure w-full max-w-sm rounded-2xl border border-hairline p-6 shadow-2xl text-center space-y-4 animate-scale-up">
        <div class="w-14 h-14 rounded-full ${iconBg} border mx-auto flex items-center justify-center ${iconColor}">
          ${svgIcon(iconName, 'w-7 h-7')}
        </div>
        <div class="space-y-1">
          <h3 class="font-serif-title text-[18px] text-primary font-semibold">${title}</h3>
          <p class="text-[12px] text-taupe font-lao leading-relaxed">${message}</p>
        </div>
        <button id="btnDialogConfirm" class="w-full py-2.5 rounded-lg bg-forest-emerald hover:bg-forest-leaf text-white text-[12px] uppercase tracking-wider font-semibold shadow-xs transition-all cursor-pointer">
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

function showAtelierConfirm({ title = "ຢືນຢັນການດຳເນີນການ", message = "", confirmText = "ລຶບລາຍການ", cancelText = "ຍົກເລີກ", isDanger = true }) {
  return new Promise((resolve) => {
    let dialog = document.getElementById('atelierConfirmDialog');
    if (!dialog) {
      dialog = document.createElement('div');
      dialog.id = 'atelierConfirmDialog';
      dialog.className = 'fixed inset-0 z-[100] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 transition-all duration-300';
      document.body.appendChild(dialog);
    }

    const btnActionStyle = isDanger ? 'bg-red-700 hover:bg-red-800 text-white' : 'bg-forest-emerald hover:bg-forest-leaf text-white';

    dialog.innerHTML = `
      <div class="bg-surface-pure w-full max-w-sm rounded-2xl border border-hairline p-6 shadow-2xl text-center space-y-4 animate-scale-up">
        <div class="w-12 h-12 rounded-full ${isDanger ? 'bg-red-50 border-red-200 text-red-700' : 'bg-forest-leaf/10 border-forest-leaf/20 text-forest-leaf'} border mx-auto flex items-center justify-center">
          ${svgIcon(isDanger ? 'trash' : 'info', 'w-6 h-6')}
        </div>
        <div class="space-y-1">
          <h3 class="font-serif-title text-[17px] text-primary font-semibold">${title}</h3>
          <p class="text-[12px] text-taupe font-lao leading-relaxed">${message}</p>
        </div>
        <div class="grid grid-cols-2 gap-2.5 pt-2">
          <button id="btnDialogCancel" class="py-2.5 rounded-lg border border-hairline hover:bg-surface text-charcoal text-[12px] font-medium font-lao cursor-pointer">
            ${cancelText}
          </button>
          <button id="btnDialogProceed" class="py-2.5 rounded-lg ${btnActionStyle} text-[12px] font-medium font-lao shadow-xs transition-all cursor-pointer">
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
