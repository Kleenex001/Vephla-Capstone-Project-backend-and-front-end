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
  // -------------------- Elements --------------------
  const modal = document.getElementById("addSaleModal");
  const addSaleBtn = document.getElementById("addSaleBtn");
  const closeModal = modal.querySelector(".close");
  const addSaleForm = document.getElementById("addSaleForm");

  const totalSalesEl = document.getElementById("totalSales");
  const cashSalesEl = document.getElementById("cashSales");
  const mobileSalesEl = document.getElementById("mobileSales");
  const pendingOrdersEl = document.getElementById("pendingOrders");

  const productTableBody = document.getElementById("productTableBody");
  const pendingOrdersList = document.getElementById("pendingOrdersList");
  const topCustomersList = document.getElementById("topCustomers");
  const topSellingProductsBody = document.getElementById("topSellingProducts");

  const filterSelect = document.getElementById("filterSelect");
  const searchInput = document.getElementById("searchInput");

  const ctx = document.getElementById("salesAnalyticsChart").getContext("2d");
  let salesChart = new Chart(ctx, {
    type: "line",
    data: { labels: [], datasets: [{ label: "Sales", data: [], borderColor: "#007bff", backgroundColor: "rgba(0,123,255,0.2)", tension: 0.4, fill: true }] },
    options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
  });

  let salesData = [];
  let currentFilter = "all";
  let currentView = "monthly";

  // -------------------- Toast --------------------
  function showToast(msg, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // -------------------- Modal --------------------
  addSaleBtn.addEventListener("click", () => modal.style.display = "block");
  closeModal.addEventListener("click", () => modal.style.display = "none");
  window.addEventListener("click", e => { if (e.target === modal) modal.style.display = "none"; });

  // -------------------- Form Submission --------------------
  addSaleForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const productName = document.getElementById("productName").value.trim();
    const amountInput = document.getElementById("amount").value.trim();
    const amount = parseFloat(amountInput);
    const paymentType = document.getElementById("paymentType").value.toLowerCase();
    const customerName = document.getElementById("customerName").value.trim();
    const status = document.getElementById("status").value.toLowerCase();

    // Validate
    if (!productName) return showToast("❌ Product name is required", "error");
    if (!customerName) return showToast("❌ Customer name is required", "error");
    if (!amountInput || isNaN(amount) || amount <= 0) return showToast("❌ Enter a valid amount", "error");
    if (!["cash", "mobile"].includes(paymentType)) return showToast("❌ Invalid payment type", "error");
    if (!["pending", "completed"].includes(status)) return showToast("❌ Invalid status", "error");

    const newSale = { productName, amount, paymentType, customerName, status };
    try {
      await addSale(newSale);
      addSaleForm.reset();
      modal.style.display = "none";
      showToast("✅ Sale added successfully!");
      await loadDashboard();
    } catch (err) {
      console.error(err);
      showToast(`❌ Failed to add sale: ${err.message}`, "error");
    }
  });

  // -------------------- CRUD --------------------
  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this sale?")) return;
    try {
      await deleteSale(id);
      showToast("🗑️ Sale deleted successfully", "info");
      await loadDashboard();
    } catch (err) {
      console.error(err);
      showToast(`❌ Failed to delete sale: ${err.message}`, "error");
    }
  }

  async function handleComplete(id) {
    const sale = salesData.find(s => s._id === id);
    if (!sale) return showToast("❌ Sale not found", "error");
    if (sale.status === "completed") return showToast("ℹ️ Already completed", "info");

    try {
      await updateSale(id, { status: "completed" });
      showToast("✅ Sale marked as completed!");
      await loadDashboard();
    } catch (err) {
      console.error(err);
      showToast(`❌ Failed to update sale: ${err.message}`, "error");
    }
  }

  // -------------------- Filter & Search --------------------
  filterSelect.addEventListener("change", () => { currentFilter = filterSelect.value; loadDashboard(); });
  searchInput.addEventListener("input", loadDashboard);

  function applyFilter() {
    let filtered = [...salesData];
    if (currentFilter !== "all") {
      if (currentFilter === "pending") filtered = filtered.filter(s => s.status === "pending");
      else filtered = filtered.filter(s => s.paymentType === currentFilter);
    }
    const query = searchInput.value.trim().toLowerCase();
    if (query) filtered = filtered.filter(s => s.productName.toLowerCase().includes(query) || s.customerName.toLowerCase().includes(query));
    return filtered;
  }

  // -------------------- Render Functions --------------------
  async function renderTable(filtered) {
    productTableBody.innerHTML = "";
    filtered.forEach((sale, idx) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${idx + 1}</td>
        <td>${sale.productName}</td>
        <td>₦${sale.amount.toLocaleString()}</td>
        <td>${sale.paymentType}</td>
        <td>${sale.customerName}</td>
        <td>${sale.status}</td>
        <td>
          ${sale.status === "pending" ? `<button class="btn complete" data-id="${sale._id}"><i class="fa fa-check"></i></button>` : ""}
          <button class="btn delete" data-id="${sale._id}"><i class="fa fa-trash"></i></button>
        </td>
      `;
      productTableBody.appendChild(row);
    });

    // Event listeners
    document.querySelectorAll(".btn.delete").forEach(btn => btn.addEventListener("click", () => handleDelete(btn.dataset.id)));
    document.querySelectorAll(".btn.complete").forEach(btn => btn.addEventListener("click", () => handleComplete(btn.dataset.id)));
  }

  async function renderPending(filtered) {
    pendingOrdersList.innerHTML = "";
    filtered.filter(s => s.status === "pending").forEach(sale => {
      const li = document.createElement("li");
      li.textContent = `${sale.productName} `;
      const span = document.createElement("span");
      span.textContent = `₦${sale.amount.toLocaleString()}`;
      li.appendChild(span);
      pendingOrdersList.appendChild(li);
    });
  }

  async function renderKPIs() {
    try {
      const { totalSales, cashSales, mobileSales, pendingOrders } = await getSalesSummary();
      totalSalesEl.textContent = `₦${totalSales.toLocaleString()}`;
      cashSalesEl.textContent = `₦${cashSales.toLocaleString()}`;
      mobileSalesEl.textContent = `₦${mobileSales.toLocaleString()}`;
      pendingOrdersEl.textContent = pendingOrders;
    } catch (err) {
      console.error(err);
    }
  }

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
    } catch (err) { console.error(err); }
  }

  async function renderTopProducts() {
    try {
      const { topProducts } = await getTopProducts();
      topSellingProductsBody.innerHTML = "";
      topProducts.forEach(([name, total], idx) => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${idx + 1}</td><td>${name}</td><td>₦${total.toLocaleString()}</td>`;
        topSellingProductsBody.appendChild(row);
      });
    } catch (err) { console.error(err); }
  }

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
      console.error(err);
    }
  }

  // -------------------- Chart Tabs --------------------
  document.getElementById("monthlyTab").addEventListener("click", async () => {
    currentView = "monthly";
    document.getElementById("monthlyTab").classList.add("active");
    document.getElementById("yearlyTab").classList.remove("active");
    await updateChart();
  });
  document.getElementById("yearlyTab").addEventListener("click", async () => {
    currentView = "yearly";
    document.getElementById("yearlyTab").classList.add("active");
    document.getElementById("monthlyTab").classList.remove("active");
    await updateChart();
  });

  // -------------------- Load Dashboard --------------------
  async function loadDashboard() {
    try {
      salesData = await getSales();
      const filtered = applyFilter();
      await renderTable(filtered);
      await renderPending(filtered);
      await renderKPIs();
      await renderTopCustomers();
      await renderTopProducts();
      await updateChart();
    } catch (err) {
      console.error("Dashboard Load Error:", err);
      showToast("❌ Failed to load dashboard", "error");
    }
  }

  // Initial load
  loadDashboard();
});
