import {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  getExpiredProducts
} from './api.js';

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

// === Fetch Products ===
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

    await fetchLowStockAndExpired();
    renderTables();
  } catch (err) {
    console.error('Failed to fetch products', err);
    products = [];
    lowStockProducts = [];
    expiredProducts = [];
    renderTables();
  }
}

// === Fetch Low Stock & Expired ===
async function fetchLowStockAndExpired() {
  try {
    const resLow = await getLowStockProducts();
    lowStockProducts = Array.isArray(resLow.data) ? resLow.data.map(p => ({
      id: p._id,
      name: p.productName,
      stock: p.stockLevel,
      reorder: p.reorderLevel,
      price: p.unitPrice,
      expiry: p.expiryDate,
      category: p.category
    })) : [];

    const resExpired = await getExpiredProducts();
    expiredProducts = Array.isArray(resExpired.data) ? resExpired.data.map(p => ({
      id: p._id,
      name: p.productName,
      stock: p.stockLevel,
      reorder: p.reorderLevel,
      price: p.unitPrice,
      expiry: p.expiryDate,
      category: p.category
    })) : [];
  } catch (err) {
    console.error('Failed to fetch low-stock or expired products', err);
    lowStockProducts = [];
    expiredProducts = [];
  }
}

// === Render Tables ===
function renderTables() {
  allProductsTable.innerHTML = '';
  lowStockTable.innerHTML = '';
  expiredTable.innerHTML = '';

  const today = new Date().toISOString().split('T')[0];
  const searchValue = searchInput.value.toLowerCase();
  const selectedCategory = categoryFilter.value;

  const filtered = products.filter(p =>
    (selectedCategory === 'all' || p.category === selectedCategory) &&
    p.name.toLowerCase().includes(searchValue)
  );

  filtered.forEach((p, i) => {
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
    alert('Please fill in all required fields.');
    return;
  }

  try {
    await addProduct({ productName, stockLevel, reorderLevel, expiryDate, category, unitPrice });
    addProductForm.reset();
    addProductModal.classList.remove('show');
    await fetchProducts();
  } catch (err) {
    console.error('Failed to add product', err);
    alert(err?.message || 'Failed to add product');
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
    alert('Please fill in all required fields correctly.');
    return;
  }

  try {
    await updateProduct(selectedProductId, updatedProduct);
    editProductModal.classList.remove('show');
    await fetchProducts();
  } catch (err) {
    console.error('Failed to update product', err);
    alert('Failed to update product');
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
      await deleteProduct(products[deleteIndex].id);
      await fetchProducts();
    } catch (err) {
      console.error('Failed to delete product', err);
      alert('Failed to delete product');
    }
  }
  deleteModal.classList.remove('show');
});

// === Initial Fetch ===
fetchProducts();
