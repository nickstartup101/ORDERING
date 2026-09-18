// Superadmin Management & Reporting (PIN: 2324)
function renderAnalytics() {
  const totalSalesEl = document.getElementById('metricTotalSales');
  const totalOrdersEl = document.getElementById('metricTotalOrdersCount');
  const cancelledEl = document.getElementById('metricCancelledOrdersCount');
  const ordersTable = document.getElementById('analyticsOrdersTable');
  if (!totalSalesEl || !ordersTable) return;

  const completedOrders = orders.filter(o => o.status === 'completed');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);

  totalSalesEl.textContent = `$${totalRevenue.toFixed(2)}`;
  totalOrdersEl.textContent = orders.length;
  cancelledEl.textContent = `${orders.filter(o => o.status === 'cancelled').length} ຍົກເລີກ`;

  ordersTable.innerHTML = '';
  orders.slice(0, 8).forEach(o => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="p-2.5 font-mono text-primary font-medium">${o.id}</td>
      <td class="p-2.5 font-lao">${o.customerName}</td>
      <td class="p-2.5 text-taupe font-lao">${o.items.length} ລາຍການ</td>
      <td class="p-2.5 font-mono text-emerald-800">~8.2 min (Fast)</td>
      <td class="p-2.5"><span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${o.status === 'completed' ? 'bg-emerald-50 text-emerald-800' : 'bg-surface text-taupe'}">${o.status}</span></td>
      <td class="p-2.5 text-right font-mono font-medium">$${o.total.toFixed(2)}</td>
    `;
    ordersTable.appendChild(tr);
  });
}

function renderAdminMenu() {
  const container = document.getElementById('adminMenuListGrid');
  if (!container) return;

  container.innerHTML = '';
  menuItems.forEach((item) => {
    const div = document.createElement('div');
    div.className = 'p-3.5 rounded-lg bg-surface-pure border border-hairline flex items-center justify-between gap-3 shadow-xs';
    div.innerHTML = `
      <div class="flex items-center gap-3">
        <img src="${item.image}" alt="${item.name}" class="w-12 h-12 rounded object-cover border border-hairline"/>
        <div>
          <h5 class="font-serif text-[14px] text-primary font-medium">${item.name}</h5>
          <span class="text-[10px] uppercase tracking-wider text-taupe">${item.category}</span>
          <p class="text-[11px] font-mono text-charcoal">
            ${item.variants.hot ? 'H: $' + item.variants.hot : ''}
            ${item.variants.iced ? ' | I: $' + item.variants.iced : ''}
            ${item.variants.frappe ? ' | F: $' + item.variants.frappe : ''}
          </p>
        </div>
      </div>
      <button onclick="deleteMenuItem('${item.id}')" class="w-8 h-8 rounded border border-hairline flex items-center justify-center text-taupe hover:text-red-700">
        <span class="material-symbols-outlined text-[16px]">delete</span>
      </button>
    `;
    container.appendChild(div);
  });
}

function openAddMenuModal() {
  document.getElementById('addMenuModal').classList.remove('hidden');
}

function closeAddMenuModal() {
  document.getElementById('addMenuModal').classList.add('hidden');
}

function saveMenuItem(e) {
  e.preventDefault();
  const name = document.getElementById('inputItemName').value;
  const category = document.getElementById('inputItemCategory').value;
  const image = document.getElementById('inputItemImage').value;
  const desc = document.getElementById('inputItemDesc').value;
  const pHot = parseFloat(document.getElementById('priceHot').value) || null;
  const pIced = parseFloat(document.getElementById('priceIced').value) || null;
  const pFrappe = parseFloat(document.getElementById('priceFrappe').value) || null;

  const newItem = {
    id: 'item_' + Date.now(),
    name: name,
    category: category,
    image: image,
    desc: desc,
    variants: { hot: pHot, iced: pIced, frappe: pFrappe },
    available: true
  };

  if (isFirebaseReady && db) {
    db.collection("menu_items").doc(newItem.id).set(newItem).catch(e => console.warn(e));
  }

  menuItems.unshift(newItem);
  localStorage.setItem('ladolce_menu', JSON.stringify(menuItems));

  renderMenu();
  renderAdminMenu();
  closeAddMenuModal();
  document.getElementById('menuForm').reset();
  showToast("ເພີ່ມເມນູໃໝ່ສຳເລັດແລ້ວ!");
}

function deleteMenuItem(id) {
  if (!confirm("ທ່ານຕ້ອງການລຶບເມນູນີ້ແທ້ບໍ່?")) return;
  menuItems = menuItems.filter(i => i.id !== id);
  if (isFirebaseReady && db) {
    db.collection("menu_items").doc(id).delete().catch(e => console.warn(e));
  }
  localStorage.setItem('ladolce_menu', JSON.stringify(menuItems));
  renderMenu();
  renderAdminMenu();
  showToast("ລຶບເມນູແລ້ວ");
}

function switchAdminSubTab(tab) {
  document.getElementById('subtab-analytics').classList.add('hidden');
  document.getElementById('subtab-menu-mgmt').classList.add('hidden');
  document.getElementById('subtab-customers').classList.add('hidden');

  document.querySelectorAll('.admin-subtab').forEach(b => {
    b.className = 'admin-subtab font-serif text-[15px] px-3 py-1.5 border-b-2 border-transparent text-taupe hover:text-primary';
  });

  if (tab === 'analytics') {
    document.getElementById('subtab-analytics').classList.remove('hidden');
    document.getElementById('subtab-btn-analytics').className = 'admin-subtab font-serif text-[15px] px-3 py-1.5 border-b-2 border-primary text-primary font-medium';
  } else if (tab === 'menu-mgmt') {
    document.getElementById('subtab-menu-mgmt').classList.remove('hidden');
    document.getElementById('subtab-btn-menu-mgmt').className = 'admin-subtab font-serif text-[15px] px-3 py-1.5 border-b-2 border-primary text-primary font-medium';
    renderAdminMenu();
  } else if (tab === 'customers') {
    document.getElementById('subtab-customers').classList.remove('hidden');
    document.getElementById('subtab-btn-customers').className = 'admin-subtab font-serif text-[15px] px-3 py-1.5 border-b-2 border-primary text-primary font-medium';
  }
}
