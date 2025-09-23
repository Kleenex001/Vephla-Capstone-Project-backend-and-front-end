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

// --------------------- DOM Elements ---------------------
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

// --------------------- STATE ---------------------
let suppliers = [];

// --------------------- TOAST ---------------------
const toastContainer = document.createElement("div");
toastContainer.id = "toastContainer";
Object.assign(toastContainer.style, {
  position: "fixed",
  top: "20px",
  right: "20px",
  zIndex: 9999,
  display: "flex",
  flexDirection: "column",
  gap: "10px",
});
document.body.appendChild(toastContainer);

function showToast(message, type = "info", duration = 3000) {
  const t = document.createElement("div");
  t.textContent = message;
  Object.assign(t.style, {
    padding: "8px 12px",
    borderRadius: "6px",
    color: "#fff",
    background:
      type === "success" ? "#28a745" :
      type === "error" ? "#dc3545" :
      type === "info" ? "#17a2b8" :
      "#ffc107",
    opacity: "0",
    transform: "translateX(12px)",
    transition: "all .3s ease",
  });
  toastContainer.appendChild(t);
  requestAnimationFrame(() => {
    t.style.opacity = "1";
    t.style.transform = "translateX(0)";
  });
  setTimeout(() => {
    t.style.opacity = "0";
    t.style.transform = "translateX(12px)";
    t.addEventListener("transitionend", () => t.remove(), { once: true });
  }, duration);
}

// --------------------- MODAL HANDLING ---------------------
addPurchaseBtn.addEventListener("click", () => purchaseModal.style.display = "flex");
closeModal.addEventListener("click", () => purchaseModal.style.display = "none");
window.addEventListener("click", e => {
  if (e.target === purchaseModal) purchaseModal.style.display = "none";
});

// --------------------- LOAD DATA ---------------------
async function loadSuppliers() {
  try {
    const data = await getSuppliers();
    suppliers = Array.isArray(data) ? data : (data.data || []);
    renderSuppliers();
    updateKPIs();
    loadRecentPurchases();
    loadTopSuppliers();
  } catch (err) {
    console.error("Failed to load suppliers:", err);
    showToast("Failed to load suppliers", "error");
  }
}

// --------------------- RENDER TABLE ---------------------
function renderSuppliers() {
  if (!supplierBody) return;
  supplierBody.innerHTML = "";

  let filtered = [...suppliers];
  const searchTerm = searchInput?.value.toLowerCase() || "";
  const categoryFilter = filterCategory?.value || "All";

  if (categoryFilter !== "All") filtered = filtered.filter(s => s.category === categoryFilter);
  if (searchTerm) filtered = filtered.filter(s => s.name.toLowerCase().includes(searchTerm));

  filtered.forEach((s, i) => {
    const tr = document.createElement("tr");
    tr.dataset.id = s._id;
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
            ? `<button class="btn confirm">Confirm</button>
               <button class="btn cancel">Cancel</button>`
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
    let recent = await getRecentPurchases();
    recent = Array.isArray(recent) ? recent : (recent.data || []);

    recentPurchases.innerHTML = "";
    if (recent.length === 0) {
      recentPurchases.innerHTML = "<li>No recent purchases</li>";
      return;
    }

    recent.forEach(s => {
      const li = document.createElement("li");
      li.textContent = `${s.name} - ${s.purchase}`;
      recentPurchases.appendChild(li);
    });
  } catch (err) {
    console.error("Failed to load recent purchases:", err);
    recentPurchases.innerHTML = "<li>Error loading recent purchases</li>";
  }
}

// --------------------- TOP SUPPLIERS ---------------------
async function loadTopSuppliers() {
  try {
    let top = await getTopSuppliers();
    top = Array.isArray(top) ? top : (top.data || []);

    topSuppliers.innerHTML = "";
    if (top.length === 0) {
      topSuppliers.innerHTML = "<li>No top suppliers</li>";
      return;
    }

    top.forEach(s => {
      const li = document.createElement("li");
      li.textContent = s.name;
      topSuppliers.appendChild(li);
    });
  } catch (err) {
    console.error("Failed to load top suppliers:", err);
    topSuppliers.innerHTML = "<li>Error loading top suppliers</li>";
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
    showToast("Supplier added successfully", "success");
  } catch (err) {
    console.error("Failed to add supplier:", err);
    showToast("Failed to add supplier", "error");
  }
});

// --------------------- EVENT DELEGATION: CONFIRM & CANCEL ---------------------
supplierBody?.addEventListener("click", async (e) => {
  const row = e.target.closest("tr");
  if (!row) return;
  const supplierId = row.dataset.id;

  if (e.target.classList.contains("confirm")) {
    try {
      await confirmPurchase(supplierId);
      await loadSuppliers();
      showToast("Purchase confirmed", "success");
    } catch (err) {
      console.error("Failed to confirm purchase:", err);
      showToast("Failed to confirm purchase", "error");
    }
  }

  if (e.target.classList.contains("cancel")) {
    try {
      await cancelPurchase(supplierId);
      await loadSuppliers();
      showToast("Purchase cancelled", "info");
    } catch (err) {
      console.error("Failed to cancel purchase:", err);
      showToast("Failed to cancel purchase", "error");
    }
  }
});

// --------------------- EXPORT ---------------------
exportBtn?.addEventListener("click", () => {
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
searchInput?.addEventListener("input", renderSuppliers);
filterCategory?.addEventListener("change", renderSuppliers);

// --------------------- INITIALIZE ---------------------
document.addEventListener("DOMContentLoaded", loadSuppliers);
