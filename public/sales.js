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

  // Table and Dashboard Elements
  const productTableBody = document.getElementById("productTableBody");
  const pendingOrdersList = document.getElementById("pendingOrdersList");
  const topCustomersList = document.getElementById("topCustomers");
  const topSellingProductsBody = document.getElementById("topSellingProducts");

  // Filter Elements
  const filterSelect = document.getElementById("filterSelect");
  const searchInput = document.getElementById("searchInput");

  // Chart.js Sales Analytics
  const ctx = document.getElementById("salesAnalyticsChart").getContext("2d");
  let salesChart = new Chart(ctx, {
    type: "line",
    data: { labels: [], datasets: [{ label: "Sales", data: [], borderColor: "#007bff", backgroundColor: "rgba(0, 123, 255, 0.2)", tension: 0.4, fill: true }] },
    options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
  });

  let currentView = "monthly";

  // ------------------ Modal ------------------
  addSaleBtn.addEventListener("click", () => { modal.style.display = "block"; });
  closeModal.addEventListener("click", () => { modal.style.display = "none"; });
  window.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });

  // ------------------ Toast ------------------
  function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // ------------------ Event Tabs ------------------
  document.getElementById("monthlyTab").addEventListener("click", () => { currentView = "monthly"; updateDashboard(); });
  document.getElementById("yearlyTab").addEventListener("click", () => { currentView = "yearly"; updateDashboard(); });

  // ------------------ Form Submission ------------------
  addSaleForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newSale = {
      productName: document.getElementById("productName").value.trim(),
      amount: parseFloat(document.getElementById("amount").value),
      paymentType: document.getElementById("paymentType").value,
      customerName: document.getElementById("customerName").value.trim(),
      status: document.getElementById("status").value
    };

    try {
      await addSale(newSale);
      showToast("✅ Sale added successfully!");
      addSaleForm.reset();
      modal.style.display = "none";
      updateDashboard();
    } catch (err) {
      showToast(`❌ ${err.message}`, "error");
      console.error(err);
    }
  });

  // ------------------ Delete Sale ------------------
  async function handleDelete(id) {
    try {
      await deleteSale(id);
      showToast("🗑️ Sale deleted successfully", "info");
      updateDashboard();
    } catch (err) {
      showToast(`❌ ${err.message}`, "error");
      console.error(err);
    }
  }

  // ------------------ Complete Sale ------------------
  async function handleComplete(id) {
    try {
      await updateSale(id, { status: "Completed" });
      showToast("✅ Sale marked as completed!");
      updateDashboard();
    } catch (err) {
      showToast(`❌ ${err.message}`, "error");
      console.error(err);
    }
  }

  // ------------------ Render Table ------------------
  function renderTable(sales) {
    productTableBody.innerHTML = "";
    sales.forEach((sale, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${sale.productName}</td>
        <td>₦${sale.amount.toLocaleString()}</td>
        <td>${sale.paymentType}</td>
        <td>${sale.customerName}</td>
        <td>${sale.status}</td>
        <td>
          ${sale.status === "Pending" ? `<button class="btn complete" data-id="${sale._id}"><i class="fa fa-check"></i> Complete</button>` : ""}
          <button class="btn delete" data-id="${sale._id}"><i class="fa fa-trash"></i> Delete</button>
        </td>
      `;
      productTableBody.appendChild(row);
    });

    // Attach event handlers
    document.querySelectorAll(".btn.delete").forEach(btn => btn.addEventListener("click", () => handleDelete(btn.dataset.id)));
    document.querySelectorAll(".btn.complete").forEach(btn => btn.addEventListener("click", () => handleComplete(btn.dataset.id)));
  }

  // ------------------ Render KPIs ------------------
  async function renderKPIs() {
    try {
      const summary = await getSalesSummary();
      totalSalesEl.textContent = `₦${summary.totalSales.toLocaleString()}`;
      cashSalesEl.textContent = `₦${summary.cashSales.toLocaleString()}`;
      mobileSalesEl.textContent = `₦${summary.mobileSales.toLocaleString()}`;
      pendingOrdersEl.textContent = summary.pendingOrders;
    } catch (err) {
      console.error(err);
    }
  }

  // ------------------ Render Chart ------------------
  async function renderChart() {
    try {
      const analytics = await getSalesAnalytics(currentView);
      if (currentView === "monthly") {
        salesChart.data.labels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        salesChart.data.datasets[0].data = analytics.analytics;
      } else {
        salesChart.data.labels = Object.keys(analytics.analytics);
        salesChart.data.datasets[0].data = Object.values(analytics.analytics);
      }
      salesChart.update();
    } catch (err) {
      console.error(err);
    }
  }

  // ------------------ Render Sidebar Stats ------------------
  async function renderSidebar() {
    try {
      const topCustomers = await getTopCustomersSales();
      topCustomersList.innerHTML = "";
      topCustomers.topCustomers.forEach(([name, total]) => {
        const li = document.createElement("li");
        li.textContent = `${name} `;
        const span = document.createElement("span");
        span.textContent = `₦${total.toLocaleString()}`;
        li.appendChild(span);
        topCustomersList.appendChild(li);
      });

      const topProducts = await getTopProducts();
      topSellingProductsBody.innerHTML = "";
      topProducts.topProducts.forEach(([name, total], index) => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${index+1}</td><td>${name}</td><td>₦${total.toLocaleString()}</td>`;
        topSellingProductsBody.appendChild(row);
      });

      const allSales = await getSales();
      pendingOrdersList.innerHTML = "";
      allSales.forEach(sale => {
        if (sale.status === "Pending") {
          const li = document.createElement("li");
          li.textContent = `${sale.productName} `;
          const span = document.createElement("span");
          span.textContent = `₦${sale.amount.toLocaleString()}`;
          li.appendChild(span);
          pendingOrdersList.appendChild(li);
        }
      });

    } catch (err) {
      console.error(err);
    }
  }

  // ------------------ Filter Logic ------------------
  function filterSales(sales) {
    let filtered = [...sales];
    const filter = filterSelect.value;
    const search = searchInput.value.trim().toLowerCase();

    if (filter !== "all") {
      if (filter === "pending") filtered = filtered.filter(s => s.status === "Pending");
      else filtered = filtered.filter(s => s.paymentType.toLowerCase() === filter);
    }

    if (search) {
      filtered = filtered.filter(s => s.productName.toLowerCase().includes(search) || s.customerName.toLowerCase().includes(search));
    }

    return filtered;
  }

  // ------------------ Update Dashboard ------------------
  async function updateDashboard() {
    try {
      const sales = await getSales();
      renderTable(filterSales(sales));
      await renderKPIs();
      await renderChart();
      await renderSidebar();
    } catch (err) {
      console.error(err);
    }
  }

  filterSelect.addEventListener("change", updateDashboard);
  searchInput.addEventListener("input", updateDashboard);

  // ------------------ Init ------------------
  updateDashboard();
});
