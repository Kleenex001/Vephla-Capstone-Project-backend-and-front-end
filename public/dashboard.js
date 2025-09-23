// dashboard.js
import {
  getUserInfo,
  getSalesAnalytics,
  logoutUser
} from "./api.js";

// ----------------- Helpers -----------------
function parseServerError(err) {
  try {
    if (!err) return "Unknown error";
    if (typeof err === "string") return err;
    return err.message || err.error || JSON.stringify(err);
  } catch {
    return "Unexpected error";
  }
}

function animateValue(el, start, end, duration = 800) {
  if (!el) return;
  let startTimestamp = null;
  let valueEl = el.querySelector(".amount-value");
  if (!valueEl) {
    valueEl = document.createElement("span");
    valueEl.classList.add("amount-value");
    el.textContent = "₦";
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

// ----------------- Load User Info -----------------
async function loadUserInfo() {
  try {
    const user = await getUserInfo();
    document.getElementById("greetingName").textContent = `Hello, ${user?.name || "User"}`;
    document.getElementById("businessName").textContent = user?.businessName || "Your Business";
  } catch (err) {
    console.error("Failed to load user info", err);
  }
}

// ----------------- Sales Dashboard -----------------
let salesChartInstance = null;
let currentAnalyticsView = "monthly";

export async function refreshSalesDashboard(view = currentAnalyticsView) {
  currentAnalyticsView = view;
  try {
    const data = await getSalesAnalytics(view); // Uses your API /sales/analytics
    if (!data || !data.labels || !data.values) return;

    // Total Sales KPI
    const totalSales = data.values.reduce((sum, val) => sum + val, 0);
    animateValue(document.getElementById("totalSales"), 0, totalSales);

    // Update Chart
    const ctx = document.getElementById("salesChart").getContext("2d");
    if (salesChartInstance) {
      salesChartInstance.data.labels = data.labels;
      salesChartInstance.data.datasets[0].data = data.values;
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
            backgroundColor: "rgba(76, 175, 239, 0.2)",
            fill: true,
            tension: 0.3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } }
        }
      });
    }
  } catch (err) {
    console.error("Failed to refresh sales dashboard", err);
  }
}

// ----------------- Logout -----------------
document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  try {
    await logoutUser();
    localStorage.clear();
    setTimeout(() => (window.location.href = "signin.html"), 500);
  } catch (err) {
    console.error("Logout failed", err);
  }
});

// ----------------- Analytics Tabs -----------------
function setupAnalyticsTabs() {
  document.querySelectorAll("#salesTabs button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#salesTabs button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      refreshSalesDashboard(btn.dataset.view);
    });
  });
}

// ----------------- Init -----------------
document.addEventListener("DOMContentLoaded", () => {
  loadUserInfo();
  refreshSalesDashboard();
  setupAnalyticsTabs();

  // Expose globally so sales.js can call after adding/updating/deleting a sale
  window.refreshDashboard = refreshSalesDashboard;
});
