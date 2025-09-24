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
    console.error("API error:", err.message);
    alert(parseServerError(err).message);
    return null;
  }
}

// ================= Animate Numbers =================
function animateValue(el, start, end, duration = 800) {
  if (!el) return;
  const valueEl = el.querySelector(".amount-value") || (() => {
    const span = document.createElement("span");
    span.classList.add("amount-value");
    el.textContent = "₦";
    el.appendChild(span);
    return span;
  })();

  let startTimestamp = null;
  const step = timestamp => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    valueEl.textContent = Math.floor(progress * (end - start) + start).toLocaleString();
    if (progress < 1) window.requestAnimationFrame(step);
  };
  window.requestAnimationFrame(step);
}

// ================= Global State =================
let salesData = [];
let salesChart;
let currentAnalyticsView = "monthly";

// ================= Sales Analytics =================

async function initSalesAnalytics(view = "monthly") {
  currentAnalyticsView = view;

  // 1️⃣ Fetch analytics from backend
  const res = await safeCall(getSalesAnalytics, view);
  if (!res) return;

  console.log("Sales Analytics API response:", res);

  let analyticsData = res.analytics || [];

  // 2️⃣ Ensure proper format
  if (view === "monthly") {
    if (!Array.isArray(analyticsData) || analyticsData.length !== 12) {
      console.warn("Analytics array invalid, defaulting to zeros");
      analyticsData = Array(12).fill(0);
    }
  } else {
    // yearly: convert object values to array
    analyticsData = Object.values(analyticsData).map(v => Number(v) || 0);
  }

  // 3️⃣ Prepare labels
  const labels = view === "monthly"
    ? ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    : Object.keys(res.analytics || {});

  // 4️⃣ Target values (numbers only)
  const targetValues = analyticsData.map(v => Number(v) || 0);

  console.log("Sales Analytics Labels:", labels);
  console.log("Sales Analytics Target Values:", targetValues);

  // 5️⃣ Chart.js setup
  const canvas = document.getElementById("salesAnalyticsChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "rgba(0, 255, 149, 0.54)");
  gradient.addColorStop(1, "rgba(0,123,255,0)");

  if (!salesChart) {
    salesChart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: "Sales",
          data: Array(targetValues.length).fill(0),
          borderColor: "#1d916ab0",
          backgroundColor: gradient,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointBackgroundColor: "#00ffb3a1"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 0 },
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true }, x: { grid: { display: false } } }
      }
    });
  } else {
    salesChart.data.labels = labels;
    if (!salesChart.data.datasets[0]) {
      salesChart.data.datasets[0] = {
        data: Array(targetValues.length).fill(0),
        borderColor: "#007bff",
        backgroundColor: gradient,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: "#007bff"
      };
    }
  }

  // 6️⃣ Animate chart smoothly
  const duration = 1200; // ms
  const frameRate = 60;  // fps
  const totalFrames = Math.round(duration / (1000 / frameRate));
  let frame = 0;
  const startValues = salesChart.data.datasets[0].data.map(v => Number(v) || 0);

  const animate = () => {
    frame++;
    salesChart.data.datasets[0].data = startValues.map((start, i) => {
      const target = targetValues[i] || 0;
      return start + (target - start) * (frame / totalFrames);
    });
    salesChart.update('none');
    if (frame < totalFrames) requestAnimationFrame(animate);
  };

  animate();
}

// ================= Analytics Tabs =================
function setupAnalyticsTabs() {
  document.getElementById("monthlyTab")?.addEventListener("click", () => initSalesAnalytics("monthly"));
  document.getElementById("yearlyTab")?.addEventListener("click", () => initSalesAnalytics("yearly"));
}

// ================= Load Sales Table =================
async function loadSalesTable() {
  const res = await safeCall(getSales);
  const tbody = document.getElementById("productTableBody");
  if (!tbody) return;

  if (!res || !Array.isArray(res.data) || !res.data.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No sales found</td></tr>`;
    salesData = [];
    return;
  }

  salesData = res.data;

  tbody.innerHTML = salesData.map((sale,i) => {
    const customerName = sale.customer?.name || sale.customerName || "Unknown";
    const statusClass = sale.status?.toLowerCase() === "completed" ? "completed" :
                        sale.status?.toLowerCase() === "pending" ? "pending" : "cancelled";
    const completeBtn = sale.status?.toLowerCase() === "completed" ? "" :
      `<button class="action-btn complete-btn" data-action="complete" data-id="${sale._id}">Complete</button>`;

    return `<tr data-id="${sale._id}">
      <td>${i+1}</td>
      <td>${sale.productName}</td>
      <td class="amount-cell">₦<span class="amount-value">${sale.amount}</span></td>
      <td>${sale.paymentType}</td>
      <td>${customerName}</td>
      <td><span class="status-btn ${statusClass}">${statusClass.charAt(0).toUpperCase()+statusClass.slice(1)}</span></td>
      <td>${completeBtn} <button class="action-btn delete-btn" data-action="delete" data-id="${sale._id}">Delete</button></td>
    </tr>`;
  }).join("");

  if (window.applyFilters) window.applyFilters();
}

// ================= Side Tables =================
async function loadTopProducts() {
  const res = await safeCall(fetchTopProducts);
  const tbody = document.getElementById("topSellingProducts");
  if (!tbody || !res || !Array.isArray(res.data)) return;

  tbody.innerHTML = "";
  res.data.forEach((p,i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${i+1}</td><td>${p[0]}</td><td class="amount-cell">₦<span class="amount-value">${p[1]}</span></td>`;
    tbody.appendChild(tr);
  });
}

async function loadTopCustomers() {
  const res = await safeCall(fetchTopCustomers);
  const ul = document.getElementById("topCustomers");
  if (!ul || !res || !Array.isArray(res.data)) return;

  ul.innerHTML = "";
  res.data.forEach(c => {
    const li = document.createElement("li");
    const name = c[0]?.name || c[0] || "Unknown";
    li.innerHTML = `${name} - ₦<span class="amount-value">${c[1]}</span>`;
    ul.appendChild(li);
  });
}

async function loadPendingOrders() {
  const res = await safeCall(fetchPendingOrders);
  const ol = document.getElementById("pendingOrdersList");
  if (!ol || !res || !Array.isArray(res.data)) return;

  ol.innerHTML = "";
  res.data.forEach(o => {
    const customerName = o.customer?.name || o.customerName || "Anonymous";
    const li = document.createElement("li");
    li.textContent = `${o.productName} (${customerName})`;
    ol.appendChild(li);
  });
}

// ================= Refresh Dashboard =================
async function refreshAll() {
  await loadSalesTable();
  await loadTopProducts();
  await loadTopCustomers();
  await loadPendingOrders();

  const summary = await safeCall(getSalesSummary);
  if (summary && summary.data) {
    const totalSalesEl = document.getElementById("totalSales");
    const currentTotal = parseInt(totalSalesEl.querySelector(".amount-value")?.textContent.replace(/,/g,'') || 0);
    animateValue(totalSalesEl, currentTotal, Number(summary.data.totalSales) || 0);
    animateValue(document.getElementById("cashSales"), 0, Number(summary.data.cashSales) || 0);
    animateValue(document.getElementById("mobileSales"), 0, Number(summary.data.mobileSales) || 0);
    const completedEl = document.getElementById("completedOrders");
    if (completedEl) completedEl.textContent = Number(summary.data.completedOrders) || 0;
  }

  await initSalesAnalytics(currentAnalyticsView);

  if (window.applyFilters) window.applyFilters();
}

// ================= Event Handlers =================
function setupAddSaleModal() {
  const modal = document.getElementById("addSaleModal");
  const btn = document.getElementById("addSaleBtn");
  const close = modal?.querySelector(".close");
  if (!modal || !btn || !close) return;

  btn.onclick = () => (modal.style.display = "block");
  close.onclick = () => (modal.style.display = "none");
  window.onclick = e => { if (e.target === modal) modal.style.display = "none"; };

  const form = document.getElementById("addSaleForm");
  if (!form) return;
  form.onsubmit = async e => {
    e.preventDefault();
    const sale = {
      productName: document.getElementById("productName")?.value || "",
      amount: parseFloat(document.getElementById("amount")?.value || 0),
      paymentType: document.getElementById("paymentType")?.value || "",
      customerName: document.getElementById("customerName")?.value || "",
      status: document.getElementById("status")?.value || "pending",
    };
    const newSale = await safeCall(addSale, sale);
    if (newSale) {
      modal.style.display = "none";
      form.reset();
      refreshAll();
    }
  };
}

function setupTableActions() {
  const tbody = document.getElementById("productTableBody");
  if (!tbody) return;
  tbody.addEventListener("click", async e => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;

    if (action === "complete") await safeCall(completeSale, id);
    else if (action === "delete") await safeCall(deleteSaleAPI, id);

    refreshAll();
  });
}

// ================= Filters =================
function setupFilters() {
  const searchInput = document.getElementById("searchInput");
  const filterSelect = document.getElementById("filterSelect");
  if (!searchInput || !filterSelect) return;

  window.applyFilters = function() {
    if (!salesData.length) return;
    const term = searchInput.value.toLowerCase();
    const filter = filterSelect.value.toLowerCase();

    document.querySelectorAll("#productTableBody tr").forEach(row => {
      const id = row.dataset.id;
      const sale = salesData.find(s => s._id === id);
      if (!sale) return;

      const customerName = sale.customer?.name || sale.customerName || "Unknown";
      const matchesSearch =
        sale.productName.toLowerCase().includes(term) ||
        customerName.toLowerCase().includes(term) ||
        sale.paymentType.toLowerCase().includes(term);

      const matchesFilter =
        filter === "all" ||
        sale.paymentType.toLowerCase() === filter ||
        sale.status.toLowerCase() === filter;

      row.style.display = matchesSearch && matchesFilter ? "" : "none";
    });
  };

  searchInput.addEventListener("input", window.applyFilters);
  filterSelect.addEventListener("change", window.applyFilters);
}

// ================= Inject Button Styles =================
function injectStyles() {
  const style = document.createElement("style");
  style.textContent = `
    .action-btn { padding: 6px 10px; border: none; border-radius: 6px; font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s ease; }
    .complete-btn { background: #28a745; color: #fff; font-size:0.7rem; margin-bottom:2px; padding: 6px 6px }
    .complete-btn:hover { background: #218838; }
    .delete-btn { background: #dc3545; color: #fff; padding: 6px 10px }
    .delete-btn:hover { background: #c82333; }
  `;
  document.head.appendChild(style);
}

// ================= Init =================
document.addEventListener("DOMContentLoaded", () => {
  injectStyles();
  setupAddSaleModal();
  setupTableActions();
  setupFilters();
  setupAnalyticsTabs();

  const tbody = document.getElementById("productTableBody");
  if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Loading sales...</td></tr>`;

  setTimeout(() => refreshAll(), 50);

  // Auto-refresh every 60s
  setInterval(refreshAll, 60000);
});
