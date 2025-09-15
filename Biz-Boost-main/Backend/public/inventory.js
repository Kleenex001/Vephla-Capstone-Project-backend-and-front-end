

let products = [
  {
    id: 1,
    name: "Tomato Rice",
    stock: 100,
    reorder: 15,
    price: 65000,
    expiry: "2025-12-31",
    img: "Assets/tomato.png",
    category: "Category A"
  }
];

// DOM Elements
const allTableBody = document.querySelector("#main tbody");
const lowTableBody = document.querySelector("#low tbody");
const expiredTableBody = document.querySelector("#expired tbody");

const addProductForm = document.getElementById("addProductForm");
const searchInput = document.querySelector(".filters input[type='text']");
const categorySelect = document.querySelector(".filters select");

// Render Products
function renderTables() {
  // Clear tables
  allTableBody.innerHTML = "";
  lowTableBody.innerHTML = "";
  expiredTableBody.innerHTML = "";

  const today = new Date();

  // Apply filters
  const searchTerm = searchInput.value.toLowerCase();
  const selectedCategory = categorySelect.value;

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm);
    const matchesCategory =
      selectedCategory === "All" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Loop and add rows
  filteredProducts.forEach((product, index) => {
    const row = `
      <tr>
        <td>${index + 1}</td>
        <td><img src="${product.img}" alt="${product.name}" width="32"></td>
        <td>${product.name}</td>
        <td>${product.stock}</td>
        <td>${product.reorder}</td>
        <td>NGN${product.price.toLocaleString()}</td>
      </tr>
    `;

    // All Products
    allTableBody.insertAdjacentHTML("beforeend", row);

    // Low Stock
    if (product.stock < product.reorder) {
      lowTableBody.insertAdjacentHTML("beforeend", row);
    }

    // Expired
    if (new Date(product.expiry) < today) {
      expiredTableBody.insertAdjacentHTML("beforeend", row);
    }
  });
}

// Handle Add Product Form
addProductForm.addEventListener("submit", e => {
  e.preventDefault();

  const name = document.getElementById("productName").value;
  const stock = parseInt(document.getElementById("stockLevel").value);
  const reorder = parseInt(document.getElementById("reorderLevel").value);
  const price = parseFloat(document.getElementById("unitPrice").value);
  const expiry = document.getElementById("expiryDate").value;

  // For now, set default image & category
  const img = "Assets/tomato.png";
  const category = "Category A";

  products.push({
    id: products.length + 1,
    name,
    stock,
    reorder,
    price,
    expiry,
    img,
    category
  });

  renderTables();
  addProductForm.reset();
  document.getElementById("addProductModal").style.display = "none";
});

// Filters (Search & Category)
searchInput.addEventListener("input", renderTables);
categorySelect.addEventListener("change", renderTables);

// Init
renderTables();
