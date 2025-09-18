// sales.js
import {
  getSales,
  addSale,
  updateSale,
  deleteSale as deleteSaleAPI,
  getSalesAnalytics,
  getTopCustomersSales,
  getTopProducts,
} from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  // -------------------- MODAL --------------------
  const modal = document.getElementById("addSaleModal");
  const addSaleBtn = document.getElementById("addSaleBtn");
  const closeModal = modal.querySelector(".close");
  const addSaleForm = document.getElementById("addSaleForm");

  addSaleBtn.addEventListener("click", () => (modal.style.display = "block"));
  closeModal.addEventListener("click", () => (modal.style.display = "none"));
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

  monthlyTab.addEventListener("click", () => {
    currentView = "monthly";
    monthlyTab.classList.add("active");
    yearlyTab.classList.remove("active");
    updateDashboard();
  });

  yearlyTab.addEventListener("click", () => {
    currentView = "yearly";
    yearlyTab.classList.add("active");
    monthlyTab.classList.remove("active");
    updateDashboard();
  });

  // -------------------- HELPERS --------------------
  function normalizeSaleData(sale) {
    return {
      ...sale,
      paymentType: sale.paymentType === "Cash" || sale.paymentType?.toLowerCase() === "cash" ? "Cash" : "Mobile",
      status: sale.status === "Completed" || sale.status?.toLowerCase() === "completed" ? "Completed" : "Pending",
    };
  }

  // -------------------- CRUD --------------------
  let salesData = [];

  async function fetchSales() {
    try {
      salesData = await getSales();
      updateDashboard();
    } catch (err) {
      console.error(err);
      showToast("❌ Failed to load sales", "error");
    }
  }

  if (addSaleForm) {
    addSaleForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const newSale = normalizeSaleData({
        productName: document.getElementById("productName")?.value.trim() || "",
        amount: parseFloat(document.getElementById("amount")?.value || 0),
        paymentType: document.getElementById("paymentType")?.value || "Cash",
        customer: document.getElementById("customerName")?.value.trim() || "Unknown",
        status: document.getElementById("status")?.value || "Pending",
      });

      try {
        const createdSale = await addSale(newSale);
        salesData.push(createdSale);
        showToast("✅ Sale added successfully!");
        addSaleForm.reset();
        if (modal) modal.style.display = "none";
        updateDashboard();
      } catch (err) {
        const errorMessage = err.details ? `❌ Sale validation failed: ${err.details}` : `❌ ${err.message || "Unknown error"}`;
        showToast(errorMessage, "error");
        console.error(err);
      }
    });
  }

  async function deleteSale(id) {
    if (!confirm("Are you sure you want to delete this sale?")) return;
    try {
      await deleteSaleAPI(id);
      salesData = salesData.filter((s) => s._id !== id);
      updateDashboard();
      showToast("🗑️ Sale deleted successfully", "info");
    } catch (err) {
      const errorMessage = err.details ? `❌ Failed to delete sale: ${err.details}` : `❌ ${err.message}`;
      showToast(errorMessage, "error");
      console.error(err);
    }
  }

  async function markAsCompleted(id) {
    const sale = salesData.find((s) => s._id === id);
    if (!sale || sale.status === "Completed") return;

    const updatedSale = normalizeSaleData({ ...sale, status: "Completed" });

    try {
      await updateSale(id, updatedSale);
      sale.status = "Completed";
      updateDashboard();
      showToast("✅ Sale marked as completed!");
    } catch (err) {
      const errorMessage = err.details ? `❌ Sale validation failed: ${err.details}` : `❌ ${err.message}`;
      showToast(errorMessage, "error");
      console.error(err);
    }
  }

  // -------------------- DASHBOARD UPDATES --------------------
  function applyFilter() {
    let filtered = [...salesData];
    const currentFilter = filterSelect?.value || "all";

    if (currentFilter !== "all") {
      if (currentFilter === "pending") filtered = filtered.filter((s) => s.status === "Pending");
      else filtered = filtered.filter((s) => s.paymentType === (currentFilter === "cash" ? "Cash" : "Mobile"));
    }

    const searchTerm = searchInput?.value.trim().toLowerCase() || "";
    if (searchTerm) {
      filtered = filtered.filter((s) => s.productName.toLowerCase().includes(searchTerm) || s.customer.toLowerCase().includes(searchTerm));
    }
    return filtered;
  }

  function updateKPIs(filteredData) {
    const total = filteredData.reduce((sum, s) => sum + s.amount, 0);
    const cash = filteredData.filter((s) => s.paymentType === "Cash").reduce((sum, s) => sum + s.amount, 0);
    const mobile = filteredData.filter((s) => s.paymentType === "Mobile").reduce((sum, s) => sum + s.amount, 0);
    const completed = filteredData.filter((s) => s.status === "Completed").length;

    totalSalesEl.textContent = `₦${total.toLocaleString()}`;
    cashSalesEl.textContent = `₦${cash.toLocaleString()}`;
    mobileSalesEl.textContent = `₦${mobile.toLocaleString()}`;
    completedOrdersEl.textContent = completed;
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
        <td>${sale.customer}</td>
        <td>${sale.status}</td>
        <td>
          <button class="btn delete" data-id="${sale._id}" style="background-color:#dc3545;color:#fff;border:none;padding:4px 8px;border-radius:4px;"><i class="fa fa-trash"></i></button>
        </td>
      `;
      productTableBody.appendChild(row);
    });

    document.querySelectorAll(".btn.delete").forEach((btn) => btn.addEventListener("click", () => deleteSale(btn.dataset.id)));
  }

  function updatePendingOrders() {
    pendingOrdersList.innerHTML = "";
    salesData
      .filter((s) => s.status === "Pending")
      .forEach((sale) => {
        const li = document.createElement("li");
        li.innerHTML = `
          ${sale.productName} - ₦${sale.amount.toLocaleString()} (${sale.customer})
          <button class="btn complete-small" data-id="${sale._id}" style="background-color:#006400;color:#fff;margin-left:10px;border:none;padding:4px 8px;border-radius:4px;"><i class="fa fa-check"></i></button>
        `;
        pendingOrdersList.appendChild(li);
      });

    document.querySelectorAll(".btn.complete-small").forEach((btn) => btn.addEventListener("click", () => markAsCompleted(btn.dataset.id)));
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

  async function updateDashboard() {
    const filtered = applyFilter();
    updateKPIs(filtered);
    updateProductTable(filtered);
    updatePendingOrders();
    await updateTopCustomers();
    await updateTopProducts();
    await updateSalesChart();
  }

  filterSelect.addEventListener("change", updateDashboard);
  searchInput.addEventListener("input", updateDashboard);

  // Initial load
  fetchSales();
});
