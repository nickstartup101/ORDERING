// =======================================================
// MODIFIER MODAL HANDLERS (ແທນ prompt ຂາວໆ)
// =======================================================

let editingModId = null;

function renderModifierSettings() {
  const list = document.getElementById('modifierAdminList');
  if (!list) return;

  list.innerHTML = modifiers.map(m => `
    <div class="p-3 bg-surface border border-hairline rounded-xl flex justify-between items-center text-[12px] shadow-xs">
      <div>
        <span class="font-bold text-charcoal block">${m.name}</span>
        <span class="text-[10px] text-taupe font-mono">[${m.group}] +${formatLAK(m.price)}</span>
      </div>
      <div class="flex items-center gap-1">
        <button type="button" onclick="openModifierModal('${m.id}')" class="w-7 h-7 rounded-lg bg-surface-pure border border-hairline text-forest-emerald flex items-center justify-center">
          <span class="material-symbols-outlined text-[15px]">edit</span>
        </button>
        <button type="button" onclick="deleteModifier('${m.id}')" class="w-7 h-7 rounded-lg bg-surface-pure border border-hairline text-red-600 flex items-center justify-center">
          <span class="material-symbols-outlined text-[15px]">delete</span>
        </button>
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
    document.getElementById('inputModPrice').value = 15000;
  }

  document.getElementById('modifierModal')?.classList.remove('hidden');
}

function closeModifierModal() {
  document.getElementById('modifierModal')?.classList.add('hidden');
}

function saveModifierFromModal(e) {
  if (e) e.preventDefault();
  const name = document.getElementById('inputModName').value.trim();
  const group = document.getElementById('inputModGroup').value;
  const price = parseFloat(document.getElementById('inputModPrice').value) || 0;

  if (!name) return;

  if (editingModId) {
    const idx = modifiers.findIndex(m => m.id === editingModId);
    if (idx !== -1) {
      modifiers[idx] = { ...modifiers[idx], name, group, price };
    }
  } else {
    modifiers.push({
      id: "mod_" + Date.now(),
      name, group, price
    });
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
  showToast("ລຶບຕົວເລືອກແລ້ວ");
}
