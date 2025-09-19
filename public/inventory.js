import {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct
} from './api.js';

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

const purchaseModal = document.getElementById('purchaseModal');
const purchaseForm = document.getElementById('purchaseForm');
const purchaseQuantityInput = document.getElementById('purchaseQuantity');

let products = [];
let deleteIndex = null;
let selectedProductId = null;

// === Fetch and Render Products ===
async function fetchProducts() {
  try {
    products = await getProducts();
    renderTables();
  } catch(err) {
    console.error('Failed to load products', err);
  }
}

function renderTables() {
  allProductsTable.innerHTML = '';
  lowStockTable.innerHTML = '';
  expiredTable.innerHTML = '';

  const today = new Date().toISOString().split('T')[0];
  const searchValue = searchInput.value.toLowerCase();
  const selectedCategory = categoryFilter.value;

  products.forEach((p, i) => {
    if ((selectedCategory === 'all' || p.category === selectedCategory) &&
        p.name.toLowerCase().includes(searchValue)) {

      // All Products Row
      const tr = `<tr>
        <td>${i+1}</td>
        <td>${p.name}</td>
        <td>${p.stock}</td>
        <td>${p.reorder}</td>
        <td>${p.expiry || '-'}</td>
        <td>${p.category}</td>
        <td>₦${p.price.toLocaleString()}</td>
        <td>
          <button onclick="openPurchase(${p.id})">Purchase</button>
          <button onclick="openEdit(${p.id})">Edit</button>
          <button onclick="openDelete(${i})">Delete</button>
        </td>
      </tr>`;
      allProductsTable.insertAdjacentHTML('beforeend', tr);

      // Low Stock
      if(p.stock <= p.reorder){
        const low = `<tr style="color:red;">
          <td>${i+1}</td>
          <td>${p.name}</td>
          <td>${p.stock}</td>
          <td>${p.reorder}</td>
          <td>${p.category}</td>
          <td>₦${p.price.toLocaleString()}</td>
        </tr>`;
        lowStockTable.insertAdjacentHTML('beforeend', low);
      }

      // Expired Products
      if(p.expiry && p.expiry < today){
        const exp = `<tr style="color:gray;">
          <td>${i+1}</td>
          <td>${p.name}</td>
          <td>${p.expiry}</td>
          <td>${p.stock}</td>
          <td>${p.category}</td>
          <td>₦${p.price.toLocaleString()}</td>
        </tr>`;
        expiredTable.insertAdjacentHTML('beforeend', exp);
      }
    }
  });
}

// === Add Product ===
addProductBtn.onclick = () => addProductModal.classList.add('show');
cancelAdd.onclick = () => addProductModal.classList.remove('show');

addProductForm.onsubmit = async e => {
  e.preventDefault();
  const newProduct = {
    name: document.getElementById('productName').value,
    stock: parseInt(document.getElementById('stockLevel').value),
    reorder: parseInt(document.getElementById('reorderLevel').value),
    expiry: document.getElementById('expiryDate').value,
    category: document.getElementById('productCategory').value,
    price: parseFloat(document.getElementById('unitPrice').value),
  };
  try {
    await addProduct(newProduct);
    await fetchProducts();
    addProductModal.classList.remove('show');
    addProductForm.reset();
  } catch(err) {
    console.error('Failed to add product', err);
  }
};

// === Edit Product ===
function openEdit(id){
  selectedProductId = id;
  const product = products.find(p => p.id === id);
  if(!product) return;

  editProductForm.name.value = product.name;
  editProductForm.stock.value = product.stock;
  editProductForm.reorder.value = product.reorder;
  editProductForm.expiry.value = product.expiry;
  editProductForm.category.value = product.category;
  editProductForm.price.value = product.price;

  editProductModal.classList.add('show');
}

cancelEdit.onclick = () => editProductModal.classList.remove('show');

editProductForm.onsubmit = async e => {
  e.preventDefault();
  const updatedProduct = {
    name: editProductForm.name.value,
    stock: parseInt(editProductForm.stock.value),
    reorder: parseInt(editProductForm.reorder.value),
    expiry: editProductForm.expiry.value,
    category: editProductForm.category.value,
    price: parseFloat(editProductForm.price.value)
  };
  try {
    await updateProduct(selectedProductId, updatedProduct);
    await fetchProducts();
    editProductModal.classList.remove('show');
  } catch(err) {
    console.error('Failed to update product', err);
  }
};

// === Delete Product ===
function openDelete(index){
  deleteIndex = index;
  deleteModal.classList.add('show');
}
cancelDelete.onclick = () => deleteModal.classList.remove('show');
confirmDelete.onclick = async () => {
  if(deleteIndex !== null){
    try {
      await deleteProduct(products[deleteIndex].id);
      await fetchProducts();
    } catch(err) {
      console.error('Failed to delete product', err);
    }
  }
  deleteModal.classList.remove('show');
};

// === Purchase Product ===
function openPurchase(id){
  selectedProductId = id;
  const product = products.find(p => p.id === id);
  if(!product) return;

  const today = new Date().toISOString().split('T')[0];
  if(product.expiry && product.expiry < today){
    alert('Cannot purchase expired product!');
    return;
  }

  purchaseModal.classList.add('active');
  document.getElementById('purchaseProductName').textContent = product.name;
  document.getElementById('purchaseUnitPrice').textContent = `₦${product.price.toLocaleString()}`;
  document.getElementById('purchaseAvailableStock').textContent = `Available Stock: ${product.stock}`;
  document.getElementById('purchaseTotal').textContent = '₦0';
  purchaseQuantityInput.value = '';

  purchaseQuantityInput.oninput = () => {
    let qty = parseInt(purchaseQuantityInput.value) || 0;
    if(qty > product.stock){
      alert(`Cannot purchase more than available stock (${product.stock})`);
      purchaseQuantityInput.value = product.stock;
      qty = product.stock;
    }
    document.getElementById('purchaseTotal').textContent = `₦${(qty * product.price).toLocaleString()}`;
  };
}

purchaseForm.onsubmit = async e => {
  e.preventDefault();
  const quantity = parseInt(purchaseQuantityInput.value);
  if(quantity > 0 && selectedProductId){
    const product = products.find(p => p.id === selectedProductId);
    try {
      await updateProduct(selectedProductId, { stock: product.stock - quantity });
      await fetchProducts();
      purchaseModal.classList.remove('active');
      alert(`Purchased ${quantity} units of "${product.name}"`);
    } catch(err) {
      console.error('Failed to update stock', err);
      alert('Purchase failed');
    }
  }
};

// Close purchase modal
document.getElementById('closeModal').onclick = () => purchaseModal.classList.remove('active');
window.onclick = (event) => {
  if(event.target === purchaseModal){
    purchaseModal.classList.remove('active');
  }
};

// === Filters Events ===
searchInput.addEventListener('input', renderTables);
categoryFilter.addEventListener('change', renderTables);

// === Initial Fetch ===
fetchProducts();
