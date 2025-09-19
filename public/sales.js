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

// Animate KPI numbers
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

// ================= Real-time Sales Analytics =================
let analyticsChart;
let analyticsData = [];
let analyticsLabels = [];
const MAX_POINTS = 12;
let currentAnalyticsView = "monthly";

async function initSalesAnalytics(view = "monthly") {
  currentAnalyticsView = view;
  const data = await safeCall(getSalesAnalytics, view);
  if (!data) return;

  if (view === "monthly") {
    analyticsLabels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    analyticsData = data.analytics || Array(12).fill(0);
  } else {
    analyticsLabels = Object.keys(data.analytics || {}).sort();
    analyticsData = Object.values(data.analytics || {});
  }

  const ctx = document.getElementById("salesAnalyticsChart").getContext("2d");
  if (analyticsChart) analyticsChart.destroy();

  analyticsChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: analyticsLabels,
      datasets: [{
        label: "Sales",
        data: analyticsData,
        borderColor: "#007bff",
        backgroundColor: "rgba(0,123,255,0.1)",
        fill: true,
        tension: 0.4,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      scales: { y: { beginAtZero: true } },
      plugins: { legend: { display: false } },
    }
  });
}

// Update chart dynamically when new sale is added
function pushNewSaleToChart(amount) {
  if (currentAnalyticsView === "monthly") {
    analyticsData.push(amount);
    if (analyticsData.length > MAX_POINTS) analyticsData.shift();

    if (analyticsLabels.length < analyticsData.length) analyticsLabels.push("");
    else if (analyticsLabels.length > analyticsData.length) analyticsLabels.shift();

    if (analyticsChart) {
      analyticsChart.data.datasets[0].data = analyticsData;
      analyticsChart.data.labels = analyticsLabels;
      analyticsChart.update();
    }
  } else {
    initSalesAnalytics(currentAnalyticsView);
  }
}

// ================= Load Other Data =================
async function loadSalesTable() {
  const sales = await safeCall(getSales);
  if (!sales) return;

  const tbody = document.getElementById("productTableBody");
  tbody.innerHTML = "";

  sales.forEach((sale, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${sale.productName}</td>
      <td>₦${sale.amount}</td>
      <td>${sale.paymentType}</td>
      <td>${sale.customerName || "Anonymous"}</td>
      <td>${sale.status}</td>
      <td>
        <button class="btn small" data-action="complete" data-id="${sale._id}">✔</button>
        <button class="btn small danger" data-action="delete" data-id="${sale._id}">🗑</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function loadSummary() {
  const data = await safeCall(getSalesSummary);
  if (!data) return;

  animateValue(document.getElementById("totalSales"), 0, Number(data.totalSales) || 0);
  animateValue(document.getElementById("cashSales"), 0, Number(data.cashSales) || 0);
  animateValue(document.getElementById("mobileSales"), 0, Number(data.mobileSales) || 0);

  const completedEl = document.getElementById("completedOrders");
  if (completedEl) completedEl.textContent = Number(data.completedOrders) || 0;
}

async function loadTopProducts() {
  const data = await safeCall(fetchTopProducts);
  if (!data) return;

  const tbody = document.getElementById("topSellingProducts");
  tbody.innerHTML = "";

  data.topProducts?.forEach((p, i) => {
    const tr = document.createElement("tr");
    const amountTd = document.createElement("td");
    tr.innerHTML = `<td>${i + 1}</td><td>${p[0]}</td>`;
    tr.appendChild(amountTd);
    tbody.appendChild(tr);
    animateValue(amountTd, 0, p[1] || 0);
  });
}

async function loadTopCustomers() {
  const data = await safeCall(fetchTopCustomers);
  if (!data) return;

  const ul = document.getElementById("topCustomers");
  ul.innerHTML = "";

  data.topCustomers?.forEach(c => {
    const li = document.createElement("li");
    ul.appendChild(li);
    const name = c[0];
    const total = c[1];
    li.textContent = `${name} - ₦${total}`;
  });
}

async function loadPendingOrders() {
  const data = await safeCall(fetchPendingOrders);
  if (!data) return;

  const ol = document.getElementById("pendingOrdersList");
  ol.innerHTML = "";

  data.pending?.forEach(o => {
    const li = document.createElement("li");
    li.textContent = `${o.productName} (${o.customerName || "Anonymous"})`;
    ol.appendChild(li);
  });
}

// ================= Refresh Dashboard =================
async function refreshAll() {
  await loadSummary();
  await loadSalesTable();
  await loadTopProducts();
  await loadTopCustomers();
  await loadPendingOrders();
  await initSalesAnalytics(view);
}

// ================= Event Handlers =================
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
      customerName: document.getElementById("customerName").value || "Anonymous",
      status: document.getElementById("status").value,
    };
    const newSale = await safeCall(addSale, sale);
    if (newSale) {
      modal.style.display = "none";
      form.reset();
      refreshAll();
      pushNewSaleToChart(sale.amount);
    }
  };
}

function setupTableActions() {
  document.getElementById("productTableBody").addEventListener("click", async e => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;

    if (action === "complete") await safeCall(completeSale, id);
    else if (action === "delete") await safeCall(deleteSaleAPI, id);

    refreshAll();
  });
}

function setupFilters() {
  const filterSelect = document.getElementById("filterSelect");
  const searchInput = document.getElementById("searchInput");
  filterSelect.addEventListener("change", loadSalesTable);
  searchInput.addEventListener("input", loadSalesTable);
}

function setupAnalyticsTabs() {
  document.getElementById("monthlyTab").onclick = () => initSalesAnalytics("monthly");
  document.getElementById("yearlyTab").onclick = () => initSalesAnalytics("yearly");
}

// ================= Init =================
document.addEventListener("DOMContentLoaded", () => {
  refreshAll();
  setupAddSaleModal();
  setupTableActions();
  setupFilters();
  setupAnalyticsTabs();
});
