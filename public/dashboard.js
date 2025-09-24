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
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

async function loadUserInfo() {
  try {
    const res = await getUserInfo();
    const user = res?.data || {};
    const nameEl = document.getElementById("greetingName");
    const businessEl = document.getElementById("businessName");

    const userName = user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User";
    const businessName = user.businessName || "Your Business";

    if (nameEl) nameEl.textContent = `${getGreeting()}, ${userName}`;
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

    // totalPaid replaced by actual sales total
    const analyticsRes = await getSalesAnalytics("monthly");
    const salesValues = analyticsRes?.analytics || Array(12).fill(0);
    const totalSales = salesValues.reduce((sum, val) => sum + val, 0);

    animateValue(document.getElementById("totalSales"), 0, totalSales);
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
    const res = await getSalesAnalytics(view); // real-time sales analytics
    const data = res?.analytics || [];
    if (!data) return;

    const labels = view === "monthly"
      ? ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
      : Object.keys(data);

    const values = view === "monthly"
      ? data
      : Object.values(data);

    // Animate total sales
    const totalSales = values.reduce((sum, val) => sum + val, 0);
    animateValue(document.getElementById("totalSales"), 0, totalSales);

    const ctxEl = document.getElementById("salesChart");
    if (!ctxEl) return;
    const ctx = ctxEl.getContext("2d");

    const gradient = ctx.createLinearGradient(0, 0, 0, ctxEl.height);
    gradient.addColorStop(0, "rgba(76, 239, 176, 0.6)");
    gradient.addColorStop(1, "rgba(76, 239, 190, 0)");

    if (salesChartInstance) {
      salesChartInstance.data.labels = labels;
      salesChartInstance.data.datasets[0].data = values;
      salesChartInstance.data.datasets[0].backgroundColor = gradient;
      salesChartInstance.update();
    } else {
     salesChartInstance = new Chart(ctx, {
  type: "line",
  data: {
    labels,
    datasets: [{
      label: "Sales",
      data: values,
      borderColor: "rgba(76, 175, 239, 0.6)",
      backgroundColor: gradient,
      fill: true,
      tension: 0.4,        // smooth curves
      pointRadius: 0       // remove point markers
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false } 
    },
    scales: { 
      y: { 
        beginAtZero: true, 
        grid: { color: "rgba(0,0,0,0.05)" }  // subtle horizontal grid
      }, 
      x: { 
        grid: { color: "rgba(0,0,0,0.05)" }  // subtle vertical grid
      } 
    },
    elements: {
      line: { borderWidth: 2 }, // thinner line
    }
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
  data: {
    labels,
    datasets: [{
      label: "Overdue Payments",
      data: dataSet,
      borderColor: "rgba(220, 53, 69, 0.6)",
      backgroundColor: "rgba(220,53,69,0.15)",
      fill: true,
      tension: 0.4,
      pointRadius: 0  // remove points
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.05)" } },
      x: { grid: { color: "rgba(0,0,0,0.05)" } }
    },
    elements: { line: { borderWidth: 2 } }
  }
});

  }
}

// ================= Sidebar Lists =================
async function loadExtraKPIs() {
  try {
    const expiredRes = await getExpiredProducts();
    const expired = expiredRes?.data || [];
    const expiredEl = document.getElementById("quickStats");
    if (expiredEl) expiredEl.innerHTML = expired.length
      ? expired.map(p => `<li>${p.productName} (expired ${p.expiryDate})</li>`).join("")
      : "<li>No expired products 🎉</li>";

    const overdueEl = document.getElementById("overduePaymentLists");
    if (overdueEl) {
      const overdue = getOverdueCustomers();
      overdueEl.innerHTML = overdue.length
        ? overdue.map(o => `<li>${o.customerName || o.name} - ₦${o.packageWorth}</li>`).join("")
        : "<li>No overdue payments 🎉</li>";
    }

    const lowStockRes = await getLowStockProducts();
    const lowStock = lowStockRes?.data || [];
    const lowStockEl = document.getElementById("lowStockList");
    if (lowStockEl) lowStockEl.innerHTML = lowStock.length
      ? lowStock.map(p => `<li>${p.productName} (${p.stockLevel} left)</li>`).join("")
      : "<li>All stock levels are fine ✅</li>";

   const topCustomersRes = await getTopCustomersSales();
const topCustomers = topCustomersRes?.data || [];
const topCustomersEl = document.getElementById("topCustomers");

if (topCustomersEl) {
  if (topCustomers.length) {
    topCustomersEl.innerHTML = topCustomers.map(c => {
      const customer = c[0];        // first element = customer object
      const total = c[1] || 0;      // second element = totalSpent
      const name = customer?.name || customer || "Unknown";
      return `<li>${name} - ₦${total.toLocaleString()}</li>`;
    }).join("");
  } else {
    topCustomersEl.innerHTML = "<li>No customer data yet</li>";
  }
}
}catch (error) {
  // Code to handle the error
  console.error("An error occurred:", error);
}}


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
  await loadUserInfo();
  await loadCustomerKPIs();
  await loadDeliveryKPIs();
  await refreshSalesDashboard();
  await refreshOverdueDashboard();
  await loadExtraKPIs();
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
