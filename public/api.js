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

document.addEventListener("DOMContentLoaded", () => {
  // -------------------- MODAL --------------------
  const modal = document.getElementById("addSaleModal");
  const addSaleBtn = document.getElementById("addSaleBtn");
  const closeModal = modal?.querySelector(".close");
  const addSaleForm = document.getElementById("addSaleForm");

  addSaleBtn?.addEventListener("click", () => (modal.style.display = "block"));
  closeModal?.addEventListener("click", () => (modal.style.display = "none"));
  window.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  // -------------------- TOAST --------------------
  const toastContainer = document.createElement("div");
  toastContainer.id = "toastContainer";
  toastContainer.style.position = "fixed";
  toastContainer.style.top = "20px";
  toastContainer.style.right = "20px";
  toastContainer.style.zIndex = "9999";
  toastContainer.style.display = "flex";
  toastContainer.style.flexDirection = "column";
  toastContainer.style.gap = "10px";
  document.body.appendChild(toastContainer);

  function showToast(message, type = "success", duration = 3000) {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toast.style.padding = "12px 20px";
    toast.style.borderRadius = "6px";
    toast.style.color = "#fff";
    toast.style.minWidth = "200px";
    toast.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    toast.style.transition = "all 0.3s ease";

    switch (type) {
      case "success": toast.style.backgroundColor = "#28a745"; break;
      case "error": toast.style.backgroundColor = "#dc3545"; break;
      case "info": toast.style.backgroundColor = "#17a2b8"; break;
      default: toast.style.backgroundColor = "#333"; break;
    }

    toastContainer.appendChild(toast);
    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateX(0)";
    });
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(100%)";
      toast.addEventListener("transitionend", () => toast.remove());
    }, duration);
  }

  // -------------------- KPI ELEMENTS --------------------
  const totalSalesEl = document.getElementById("totalSales");
  const cashSalesEl = document.getElementById("cashSales");
  const mobileSalesEl = document.getElementById("mobileSales");
  const completedOrdersEl = document.getElementById("completedOrders");

  // -------------------- TABLE & SIDEBAR ELEMENTS --------------------
  const productTableBody = document.getElementById("productTableBody");
  const pendingOrdersList = document.getElementById("pendingOrdersList");
  const topCustomersList = document.getElementById("topCustomers");
  const topSellingProductsBody = document.getElementById("topSellingProducts");

  const filterSelect = document.getElementById("filterSelect");
  const searchInput = document.getElementById("searchInput");

  // -------------------- SALES CHART --------------------
  const ctx = document.getElementById("salesAnalyticsChart").getContext("2d");
  let salesChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [{
        label: "Sales",
        data: [],
        borderColor: "#007bff",
        backgroundColor: "rgba(0,123,255,0.2)",
        tension: 0.4,
        fill: true
      }]
    },
    options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
  });

  let currentView = "monthly";
  const monthlyTab = document.getElementById("monthlyTab");
  const yearlyTab = document.getElementById("yearlyTab");

  monthlyTab?.addEventListener("click", () => {
    currentView = "monthly";
    monthlyTab.classList.add("active");
    yearlyTab.classList.remove("active");
    updateDashboard();
  });

  yearlyTab?.addEventListener("click", () => {
    currentView = "yearly";
    yearlyTab.classList.add("active");
    monthlyTab.classList.remove("active");
    updateDashboard();
  });

  // -------------------- HELPERS --------------------
  function normalizeSaleData(sale) {
    return {
      ...sale,
      paymentType: sale.paymentType?.toLowerCase() === "cash" ? "Cash" : "Mobile",
      status: sale.status?.toLowerCase() === "completed" ? "Completed" : "Pending",
    };
  }

  let salesData = [];

  // -------------------- CRUD --------------------
  if (addSaleForm) {
    addSaleForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const newSale = normalizeSaleData({
        productName: document.getElementById("productName")?.value.trim() || "",
        amount: parseFloat(document.getElementById("amount")?.value || 0),
        paymentType: document.getElementById("paymentType")?.value || "Cash",
        customerName: document.getElementById("customerName")?.value.trim() || "Unknown",
        status: document.getElementById("status")?.value || "Pending",
      });

      try {
        await addSale(newSale);
        showToast("✅ Sale added successfully!");
        addSaleForm.reset();
        if (modal) modal.style.display = "none";
        updateDashboard();
      } catch (err) {
        showToast(`❌ Failed to add sale: ${err.message}`, "error");
        console.error(err);
      }
    });
  }

  async function deleteSale(id) {
    if (!confirm("Are you sure you want to delete this sale?")) return;
    try {
      await deleteSaleAPI(id);
      showToast("🗑️ Sale deleted successfully", "info");
      updateDashboard();
    } catch (err) {
      showToast(`❌ Failed to delete sale: ${err.message}`, "error");
      console.error(err);
    }
  }

  async function markAsCompleted(id) {
    try {
      await completeSale(id);
      showToast("✅ Sale marked as completed!");
      updateDashboard();
    } catch (err) {
      showToast(`❌ Failed to complete sale: ${err.message}`, "error");
      console.error(err);
    }
  }

  // -------------------- DASHBOARD --------------------
  function applyFilter() {
    let filtered = [...salesData];
    const currentFilter = filterSelect?.value || "all";

    if (currentFilter !== "all") {
      if (currentFilter === "pending") filtered = filtered.filter((s) => s.status === "Pending");
      else filtered = filtered.filter((s) => s.paymentType === (currentFilter === "cash" ? "Cash" : "Mobile"));
    }

    const searchTerm = searchInput?.value.trim().toLowerCase() || "";
    if (searchTerm) {
      filtered = filtered.filter((s) =>
        s.productName.toLowerCase().includes(searchTerm) ||
        (s.customerName?.toLowerCase() || "").includes(searchTerm)
      );
    }
    return filtered;
  }

  function updateProductTable(filteredData) {
    productTableBody.innerHTML = "";
    filteredData.forEach((sale, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${sale.productName}</td>
        <td>₦${sale.amount.toLocaleString()}</td>
        <td>${sale.paymentType}</td>
        <td>${sale.customerName}</td>
        <td>${sale.status}</td>
        <td>
          <button class="btn delete" data-id="${sale._id}" style="background-color:#dc3545;color:#fff;border:none;padding:4px 8px;border-radius:4px;">
            <i class="fa fa-trash"></i>
          </button>
        </td>
      `;
      productTableBody.appendChild(row);
    });

    document.querySelectorAll(".btn.delete").forEach((btn) =>
      btn.addEventListener("click", () => deleteSale(btn.dataset.id))
    );
  }

  async function updatePendingOrders() {
    try {
      const data = await getPendingOrders();
      pendingOrdersList.innerHTML = "";
      data.pending.forEach((sale) => {
        const li = document.createElement("li");
        li.innerHTML = `
          ${sale.productName} - ₦${sale.amount.toLocaleString()} (${sale.customerName})
          <button class="btn complete-small" data-id="${sale._id}" style="background-color:#006400;color:#fff;margin-left:10px;border:none;padding:4px 8px;border-radius:4px;">
            <i class="fa fa-check"></i>
          </button>
        `;
        pendingOrdersList.appendChild(li);
      });
      document.querySelectorAll(".btn.complete-small").forEach((btn) =>
        btn.addEventListener("click", () => markAsCompleted(btn.dataset.id))
      );
    } catch (err) {
      console.error(err);
    }
  }

  async function updateTopCustomers() {
    try {
      const data = await getTopCustomersSales();
      topCustomersList.innerHTML = "";
      data.topCustomers.forEach(([name, total]) => {
        const li = document.createElement("li");
        li.textContent = `${name || "Unknown"} - ₦${total.toLocaleString()}`;
        topCustomersList.appendChild(li);
      });
    } catch (err) { console.error(err); }
  }

  async function updateTopProducts() {
    try {
      const data = await getTopProducts();
      topSellingProductsBody.innerHTML = "";
      data.topProducts.forEach(([name, total], index) => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${index + 1}</td><td>${name}</td><td>₦${total.toLocaleString()}</td>`;
        topSellingProductsBody.appendChild(row);
      });
    } catch (err) { console.error(err); }
  }

  async function updateSalesChart() {
    try {
      const data = await getSalesAnalytics(currentView);
      let labels = [], chartData = [];
      if (currentView === "monthly") {
        labels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        chartData = data.analytics;
      } else {
        labels = Object.keys(data.analytics);
        chartData = Object.values(data.analytics);
      }
      salesChart.data.labels = labels;
      salesChart.data.datasets[0].data = chartData;
      salesChart.update();
    } catch (err) { console.error(err); }
  }

  async function updateKPIs() {
    try {
      const summary = await getSalesSummary();
      totalSalesEl.textContent = `₦${summary.totalSales.toLocaleString()}`;
      cashSalesEl.textContent = `₦${summary.cashSales.toLocaleString()}`;
      mobileSalesEl.textContent = `₦${summary.mobileSales.toLocaleString()}`;
      completedOrdersEl.textContent = summary.completedOrders;
    } catch (err) { console.error(err); }
  }

  async function updateDashboard() {
    try {
      salesData = await getSales(); // always refresh
      const filtered = applyFilter();

      await updateKPIs();
      updateProductTable(filtered);
      await updatePendingOrders();
      await updateTopCustomers();
      await updateTopProducts();
      await updateSalesChart();
    } catch (err) {
      console.error(err);
      showToast("❌ Failed to refresh dashboard", "error");
    }
  }

  filterSelect?.addEventListener("change", updateDashboard);
  searchInput?.addEventListener("input", updateDashboard);

  // Initial load
  updateDashboard();
});
