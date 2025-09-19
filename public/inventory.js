import { 
  getProducts, 
  addProduct, 
  deleteProduct, 
  getLowStockProducts, 
  getExpiredProducts 
} from "./api.js";

// DOM Elements
const allTableBody = document.querySelector("#allProductsTable tbody");
const lowTableBody = document.querySelector("#lowStockTable tbody");
const expiredTableBody = document.querySelector("#expiredTable tbody");

const addProductForm = document.getElementById("addProductForm");
const addProductModal = document.getElementById("addProductModal");
const addProductBtn = document.getElementById("addProductBtn");
const cancelAdd = document.getElementById("cancelAdd");

const deleteModal = document.getElementById("deleteModal");
const cancelDelete = document.getElementById("cancelDelete");
const confirmDelete = document.getElementById("confirmDelete");

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");

let products = [];
let deleteIndex = null;

// ================= Render Table =================
function renderTableRows(tableBody, data, showDelete = false) {
  tableBody.innerHTML = '';
  data.forEach((p, i) => {
    const tr = document.createElement('tr');

    let rowContent = `
      <td>${i + 1}</td>
      <td>${p.name}</td>
      <td>${p.stock}</td>
      <td>${p.reorder || '-'}</td>
      <td>${p.expiry || '-'}</td>
      <td>${p.category}</td>
      <td>₦${p.price}</td>
    `;

    if(showDelete) {
      rowContent += `<td><button onclick="openDelete(${i})" class="btn danger">Delete</button></td>`;
    }

    tr.innerHTML = rowContent;
    tableBody.appendChild(tr);
  });
}

// ================= Load Products =================
async function loadProducts() {
  try {
    products = await getProducts();
    const lowStockProducts = await getLowStockProducts();
    const expiredProducts = await getExpiredProducts();

    // Apply search & category filters for All Products
    const searchValue = searchInput.value.toLowerCase();
    const selectedCategory = categoryFilter.value;
    const filteredProducts = products.filter(p => 
      (selectedCategory === 'all' || p.category === selectedCategory) &&
      p.name.toLowerCase().includes(searchValue)
    );

    renderTableRows(allTableBody, filteredProducts, true);
    renderTableRows(lowTableBody, lowStockProducts);
    renderTableRows(expiredTableBody, expiredProducts);
  } catch (err) {
    console.error("Failed to load products:", err);
  }
}

// ================= Add Product =================
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
    addProductModal.classList.remove('show');
    addProductForm.reset();
    await loadProducts();
  } catch (err) {
    console.error("Failed to add product:", err);
  }
};

// ================= Delete Product =================
window.openDelete = (index) => {
  deleteIndex = index;
  deleteModal.classList.add('show');
};

cancelDelete.onclick = () => deleteModal.classList.remove('show');

confirmDelete.onclick = async () => {
  if(deleteIndex !== null){
    try {
      await deleteProduct(products[deleteIndex].id);
      deleteModal.classList.remove('show');
      await loadProducts();
    } catch (err) {
      console.error("Failed to delete product:", err);
    }
  }
};

// ================= Filters =================
searchInput.addEventListener('input', loadProducts);
categoryFilter.addEventListener('change', loadProducts);

// ================= Initialize =================
loadProducts();
