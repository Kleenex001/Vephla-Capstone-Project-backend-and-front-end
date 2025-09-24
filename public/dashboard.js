// ================= Imports =================
import {
  getUserInfo,
  logoutUser,
  getSalesAnalytics,
  getTopCustomersSales,
  getLowStockProducts,
  getExpiredProducts,
  getCustomers,
  getDeliveries,
  showToast,
} from "./api.js";

// ================= Helpers =================
function parseServerError(err) {
  try {
    if (!err) return "Unknown error";
    if (typeof err === "string") return err;
    return err.message || err.error || JSON.stringify(err);
  } catch {
    return "Unexpected error";
  }
}

function animateValue(el, start, end, duration = 800, prefix = "₦") {
  if (!el) return;
  let startTimestamp = null;
  let valueEl = el.querySelector(".amount-value");
  if (!valueEl) {
    valueEl = document.createElement("span");
    valueEl.classList.add("amount-value");
    el.textContent = prefix || "";
    el.appendChild(valueEl);
  }

  const step = timestamp => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    valueEl.textContent = Math.floor(progress * (end - start) + start).toLocaleString();
    if (progress < 1) window.requestAnimationFrame(step);
  };
  window.requestAnimationFrame(step);
}

// ================= User Info =================
async function loadUserInfo() {
  try {
    const res = await getUserInfo();
    const user = res?.data || {};
    const nameEl = document.getElementById("greetingName");
    const businessEl = document.getElementById("businessName");

    const userName = user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User";
    const businessName = user.businessName || "Your Business";

    if (nameEl) nameEl.textContent = `Hello, ${userName}`;
    if (businessEl) businessEl.textContent = businessName;

    showToast(`Welcome back, ${userName} of ${businessName}!`, "success", 4000);
  } catch (err) {
    console.error("Failed to load user info", err);
    showToast("Unable to fetch user info", "error");
  }
}

// ================= KPI & Status =================
function calcStatus(customer) {
  if (customer.status === "paid") return "paid";
  const today = new Date();
  const payDate = new Date(customer.paymentDate);
  return payDate < today ? "overdue" : "owed";
}

let allCustomers = [];

async function loadCustomerKPIs() {
  try {
    const res = await getCustomers();
    allCustomers = res?.data || [];

    let totalPaid = 0, totalOwed = 0, totalOverdue = 0;

    allCustomers.forEach(c => {
      const status = calcStatus(c);
      if (status === "paid") totalPaid += c.packageWorth;
      else if (status === "owed") totalOwed += c.packageWorth;
      else if (status === "overdue") {
        totalOwed += c.packageWorth;
        totalOverdue += c.packageWorth;
      }
    });

    animateValue(document.getElementById("totalSales"), 0, totalPaid);
    animateValue(document.getElementById("totalOwed"), 0, totalOwed);
    animateValue(document.getElementById("totalOverdue"), 0, totalOverdue);

    refreshOverdueDashboard();
  } catch (err) {
    console.error("Failed to load customer KPIs", err);
    showToast("Failed to load customer KPIs", "error");
  }
}

// ================= Delivery KPI =================
async function loadDeliveryKPIs() {
  try {
    const res = await getDeliveries();
    const deliveries = res?.data || [];
    animateValue(document.getElementById("totalDeliveries"), 0, deliveries.length, 800, "");

    const totalAmount = deliveries.reduce((sum, d) => sum + (d.amount || 0), 0);
    const kpiAmountEl = document.getElementById("totalDeliveriesAmount");
    if (kpiAmountEl) animateValue(kpiAmountEl, 0, totalAmount, 800, "₦");
  } catch (err) {
    console.error("Failed to load delivery KPIs", err);
    showToast("Failed to load delivery KPIs", "error");
  }
}

// ================= Sales Dashboard =================
let salesChartInstance = null;
let currentAnalyticsView = "monthly";

async function refreshSalesDashboard(view = currentAnalyticsView) {
  currentAnalyticsView = view;
  try {
    const res = await getSalesAnalytics(view);
    const data = res?.data || {};
    if (!data.labels || !data.values) return;

    const totalSales = data.values.reduce((sum, val) => sum + val, 0);
    animateValue(document.getElementById("totalSales"), 0, totalSales);

    const ctxEl = document.getElementById("salesChart");
    if (!ctxEl) return;
    const ctx = ctxEl.getContext("2d");

    const gradient = ctx.createLinearGradient(0, 0, 0, ctxEl.height);
    gradient.addColorStop(0, "rgba(76, 175, 239, 0.4)");
    gradient.addColorStop(1, "rgba(76, 175, 239, 0)");

    if (salesChartInstance) {
      salesChartInstance.data.labels = data.labels;
      salesChartInstance.data.datasets[0].data = data.values;
      salesChartInstance.data.datasets[0].backgroundColor = gradient;
      salesChartInstance.update();
    } else {
      salesChartInstance = new Chart(ctx, {
        type: "line",
        data: {
          labels: data.labels,
          datasets: [{
            label: "Sales",
            data: data.values,
            borderColor: "#4cafef",
            backgroundColor: gradient,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: "#4cafef"
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true }, x: { grid: { display: false } } }
        }
      });
    }
  } catch (err) {
    console.error("Failed to refresh sales dashboard", err);
    showToast("Failed to load sales dashboard", "error");
  }
}

// ================= Overdue Payment Dashboard =================
let overdueChartInstance = null;

function getOverdueCustomers() {
  return allCustomers.filter(c => calcStatus(c) === "overdue");
}

function refreshOverdueDashboard(view = "monthly") {
  const overdueCustomers = getOverdueCustomers();
  const totalAmount = overdueCustomers.reduce((sum, c) => sum + c.packageWorth, 0);
  const overdueAmountEl = document.getElementById("totalOverduePayments");
  if (overdueAmountEl) animateValue(overdueAmountEl, 0, totalAmount);

  const monthly = Array(12).fill(0);
  const yearly = Array(8).fill(0);
  const currentYear = new Date().getFullYear();
  const lastYears = Array.from({ length: 8 }, (_, i) => currentYear - 7 + i);
  const monthsLabels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  overdueCustomers.forEach(c => {
    const date = new Date(c.paymentDate);
    monthly[date.getMonth()] += c.packageWorth;

    const yearIndex = date.getFullYear() - (currentYear - 7);
    if (yearIndex >= 0 && yearIndex < 8) yearly[yearIndex] += c.packageWorth;
  });

  const labels = view === "monthly" ? monthsLabels : lastYears;
  const dataSet = view === "monthly" ? monthly : yearly;

  const ctxEl = document.getElementById("paymentChart");
  if (!ctxEl) return;
  const ctx = ctxEl.getContext("2d");

  if (overdueChartInstance) {
    overdueChartInstance.data.labels = labels;
    overdueChartInstance.data.datasets[0].data = dataSet;
    overdueChartInstance.update();
  } else {
    overdueChartInstance = new Chart(ctx, {
      type: "line",
      data: { labels, datasets: [{ label: "Overdue Payments", data: dataSet, borderColor: "#dc3545", backgroundColor: "rgba(220,53,69,0.2)", fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: "#dc3545" }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true }, x: { grid: { display: false } } } }
    });
  }
}

// ================= Sidebar Lists =================
async function loadExtraKPIs() {
  try {
    const expiredRes = await getExpiredProducts();
    const expired = expiredRes?.data || [];
    const expiredEl = document.getElementById("quickStats");
    if (expiredEl) expiredEl.innerHTML = expired.length ? expired.map(p => `<li>${p.productName} (expired ${p.expiryDate})</li>`).join("") : "<li>No expired products 🎉</li>";

    const overdueEl = document.getElementById("overduePaymentLists");
    if (overdueEl) {
      const overdue = getOverdueCustomers();
      overdueEl.innerHTML = overdue.length ? overdue.map(o => `<li>${o.customerName} - ₦${o.packageWorth}</li>`).join("") : "<li>No overdue payments 🎉</li>";
    }

    const lowStockRes = await getLowStockProducts();
    const lowStock = lowStockRes?.data || [];
    const lowStockEl = document.getElementById("lowStockList");
    if (lowStockEl) lowStockEl.innerHTML = lowStock.length ? lowStock.map(p => `<li>${p.productName} (${p.stockLevel} left)</li>`).join("") : "<li>All stock levels are fine ✅</li>";

    const topCustomersRes = await getTopCustomersSales();
    const topCustomers = topCustomersRes?.data || [];
    const topCustomersEl = document.getElementById("topCustomers");
    if (topCustomersEl) topCustomersEl.innerHTML = topCustomers.length ? topCustomers.map(c => `<li>${c.name} - ₦${c.totalSpent}</li>`).join("") : "<li>No customer data yet</li>";
  } catch (err) {
    console.error("Failed to load side tables", err);
    showToast("Some side data could not be loaded", "error");
  }
}

// ================= Logout =================
document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  try {
    await logoutUser();
    localStorage.clear();
    showToast("Logged out successfully", "success", 2000);
    setTimeout(() => (window.location.href = "signin.html"), 500);
  } catch (err) {
    console.error("Logout failed", err);
    showToast("Logout failed", "error");
  }
});

// ================= Analytics Tabs =================
function setupAnalyticsTabs() {
  document.querySelectorAll("#salesTabs button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#salesTabs button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      refreshSalesDashboard(btn.dataset.view);
    });
  });

  document.querySelectorAll("#paymentTabs button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#paymentTabs button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      refreshOverdueDashboard(btn.dataset.view);
    });
  });
}

// ================= Init =================
async function initDashboard() {
  loadUserInfo();
  await loadCustomerKPIs();
  await loadDeliveryKPIs();
  refreshSalesDashboard();
  refreshOverdueDashboard();
  loadExtraKPIs();
  setupAnalyticsTabs();
}

// Auto-refresh every 60s
setInterval(() => {
  loadCustomerKPIs();
  loadDeliveryKPIs();
  refreshSalesDashboard();
  refreshOverdueDashboard();
  loadExtraKPIs();
}, 60000);

document.addEventListener("DOMContentLoaded", initDashboard);
