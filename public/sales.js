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

  const filterSelect = document.getElementById("filterSelect");
  const searchInput = document.getElementById("searchInput");
  const monthlyTab = document.getElementById("monthlyTab");
  const yearlyTab = document.getElementById("yearlyTab");

  // ---------- Chart ----------
  const ctx = document
    .getElementById("salesAnalyticsChart")
    ?.getContext("2d");
  const salesChart = ctx
    ? new Chart(ctx, {
        type: "line",
        data: {
          labels: [],
          datasets: [
            {
              label: "Sales",
              data: [],
              borderColor: "#28a745",
              backgroundColor: "rgba(40,167,69,0.2)",
              tension: 0.4,
              fill: true,
              pointRadius: 5,
              pointHoverRadius: 7,
            },
          ],
        },
        options: {
          responsive: true,
          animation: {
            duration: 1200,
            easing: "easeOutQuart",
          },
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } },
        },
      })
    : null;

  // ---------- toast helper ----------
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

  function showToast(message, type = "success", duration = 3000) {
    const t = document.createElement("div");
    t.className = `toast ${type}`;
    t.textContent = message;
    Object.assign(t.style, {
      padding: "10px 14px",
      borderRadius: "6px",
      color: "#fff",
      minWidth: "200px",
      boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
      opacity: 0,
      transform: "translateX(100%)",
      transition: "all .25s ease",
    });
    if (type === "success") t.style.backgroundColor = "#28a745";
    if (type === "error") t.style.backgroundColor = "#dc3545";
    if (type === "info") t.style.backgroundColor = "#17a2b8";
    toastContainer.appendChild(t);
    requestAnimationFrame(() => {
      t.style.opacity = 1;
      t.style.transform = "translateX(0)";
    });
    setTimeout(() => {
      t.style.opacity = 0;
      t.style.transform = "translateX(100%)";
      t.addEventListener("transitionend", () => t.remove());
    }, duration);
  }

  // ---------- normalize ----------
  function normalizeForServer(sale) {
    const payment =
      (sale.paymentType || "").toLowerCase() === "cash" ? "Cash" : "Mobile";
    const status =
      (sale.status || "").toLowerCase() === "completed"
        ? "Completed"
        : "Pending";
    return { ...sale, paymentType: payment, status };
  }

  // ---------- state ----------
  let salesData = [];
  let currentView = "monthly"; // default

  // ---------- event wiring ----------
  addSaleBtn?.addEventListener("click", () => {
    if (modal) modal.style.display = "block";
  });
  closeModal?.addEventListener("click", () => {
    if (modal) modal.style.display = "none";
  });
  window.addEventListener("click", (e) => {
    if (e.target === modal && modal) modal.style.display = "none";
  });

  monthlyTab?.addEventListener("click", () => {
    currentView = "monthly";
    setActiveTab();
    updateDashboard();
  });
  yearlyTab?.addEventListener("click", () => {
    currentView = "yearly";
    setActiveTab();
    updateDashboard();
  });

  filterSelect?.addEventListener("change", updateDashboard);
  searchInput?.addEventListener("input", updateDashboard);

  function setActiveTab() {
    if (currentView === "monthly") {
      monthlyTab?.classList.add("active");
      yearlyTab?.classList.remove("active");
    } else {
      yearlyTab?.classList.add("active");
      monthlyTab?.classList.remove("active");
    }
  }

  // ---------- safe call ----------
  async function safeCall(fn, ...args) {
    try {
      return await fn(...args);
    } catch (err) {
      throw err;
    }
  }

  // ---------- add new sale ----------
  async function addNewSaleFromForm() {
    if (!addSaleForm) return;
    try {
      const productName =
        document.getElementById("productName")?.value?.trim() || "";
      const amountRaw = document.getElementById("amount")?.value || "0";
      const amount = parseFloat(amountRaw) || 0;
      const paymentTypeRaw =
        document.getElementById("paymentType")?.value || "Cash";
      const customerName =
        document.getElementById("customerName")?.value?.trim() || "Unknown";
      const statusRaw = document.getElementById("status")?.value || "Pending";

      const payload = normalizeForServer({
        productName,
        amount,
        paymentType: paymentTypeRaw,
        customerName,
        customer: customerName,
        status: statusRaw,
        date: new Date().toISOString(),
      });

      await safeCall(addSale, payload);
      showToast("✅ Sale added");
      addSaleForm.reset();
      if (modal) modal.style.display = "none";
      await updateDashboard();
    } catch (err) {
      const parsed = parseServerError(err);
      showToast(
        `❌ Add failed: ${parsed.details || parsed.message}`,
        "error"
      );
      console.error("Add sale error:", err);
    }
  }

  addSaleForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    await addNewSaleFromForm();
  });

  // ---------- update sales chart ----------
  async function updateSalesChartUI() {
    try {
      const res = await safeCall(getSalesAnalytics, currentView);
      let labels = [],
        data = [];
      if (currentView === "monthly") {
        labels = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        data = Array.isArray(res.analytics)
          ? res.analytics
          : Object.values(res.analytics || {});
        if (data.length < 12) {
          const tmp = Array(12).fill(0);
          for (let i = 0; i < data.length && i < 12; i++)
            tmp[i] = Number(data[i] || 0);
          data = tmp;
        }
      } else {
        labels = Object.keys(res.analytics || {});
        data = Object.values(res.analytics || {});
      }
      if (salesChart) {
        salesChart.data.labels = labels;
        salesChart.data.datasets[0].data = data;
        salesChart.update();
      }
    } catch (err) {
      console.warn("Chart update failed", err);
    }
  }

  // ---------- dashboard refresh ----------
  async function updateDashboard() {
    try {
      salesData = await safeCall(getSales);
      // KPIs
      await updateKPIs();
      // chart
      await updateSalesChartUI();
      // other UI updates (pending orders, top products/customers, table etc.)
      // ... (keep your existing code here)
    } catch (err) {
      const parsed = parseServerError(err);
      showToast(`❌ Dashboard update failed: ${parsed.message}`, "error");
      console.error("updateDashboard error:", err);
    }
  }

  // ---------- KPIs ----------
  async function updateKPIs() {
    try {
      const summary = await safeCall(getSalesSummary);
      if (totalSalesEl)
        totalSalesEl.textContent = `₦${(
          summary.totalSales || 0
        ).toLocaleString()}`;
      if (cashSalesEl)
        cashSalesEl.textContent = `₦${(
          summary.cashSales || 0
        ).toLocaleString()}`;
      if (mobileSalesEl)
        mobileSalesEl.textContent = `₦${(
          summary.mobileSales || 0
        ).toLocaleString()}`;
      if (completedOrdersEl)
        completedOrdersEl.textContent = summary.completedOrders ?? 0;
    } catch (err) {
      console.warn("KPI update failed", err);
    }
  }

  // ---------- init ----------
  setActiveTab();
  updateDashboard();
});
