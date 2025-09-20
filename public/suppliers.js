// ==================== SUPPLIERS MODULE ====================
import { getSuppliers, addSupplier, updateSupplier, deleteSupplier, getTopRatedSuppliers } from './api.js';

// ==================== DOM ELEMENTS ====================
const supplierBody = document.getElementById("supplierBody");
const topSuppliers = document.getElementById("topSuppliers");
const recentPurchases = document.getElementById("recentPurchases");

// KPIs
const totalPurchasesEl = document.getElementById("totalPurchases");
const pendingDeliveryEl = document.getElementById("pendingDelivery");
const purchasedEl = document.getElementById("purchased");
const cancelledEl = document.getElementById("cancelled");

// Modal & Form
const supplierModal = document.getElementById("supplierModal");
const supplierForm = document.getElementById("supplierForm");
const modalTitle = document.getElementById("modalTitle");
const addSupplierBtn = document.getElementById("addSupplierBtn");
const closeSupplierModal = document.getElementById("closeSupplierModal");

// Form fields
const supplierNameInput = document.getElementById("supplierName");
const supplierCategoryInput = document.getElementById("supplierCategory");
const leadTimeInput = document.getElementById("leadTime");
const ratingInput = document.getElementById("rating");
const statusInput = document.getElementById("status");

// Search & Filter
const searchInput = document.getElementById("searchInput");
const filterCategory = document.getElementById("filterCategory");

// Data storage
let suppliers = [];
let purchases = [];
let editingSupplierId = null;

// ==================== TOAST ====================
function showToast(message, type = "info") {
  Toastify({
    text: message,
    duration: 3000,
    gravity: "top",
    position: "right",
    backgroundColor: type === "success" ? "green" : type === "error" ? "red" : "blue",
    stopOnFocus: true,
  }).showToast();
}

// ==================== MODAL EVENTS ====================
document.getElementById("addPurchaseBtn").addEventListener("click", () => {
  modalTitle.textContent = "Add New Supplier";
  supplierForm.reset();
  editingSupplierId = null;
  supplierModal.style.display = "flex";
});

closeSupplierModal.addEventListener("click", () => {
  supplierModal.style.display = "none";
});

// ==================== FORM SUBMIT ====================
supplierForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const supplierData = {
    name: supplierNameInput.value.trim(),
    category: supplierCategoryInput.value,
    leadTime: Number(leadTimeInput.value),
    rating: Number(ratingInput.value),
    status: statusInput.value
  };

  if (!supplierData.name || !supplierData.category || isNaN(supplierData.leadTime) || isNaN(supplierData.rating)) {
    showToast("Please fill all required fields", "error");
    return;
  }

  try {
    if (editingSupplierId) {
      // update
      const updated = await updateSupplier(editingSupplierId, supplierData);
      suppliers = suppliers.map(s => s._id === editingSupplierId ? updated : s);
      showToast("Supplier updated successfully!", "success");
    } else {
      // add
      const added = await addSupplier(supplierData);
      suppliers.unshift(added);
      purchases.unshift({ name: added.name, category: added.category, status: added.status });
      showToast("Supplier added successfully!", "success");
    }

    renderSuppliers();
    updateKPIs();
    updateTopSuppliers();
    updateRecentPurchases();
    supplierForm.reset();
    supplierModal.style.display = "none";
  } catch (err) {
    console.error("Error:", err);
    showToast(err?.message || "Failed to save supplier", "error");
  }
});

// ==================== RENDER SUPPLIERS ====================
function renderSuppliers() {
  supplierBody.innerHTML = "";

  if (!Array.isArray(suppliers)) return;

  let filteredSuppliers = [...suppliers];

  // Filter
  const searchTerm = searchInput.value.toLowerCase();
  if (filterCategory.value !== "All") {
    filteredSuppliers = filteredSuppliers.filter(s => s.category === filterCategory.value);
  }
  if (searchTerm) {
    filteredSuppliers = filteredSuppliers.filter(s => s.name.toLowerCase().includes(searchTerm));
  }

  filteredSuppliers.forEach((s, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${s.name}</td>
      <td>${s.category}</td>
      <td>${s.leadTime}</td>
      <td>${"⭐".repeat(s.rating)}</td>
      <td>${s.status}</td>
      <td>
        <button class="btn primary" onclick="editSupplier('${s._id}')">Edit</button>
        <button class="btn delete" onclick="deleteSupplierAction('${s._id}')">Delete</button>
      </td>
    `;
    supplierBody.appendChild(tr);
  });
}

// ==================== KPI UPDATES ====================
function updateKPIs() {
  totalPurchasesEl.textContent = suppliers.length;
  pendingDeliveryEl.textContent = suppliers.filter(s => s.status === "On Hold").length;
  purchasedEl.textContent = suppliers.filter(s => s.status === "Active").length;
  cancelledEl.textContent = suppliers.filter(s => s.status === "Inactive").length;
}

// ==================== TOP & RECENT ====================
function updateTopSuppliers() {
  const top = [...suppliers].sort((a,b) => b.rating - a.rating).slice(0, 3);
  topSuppliers.innerHTML = "";
  top.forEach(s => {
    const li = document.createElement("li");
    li.textContent = `${s.name} (${ "⭐".repeat(s.rating) })`;
    topSuppliers.appendChild(li);
  });
}

function updateRecentPurchases() {
  recentPurchases.innerHTML = "";
  purchases.slice(0,5).forEach(p => {
    const li = document.createElement("li");
    li.textContent = `${p.name} - ${p.status}`;
    recentPurchases.appendChild(li);
  });
}

// ==================== EDIT / DELETE ====================
window.editSupplier = (id) => {
  const supplier = suppliers.find(s => s._id === id);
  if (!supplier) return;

  editingSupplierId = id;
  modalTitle.textContent = "Edit Supplier";
  supplierNameInput.value = supplier.name;
  supplierCategoryInput.value = supplier.category;
  leadTimeInput.value = supplier.leadTime;
  ratingInput.value = supplier.rating;
  statusInput.value = supplier.status;
  supplierModal.style.display = "flex";
};

window.deleteSupplierAction = async (id) => {
  if (!confirm("Are you sure you want to delete this supplier?")) return;

  try {
    await deleteSupplier(id);
    suppliers = suppliers.filter(s => s._id !== id);
    renderSuppliers();
    updateKPIs();
    updateTopSuppliers();
    showToast("Supplier deleted!", "success");
  } catch(err) {
    console.error(err);
    showToast("Failed to delete supplier", "error");
  }
};

// ==================== SEARCH & FILTER ====================
searchInput.addEventListener("input", renderSuppliers);
filterCategory.addEventListener("change", renderSuppliers);

// ==================== INITIAL LOAD ====================
async function loadSuppliers() {
  try {
    const res = await getSuppliers();
    suppliers = res.data || [];
    purchases = suppliers.map(s => ({ name: s.name, category: s.category, status: s.status }));

    renderSuppliers();
    updateKPIs();
    updateTopSuppliers();
    updateRecentPurchases();
  } catch(err) {
    console.error("Failed to load suppliers:", err);
    showToast("Failed to load suppliers", "error");
  }
}

document.addEventListener("DOMContentLoaded", loadSuppliers);
