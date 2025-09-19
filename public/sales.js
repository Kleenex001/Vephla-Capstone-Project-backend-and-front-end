import {
  getSales,
  addSale,
  deleteSale as deleteSaleAPI,
  completeSale,
  getSalesSummary,
  getSalesAnalytics,
  getTopCustomersSales as fetchTopCustomers,
  getTopProductsSales as fetchTopProducts,
  getPendingOrdersSales as fetchPendingOrders,
} from "./api.js";

// ================= Helpers =================
function parseServerError(err) {
  try {
    if (!err) return { message: "Unknown error" };
    if (typeof err === "string") return { message: err };
    if (err.error) return { message: err.error };
    if (err.message) return { message: err.message };
    return { message: JSON.stringify(err) };
  } catch {
    return { message: "Unexpected server error" };
  }
}

async function safeCall(apiFn, ...args) {
  try {
    return await apiFn(...args);
  } catch (err) {
    console.error("API error:", err);
    alert(parseServerError(err).message);
    return null;
  }
}

// Animate numbers from start to end
function animateValue(el, start, end, duration = 800) {
  if (!el) return;
  let startTimestamp = null;
  const step = timestamp => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    el.textContent = `₦${Math.floor(progress * (end - start) + start)}`;
    if (progress < 1) window.requestAnimationFrame(step);
  };
  window.requestAnimationFrame(step);
}

// ================= Load Data =================
let analyticsChart;

async function loadSalesAnalytics(view = "monthly") {
  const data = await safeCall(getSalesAnalytics, view);
  if (!data) return;

  const ctx = document.getElementById("salesAnalyticsChart").getContext("2d");
  if (analyticsChart) analyticsChart.destroy();

  let labels = [];
  let values = [];

  if (view === "monthly") {
    labels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    values = data.analytics || Array(12).fill(0);
  } else {
    labels = Object.keys(data.analytics || {}).sort();
    values = Object.values(data.analytics || {});
  }

  analyticsChart = new Chart(ctx, {
    type: "line",
    data: { labels, datasets: [{ label: "Sales", data: values, borderColor: "#007bff", fill: false }] },
    options: { responsive: true, maintainAspectRatio: false },
  });
}

async function refreshAll(view = "monthly") {
  // 1. KPI summary
  const kpiData = await safeCall(getSalesSummary);
  if (kpiData) {
    animateValue(document.getElementById("totalSales"), 0, Number(kpiData.totalSales) || 0);
    animateValue(document.getElementById("cashSales"), 0, Number(kpiData.cashSales) || 0);
    animateValue(document.getElementById("mobileSales"), 0, Number(kpiData.mobileSales) || 0);

    const completedEl = document.getElementById("completedOrders");
    if (completedEl) completedEl.textContent = Number(kpiData.completedOrders) || 0;
  }

  // 2. Sales table
  const sales = await safeCall(getSales);
  if (sales) {
    const tbody = document.getElementById("productTableBody");
    tbody.innerHTML = "";
    sales.forEach((sale, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${i + 1}</td>
        <td>${sale.productName}</td>
        <td>₦${sale.amount}</td>
        <td>${sale.paymentType}</td>
        <td>${sale.customerName}</td>
        <td>${sale.status}</td>
        <td>
          <button class="btn small" data-action="complete" data-id="${sale._id}">✔</button>
          <button class="btn small danger" data-action="delete" data-id="${sale._id}">🗑</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // 3. Top Products
  const topProductsData = await safeCall(fetchTopProducts);
  if (topProductsData) {
    const tbody = document.getElementById("topSellingProducts");
    tbody.innerHTML = "";
    topProductsData.topProducts?.forEach((p, i) => {
      const tr = document.createElement("tr");
      const amountTd = document.createElement("td");
      tr.innerHTML = `<td>${i + 1}</td><td>${p[0]}</td>`;
      tr.appendChild(amountTd);
      tbody.appendChild(tr);
      animateValue(amountTd, 0, p[1] || 0);
    });
  }

  // 4. Top Customers
  const topCustomersData = await safeCall(fetchTopCustomers);
  if (topCustomersData) {
    const ul = document.getElementById("topCustomers");
    ul.innerHTML = "";
    topCustomersData.topCustomers?.forEach(c => {
      const li = document.createElement("li");
      ul.appendChild(li);
      const name = c[0];
      const total = c[1];
      let start = 0;
      const duration = 1000;
      function step(timestamp) {
        if (!li.startTime) li.startTime = timestamp;
        const progress = Math.min((timestamp - li.startTime) / duration, 1);
        const value = Math.floor(progress * total + start);
        li.textContent = `${name} - ₦${value}`;
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  // 5. Pending Orders
  const pendingData = await safeCall(fetchPendingOrders);
  if (pendingData) {
    const ol = document.getElementById("pendingOrdersList");
    ol.innerHTML = "";
    pendingData.pending?.forEach(o => {
      const li = document.createElement("li");
      li.textContent = `${o.productName} (${o.customerName})`;
      ol.appendChild(li);
    });
  }

  // 6. Sales Analytics chart
  await loadSalesAnalytics(view);

  // 7. Update tab classes
  if (view === "monthly") {
    document.getElementById("monthlyTab").classList.add("active");
    document.getElementById("yearlyTab").classList.remove("active");
  } else {
    document.getElementById("monthlyTab").classList.remove("active");
    document.getElementById("yearlyTab").classList.add("active");
  }
}

// ================= Event Handlers =================

// Add Sale
function setupAddSaleModal() {
  const modal = document.getElementById("addSaleModal");
  const btn = document.getElementById("addSaleBtn");
  const close = modal.querySelector(".close");

  btn.onclick = () => (modal.style.display = "block");
  close.onclick = () => (modal.style.display = "none");
  window.onclick = e => { if (e.target === modal) modal.style.display = "none"; };

  const form = document.getElementById("addSaleForm");
  form.onsubmit = async e => {
    e.preventDefault();
    const sale = {
      productName: document.getElementById("productName").value,
      amount: parseFloat(document.getElementById("amount").value),
      paymentType: document.getElementById("paymentType").value,
      customerName: document.getElementById("customerName").value,
      status: document.getElementById("status").value,
    };
    const newSale = await safeCall(addSale, sale);
    if (newSale) {
      modal.style.display = "none";
      form.reset();
      refreshAll(); // refresh dashboard after adding sale
    }
  };
}

// Complete/Delete Sale
function setupTableActions() {
  document.getElementById("productTableBody").addEventListener("click", async e => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const id = btn.dataset.id;
    const action = btn.dataset.action;

    if (action === "complete") await safeCall(completeSale, id);
    else if (action === "delete") await safeCall(deleteSaleAPI, id);

    refreshAll(); // refresh dashboard after action
  });
}

// Filter/Search
function setupFilters() {
  const filterSelect = document.getElementById("filterSelect");
  const searchInput = document.getElementById("searchInput");

  filterSelect.addEventListener("change", loadSalesTable);
  searchInput.addEventListener("input", loadSalesTable);
}

// Chart Tabs
function setupAnalyticsTabs() {
  document.getElementById("monthlyTab").onclick = () => refreshAll("monthly");
  document.getElementById("yearlyTab").onclick = () => refreshAll("yearly");
}

// ================= Init =================
document.addEventListener("DOMContentLoaded", () => {
  refreshAll();
  setupAddSaleModal();
  setupTableActions();
  setupFilters();
  setupAnalyticsTabs();
});
