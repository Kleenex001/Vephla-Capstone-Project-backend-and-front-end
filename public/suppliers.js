// suppliers.js
import {
  getSuppliers,
  getSupplierById,
  addSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierPurchaseBreakdown
} from "./api.js";

// === DOM Elements ===
const supplierTableBody = document.getElementById("supplierTableBody");

// KPI DOM elements
const totalSuppliesEl = document.getElementById("totalSupplies");
const pendingEl = document.getElementById("pendingSupplies");
const completedEl = document.getElementById("completedSupplies");
const cancelledEl = document.getElementById("cancelledSupplies");

// Form elements
const supplierForm = document.getElementById("supplierForm");
const supplierNameInput = document.getElementById("supplierName");
const supplierCategoryInput = document.getElementById("supplierCategory");
const supplierLeadTimeInput = document.getElementById("supplierLeadTime");
const supplierRatingInput = document.getElementById("supplierRating");
const supplierPurchaseInput = document.getElementById("supplierPurchase");

let editingSupplierId = null;

// === Load Supplier Purchase Breakdown ===
async function loadSupplierBreakdown() {
  try {
    const breakdown = await getSupplierPurchaseBreakdown();

    if (totalSuppliesEl) totalSuppliesEl.textContent = breakdown.totalSupplies || 0;
    if (pendingEl) pendingEl.textContent = breakdown.pending || 0;
    if (completedEl) completedEl.textContent = breakdown.completed || 0;
    if (cancelledEl) cancelledEl.textContent = breakdown.cancelled || 0;
  } catch (err) {
    console.error("Failed to load supplier breakdown:", err);
  }
}

// === Load Suppliers into Table ===
async function loadSuppliers() {
  try {
    const suppliers = await getSuppliers();

    supplierTableBody.innerHTML = "";

    suppliers.forEach((s) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${s.name}</td>
        <td>${s.category}</td>
        <td>${s.leadTime} days</td>
        <td>${s.rating}</td>
        <td>${s.purchase || "N/A"}</td>
        <td>
          <button class="edit-btn" data-id="${s._id}">Edit</button>
          <button class="delete-btn" data-id="${s._id}">Delete</button>
        </td>
      `;
      supplierTableBody.appendChild(row);
    });

    // Bind edit & delete
    document.querySelectorAll(".edit-btn").forEach((btn) =>
      btn.addEventListener("click", () => editSupplier(btn.dataset.id))
    );
    document.querySelectorAll(".delete-btn").forEach((btn) =>
      btn.addEventListener("click", () => removeSupplier(btn.dataset.id))
    );
  } catch (err) {
    console.error("Failed to load suppliers:", err);
  }
}

// === Add / Update Supplier ===
supplierForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const supplierData = {
    name: supplierNameInput.value,
    category: supplierCategoryInput.value,
    leadTime: Number(supplierLeadTimeInput.value),
    rating: Number(supplierRatingInput.value),
    purchase: supplierPurchaseInput.value, // Pending, Completed, Cancelled
  };

  try {
    if (editingSupplierId) {
      await updateSupplier(editingSupplierId, supplierData);
      editingSupplierId = null;
    } else {
      await addSupplier(supplierData);
    }

    supplierForm.reset();
    await loadSuppliers();
    await loadSupplierBreakdown();
  } catch (err) {
    console.error("Failed to save supplier:", err);
  }
});

// === Edit Supplier ===
async function editSupplier(id) {
  try {
    const supplier = await getSupplierById(id);

    supplierNameInput.value = supplier.name;
    supplierCategoryInput.value = supplier.category;
    supplierLeadTimeInput.value = supplier.leadTime;
    supplierRatingInput.value = supplier.rating;
    supplierPurchaseInput.value = supplier.purchase || "";

    editingSupplierId = id;
  } catch (err) {
    console.error("Failed to load supplier for editing:", err);
  }
}

// === Delete Supplier ===
async function removeSupplier(id) {
  if (!confirm("Are you sure you want to delete this supplier?")) return;

  try {
    await deleteSupplier(id);
    await loadSuppliers();
    await loadSupplierBreakdown();
  } catch (err) {
    console.error("Failed to delete supplier:", err);
  }
}

// === Init ===
document.addEventListener("DOMContentLoaded", async () => {
  await loadSuppliers();
  await loadSupplierBreakdown();
});
