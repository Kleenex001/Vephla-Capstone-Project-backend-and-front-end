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

// ----------------- Toast -----------------
function showToast(message, type = "info", duration = 3000) {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    Object.assign(container.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      gap: "10px",
    });
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.textContent = message;
  Object.assign(toast.style, {
    padding: "8px 12px",
    borderRadius: "6px",
    color: "#fff",
    background: type === "success" ? "#28a745" :
                type === "error" ? "#dc3545" :
                type === "info" ? "#17a2b8" : "#ffc107",
    opacity: 0,
    transform: "translateX(12px)",
    transition: "all .3s ease",
  });

  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateX(0)";
  });

  setTimeout(() => {
    toast.style.opacity = 0;
    toast.style.transform = "translateX(12px)";
    toast.addEventListener("transitionend", () => toast.remove(), { once: true });
  }, duration);
}

// ----------------- Load User Info -----------------
async function loadUserInfo() {
  try {
    const res = await getUserInfo();
    console.log("getUserInfo response:", res);

    const user = res?.data || {};
    const userName = user.name || "User";
    const businessName = user.businessName || "Your Business";

    const nameEl = document.getElementById("greetingName");
    const businessEl = document.getElementById("businessName");

    if (nameEl) nameEl.textContent = `Hello, ${userName}`;
    if (businessEl) businessEl.textContent = businessName;

    showToast(`Welcome back, ${userName} of ${businessName}!`, "success", 4000);
  } catch (err) {
    console.error("Failed to load user info:", err);
    showToast("Unable to fetch user info", "error");
  }
}

// ----------------- Sales Dashboard -----------------
let salesChartInstance = null;
let currentAnalyticsView = "monthly";

export async function refreshSalesDashboard(view = currentAnalyticsView) {
  currentAnalyticsView = view;
  try {
    const data = await getSalesAnalytics(view);
    if (!data || !data.labels || !data.values) return;

    // Total Sales KPI
    const totalSales = data.values.reduce((sum, val) => sum + val, 0);
    const totalSalesEl = document.getElementById("totalSales");
    if (totalSalesEl) animateValue(totalSalesEl, 0, totalSales);

    showToast("Sales dashboard updated", "info", 2000);

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
    showToast("Failed to load sales dashboard", "error");
  }
}

// ----------------- Logout -----------------
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

  // Expose globally
  window.refreshDashboard = refreshSalesDashboard;
});
