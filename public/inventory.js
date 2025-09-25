import {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct
} from './api.js';


import { initSettings } from './settingsHelper.js';

document.addEventListener('DOMContentLoaded', () => {
  initSettings();  // This applies settings automatically
});

// === DOM Elements ===
const allProductsTable = document.querySelector('#allProductsTable tbody');
const lowStockTable = document.querySelector('#lowStockTable tbody');
const expiredTable = document.querySelector('#expiredTable tbody');
const categoryFilter = document.getElementById('categoryFilter');
const searchInput = document.getElementById('searchInput');

// Modals
const addProductModal = document.getElementById('addProductModal');
const addProductBtn = document.getElementById('addProductBtn');
const cancelAdd = document.getElementById('cancelAdd');
const addProductForm = document.getElementById('addProductForm');

const editProductModal = document.getElementById('editProductModal');
const editProductForm = document.getElementById('editProductForm');
const cancelEdit = document.getElementById('cancelEdit');

const deleteModal = document.getElementById('deleteModal');
const cancelDelete = document.getElementById('cancelDelete');
const confirmDelete = document.getElementById('confirmDelete');

let products = [];
let lowStockProducts = [];
let expiredProducts = [];
let deleteIndex = null;
let selectedProductId = null;

// === Inject CSS for button styling and row highlights ===
const style = document.createElement('style');
style.innerHTML = `
  .low-stock { background-color: #ffe5e5; font-weight: bold; }
  .expired { background-color: #f0f0f0; text-decoration: line-through; color: #777; }
  .low-expired { background-color: #ffd6d6; font-weight: bold; text-decoration: line-through; color: #555; }
  .edit-btn, .delete-btn {
    padding: 4px 10px; margin: 0 2px; border: none; border-radius: 4px;
    color: #fff; cursor: pointer; font-size: 13px;
  }
  .edit-btn { background-color: #1e90ff; }
  .edit-btn:hover { background-color: #0b78e3; }
  .delete-btn { background-color: #dc3545; }
  .delete-btn:hover { background-color: #c82333; }
`;
document.head.appendChild(style);

// === Toast Container ===
let toastContainer = document.getElementById('toastContainer');
if (!toastContainer) {
  toastContainer = document.createElement('div');
  toastContainer.id = 'toastContainer';
  toastContainer.style.position = 'fixed';
  toastContainer.style.bottom = '20px';
  toastContainer.style.right = '20px';
  toastContainer.style.display = 'flex';
  toastContainer.style.flexDirection = 'column-reverse';
  toastContainer.style.gap = '10px';
  toastContainer.style.zIndex = 9999;
  document.body.appendChild(toastContainer);
}

// === Toast Notifications ===
function showToast(message, type = 'success', duration = 4000) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  toast.style.backgroundColor = type === 'error' ? '#dc3545' :
                               type === 'warning' ? '#ffc107' :
                               '#28a745';
  toast.style.color = '#fff';
  toast.style.padding = '10px 15px';
  toast.style.borderRadius = '5px';
  toast.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
  toast.style.fontSize = '14px';
  toast.style.opacity = '0';
  toast.style.transition = 'opacity 0.3s, transform 0.3s';
  toast.style.transform = 'translateX(100%)';

  toastContainer.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(0)';
  }, 100);

  // Animate out and remove
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// === Tabs ===
const tabs = document.querySelectorAll('.tab-buttons a');
const contents = document.querySelectorAll('.tab-content');
tabs.forEach(tab => {
  tab.addEventListener('click', e => {
    e.preventDefault();
    tabs.forEach(t => t.classList.remove('active'));
    contents.forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
  });
});

// === Fetch Products and categorize ===
async function fetchProducts() {
  try {
    const resProducts = await getProducts();
    products = Array.isArray(resProducts.data)
      ? resProducts.data.map(p => ({
          id: p._id,
          name: p.productName,
          stock: p.stockLevel,
          reorder: p.reorderLevel,
          price: p.unitPrice,
          expiry: p.expiryDate,
          category: p.category
        }))
      : [];

    const today = new Date().toISOString().split('T')[0];

    lowStockProducts = products.filter(p => p.stock <= p.reorder);
    expiredProducts = products.filter(p => p.expiry && p.expiry < today);

    renderTables();
    notifyLowStockAndExpired();
  } catch (err) {
    console.error('Failed to fetch products', err);
    products = [];
    lowStockProducts = [];
    expiredProducts = [];
    renderTables();
  }
}

// === Notify user for low stock & expired ===
function notifyLowStockAndExpired() {
  lowStockProducts.forEach(p => {
    showToast(`Low stock alert: ${p.name} (${p.stock} left)`, 'warning', 5000);
  });

  expiredProducts.forEach(p => {
    showToast(`Expired product alert: ${p.name}`, 'error', 5000);
  });
}

// === Render Tables ===
function renderTables() {
  const today = new Date().toISOString().split('T')[0];
  const searchValue = searchInput.value.toLowerCase();
  const selectedCategory = categoryFilter.value;

  // All Products
  allProductsTable.innerHTML = '';
  const filteredProducts = products.filter(p =>
    (selectedCategory === 'all' || p.category === selectedCategory) &&
    p.name.toLowerCase().includes(searchValue)
  );

  filteredProducts.forEach((p, i) => {
    let rowClass = '';
    const isLow = p.stock <= p.reorder;
    const isExpired = p.expiry && p.expiry < today;

    if (isLow && isExpired) rowClass = 'low-expired';
    else if (isLow) rowClass = 'low-stock';
    else if (isExpired) rowClass = 'expired';

    const row = `<tr class="${rowClass}">
      <td>${i + 1}</td>
      <td>${p.name}</td>
      <td>${p.stock}</td>
      <td>${p.reorder}</td>
      <td>${p.expiry || '-'}</td>
      <td>${p.category}</td>
      <td>₦${p.price.toLocaleString()}</td>
      <td>
        <button class="edit-btn" onclick="openEdit('${p.id}')">Edit</button>
        <button class="delete-btn" onclick="openDelete(${i})">Delete</button>
      </td>
    </tr>`;
    allProductsTable.insertAdjacentHTML('beforeend', row);
  });

  // Low Stock Table
  lowStockTable.innerHTML = '';
  lowStockProducts
    .filter(p => (selectedCategory === 'all' || p.category === selectedCategory) &&
                 p.name.toLowerCase().includes(searchValue))
    .forEach((p, i) => {
      const row = `<tr class="low-stock">
        <td>${i + 1}</td>
        <td>${p.name}</td>
        <td>${p.stock}</td>
        <td>${p.reorder}</td>
        <td>${p.category}</td>
        <td>₦${p.price.toLocaleString()}</td>
      </tr>`;
      lowStockTable.insertAdjacentHTML('beforeend', row);
    });

  // Expired Table
  expiredTable.innerHTML = '';
  expiredProducts
    .filter(p => (selectedCategory === 'all' || p.category === selectedCategory) &&
                 p.name.toLowerCase().includes(searchValue))
    .forEach((p, i) => {
      const row = `<tr class="expired">
        <td>${i + 1}</td>
        <td>${p.name}</td>
        <td>${p.expiry || '-'}</td>
        <td>${p.stock}</td>
        <td>${p.category}</td>
        <td>₦${p.price.toLocaleString()}</td>
      </tr>`;
      expiredTable.insertAdjacentHTML('beforeend', row);
    });
}

// === Filters ===
searchInput.addEventListener('input', renderTables);
categoryFilter.addEventListener('change', renderTables);

// === Add Product ===
addProductBtn?.addEventListener('click', () => addProductModal.classList.add('show'));
cancelAdd?.addEventListener('click', () => addProductModal.classList.remove('show'));

addProductForm?.addEventListener('submit', async e => {
  e.preventDefault();
  const productName = document.getElementById('productName').value.trim();
  const stockLevel = parseInt(document.getElementById('stockLevel').value, 10);
  const reorderLevel = parseInt(document.getElementById('reorderLevel').value, 10);
  const expiryDate = document.getElementById('expiryDate').value;
  const category = document.getElementById('productCategory').value.trim();
  const unitPrice = parseFloat(document.getElementById('unitPrice').value);

  if (!productName || isNaN(stockLevel) || isNaN(reorderLevel) || !category || isNaN(unitPrice) || !expiryDate) {
    showToast('Please fill in all required fields correctly', 'warning');
    return;
  }

  try {
    await addProduct({ productName, stockLevel, reorderLevel, expiryDate, category, unitPrice });
    showToast(`Product "${productName}" added successfully`);
    addProductForm.reset();
    addProductModal.classList.remove('show');
    await fetchProducts();
  } catch (err) {
    console.error('Failed to add product', err);
    showToast(err.message || 'Failed to add product', 'error');
  }
});

// === Edit Product ===
window.openEdit = function(id) {
  selectedProductId = id;
  const product = products.find(p => p.id === id);
  if (!product || !editProductForm) return;

  editProductForm.name.value = product.name;
  editProductForm.stock.value = product.stock;
  editProductForm.reorder.value = product.reorder;
  editProductForm.expiry.value = product.expiry || '';
  editProductForm.category.value = product.category;
  editProductForm.price.value = product.price;

  editProductModal.classList.add('show');
};

cancelEdit?.addEventListener('click', () => editProductModal.classList.remove('show'));

editProductForm?.addEventListener('submit', async e => {
  e.preventDefault();

  const updatedProduct = {
    productName: editProductForm.name.value.trim(),
    stockLevel: parseInt(editProductForm.stock.value, 10),
    reorderLevel: parseInt(editProductForm.reorder.value, 10),
    expiryDate: editProductForm.expiry.value,
    category: editProductForm.category.value.trim(),
    unitPrice: parseFloat(editProductForm.price.value)
  };

 
  if (!updatedProduct.productName || isNaN(updatedProduct.stockLevel) || isNaN(updatedProduct.reorderLevel) || !updatedProduct.category || isNaN(updatedProduct.unitPrice)) {
    showToast('Please fill in all required fields correctly', 'warning');
    return;
  }

  try {
    await updateProduct(selectedProductId, updatedProduct);
    showToast(`Product "${updatedProduct.productName}" updated successfully`);
    editProductModal.classList.remove('show');
    await fetchProducts();
  } catch (err) {
    console.error('Failed to update product', err);
    showToast(err.message || 'Failed to update product', 'error');
  }
});

// === Delete Product ===
window.openDelete = function(index) {
  deleteIndex = index;
  deleteModal.classList.add('show');
};

cancelDelete?.addEventListener('click', () => deleteModal.classList.remove('show'));

confirmDelete?.addEventListener('click', async () => {
  if (deleteIndex !== null) {
    try {
      const deletedName = products[deleteIndex].name;
      await deleteProduct(products[deleteIndex].id);
      showToast(`Product "${deletedName}" deleted successfully`);
      await fetchProducts();
    } catch (err) {
      console.error('Failed to delete product', err);
      showToast('Failed to delete product', 'error');
    }
  }
  deleteModal.classList.remove('show');
});

// === Initial Fetch ===
fetchProducts();

// === Listen for logout from other tabs ===
window.addEventListener('storage', (event) => {
  if (event.key === 'logoutAll') {
    showToast('👋 Logged out from another session', 'info');
    window.location.href = 'sign in.html';
  }
});
