// -------------------- IMPORTS --------------------
import {
  getSales,
  addSale,
  updateSale,
  deleteSale,
  completeSale,
  getSalesSummary,
  getSalesAnalytics,
  getTopCustomersSales,
  getTopProducts,
  getPendingOrders
} from "./api.js";

// -------------------- GLOBAL --------------------
let currentView = "monthly"; // default view
let salesChart;

// -------------------- LOAD DASHBOARD --------------------
async function loadDashboard() {
  try {
    await Promise.all([
      loadKPIs(),
      loadAnalytics(currentView),
      loadTopCustomers(),
      loadTopProducts(),
      loadPendingOrders()
    ]);
    highlightActiveView();
  } catch (err) {
    console.error("Failed to load dashboard:", err);
  }
}

// -------------------- KPI CARDS --------------------
async function loadKPIs() {
  const kpis = await getSalesSummary();
  document.getElementById("total-sales").textContent = `₦${kpis.totalSales}`;
  document.getElementById("cash-sales").textContent = `₦${kpis.cashSales}`;
  document.getElementById("mobile-sales").textContent = `₦${kpis.mobileSales}`;
  document.getElementById("completed-orders").textContent = kpis.completedOrders;
  document.getElementById("pending-orders").textContent = kpis.pendingOrders;
}

// -------------------- SALES ANALYTICS CHART --------------------
async function loadAnalytics(view = "monthly") {
  const { analytics } = await getSalesAnalytics(view);

  const ctx = document.getElementById("salesChart").getContext("2d");
  if (salesChart) salesChart.destroy();

  const labels = view === "monthly"
    ? ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    : Object.keys(analytics);

  const data = view === "monthly"
    ? analytics
    : Object.values(analytics);

  salesChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: `Sales (${view})`,
        data,
        borderColor: "green",
        backgroundColor: "rgba(0,128,0,0.2)",
        tension: 0.3,
        fill: true,
        pointRadius: 5,
        pointHoverRadius: 7
      }]
    },
    options: {
      responsive: true,
      animation: {
        duration: 1000, // smooth growth
        easing: "easeOutQuart"
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });

  highlightActiveView();
}

// -------------------- TOP CUSTOMERS --------------------
async function loadTopCustomers() {
  const { topCustomers } = await getTopCustomersSales();
  const list = document.getElementById("top-customers");
  list.innerHTML = "";
  topCustomers.forEach(([name, amount]) => {
    const li = document.createElement("li");
    li.textContent = `${name}: ₦${amount}`;
    list.appendChild(li);
  });
}

// -------------------- TOP PRODUCTS --------------------
async function loadTopProducts() {
  const { topProducts } = await getTopProducts();
  const list = document.getElementById("top-products");
  list.innerHTML = "";
  topProducts.forEach(([name, amount]) => {
    const li = document.createElement("li");
    li.textContent = `${name}: ₦${amount}`;
    list.appendChild(li);
  });
}

// -------------------- PENDING ORDERS --------------------
async function loadPendingOrders() {
  const { pending } = await getPendingOrders();
  const list = document.getElementById("pending-orders-list");
  list.innerHTML = "";

  pending.forEach(order => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${order.customerName || "Unknown"}</strong> - ${order.productName} (₦${order.amount})
      <button class="complete-btn" data-id="${order._id}">✔</button>
      <button class="delete-btn" data-id="${order._id}">🗑</button>
    `;
    list.appendChild(li);
  });

  // Attach actions
  document.querySelectorAll(".complete-btn").forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.id;
      await completeSale(id);
      await loadDashboard();
    };
    btn.style.backgroundColor = "darkgreen";
    btn.style.color = "white";
    btn.style.marginLeft = "10px";
  });

  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.onclick = async () => {
      if (confirm("Are you sure you want to delete this order?")) {
        const id = btn.dataset.id;
        await deleteSale(id);
        await loadDashboard();
      }
    };
    btn.style.backgroundColor = "darkred";
    btn.style.color = "white";
    btn.style.marginLeft = "5px";
  });
}

// -------------------- FORM SUBMIT --------------------
document.getElementById("saleForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const sale = {
    productName: document.getElementById("productName").value,
    amount: parseFloat(document.getElementById("amount").value),
    paymentType: document.getElementById("paymentType").value,
    customerName: document.getElementById("customerName").value,
    status: "pending",
    date: new Date()
  };

  await addSale(sale);
  e.target.reset();
  await loadDashboard();
});

// -------------------- TOGGLE VIEW --------------------
document.getElementById("monthlyView").addEventListener("click", () => {
  currentView = "monthly";
  loadAnalytics("monthly");
});

document.getElementById("yearlyView").addEventListener("click", () => {
  currentView = "yearly";
  loadAnalytics("yearly");
});

// -------------------- HIGHLIGHT ACTIVE VIEW --------------------
function highlightActiveView() {
  const monthlyBtn = document.getElementById("monthlyView");
  const yearlyBtn = document.getElementById("yearlyView");

  if (currentView === "monthly") {
    monthlyBtn.classList.add("active-view");
    yearlyBtn.classList.remove("active-view");
  } else {
    yearlyBtn.classList.add("active-view");
    monthlyBtn.classList.remove("active-view");
  }
}

// -------------------- INIT --------------------
document.addEventListener("DOMContentLoaded", loadDashboard);
