import {
  getDashboardSummary,
  getQuickStats,
  getPendingOrders,
  getLowStockProducts,
  getTopCustomers,
  getUserInfo,
  getSalesAnalytics,
} from "./api.js";

// ---------------- Helpers ---------------- //
function createLineChart(ctx, labels, data, color) {
  return new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "",
          data,
          fill: true,
          tension: 0.4,
          borderColor: color,
          backgroundColor: color + "33",
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { x: { display: true }, y: { display: true } },
    },
  });
}

let salesChart;

// ---------------- API Integration ---------------- //
async function fetchDataFromAPI() {
  try {
    const [
      summary,
      quickStats,
      pendingOrders,
      lowStock,
      topCustomers,
      user,
      salesAnalytics,
    ] = await Promise.all([
      getDashboardSummary(),
      getQuickStats(),
      getPendingOrders(),
      getLowStockProducts(),
      getTopCustomers(),
      getUserInfo(),
      getSalesAnalytics(),
    ]);

    return {
      kpis: {
        totalSales: summary.data.totalSales || 0,
        totalOwed: summary.data.totalOwed || 0,
        totalDelivery: summary.data.totalDelivery || 0,
      },
      quickStats: [
        `Total Purchase: ${quickStats.data.totalPurchase}`,
        `Pending Delivery: ${quickStats.data.pendingDelivery}`,
        `Expired Products: ${quickStats.data.expiredProducts}`,
      ],
      pendingOrders: pendingOrders.data.map(
        (o) => `${o.productName} - ${o.status}`
      ),
      lowStock: lowStock.data.map(
        (p) => `${p.name} (Stock: ${p.stockLevel})`
      ),
      topCustomers: topCustomers.data.map((c) => ({
        name: c.name,
        amount: c.totalPurchases,
      })),
      salesAnalytics: salesAnalytics.data,
      user: user.data,
    };
  } catch (err) {
    console.error("❌ Dashboard fetch error:", err);

    // If unauthorized, force logout + redirect
    if (err.message.includes("401") || err.message.includes("403")) {
      localStorage.removeItem("token");
      window.location.href = "signin.html";
    }

    return null;
  }
}

// ---------------- Renderers ---------------- //
function updateGreeting(user) {
  const greetingEl = document.getElementById("greetingHeader");
  if (!greetingEl) return;

  const now = new Date();
  const hours = now.getHours();
  let greeting = "Hello";

  if (hours < 12) greeting = "Good morning";
  else if (hours < 18) greeting = "Good afternoon";
  else greeting = "Good evening";

  greetingEl.textContent = `${greeting}, ${user?.fullName || "User"} ${
    user?.businessName ? "(" + user.businessName + ")" : ""
  }`;
}

function updateKPIs(kpis) {
  document.getElementById("totalSales").textContent =
    kpis.totalSales.toLocaleString();
  document.getElementById("totalOwed").textContent =
    kpis.totalOwed.toLocaleString();
  document.getElementById("totalDelivery").textContent =
    kpis.totalDelivery.toLocaleString();
}

function updateCharts(salesAnalytics) {
  const salesCtx = document.getElementById("salesChart").getContext("2d");

  if (salesChart) salesChart.destroy();

  const labels = salesAnalytics.map((s) => s._id);
  const data = salesAnalytics.map((s) => s.totalSales);

  salesChart = createLineChart(salesCtx, labels, data, "#009879");
}

function updateSidebar(data) {
  document.getElementById("quickStats").innerHTML = data.quickStats
    .map((s) => `<li>${s}</li>`)
    .join("");
  document.getElementById("pendingOrdersList").innerHTML = data.pendingOrders
    .map((o) => `<li>${o}</li>`)
    .join("");
  document.getElementById("lowStockList").innerHTML = data.lowStock
    .map((l) => `<li>${l}</li>`)
    .join("");
  document.getElementById("topCustomers").innerHTML = data.topCustomers
    .map((c) => `<li>${c.name} <span>${c.amount}</span></li>`)
    .join("");
}

// ---------------- Init ---------------- //
async function renderDashboard() {
  // 🔒 Redirect if no token at all
  if (!localStorage.getItem("token")) {
    window.location.href = "signin.html";
    return;
  }

  const data = await fetchDataFromAPI();
  if (!data) return;

  updateGreeting(data.user);
  updateKPIs(data.kpis);
  updateCharts(data.salesAnalytics);
  updateSidebar(data);
}

document.addEventListener("DOMContentLoaded", renderDashboard);
// Logout Functionality
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      window.location.href = "signin.html";
    });
  }

  renderDashboard();
});

