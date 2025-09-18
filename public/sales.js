// sales.js
import {
  getSales,
  addSale,
  updateSale,
  deleteSale,
  getSalesSummary,
  getSalesAnalytics,
  getTopCustomersSales,
  getTopProducts
} from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  // Modal Elements
  const modal = document.getElementById("addSaleModal");
  const addSaleBtn = document.getElementById("addSaleBtn");
  const closeModal = modal.querySelector(".close");
  const addSaleForm = document.getElementById("addSaleForm");

  // KPI Elements
  const totalSalesEl = document.getElementById("totalSales");
  const cashSalesEl = document.getElementById("cashSales");
  const mobileSalesEl = document.getElementById("mobileSales");
  const pendingOrdersEl = document.getElementById("pendingOrders");

  // Table & Dashboard
  const productTableBody = document.getElementById("productTableBody");
  const pendingOrdersList = document.getElementById("pendingOrdersList");
  const topCustomersList = document.getElementById("topCustomers");
  const topSellingProductsBody = document.getElementById("topSellingProducts");

  // Filter/Search
  const filterSelect = document.getElementById("filterSelect");
  const searchInput = document.getElementById("searchInput");

  // Chart.js
  const ctx = document.getElementById("salesAnalyticsChart").getContext("2d");
  let salesChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [{
        label: "Sales",
        data: [],
        borderColor: "#007bff",
        backgroundColor: "rgba(0, 123, 255, 0.2)",
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
      scales: { y: { beginAtZero: true } }
    }
  });

  let currentView = "monthly"; // Chart toggle
  const monthlyTab = document.getElementById("monthlyTab");
  const yearlyTab = document.getElementById("yearlyTab");

  monthlyTab.addEventListener("click", () => { currentView = "monthly"; monthlyTab.classList.add("active"); yearlyTab.classList.remove("active"); updateChart(); });
  yearlyTab.addEventListener("click", () => { currentView = "yearly"; yearlyTab.classList.add("active"); monthlyTab.classList.remove("active"); updateChart(); });

  // Toast
  function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // Modal
  addSaleBtn.addEventListener("click", () => modal.style.display = "block");
  closeModal.addEventListener("click", () => modal.style.display = "none");
  window.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });

  // Global sales data cache
  let salesData = [];

  // Fetch all sales from API
  async function fetchSales() {
    try {
      salesData = await getSales();
    } catch (err) {
      showToast(`❌ Failed to fetch sales: ${err.message}`, "error");
    }
  }

  // Add Sale
  addSaleForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newSale = {
      productName: document.getElementById("productName").value.trim(),
      amount: parseFloat(document.getElementById("amount").value),
      paymentType: document.getElementById("paymentType").value,
      customerName: document.getElementById("customerName").value.trim(),
      status: document.getElementById("status").value
    };

    if (!newSale.productName || !newSale.customerName || isNaN(newSale.amount) || newSale.amount <= 0) {
      showToast("❌ Enter valid sale data", "error");
      return;
    }

    try {
      await addSale(newSale);
      addSaleForm.reset();
      modal.style.display = "none";
      showToast("✅ Sale added successfully!");
      await loadDashboard();
    } catch (err) {
      showToast(`❌ Failed to add sale: ${err.message}`, "error");
    }
  });

  // Delete Sale
  async function handleDelete(id) {
    try {
      await deleteSale(id);
      showToast("🗑️ Sale deleted successfully", "info");
      await loadDashboard();
    } catch (err) {
      showToast(`❌ Failed to delete: ${err.message}`, "error");
    }
  }

  // Mark Completed
  async function handleComplete(id) {
    try {
      await updateSale(id, { status: "completed" });
      showToast("✅ Sale marked as completed!");
      await loadDashboard();
    } catch (err) {
      showToast(`❌ Failed to update sale: ${err.message}`, "error");
    }
  }

  // Render Table
  function renderTable(filtered) {
    productTableBody.innerHTML = "";
    filtered.forEach((s, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${i + 1}</td>
        <td>${s.productName}</td>
        <td>₦${s.amount.toLocaleString()}</td>
        <td>${s.paymentType}</td>
        <td>${s.customerName}</td>
        <td>${s.status}</td>
        <td>
          ${s.status === "pending" ? `<button class="btn complete" data-id="${s._id}"><i class="fa fa-check"></i> Complete</button>` : ""}
          <button class="btn delete" data-id="${s._id}"><i class="fa fa-trash"></i> Delete</button>
        </td>
      `;
      productTableBody.appendChild(tr);
    });

    // Delegation
    productTableBody.querySelectorAll(".btn.delete").forEach(btn => btn.addEventListener("click", () => handleDelete(btn.dataset.id)));
    productTableBody.querySelectorAll(".btn.complete").forEach(btn => btn.addEventListener("click", () => handleComplete(btn.dataset.id)));
  }

  // Pending Orders
  function renderPending(filtered) {
    pendingOrdersList.innerHTML = "";
    filtered.filter(s => s.status === "pending").forEach(s => {
      const li = document.createElement("li");
      li.textContent = `${s.productName} `;
      const span = document.createElement("span");
      span.textContent = `₦${s.amount.toLocaleString()}`;
      li.appendChild(span);
      pendingOrdersList.appendChild(li);
    });
  }

  // Filter/Search
  function applyFilter() {
    let filtered = [...salesData];
    const filter = filterSelect.value;
    if (filter !== "all") {
      if (filter === "pending") filtered = filtered.filter(s => s.status === "pending");
      else filtered = filtered.filter(s => s.paymentType === filter);
    }
    const search = searchInput.value.trim().toLowerCase();
    if (search) {
      filtered = filtered.filter(s => s.productName.toLowerCase().includes(search) || s.customerName.toLowerCase().includes(search));
    }
    return filtered;
  }

  filterSelect.addEventListener("change", loadDashboard);
  searchInput.addEventListener("input", loadDashboard);

  // Render KPIs
  async function renderKPIs() {
    try {
      const summary = await getSalesSummary();
      totalSalesEl.textContent = `₦${summary.totalSales.toLocaleString()}`;
      cashSalesEl.textContent = `₦${summary.cashSales.toLocaleString()}`;
      mobileSalesEl.textContent = `₦${summary.mobileSales.toLocaleString()}`;
      pendingOrdersEl.textContent = summary.pendingOrders;
    } catch (err) {
      showToast(`❌ Failed to load KPIs: ${err.message}`, "error");
    }
  }

  // Top Customers
  async function renderTopCustomers() {
    try {
      const { topCustomers } = await getTopCustomersSales();
      topCustomersList.innerHTML = "";
      topCustomers.forEach(([name, total]) => {
        const li = document.createElement("li");
        li.textContent = `${name} `;
        const span = document.createElement("span");
        span.textContent = `₦${total.toLocaleString()}`;
        li.appendChild(span);
        topCustomersList.appendChild(li);
      });
    } catch (err) {
      showToast(`❌ Failed to load top customers: ${err.message}`, "error");
    }
  }

  // Top Products
  async function renderTopProducts() {
    try {
      const { topProducts } = await getTopProducts();
      topSellingProductsBody.innerHTML = "";
      topProducts.forEach(([name, total], i) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${i + 1}</td><td>${name}</td><td>₦${total.toLocaleString()}</td>`;
        topSellingProductsBody.appendChild(tr);
      });
    } catch (err) {
      showToast(`❌ Failed to load top products: ${err.message}`, "error");
    }
  }

  // Update Chart
  async function updateChart() {
    try {
      const { analytics } = await getSalesAnalytics(currentView);
      if (currentView === "monthly") {
        salesChart.data.labels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        salesChart.data.datasets[0].data = analytics;
      } else {
        const years = Object.keys(analytics).sort();
        salesChart.data.labels = years;
        salesChart.data.datasets[0].data = years.map(y => analytics[y]);
      }
      salesChart.update();
    } catch (err) {
      showToast(`❌ Failed to load chart: ${err.message}`, "error");
    }
  }

  // Main dashboard loader
  async function loadDashboard() {
    await fetchSales();
    const filtered = applyFilter();
    renderTable(filtered);
    renderPending(filtered);
    await renderKPIs();
    await renderTopCustomers();
    await renderTopProducts();
    await updateChart();
  }

  // Initial load
  loadDashboard();
});
