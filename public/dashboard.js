// -------------------- Fetch Data from Backend API --------------------
async function fetchDataFromAPI() {
  try {
    const res = await fetch("/api/dashboard"); // Replace with real endpoint
    if (!res.ok) throw new Error("Failed to fetch dashboard data");
    return await res.json();
  } catch (err) {
    console.warn("Dashboard fetch error, using dummy data:", err);

    // Dummy data with KPI sparklines
    return {
      kpis: {
        totalSales: 3000,
        totalOwed: 40000,
        totalDelivery: 3000,
        sparkSales: [200, 400, 300, 600, 500, 700, 800],
        sparkOwed: [500, 450, 470, 480, 460, 490, 510],
        sparkDelivery: [10, 12, 15, 14, 18, 20, 22],
      },
      sales: {
        monthly: {
          labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
          data: [1200, 2300, 1800, 2500, 3100, 4000],
        },
        yearly: {
          labels: ["2019", "2020", "2021", "2022", "2023", "2024"],
          data: [12000, 15000, 18000, 22000, 30000, 40000],
        },
      },
      payments: {
        monthly: {
          labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
          data: [400, 600, 300, 800, 500, 700],
        },
        yearly: {
          labels: ["2019", "2020", "2021", "2022", "2023", "2024"],
          data: [3000, 4500, 5000, 7000, 8500, 10000],
        },
      },
      quickStats: [
        "Pending delivery: 15",
        "Pending purchases: 7",
        "Expired products: 3",
      ],
      pendingOrders: ["Order #1024 - ₦40,000", "Order #1025 - ₦12,000"],
      lowStock: ["Product A - 2 left", "Product B - 5 left"],
      topCustomers: [
        { name: "John Doe", amount: "₦500,000" },
        { name: "Jane Smith", amount: "₦350,000" },
        { name: "Michael Lee", amount: "₦280,000" },
      ],
    };
  }
}

// -------------------- Chart.js Helpers --------------------
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

// Mini Sparkline Chart
function createSparkline(ctx, data, color) {
  return new Chart(ctx, {
    type: "line",
    data: {
      labels: data.map((_, i) => i + 1), // simple index labels
      datasets: [
        {
          data,
          borderColor: color,
          borderWidth: 1.5,
          fill: false,
          tension: 0.4, // zigzag curve
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      elements: { line: { borderJoinStyle: "round" } },
      scales: {
        x: { display: false },
        y: { display: false },
      },
    },
  });
}

let salesChart, paymentChart, sparkSales, sparkOwed, sparkDelivery;

// -------------------- Render Functions --------------------
function updateKPIs(kpis) {
  document.getElementById("totalSales").textContent = kpis.totalSales.toLocaleString();
  document.getElementById("totalOwed").textContent = kpis.totalOwed.toLocaleString();
  document.getElementById("totalDelivery").textContent = kpis.totalDelivery.toLocaleString();

  // Destroy old sparklines if they exist
  if (sparkSales) sparkSales.destroy();
  if (sparkOwed) sparkOwed.destroy();
  if (sparkDelivery) sparkDelivery.destroy();

  // Create sparklines
  sparkSales = createSparkline(document.getElementById("sparkSales").getContext("2d"), kpis.sparkSales, "#009879");
  sparkOwed = createSparkline(document.getElementById("sparkOwed").getContext("2d"), kpis.sparkOwed, "#ff5722");
  sparkDelivery = createSparkline(document.getElementById("sparkDelivery").getContext("2d"), kpis.sparkDelivery, "#3f51b5");
}

function updateCharts(sales, payments) {
  const salesCtx = document.getElementById("salesChart").getContext("2d");
  const paymentCtx = document.getElementById("paymentChart").getContext("2d");

  if (salesChart) salesChart.destroy();
  if (paymentChart) paymentChart.destroy();

  // Default = monthly
  salesChart = createLineChart(salesCtx, sales.monthly.labels, sales.monthly.data, "#009879");
  paymentChart = createLineChart(paymentCtx, payments.monthly.labels, payments.monthly.data, "#ff9800");

  // Sales tabs
  document.querySelectorAll("#salesTabs button").forEach((btn) => {
    btn.onclick = () => {
      document.querySelectorAll("#salesTabs button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      updateChart(salesChart, sales[btn.dataset.view].labels, sales[btn.dataset.view].data);
    };
  });

  // Payments tabs
  document.querySelectorAll("#paymentTabs button").forEach((btn) => {
    btn.onclick = () => {
      document.querySelectorAll("#paymentTabs button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      updateChart(paymentChart, payments[btn.dataset.view].labels, payments[btn.dataset.view].data);
    };
  });
}

function updateChart(chart, labels, data) {
  chart.data.labels = labels;
  chart.data.datasets[0].data = data;
  chart.update();
}

function updateSidebar(data) {
  document.getElementById("quickStats").innerHTML = data.quickStats.map((s) => `<li>${s}</li>`).join("");
  document.getElementById("pendingOrdersList").innerHTML = data.pendingOrders.map((o) => `<li>${o}</li>`).join("");
  document.getElementById("lowStockList").innerHTML = data.lowStock.map((l) => `<li>${l}</li>`).join("");
  document.getElementById("topCustomers").innerHTML = data.topCustomers
    .map((c) => `<li>${c.name} <span>${c.amount}</span></li>`)
    .join("");
}

// -------------------- Main Renderer --------------------
async function renderDashboard() {
  const data = await fetchDataFromAPI();
  if (!data) return;

  updateKPIs(data.kpis);
  updateCharts(data.sales, data.payments);
  updateSidebar(data);
}

// -------------------- Init --------------------
document.addEventListener("DOMContentLoaded", renderDashboard);
