// Supplier Data Store
let suppliers = [];
let purchases = [];

// DOM Elements
const supplierBody = document.getElementById("supplierBody");
const topSuppliers = document.getElementById("topSuppliers");
const recentPurchases = document.getElementById("recentPurchases");

// KPIs
const totalPurchasesEl = document.getElementById("totalPurchases");
const pendingDeliveryEl = document.getElementById("pendingDelivery");
const purchasedEl = document.getElementById("purchased");
const cancelledEl = document.getElementById("cancelled");

// Modal
const purchaseModal = document.getElementById("purchaseModal");
const purchaseForm = document.getElementById("purchaseForm");
const addPurchaseBtn = document.getElementById("addPurchaseBtn");
const closeModal = document.getElementById("closeModal");

// Search & Filter
const searchInput = document.getElementById("searchInput");
const filterCategory = document.getElementById("filterCategory");

// Export
const exportBtn = document.getElementById("exportBtn");

// Open Modal
addPurchaseBtn.addEventListener("click", () => {
  purchaseModal.style.display = "flex";
});

// Close Modal
closeModal.addEventListener("click", () => {
  purchaseModal.style.display = "none";
});

// Submit Purchase Form
purchaseForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("supplierName").value.trim();
  const category = document.getElementById("supplierCategory").value;
  const leadTime = document.getElementById("leadTime").value.trim();
  const rating = parseInt(document.getElementById("rating").value);

  const newSupplier = {
    id: suppliers.length + 1,
    name,
    category,
    leadTime,
    rating,
    status: "Pending",
  };

  suppliers.push(newSupplier);
  purchases.unshift({ name, category, status: "Pending" }); // For recent purchases

  renderSuppliers();
  updateKPIs();
  updateTopSuppliers();
  updateRecentPurchases();

  purchaseForm.reset();
  purchaseModal.style.display = "none";
});

// Render Supplier Table
function renderSuppliers() {
  supplierBody.innerHTML = "";
  let filteredSuppliers = [...suppliers];

  const searchTerm = searchInput.value.toLowerCase();
  const categoryFilter = filterCategory.value;

  if (categoryFilter !== "All") {
    filteredSuppliers = filteredSuppliers.filter(s => s.category === categoryFilter);
  }

  if (searchTerm) {
    filteredSuppliers = filteredSuppliers.filter(s =>
      s.name.toLowerCase().includes(searchTerm)
    );
  }

  filteredSuppliers.forEach((s, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${s.name}</td>
      <td>${s.category}</td>
      <td>${s.leadTime}</td>
      <td>
        <select onchange="rateSupplier(${s.id}, this.value)">
          ${[1,2,3,4,5].map(num =>
            `<option value="${num}" ${s.rating === num ? "selected" : ""}>${"⭐".repeat(num)}</option>`
          ).join("")}
        </select>
      </td>
      <td><span class="status ${s.status.toLowerCase()}">${s.status}</span></td>
      <td>
        ${
          s.status === "Pending"
            ? `<button class="btn confirm" onclick="confirmPurchase(${s.id})">Confirm</button>
               <button class="btn cancel" onclick="cancelPurchase(${s.id})">Cancel</button>`
            : "-"
        }
      </td>
    `;
    supplierBody.appendChild(tr);
  });
}

// Update KPIs
function updateKPIs() {
  const total = suppliers.length;
  const pending = suppliers.filter(s => s.status === "Pending").length;
  const purchased = suppliers.filter(s => s.status === "Purchased").length;
  const cancelled = suppliers.filter(s => s.status === "Cancelled").length;

  totalPurchasesEl.textContent = total;
  pendingDeliveryEl.textContent = pending;
  purchasedEl.textContent = purchased;
  cancelledEl.textContent = cancelled;
}

// Rate Supplier
function rateSupplier(id, value) {
  const supplier = suppliers.find(s => s.id === id);
  if (supplier) {
    supplier.rating = parseInt(value);
    updateTopSuppliers();
  }
}

// Confirm Purchase
function confirmPurchase(id) {
  const supplier = suppliers.find(s => s.id === id);
  if (supplier) {
    supplier.status = "Purchased";
    purchases.unshift({ name: supplier.name, category: supplier.category, status: "Purchased" });
    renderSuppliers();
    updateKPIs();
    updateRecentPurchases();
  }
}

// Cancel Purchase
function cancelPurchase(id) {
  const supplier = suppliers.find(s => s.id === id);
  if (supplier) {
    supplier.status = "Cancelled";
    purchases.unshift({ name: supplier.name, category: supplier.category, status: "Cancelled" });
    renderSuppliers();
    updateKPIs();
    updateRecentPurchases();
  }
}

// Update Top Suppliers
function updateTopSuppliers() {
  const sorted = [...suppliers].sort((a, b) => b.rating - a.rating).slice(0, 3);
  topSuppliers.innerHTML = "";
  sorted.forEach(s => {
    const li = document.createElement("li");
    li.textContent = `${s.name} (${ "⭐".repeat(s.rating) })`;
    topSuppliers.appendChild(li);
  });
}

// Update Recent Purchases
function updateRecentPurchases() {
  recentPurchases.innerHTML = "";
  purchases.slice(0, 5).forEach(p => {
    const li = document.createElement("li");
    li.textContent = `${p.name} - ${p.status}`;
    recentPurchases.appendChild(li);
  });
}

// Export Table to CSV
exportBtn.addEventListener("click", () => {
  let csv = "S/N,Supplier,Category,Lead Time,Rating,Status\n";
  suppliers.forEach((s, i) => {
    csv += `${i+1},${s.name},${s.category},${s.leadTime},${s.rating},${s.status}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "suppliers.csv";
  link.click();
});

// Search & Filter
searchInput.addEventListener("input", renderSuppliers);
filterCategory.addEventListener("change", renderSuppliers);

// Initialize
renderSuppliers();
updateKPIs();
updateTopSuppliers();
updateRecentPurchases();    
document.addEventListener("DOMContentLoaded", () => {
  setActivePage(location.hash.replace("#", "") || "dashboard");
}
);
window.addEventListener("hashchange", () => {
  setActivePage(location.hash.replace("#", "") || "dashboard");
});

