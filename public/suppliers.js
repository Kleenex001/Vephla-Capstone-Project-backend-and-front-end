import {
  getSuppliers,
  addSupplier,
  updateSupplier,
  deleteSupplier,
  getTopRatedSuppliers,
} from "./api.js";

// DOM Elements
const supplierBody = document.getElementById("supplierBody");
const topSuppliers = document.getElementById("topSuppliers");
const recentPurchases = document.getElementById("recentPurchases");

// KPIs
const totalPurchasesEl = document.getElementById("totalPurchases");
const pendingDeliveryEl = document.getElementById("pendingDelivery");
const purchasedEl = document.getElementById("purchased");
const cancelledEl = document.getElementById("cancelled");

// Modal Elements
const purchaseModal = document.getElementById("purchaseModal");
const purchaseForm = document.getElementById("purchaseForm");
const addPurchaseBtn = document.getElementById("addPurchaseBtn");
const closeModal = document.getElementById("closeModal");

// Search & Filter
const searchInput = document.getElementById("searchInput");
const filterCategory = document.getElementById("filterCategory");

// Export
const exportBtn = document.getElementById("exportBtn");

// Local State
let suppliers = [];
let recent = [];

// ================= MODAL =================
addPurchaseBtn.addEventListener("click", () => (purchaseModal.style.display = "flex"));
closeModal.addEventListener("click", () => (purchaseModal.style.display = "none"));

// ================= FETCH & RENDER =================
async function loadSuppliers() {
  try {
    suppliers = await getSuppliers();
    renderSuppliers();
    updateKPIs();
    loadTopSuppliers();
    loadRecentPurchases();
  } catch (err) {
    console.error("Error loading suppliers:", err);
  }
}

function renderSuppliers() {
  supplierBody.innerHTML = "";
  let filtered = [...suppliers];

  const searchTerm = searchInput.value.toLowerCase();
  const categoryTerm = filterCategory.value;

  if (categoryTerm !== "All") {
    filtered = filtered.filter(s => s.category === categoryTerm);
  }
  if (searchTerm) {
    filtered = filtered.filter(s => s.supplierName.toLowerCase().includes(searchTerm));
  }

  filtered.forEach((s, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${s.supplierName}</td>
      <td>${s.category}</td>
      <td>${s.leadTime}</td>
      <td>
        <select onchange="updateRating(${s._id}, this.value)">
          ${[1,2,3,4,5].map(n => `<option value="${n}" ${s.rating === n ? "selected" : ""}>${"⭐".repeat(n)}</option>`).join("")}
        </select>
      </td>
      <td><span class="status ${s.status.toLowerCase()}">${s.status}</span></td>
      <td>
        ${
          s.status === "Active"
            ? `<button class="btn confirm" onclick="confirmPurchase('${s._id}')">Confirm</button>
               <button class="btn cancel" onclick="cancelPurchase('${s._id}')">Cancel</button>
               <button class="btn danger" onclick="deleteSupplierById('${s._id}')">Delete</button>`
            : `<button class="btn danger" onclick="deleteSupplierById('${s._id}')">Delete</button>`
        }
      </td>
    `;
    supplierBody.appendChild(tr);
  });
}

// ================= KPI & Top/Recent =================
function updateKPIs() {
  totalPurchasesEl.textContent = suppliers.length;
  pendingDeliveryEl.textContent = suppliers.filter(s => s.status === "Active").length;
  purchasedEl.textContent = suppliers.filter(s => s.status === "Purchased").length;
  cancelledEl.textContent = suppliers.filter(s => s.status === "Cancelled").length;
}

async function loadTopSuppliers() {
  try {
    const top = await getTopRatedSuppliers();
    topSuppliers.innerHTML = "";
    top.forEach(s => {
      const li = document.createElement("li");
      li.textContent = `${s.supplierName} (${ "⭐".repeat(s.rating) })`;
      topSuppliers.appendChild(li);
    });
  } catch (err) {
    console.error("Error fetching top suppliers:", err);
  }
}

function loadRecentPurchases() {
  recentPurchases.innerHTML = "";
  recent.slice(0, 5).forEach(p => {
    const li = document.createElement("li");
    li.textContent = `${p.supplierName || p.name} - ${p.status}`;
    recentPurchases.appendChild(li);
  });
}

// ================= ADD / UPDATE / DELETE =================
purchaseForm.addEventListener("submit", async e => {
  e.preventDefault();
  const supplier = {
    supplierName: document.getElementById("supplierName").value,
    category: document.getElementById("supplierCategory").value,
    leadTime: parseInt(document.getElementById("leadTime").value),
    rating: parseInt(document.getElementById("rating").value),
    status: "Active",
  };
  try {
    const newSupplier = await addSupplier(supplier);
    suppliers.unshift(newSupplier);
    recent.unshift({ ...newSupplier });
    renderSuppliers();
    updateKPIs();
    loadTopSuppliers();
    loadRecentPurchases();
    purchaseForm.reset();
    purchaseModal.style.display = "none";
  } catch (err) {
    console.error("Error adding supplier:", err);
  }
});

window.updateRating = async (id, value) => {
  try {
    const updated = await updateSupplier(id, { rating: parseInt(value) });
    const index = suppliers.findIndex(s => s._id === id);
    if (index > -1) suppliers[index] = updated;
    loadTopSuppliers();
    renderSuppliers();
  } catch (err) {
    console.error("Error updating rating:", err);
  }
};

window.confirmPurchase = async id => {
  try {
    const updated = await updateSupplier(id, { status: "Purchased" });
    const index = suppliers.findIndex(s => s._id === id);
    if (index > -1) suppliers[index] = updated;
    recent.unshift({ ...updated });
    renderSuppliers();
    updateKPIs();
    loadRecentPurchases();
  } catch (err) {
    console.error("Error confirming purchase:", err);
  }
};

window.cancelPurchase = async id => {
  try {
    const updated = await updateSupplier(id, { status: "Cancelled" });
    const index = suppliers.findIndex(s => s._id === id);
    if (index > -1) suppliers[index] = updated;
    recent.unshift({ ...updated });
    renderSuppliers();
    updateKPIs();
    loadRecentPurchases();
  } catch (err) {
    console.error("Error cancelling purchase:", err);
  }
};

window.deleteSupplierById = async id => {
  if (!confirm("Are you sure you want to delete this supplier?")) return;
  try {
    await deleteSupplier(id);
    suppliers = suppliers.filter(s => s._id !== id);
    renderSuppliers();
    updateKPIs();
    loadTopSuppliers();
  } catch (err) {
    console.error("Error deleting supplier:", err);
  }
};

// ================= SEARCH / FILTER =================
searchInput.addEventListener("input", renderSuppliers);
filterCategory.addEventListener("change", renderSuppliers);

// ================= EXPORT =================
exportBtn.addEventListener("click", () => {
  let csv = "S/N,Supplier,Category,Lead Time,Rating,Status\n";
  suppliers.forEach((s, i) => {
    csv += `${i+1},${s.supplierName},${s.category},${s.leadTime},${s.rating},${s.status}\n`;
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "suppliers.csv";
  link.click();
});

// ================= INIT =================
document.addEventListener("DOMContentLoaded", loadSuppliers);
