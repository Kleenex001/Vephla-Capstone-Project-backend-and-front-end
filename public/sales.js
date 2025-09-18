// sales.js

const BASE_URL = "http://localhost:5000/api"; // update if deployed

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
    data: { labels: [], datasets: [{ label: "Sales", data: [], borderColor: "#007bff", backgroundColor: "rgba(0,123,255,0.2)", tension: 0.4, fill: true }] },
    options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
  });

  // View toggle (monthly/yearly)
  let currentView = "monthly";
  document.getElementById("monthlyTab").onclick = () => { currentView = "monthly"; updateChart(); };
  document.getElementById("yearlyTab").onclick = () => { currentView = "yearly"; updateChart(); };

  // Toast Function
  function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // ========== API CALLS ==========

  async function apiGet(path) {
    const res = await fetch(`${BASE_URL}${path}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async function apiPost(path, body) {
    const res = await fetch(`${BASE_URL}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async function apiDelete(path) {
    const res = await fetch(`${BASE_URL}${path}`, { method: "DELETE" });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async function apiPatch(path, body) {
    const res = await fetch(`${BASE_URL}${path}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  // ========== Dashboard Updates ==========

  async function loadKPIs() {
    try {
      const data = await apiGet("/sales/summary/kpis");
      totalSalesEl.textContent = `₦${data.totalSales.toLocaleString()}`;
      cashSalesEl.textContent = `₦${data.cashSales.toLocaleString()}`;
      mobileSalesEl.textContent = `₦${data.mobileSales.toLocaleString()}`;
      pendingOrdersEl.textContent = data.pendingOrders;
    } catch (err) {
      console.error("Failed to load KPIs", err);
    }
  }

  async function loadSalesTable() {
    try {
      const sales = await apiGet("/sales");
      productTableBody.innerHTML = "";
      sales.forEach((sale, i) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${i + 1}</td>
          <td>${sale.productName}</td>
          <td>₦${sale.amount.toLocaleString()}</td>
          <td>${sale.paymentType}</td>
          <td>${sale.customerName}</td>
          <td>${sale.status}</td>
          <td>
            ${sale.status === "pending" ? `<button class="btn complete" data-id="${sale._id}"><i class="fa fa-check"></i> Complete</button>` : ""}
            <button class="btn delete" data-id="${sale._id}"><i class="fa fa-trash"></i> Delete</button>
          </td>
        `;
        productTableBody.appendChild(row);
      });

      // Delete handler
      document.querySelectorAll(".btn.delete").forEach((btn) =>
        btn.addEventListener("click", async () => {
          await apiDelete(`/sales/${btn.dataset.id}`);
          showToast("🗑️ Sale deleted");
          updateDashboard();
        })
      );

      // Complete handler
      document.querySelectorAll(".btn.complete").forEach((btn) =>
        btn.addEventListener("click", async () => {
          await apiPatch(`/sales/${btn.dataset.id}/complete`);
          showToast("✅ Sale completed");
          updateDashboard();
        })
      );
    } catch (err) {
      console.error("Failed to load sales", err);
    }
  }

  async function loadPendingOrders() {
    try {
      const data = await apiGet("/sales/pending-orders");
      pendingOrdersList.innerHTML = "";
      data.pending.forEach((sale) => {
        const li = document.createElement("li");
        li.textContent = `${sale.productName} (${sale.customerName}) - ₦${sale.amount}`;
        pendingOrdersList.appendChild(li);
      });
    } catch (err) {
      console.error("Failed to load pending orders", err);
    }
  }

  async function loadTopCustomers() {
    try {
      const data = await apiGet("/sales/top-customers");
      topCustomersList.innerHTML = "";
      data.topCustomers.forEach(([name, total]) => {
        const li = document.createElement("li");
        li.textContent = `${name} - ₦${total}`;
        topCustomersList.appendChild(li);
      });
    } catch (err) {
      console.error("Failed to load customers", err);
    }
  }

  async function loadTopProducts() {
    try {
      const data = await apiGet("/sales/top-products");
      topSellingProductsBody.innerHTML = "";
      data.topProducts.forEach(([name, total], i) => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${i + 1}</td><td>${name}</td><td>₦${total}</td>`;
        topSellingProductsBody.appendChild(row);
      });
    } catch (err) {
      console.error("Failed to load products", err);
    }
  }

  async function updateChart() {
    try {
      const data = await apiGet(`/sales/analytics?view=${currentView}`);
      if (currentView === "monthly") {
        salesChart.data.labels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        salesChart.data.datasets[0].data = data.analytics;
      } else {
        const years = Object.keys(data.analytics).sort();
        salesChart.data.labels = years;
        salesChart.data.datasets[0].data = years.map(y => data.analytics[y]);
      }
      salesChart.update();
    } catch (err) {
      console.error("Failed to load chart", err);
    }
  }

  // ========== Add Sale ==========

  addSaleForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const productName = document.getElementById("productName").value.trim();
    const amount = parseFloat(document.getElementById("amount").value);
    const paymentType = document.getElementById("paymentType").value;
    const customerName = document.getElementById("customerName").value.trim();
    const status = document.getElementById("status").value;

    try {
      await apiPost("/sales", { productName, amount, paymentType, customerName, status });
      showToast("✅ Sale added");
      modal.style.display = "none";
      addSaleForm.reset();
      updateDashboard();
    } catch (err) {
      console.error("Failed to add sale", err);
    }
  });

  // ========== Dashboard Refresh ==========

  async function updateDashboard() {
    await loadKPIs();
    await loadSalesTable();
    await loadPendingOrders();
    await loadTopCustomers();
    await loadTopProducts();
    await updateChart();
  }

  // Init
  updateDashboard();
});
