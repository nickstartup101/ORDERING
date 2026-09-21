// =======================================================
// CUSTOMIZATION MODAL (ADAPTIVE TO MENU SETTINGS)
// =======================================================

function openCustomizeModal(itemId) {
  activeCustomizingItem = menuItems.find(i => i.id === itemId);
  if (!activeCustomizingItem || activeCustomizingItem.isAvailable === false) return;

  modalQuantity = 1;
  selectedSweetnessLevel = '100%';
  document.getElementById('modalQtyDisplay').textContent = modalQuantity;
  document.getElementById('modalItemTitle').textContent = activeCustomizingItem.name;
  document.getElementById('modalItemDesc').textContent = activeCustomizingItem.desc || '';
  document.getElementById('modalItemImage').src = activeCustomizingItem.image;

  // 1. Render ຮູບແບບ (ຮ້ອນ / ເຢັນ / ປັ່ນ ຕາມທີ່ Superadmin ອະນຸຍາດ)
  const container = document.getElementById('variantButtonsGrid');
  container.innerHTML = '';
  const v = activeCustomizingItem.variants || {};
  const list = [];

  if (activeCustomizingItem.allowHot !== false && v.hot) {
    list.push({ key: 'hot', label: 'ຮ້ອນ', price: v.hot });
  }
  if (activeCustomizingItem.allowIced !== false && v.iced) {
    list.push({ key: 'iced', label: 'ເຢັນ', price: v.iced });
  }
  if (activeCustomizingItem.allowFrappe === true && v.frappe) {
    list.push({ key: 'frappe', label: 'ປັ່ນ', price: v.frappe });
  }
  if (list.length === 0) {
    list.push({ key: 'standard', label: 'ມາດຕະຖານ', price: v.standard || 35000 });
  }

  selectedVariant = list[0].key;

  list.forEach(varItem => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `variant-btn p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all ${varItem.key === selectedVariant ? 'border-forest-emerald bg-forest-emerald/10 font-bold' : 'border-hairline bg-surface-pure'}`;
    btn.dataset.key = varItem.key;
    btn.onclick = function() { selectVariantOption(varItem.key); };
    btn.innerHTML = `<span class="text-[11px]">${varItem.label}</span><span class="font-serif-title font-bold text-forest-emerald">${formatLAK(varItem.price)}</span>`;
    container.appendChild(btn);
  });

  // 2. ສະແດງ ຫຼື ເຊື່ອງ "ຕົວເລືອກນົມ" ຕາມທີ່ Superadmin ຕັ້ງຄ່າ
  const milkSection = document.getElementById('milkSelectorGroup');
  if (milkSection) {
    if (activeCustomizingItem.allowMilk === false || activeCustomizingItem.category === 'bakery') {
      milkSection.classList.add('hidden'); // ເຊື່ອງນົມສຳລັບອາເມຣິກາໂນ່
    } else {
      milkSection.classList.remove('hidden'); // ສະແດງນົມສຳລັບລາເຕ້
    }
  }

  // 3. ສະແດງ ຫຼື ເຊື່ອງ "ລະດັບຄວາມຫວານ"
  const sweetSection = document.getElementById('sweetnessSelectorGroup');
  if (sweetSection) {
    if (activeCustomizingItem.allowSweetness === false || activeCustomizingItem.category === 'bakery') {
      sweetSection.classList.add('hidden');
    } else {
      sweetSection.classList.remove('hidden');
    }
  }

  updateModalPrice();
  document.getElementById('customizeModal')?.classList.remove('hidden');
}

function selectVariantOption(key) {
  selectedVariant = key;
  document.querySelectorAll('.variant-btn').forEach(btn => {
    if (btn.dataset.key === key) {
      btn.className = 'variant-btn p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all border-forest-emerald bg-forest-emerald/10 font-bold';
    } else {
      btn.className = 'variant-btn p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all border-hairline bg-surface-pure';
    }
  });
  updateModalPrice();
}

function selectSweetness(btn, level) {
  selectedSweetnessLevel = level;
  document.querySelectorAll('.sweet-btn').forEach(b => {
    b.className = 'sweet-btn py-1.5 rounded text-[11px] text-taupe font-medium';
  });
  btn.className = 'sweet-btn py-1.5 rounded text-[11px] bg-forest-emerald text-white font-medium';
}

function closeCustomizeModal() {
  document.getElementById('customizeModal')?.classList.add('hidden');
}

function adjustModalQty(delta) {
  modalQuantity = Math.max(1, modalQuantity + delta);
  document.getElementById('modalQtyDisplay').textContent = modalQuantity;
  updateModalPrice();
}

function updateModalPrice() {
  if (!activeCustomizingItem) return;
  let unitPrice = activeCustomizingItem.variants?.[selectedVariant] || 35000;

  // ບວກຄ່ານົມສະເພາະເມນູທີ່ເປີດໃຫ້ນົມ
  if (activeCustomizingItem.allowMilk !== false) {
    const milkRadio = document.querySelector('input[name="milkOption"]:checked');
    if (milkRadio && (milkRadio.value.includes('Oat') || milkRadio.value.includes('Almond'))) {
      unitPrice += 15000;
    }
  }

  const extraShot = document.getElementById('addonExtraShot')?.checked;
  if (extraShot) {
    unitPrice += 12000;
  }

  document.getElementById('modalItemBasePrice').textContent = formatLAK(unitPrice);
  document.getElementById('modalDynamicTotal').textContent = formatLAK(unitPrice * modalQuantity);
}
