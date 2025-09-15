// Fetch Data from Backend API (with dummy fallback)
async function fetchDataFromAPI() {
  try {
    const res = await fetch("/api/dashboard"); // replace with your endpoint
    if (!res.ok) throw new Error("Failed to fetch dashboard data");
    return await res.json();
  } catch (err) {
    console.warn("Dashboard fetch error, using dummy data:", err);

    // Dummy data for simulation (Sales Analytics + Overdue Payments)
    return {
      kpis: {
        totalSales:"3000",
        totalOwed: "40000",
        totalDelivery:"3000",
        salesTrend: {
          labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          data: [1200, 1500, 1800, 1700, 2200, 2500, 2000],
        },
        owedTrend: {
          labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          data: [400, 350, 500, 450, 600, 550, 300],
        },
        deliveryTrend: {
          labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          data: [20, 25, 18, 22, 28, 30, 24],
        },
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
      quickStats: ["Pending delivery:", "Pending purchases: ", "Recent purchases:"],
      pendingOrders: ["", ""],
      lowStock: ["", ""],
      topCustomers: [
        { name: "", amount: "" },
        { name: "", amount: "" },
        { name: "", amount: "" },
      ],
    };
  }
}


// Chart.js Helpers
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
      scales: { x: { display: true }, y: { display: true } }, // keep axes visible
    },
  });
}

let salesChart, paymentChart, sparkSales, sparkOwed, sparkDelivery;


// Render Functions
function updateKPIs(kpis) {
  document.getElementById("totalSales").textContent = kpis.totalSales.toLocaleString();
  document.getElementById("totalOwed").textContent = kpis.totalOwed.toLocaleString();
  document.getElementById("totalDelivery").textContent = kpis.totalDelivery.toLocaleString();

  
}

function updateCharts(sales, payments) {
  const salesCtx = document.getElementById("salesChart").getContext("2d");
  const paymentCtx = document.getElementById("paymentChart").getContext("2d");

  if (salesChart) salesChart.destroy();
  if (paymentChart) paymentChart.destroy();

  // Default view = monthly
  salesChart = createLineChart(salesCtx, sales.monthly.labels, sales.monthly.data, "#009879");
  paymentChart = createLineChart(paymentCtx, payments.monthly.labels, payments.monthly.data, "#ff9800");

  // Tabs
  document.querySelectorAll("#salesTabs button").forEach((btn) => {
    btn.onclick = () => {
      document.querySelectorAll("#salesTabs button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const view = btn.dataset.view;
      updateChart(salesChart, sales[view].labels, sales[view].data);
    };
  });

  document.querySelectorAll("#paymentTabs button").forEach((btn) => {
    btn.onclick = () => {
      document.querySelectorAll("#paymentTabs button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const view = btn.dataset.view;
      updateChart(paymentChart, payments[view].labels, payments[view].data);
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


// Main Renderer
async function renderDashboard() {
  const data = await fetchDataFromAPI();
  if (!data) return;

  updateKPIs(data.kpis);
  updateCharts(data.sales, data.payments);
  updateSidebar(data);
}


// Init
document.addEventListener("DOMContentLoaded", renderDashboard);
