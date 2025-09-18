// sales.js
import {
  getSales,
  addSale as addSaleAPI,
  updateSale as updateSaleAPI,
  deleteSale as deleteSaleAPI,
  getSalesSummary,
  getTopCustomersSales,
  getTopProducts,
} from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("addSaleModal");
  const addSaleBtn = document.getElementById("addSaleBtn");
  const closeModal = modal.querySelector(".close");
  const addSaleForm = document.getElementById("addSaleForm");

  const totalSalesEl = document.getElementById("totalSales");
  const cashSalesEl = document.getElementById("cashSales");
  const mobileSalesEl = document.getElementById("mobileSales");
  const pendingOrdersEl = document.getElementById("pendingOrders");

  const productTableBody = document.getElementById("productTableBody");
  const pendingOrdersList = document.getElementById("pendingOrdersList");
  const topCustomersList = document.getElementById("topCustomers");
  const topSellingProductsBody = document.getElementById("topSellingProducts");

  const filterSelect = document.getElementById("filterSelect");
  const searchInput = document.getElementById("searchInput");

  let salesData = [];
  let currentFilter = "all";
  let currentView = "monthly";

  const ctx = document.getElementById("salesAnalyticsChart").getContext("2d");
  let salesChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Sales",
          data: [],
          borderColor: "#007bff",
          backgroundColor: "rgba(0, 123, 255, 0.2)",
          tension: 0.4,
          fill: true,
        },
      ],
    },
    options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
  });

  const monthlyTab = document.getElementById("monthlyTab");
  const yearlyTab = document.getElementById("yearlyTab");

  monthlyTab.addEventListener("click", () => {
    currentView = "monthly";
    monthlyTab.classList.add("active");
    yearlyTab.classList.remove("active");
    updateChart();
  });

  yearlyTab.addEventListener("click", () => {
    currentView = "yearly";
    yearlyTab.classList.add("active");
    monthlyTab.classList.remove("active");
    updateChart();
  });

  function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  addSaleBtn.addEventListener("click", () => (modal.style.display = "block"));
  closeModal.addEventListener("click", () => (modal.style.display = "none"));
  window.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });

  // --- API Integration ---
  async function loadSales() {
    try {
      salesData = await getSales() || [];
      updateDashboard();
    } catch (err) {
      console.error("Failed to load sales:", err);
      showToast("⚠️ Could not fetch sales data", "error");
    }
  }

 async function addSale(newSale) {
    try {
      // Convert to uppercase to match backend enums
      // Use the correct backend enum values
      newSale.paymentType = "cash_payment"; // Replace with the actual valid enum value
      newSale.status = "pending_status"; // Replace with the actual valid enum value

      await addSaleAPI(newSale);
      await loadSales();
      showToast("✅ Sale added successfully!");
    } catch (err) {
      console.error("Failed to add sale:", err);
      showToast("⚠️ Failed to add sale", "error");
    }
  }


  async function deleteSale(id) {
    try {
      await deleteSaleAPI(id);
      await loadSales();
      showToast("🗑️ Sale deleted successfully", "info");
    } catch (err) {
      console.error("Failed to delete sale:", err);
      showToast("⚠️ Failed to delete sale", "error");
    }
  }

  async function markAsCompleted(id) {
    try {
      await updateSaleAPI(id, { status: "COMPLETED" });
      await loadSales();
      showToast("✅ Sale marked as completed!");
    } catch (err) {
      console.error("Failed to update sale:", err);
      showToast("⚠️ Could not update sale", "error");
    }
  }

  addSaleForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const newSale = {
      productName: document.getElementById("productName").value.trim(),
      amount: parseFloat(document.getElementById("amount").value),
      paymentType: document.getElementById("paymentType").value,
      customerName: document.getElementById("customerName").value.trim(),
      status: document.getElementById("status").value,
      date: new Date().toISOString(),
    };
    addSale(newSale);
    addSaleForm.reset();
    modal.style.display = "none";
  });

  async function updateKPIs() {
    try {
      const summary = await getSalesSummary() || {};
      totalSalesEl.textContent = `₦${summary.total?.toLocaleString() ?? 0}`;
      cashSalesEl.textContent = `₦${summary.cash?.toLocaleString() ?? 0}`;
      mobileSalesEl.textContent = `₦${summary.mobile?.toLocaleString() ?? 0}`;
      pendingOrdersEl.textContent = summary.pending ?? 0;
    } catch (err) {
      console.error("Failed to fetch KPI summary:", err);
    }
  }

  function updateProductTable(filteredData) {
    productTableBody.innerHTML = "";
    filteredData.forEach((sale, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${sale.productName}</td>
        <td>₦${sale.amount.toLocaleString()}</td>
        <td>${sale.paymentType}</td>
        <td>${sale.customerName}</td>
        <td>${sale.status}</td>
        <td>
          ${sale.status === "PENDING" ? `<button class="btn complete" data-id="${sale._id}"><i class="fa fa-check"></i> Complete</button>` : ""}
          <button class="btn delete" data-id="${sale._id}"><i class="fa fa-trash"></i> Delete</button>
        </td>
      `;
      productTableBody.appendChild(row);
    });

    document.querySelectorAll(".btn.delete").forEach((btn) => btn.addEventListener("click", () => deleteSale(btn.dataset.id)));
    document.querySelectorAll(".btn.complete").forEach((btn) => btn.addEventListener("click", () => markAsCompleted(btn.dataset.id)));
  }

  function updatePendingOrders(filteredData) {
    pendingOrdersList.innerHTML = "";
    filteredData.filter((s) => s.status === "PENDING").forEach((sale) => {
      const li = document.createElement("li");
      li.textContent = `${sale.productName} `;
      const span = document.createElement("span");
      span.textContent = `₦${sale.amount.toLocaleString()}`;
      li.appendChild(span);
      pendingOrdersList.appendChild(li);
    });
  }

  async function updateTopCustomers() {
    try {
      const customers = Array.isArray(await getTopCustomersSales()) ? await getTopCustomersSales() : [];
      topCustomersList.innerHTML = "";
      customers.slice(0, 5).forEach((c) => {
        const li = document.createElement("li");
        li.textContent = `${c.customerName} `;
        const span = document.createElement("span");
        span.textContent = `₦${c.totalSpent.toLocaleString()}`;
        li.appendChild(span);
        topCustomersList.appendChild(li);
      });
    } catch (err) {
      console.error("Failed to fetch top customers:", err);
    }
  }

  async function updateTopProducts() {
    try {
      const products = Array.isArray(await getTopProducts()) ? await getTopProducts() : [];
      topSellingProductsBody.innerHTML = "";
      products.slice(0, 5).forEach((p, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${index + 1}</td>
          <td>${p.productName}</td>
          <td>₦${p.totalSold.toLocaleString()}</td>
        `;
        topSellingProductsBody.appendChild(row);
      });
    } catch (err) {
      console.error("Failed to fetch top products:", err);
    }
  }

  function updateChart(filteredData = salesData) {
    if (currentView === "monthly") {
      const monthlyTotals = new Array(12).fill(0);
      filteredData.forEach((sale) => { monthlyTotals[new Date(sale.date).getMonth()] += sale.amount; });
      salesChart.data.labels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      salesChart.data.datasets[0].data = monthlyTotals;
    } else {
      const yearlyTotals = {};
      filteredData.forEach((sale) => {
        const year = new Date(sale.date).getFullYear();
        yearlyTotals[year] = (yearlyTotals[year] || 0) + sale.amount;
      });
      const years = Object.keys(yearlyTotals).sort();
      salesChart.data.labels = years;
      salesChart.data.datasets[0].data = years.map((y) => yearlyTotals[y]);
    }
    salesChart.update();
  }

  function applyFilter() {
    let filtered = [...salesData];
    if (currentFilter !== "all") {
      filtered = currentFilter === "pending"
        ? filtered.filter((s) => s.status === "PENDING")
        : filtered.filter((s) => s.paymentType === currentFilter.toUpperCase());
    }
    if (searchInput.value.trim() !== "") {
      filtered = filtered.filter((s) =>
        s.productName.toLowerCase().includes(searchInput.value.toLowerCase()) ||
        s.customerName.toLowerCase().includes(searchInput.value.toLowerCase())
      );
    }
    return filtered;
  }

  filterSelect.addEventListener("change", () => { currentFilter = filterSelect.value; updateDashboard(); });
  searchInput.addEventListener("input", () => updateDashboard());

  function updateDashboard() {
    const filteredData = applyFilter();
    updateKPIs();
    updateProductTable(filteredData);
    updatePendingOrders(filteredData);
    updateTopCustomers();
    updateTopProducts();
    updateChart(filteredData);
  }

  loadSales();
});
