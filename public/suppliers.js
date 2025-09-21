import {
  getSuppliers,
  addSupplier,
  updateSupplier,
  deleteSupplier,
  confirmPurchase,
  cancelPurchase,
  getRecentPurchases,
  getTopSuppliers
} from "./api.js";

// DOM Elements
const supplierBody = document.getElementById("supplierBody");
const topSuppliers = document.getElementById("topSuppliers");
const recentPurchases = document.getElementById("recentPurchases");

const totalPurchasesEl = document.getElementById("totalPurchases");
const pendingDeliveryEl = document.getElementById("pendingDelivery");
const purchasedEl = document.getElementById("purchased");
const cancelledEl = document.getElementById("cancelled");

const purchaseModal = document.getElementById("purchaseModal");
const purchaseForm = document.getElementById("purchaseForm");
const addPurchaseBtn = document.getElementById("addPurchaseBtn");
const closeModal = document.getElementById("closeModal");

const searchInput = document.getElementById("searchInput");
const filterCategory = document.getElementById("filterCategory");

const exportBtn = document.getElementById("exportBtn");

// --------------------- MODAL ---------------------
addPurchaseBtn.addEventListener("click", () => purchaseModal.style.display = "flex");
closeModal.addEventListener("click", () => purchaseModal.style.display = "none");

// --------------------- LOAD DATA ---------------------
let suppliers = [];

async function loadSuppliers() {
  try {
    suppliers = await getSuppliers();
    renderSuppliers();
    updateKPIs();
    loadRecentPurchases();
    loadTopSuppliers();
  } catch (err) {
    console.error("Failed to load suppliers:", err);
  }
}

// --------------------- RENDER TABLE ---------------------
function renderSuppliers() {
  supplierBody.innerHTML = "";
  let filtered = [...suppliers];

  const searchTerm = searchInput.value.toLowerCase();
  const categoryFilter = filterCategory.value;

  if (categoryFilter !== "All") {
    filtered = filtered.filter(s => s.category === categoryFilter);
  }

  if (searchTerm) {
    filtered = filtered.filter(s => s.name.toLowerCase().includes(searchTerm));
  }

  filtered.forEach((s, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${s.name}</td>
      <td>${s.category}</td>
      <td>${s.leadTime}</td>
      <td>${s.email || "-"}</td>
      <td>${s.phone || "-"}</td>
      <td>${s.address || "-"}</td>
      <td><span class="status ${s.purchase.toLowerCase()}">${s.purchase}</span></td>
      <td>
        ${
          s.purchase === "Pending"
            ? `<button class="btn confirm" onclick="confirmSupplierPurchase('${s._id}')">Confirm</button>
               <button class="btn cancel" onclick="cancelSupplierPurchase('${s._id}')">Cancel</button>`
            : "-"
        }
      </td>
    `;
    supplierBody.appendChild(tr);
  });
}

// --------------------- KPIs ---------------------
function updateKPIs() {
  const total = suppliers.length;
  const pending = suppliers.filter(s => s.purchase === "Pending").length;
  const completed = suppliers.filter(s => s.purchase === "Completed").length;
  const cancelled = suppliers.filter(s => s.purchase === "Cancelled").length;

  totalPurchasesEl.textContent = total;
  pendingDeliveryEl.textContent = pending;
  purchasedEl.textContent = completed;
  cancelledEl.textContent = cancelled;
}

// --------------------- RECENT PURCHASES ---------------------
async function loadRecentPurchases() {
  try {
    const recent = await getRecentPurchases();
    recentPurchases.innerHTML = "";
    recent.forEach(s => {
      const li = document.createElement("li");
      li.textContent = `${s.name} - ${s.purchase}`;
      recentPurchases.appendChild(li);
    });
  } catch (err) {
    console.error("Failed to load recent purchases:", err);
  }
}

// --------------------- TOP SUPPLIERS ---------------------
async function loadTopSuppliers() {
  try {
    const top = await getTopSuppliers();
    topSuppliers.innerHTML = "";
    top.forEach(s => {
      const li = document.createElement("li");
      li.textContent = s.name;
      topSuppliers.appendChild(li);
    });
  } catch (err) {
    console.error("Failed to load top suppliers:", err);
  }
}

// --------------------- FORM SUBMIT ---------------------
purchaseForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const supplier = {
    name: document.getElementById("supplierName").value.trim(),
    category: document.getElementById("supplierCategory").value,
    leadTime: parseInt(document.getElementById("leadTime").value),
    email: document.getElementById("supplierEmail").value.trim(),
    phone: document.getElementById("supplierPhone").value.trim(),
    address: document.getElementById("supplierAddress").value.trim(),
  };

  try {
    await addSupplier(supplier);
    await loadSuppliers();
    purchaseForm.reset();
    purchaseModal.style.display = "none";
  } catch (err) {
    console.error("Failed to add supplier:", err);
  }
});

// --------------------- CONFIRM & CANCEL PURCHASE ---------------------
window.confirmSupplierPurchase = async (id) => {
  try {
    await confirmPurchase(id);
    await loadSuppliers();
  } catch (err) {
    console.error("Failed to confirm purchase:", err);
  }
};

window.cancelSupplierPurchase = async (id) => {
  try {
    await cancelPurchase(id);
    await loadSuppliers();
  } catch (err) {
    console.error("Failed to cancel purchase:", err);
  }
};

// --------------------- EXPORT ---------------------
exportBtn.addEventListener("click", () => {
  let csv = "S/N,Supplier,Category,Lead Time,Email,Phone,Address,Status\n";
  suppliers.forEach((s, i) => {
    csv += `${i+1},${s.name},${s.category},${s.leadTime},${s.email || "-"},${s.phone || "-"},${s.address || "-"},${s.purchase}\n`;
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "suppliers.csv";
  link.click();
});

// --------------------- SEARCH & FILTER ---------------------
searchInput.addEventListener("input", renderSuppliers);
filterCategory.addEventListener("change", renderSuppliers);

// --------------------- INITIALIZE ---------------------
document.addEventListener("DOMContentLoaded", loadSuppliers);
