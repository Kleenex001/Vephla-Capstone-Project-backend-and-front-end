// sales.js
import {
  getSales,
  addSale,
  updateSale,
  deleteSale as deleteSaleAPI,
  completeSale,
  getSalesSummary,
  getSalesAnalytics,
  getTopCustomersSales,
  getTopProducts,
  getPendingOrders,
} from "./api.js";

// --------- error parser ---------
function parseServerError(err) {
  try {
    if (!err) return { message: "Unknown error" };
    const text = typeof err === "string" ? err : err.message;
    if (!text) return { message: "Unknown error" };
    const trimmed = text.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      const obj = JSON.parse(trimmed);
      return {
        message: obj.error || obj.message || JSON.stringify(obj),
        details: obj.details || obj,
      };
    }
    return { message: text };
  } catch (e) {
    return { message: err.message || String(err) };
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // ---------- DOM elements ----------
  const modal = document.getElementById("addSaleModal");
  const addSaleBtn = document.getElementById("addSaleBtn");
  const closeModal = modal?.querySelector(".close");
  const addSaleForm = document.getElementById("addSaleForm");

  const totalSalesEl = document.getElementById("totalSales");
  const cashSalesEl = document.getElementById("cashSales");
  const mobileSalesEl = document.getElementById("mobileSales");
  const completedOrdersEl = document.getElementById("completedOrders");

  const productTableBody = document.getElementById("productTableBody");
  const pendingOrdersList = document.getElementById("pendingOrdersList");
  const topCustomersList = document.getElementById("topCustomers");
  const topSellingProductsBody = document.getElementById("topSellingProducts");

  const monthlyTab = document.getElementById("monthlyTab");
  const yearlyTab = document.getElementById("yearlyTab");

  // ---------- Chart ----------
  const ctx = document.getElementById("salesAnalyticsChart")?.getContext("2d");
  const salesChart = ctx
    ? new Chart(ctx, {
        type: "line",
        data: { labels: [], datasets: [{ label: "Sales", data: [], borderColor: "#28a745", backgroundColor: "rgba(40,167,69,0.2)", tension: 0.4, fill: true }] },
        options: { responsive: true, plugins: { legend: { display: false } } },
      })
    : null;

  // ---------- toast helper ----------
  const toastContainer = document.createElement("div");
  toastContainer.id = "toastContainer";
  Object.assign(toastContainer.style, {
    position: "fixed", top: "20px", right: "20px", zIndex: 9999, display: "flex", flexDirection: "column", gap: "10px",
  });
  document.body.appendChild(toastContainer);

  function showToast(message, type = "success", duration = 3000) {
    const t = document.createElement("div");
    t.textContent = message;
    t.style.cssText = "padding:10px 14px;border-radius:6px;color:#fff;min-width:200px;box-shadow:0 2px 6px rgba(0,0,0,0.2)";
    if (type === "success") t.style.background = "#28a745";
    if (type === "error") t.style.background = "#dc3545";
    toastContainer.appendChild(t);
    setTimeout(() => t.remove(), duration);
  }

  // ---------- normalize ----------
  function normalizeForServer(sale) {
    const payment = (sale.paymentType || "").toLowerCase() === "cash" ? "Cash" : "Mobile";
    const status = (sale.status || "").toLowerCase() === "completed" ? "Completed" : "Pending";
    return { ...sale, paymentType: payment, status };
  }

  // ---------- state ----------
  let salesData = [];
  let currentView = "monthly";

  // ---------- event wiring ----------
  addSaleBtn?.addEventListener("click", () => modal && (modal.style.display = "block"));
  closeModal?.addEventListener("click", () => modal && (modal.style.display = "none"));
  window.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });

  monthlyTab?.addEventListener("click", () => { currentView = "monthly"; setActiveTab(); updateDashboard(); });
  yearlyTab?.addEventListener("click", () => { currentView = "yearly"; setActiveTab(); updateDashboard(); });

  function setActiveTab() {
    monthlyTab?.classList.toggle("active", currentView === "monthly");
    yearlyTab?.classList.toggle("active", currentView === "yearly");
  }

  async function safeCall(fn, ...args) {
    try { return await fn(...args); } catch (err) { throw err; }
  }

  // ---------- add sale ----------
  async function addNewSaleFromForm() {
    if (!addSaleForm) return;
    try {
      const payload = normalizeForServer({
        productName: document.getElementById("productName")?.value.trim(),
        amount: parseFloat(document.getElementById("amount")?.value || "0"),
        paymentType: document.getElementById("paymentType")?.value || "Cash",
        customerName: document.getElementById("customerName")?.value.trim() || "Unknown",
        status: document.getElementById("status")?.value || "Pending",
        date: new Date().toISOString(),
      });

      await safeCall(addSale, payload);
      showToast("✅ Sale added");
      addSaleForm.reset();
      modal.style.display = "none";
      await updateDashboard();
    } catch (err) {
      const parsed = parseServerError(err);
      showToast(`❌ Add failed: ${parsed.message}`, "error");
    }
  }
  addSaleForm?.addEventListener("submit", (e) => { e.preventDefault(); addNewSaleFromForm(); });

  // ---------- update UI sections ----------
  async function updateSalesChartUI() {
    try {
      const res = await safeCall(getSalesAnalytics, currentView);
      const labels = currentView === "monthly"
        ? ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
        : Object.keys(res.analytics || {});
      const data = Object.values(res.analytics || {});
      if (salesChart) { salesChart.data.labels = labels; salesChart.data.datasets[0].data = data; salesChart.update(); }
    } catch (err) { console.warn("Chart update failed", err); }
  }

  async function updateKPIs() {
    try {
      const summary = await safeCall(getSalesSummary);
      totalSalesEl.textContent = `₦${(summary.totalSales || 0).toLocaleString()}`;
      cashSalesEl.textContent = `₦${(summary.cashSales || 0).toLocaleString()}`;
      mobileSalesEl.textContent = `₦${(summary.mobileSales || 0).toLocaleString()}`;
      completedOrdersEl.textContent = summary.completedOrders ?? 0;
    } catch (err) { console.warn("KPI update failed", err); }
  }

  async function updatePendingOrdersUI() {
    try {
      const orders = await safeCall(getPendingOrders);
      pendingOrdersList.innerHTML = "";
      (orders || []).forEach(o => {
        const li = document.createElement("li");
        li.textContent = `${o.productName} - ₦${o.amount} (${o.customerName})`;
        pendingOrdersList.appendChild(li);
      });
    } catch { console.warn("Pending orders failed"); }
  }

  async function updateTopCustomersUI() {
    try {
      const customers = await safeCall(getTopCustomersSales);
      topCustomersList.innerHTML = "";
      (customers || []).forEach(c => {
        const li = document.createElement("li");
        li.textContent = `${c.customerName} - ₦${c.totalSpent}`;
        topCustomersList.appendChild(li);
      });
    } catch { console.warn("Top customers failed"); }
  }

  async function updateTopProductsUI() {
    try {
      const products = await safeCall(getTopProducts);
      topSellingProductsBody.innerHTML = "";
      (products || []).forEach(p => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${p.productName}</td><td>${p.totalSold}</td>`;
        topSellingProductsBody.appendChild(tr);
      });
    } catch { console.warn("Top products failed"); }
  }

  async function updateSalesTableUI() {
    productTableBody.innerHTML = "";
    (salesData || []).forEach(s => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${s.productName}</td>
        <td>₦${s.amount}</td>
        <td>${s.paymentType}</td>
        <td>${s.customerName}</td>
        <td>${s.status}</td>
        <td>${new Date(s.date).toLocaleDateString()}</td>
        <td>
          <button class="complete-btn" data-id="${s.id}" ${s.status === "Completed" ? "disabled" : ""}>✅ Complete</button>
          <button class="delete-btn" data-id="${s.id}">🗑 Delete</button>
        </td>`;
      productTableBody.appendChild(tr);
    });

    // Wire up complete + delete buttons
    document.querySelectorAll(".complete-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        try {
          await safeCall(completeSale, id);
          showToast("✅ Sale marked as complete");
          await updateDashboard();
        } catch (err) {
          const parsed = parseServerError(err);
          showToast(`❌ Complete failed: ${parsed.message}`, "error");
        }
      });
    });

    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        if (!confirm("⚠️ Are you sure you want to delete this sale?")) return;
        try {
          await safeCall(deleteSaleAPI, id);
          showToast("🗑 Sale deleted");
          await updateDashboard();
        } catch (err) {
          const parsed = parseServerError(err);
          showToast(`❌ Delete failed: ${parsed.message}`, "error");
        }
      });
    });
  }

  // ---------- dashboard refresh ----------
  async function updateDashboard() {
    try {
      salesData = await safeCall(getSales);
      await updateKPIs();
      await updateSalesChartUI();
      await updatePendingOrdersUI();
      await updateTopCustomersUI();
      await updateTopProductsUI();
      await updateSalesTableUI();
    } catch (err) {
      const parsed = parseServerError(err);
      showToast(`❌ Dashboard update failed: ${parsed.message}`, "error");
    }
  }

  // ---------- init ----------
  setActiveTab();
  updateDashboard();
});
