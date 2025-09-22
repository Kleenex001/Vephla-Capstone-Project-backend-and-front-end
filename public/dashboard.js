// dashboard.js
import {
  getDashboardSummary,
  getQuickStats,
  getOverduePayments,
  getLowStockProductsDashboard,
  getTopCustomersDashboard,
  getUserInfo,
  getSalesAnalytics,
  dueToast
} from "./api.js";

// ----------------- Load User Info -----------------
async function loadUserInfo() {
  try {
    const user = await getUserInfo();
    document.getElementById("greetingName").textContent = `Hello, ${user.name || "User"}`;
    document.getElementById("businessName").textContent = user.businessName || "Your Business";
  } catch (err) {
    console.error("Failed to load user info", err);
    dueToast("Error loading user info", "error");
  }
}

// ----------------- Load KPIs -----------------
async function loadSummary() {
  try {
    const data = await getDashboardSummary();
    document.getElementById("totalSales").textContent = `₦${(data.totalSales || 0).toLocaleString()}`;
    document.getElementById("totalOwed").textContent = `₦${(data.totalOwed || 0).toLocaleString()}`;
    document.getElementById("totalDelivery").textContent = data.totalDelivery || 0;
  } catch (err) {
    console.error("Failed to load summary", err);
    dueToast("Error loading dashboard summary", "error");
  }
}

// ----------------- Quick Stats -----------------
async function loadQuickStats() {
  try {
    const stats = await getQuickStats();
    const list = document.getElementById("quickStats");
    list.innerHTML = "";

    stats.forEach(stat => {
      const li = document.createElement("li");
      li.textContent = `${stat.label}: ${stat.value}`;
      list.appendChild(li);
    });
  } catch (err) {
    console.error("Failed to load quick stats", err);
    dueToast("Error loading quick stats", "error");
  }
}

// ----------------- Overdue Payments -----------------
async function loadOverduePayments() {
  try {
    const data = await getOverduePayments();
    const list = document.getElementById("overduePaymentList");
    list.innerHTML = "";

    if (!data || data.length === 0) {
      list.innerHTML = "<li>No overdue payments 🎉</li>";
    } else {
      data.forEach(item => {
        const li = document.createElement("li");
        li.textContent = `${item.customerName} owes ₦${(item.amount || 0).toLocaleString()}`;
        list.appendChild(li);

        // Show toast per overdue payment
        dueToast(`${item.customerName} has an overdue payment of ₦${(item.amount || 0).toLocaleString()}`, "warning");
      });
    }
  } catch (err) {
    console.error("Failed to load overdue payments", err);
    dueToast("Error loading overdue payments", "error");
  }
}

// ----------------- Low Stock -----------------
async function loadLowStock() {
  try {
    const products = await getLowStockProductsDashboard();
    const list = document.getElementById("lowStockList");
    list.innerHTML = "";

    if (!products || products.length === 0) {
      list.innerHTML = "<li>All stock levels are fine ✅</li>";
    } else {
      products.forEach(p => {
        const li = document.createElement("li");
        li.textContent = `${p.name} - Only ${p.stock} left`;
        list.appendChild(li);
      });
    }
  } catch (err) {
    console.error("Failed to load low stock", err);
    dueToast("Error loading low stock products", "error");
  }
}

// ----------------- Top Customers -----------------
async function loadTopCustomers() {
  try {
    const customers = await getTopCustomersDashboard();
    const list = document.getElementById("topCustomers");
    list.innerHTML = "";

    customers.forEach(c => {
      const li = document.createElement("li");
      li.textContent = `${c.name} - ₦${(c.totalSpent || 0).toLocaleString()}`;
      list.appendChild(li);
    });
  } catch (err) {
    console.error("Failed to load top customers", err);
    dueToast("Error loading top customers", "error");
  }
}

// ----------------- Sales Analytics -----------------
async function loadSalesAnalytics(view = "monthly") {
  try {
    const data = await getSalesAnalytics(view);
    const ctx = document.getElementById("salesChart").getContext("2d");

    new Chart(ctx, {
      type: "line",
      data: {
        labels: data.labels,
        datasets: [
          {
            label: "Sales",
            data: data.values,
            borderColor: "#4cafef",
            backgroundColor: "rgba(76, 175, 239, 0.2)",
            fill: true,
            tension: 0.3
          }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  } catch (err) {
    console.error("Failed to load sales analytics", err);
    dueToast("Error loading sales analytics", "error");
  }
}

// ----------------- Payment Analytics -----------------
async function loadPaymentAnalytics(view = "monthly") {
  try {
    const data = await getSalesAnalytics(view, "payments"); // assuming backend supports type
    const ctx = document.getElementById("paymentChart").getContext("2d");

    new Chart(ctx, {
      type: "bar",
      data: {
        labels: data.labels,
        datasets: [
          {
            label: "Overdue Payments",
            data: data.values,
            backgroundColor: "#ff6b6b"
          }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  } catch (err) {
    console.error("Failed to load payment analytics", err);
    dueToast("Error loading payment analytics", "error");
  }
}

// ----------------- Init -----------------
document.addEventListener("DOMContentLoaded", () => {
  loadUserInfo();
  loadSummary();
  loadQuickStats();
  loadOverduePayments();
  loadLowStock();
  loadTopCustomers();
  loadSalesAnalytics("monthly");
  loadPaymentAnalytics("monthly");

  // Tab switching for sales analytics
  document.querySelectorAll("#salesTabs button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#salesTabs button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      loadSalesAnalytics(btn.dataset.view);
    });
  });

  // Tab switching for payment analytics
  document.querySelectorAll("#paymentTabs button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#paymentTabs button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      loadPaymentAnalytics(btn.dataset.view);
    });
  });

  // Logout button
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.clear();
    dueToast("Logged out successfully", "success");
    setTimeout(() => (window.location.href = "index.html"), 1000);
  });
});
