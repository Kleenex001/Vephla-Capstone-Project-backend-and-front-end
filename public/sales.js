// sales.js
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

// Animate numeric values
function animateValue(element, start, end, duration = 1000) {
  const range = end - start;
  const startTime = performance.now();

  function step(currentTime) {
    const progress = Math.min((currentTime - startTime) / duration, 1);
    const value = Math.floor(progress * range + start);
    element.textContent = `₦${value}`;
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

// ================= Load Data =================

// Load KPI summary
async function loadSummary() {
  const data = await safeCall(getSalesSummary);
  if (!data) return;

  animateValue(document.getElementById("totalSales"), 0, data.totalSales || 0);
  animateValue(document.getElementById("cashSales"), 0, data.cashSales || 0);
  animateValue(document.getElementById("mobileSales"), 0, data.mobileSales || 0);
  animateValue(document.getElementById("completedOrders"), 0, data.completedOrders || 0);
}

// Load analytics chart
let analyticsChart;
async function loadAnalytics(view = "monthly") {
  const data = await safeCall(getSalesAnalytics, view);
  if (!data) return;

  const ctx = document.getElementById("salesAnalyticsChart").getContext("2d");
  if (analyticsChart) analyticsChart.destroy();

  let labels = [];
  let values = [];

  if (view === "monthly") {
    labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
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

// Load sales table
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

// Load Top Products
async function loadTopProducts() {
  const products = await safeCall(fetchTopProducts);
  if (!products) return;

  const tbody = document.getElementById("topSellingProducts");
  tbody.innerHTML = "";

  products.topProducts?.forEach((p, i) => {
    const tr = document.createElement("tr");
    const amountTd = document.createElement("td");
    tr.innerHTML = `<td>${i + 1}</td><td>${p[0]}</td>`; // p[0] = productName
    tr.appendChild(amountTd);
    tbody.appendChild(tr);

    animateValue(amountTd, 0, p[1] || 0);
  });
}

// Load Top Customers
async function loadTopCustomers() {
  const customers = await safeCall(fetchTopCustomers);
  if (!customers) return;

  const ul = document.getElementById("topCustomers");
  ul.innerHTML = "";

  customers.topCustomers?.forEach(c => {
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

// Load Pending Orders
async function loadPendingOrders() {
  const data = await safeCall(fetchPendingOrders);
  if (!data) return;

  const ol = document.getElementById("pendingOrdersList");
  ol.innerHTML = "";

  data.pending?.forEach(o => {
    const li = document.createElement("li");
    li.textContent = `${o.productName} (${o.customerName})`;
    ol.appendChild(li);
  });
}

// ================= Event Handlers =================

// Add Sale Modal
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
      refreshAll();
    }
  };
}

// Table actions (complete/delete)
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

// Filter + Search
function setupFilters() {
  const filterSelect = document.getElementById("filterSelect");
  const searchInput = document.getElementById("searchInput");

  filterSelect.addEventListener("change", loadSalesTable);
  searchInput.addEventListener("input", loadSalesTable);
}

// Analytics Tabs
function setupAnalyticsTabs() {
  document.getElementById("monthlyTab").onclick = () => {
    loadAnalytics("monthly");
    document.getElementById("monthlyTab").classList.add("active");
    document.getElementById("yearlyTab").classList.remove("active");
  };
  document.getElementById("yearlyTab").onclick = () => {
    loadAnalytics("yearly");
    document.getElementById("yearlyTab").classList.add("active");
    document.getElementById("monthlyTab").classList.remove("active");
  };
}

// Refresh all data
function refreshAll() {
  loadSummary();
  loadSalesTable();
  loadTopProducts();
  loadTopCustomers();
  loadPendingOrders();
}

// ================= Init =================
document.addEventListener("DOMContentLoaded", () => {
  refreshAll();
  loadAnalytics("monthly");

  setupAddSaleModal();
  setupTableActions();
  setupFilters();
  setupAnalyticsTabs();
});
