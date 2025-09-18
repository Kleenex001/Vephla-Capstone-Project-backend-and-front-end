// sales.js
import {
  getSales,
  addSale,
  updateSale,
  deleteSale as deleteSaleApi,
  completeSale,
  getSalesSummary,
  getSalesAnalytics,
  getTopCustomers as getTopCustomersApi,
  getTopProducts as getTopProductsApi,
  getPendingOrders as getPendingOrdersApi,
} from "./api.js";

// ============ Helpers ============
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

// ============ UI Rendering ============

// KPIs
async function loadSummary() {
  const data = await safeCall(getSalesSummary);
  if (!data) return;

  document.getElementById("totalSales").textContent = `₦${data.totalSales || 0}`;
  document.getElementById("cashSales").textContent = `₦${data.cashSales || 0}`;
  document.getElementById("mobileSales").textContent = `₦${data.mobileSales || 0}`;
  document.getElementById("completedOrders").textContent = data.completedOrders || 0;
}

// Analytics Chart
let analyticsChart;
async function loadAnalytics(view = "monthly") {
  const data = await safeCall(getSalesAnalytics, view);
  if (!data) return;

  const ctx = document.getElementById("salesAnalyticsChart").getContext("2d");
  if (analyticsChart) analyticsChart.destroy();

  analyticsChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.labels || [],
      datasets: [
        {
          label: "Sales",
          data: data.values || [],
          borderColor: "#007bff",
          fill: false,
        },
      ],
    },
  });
}

// Sales Table
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
        <button class="btn small" data-action="complete" data-id="${sale.id}">✔</button>
        <button class="btn small danger" data-action="delete" data-id="${sale.id}">🗑</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Top Products
async function loadTopProducts() {
  const products = await safeCall(getTopProductsApi);
  if (!products) return;

  const tbody = document.getElementById("topSellingProducts");
  tbody.innerHTML = "";

  products.forEach((p, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${p.productName}</td>
      <td>₦${p.totalAmount}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Top Customers
async function loadTopCustomers() {
  const customers = await safeCall(getTopCustomersApi);
  if (!customers) return;

  const ul = document.getElementById("topCustomers");
  ul.innerHTML = "";

  customers.forEach(c => {
    const li = document.createElement("li");
    li.textContent = `${c.customerName} - ₦${c.totalSpent}`;
    ul.appendChild(li);
  });
}

// Pending Orders
async function loadPendingOrders() {
  const orders = await safeCall(getPendingOrdersApi);
  if (!orders) return;

  const ol = document.getElementById("pendingOrdersList");
  ol.innerHTML = "";

  orders.forEach(o => {
    const li = document.createElement("li");
    li.textContent = `${o.productName} (${o.customerName})`;
    ol.appendChild(li);
  });
}

// ============ Event Handlers ============

// Add Sale Modal
function setupAddSaleModal() {
  const modal = document.getElementById("addSaleModal");
  const btn = document.getElementById("addSaleBtn");
  const close = modal.querySelector(".close");

  btn.onclick = () => (modal.style.display = "block");
  close.onclick = () => (modal.style.display = "none");
  window.onclick = e => {
    if (e.target === modal) modal.style.display = "none";
  };

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
      loadSalesTable();
      loadSummary();
    }
  };
}

// Table Actions (complete/delete)
function setupTableActions() {
  document.getElementById("productTableBody").addEventListener("click", async e => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const id = btn.dataset.id;
    const action = btn.dataset.action;

    if (action === "complete") {
      await safeCall(completeSale, id);
    } else if (action === "delete") {
      await safeCall(deleteSaleApi, id);
    }

    loadSalesTable();
    loadSummary();
    loadPendingOrders();
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

// ============ Init ============
document.addEventListener("DOMContentLoaded", () => {
  loadSummary();
  loadAnalytics("monthly");
  loadSalesTable();
  loadTopProducts();
  loadTopCustomers();
  loadPendingOrders();

  setupAddSaleModal();
  setupTableActions();
  setupFilters();
  setupAnalyticsTabs();
});
