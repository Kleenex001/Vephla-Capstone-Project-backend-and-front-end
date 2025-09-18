// sales.js
import {
  getSales,
  addSale,
  updateSale,
  deleteSale as deleteSaleAPI,
  getSalesAnalytics,
  getTopCustomersSales,
  getTopProducts,
} from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  // -------------------- MODAL --------------------
  const modal = document.getElementById("addSaleModal");
  const addSaleBtn = document.getElementById("addSaleBtn");
  const closeModal = modal?.querySelector(".close");
  const addSaleForm = document.getElementById("addSaleForm");

  if (addSaleBtn && modal) {
    addSaleBtn.addEventListener("click", () => (modal.style.display = "block"));
  }
  if (closeModal) closeModal.addEventListener("click", () => (modal.style.display = "none"));
  window.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  // -------------------- TOAST --------------------
  const toastContainer = document.createElement("div");
  toastContainer.id = "toastContainer";
  toastContainer.style.position = "fixed";
  toastContainer.style.top = "20px";
  toastContainer.style.right = "20px";
  toastContainer.style.zIndex = "9999";
  toastContainer.style.display = "flex";
  toastContainer.style.flexDirection = "column";
  toastContainer.style.gap = "10px";
  document.body.appendChild(toastContainer);

  function showToast(message, type = "success", duration = 3000) {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toast.style.padding = "12px 20px";
    toast.style.borderRadius = "6px";
    toast.style.color = "#fff";
    toast.style.minWidth = "200px";
    toast.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    toast.style.transition = "all 0.3s ease";

    toast.style.backgroundColor = type === "success" ? "#28a745" :
                                  type === "error" ? "#dc3545" :
                                  type === "info" ? "#17a2b8" : "#333";

    toastContainer.appendChild(toast);
    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateX(0)";
    });
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(100%)";
      toast.addEventListener("transitionend", () => toast.remove());
    }, duration);
  }

  // -------------------- ELEMENTS --------------------
  const totalSalesEl = document.getElementById("totalSales");
  const cashSalesEl = document.getElementById("cashSales");
  const mobileSalesEl = document.getElementById("mobileSales");
  const completedOrdersEl = document.getElementById("completedOrders");
  const productTableBody = document.getElementById("productTableBody");
  const pendingOrdersList = document.getElementById("pendingOrdersList");
  const topCustomersList = document.getElementById("topCustomers");
  const topSellingProductsBody = document.getElementById("topSellingProducts");
  const filterSelect = document.getElementById("filterSelect");
  const searchInput = document.getElementById("searchInput");

  // -------------------- SALES CHART --------------------
  const ctx = document.getElementById("salesAnalyticsChart")?.getContext("2d");
  let salesChart = ctx ? new Chart(ctx, {
    type: "line",
    data: { labels: [], datasets: [{ label: "Sales", data: [], borderColor: "#007bff", backgroundColor: "rgba(0,123,255,0.2)", tension: 0.4, fill: true }] },
    options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
  }) : null;

  let currentView = "monthly";
  const monthlyTab = document.getElementById("monthlyTab");
  const yearlyTab = document.getElementById("yearlyTab");

  monthlyTab?.addEventListener("click", () => {
    currentView = "monthly";
    monthlyTab.classList.add("active");
    yearlyTab.classList.remove("active");
    updateDashboard();
  });
  yearlyTab?.addEventListener("click", () => {
    currentView = "yearly";
    yearlyTab.classList.add("active");
    monthlyTab.classList.remove("active");
    updateDashboard();
  });

  // -------------------- HELPERS --------------------
  let salesData = [];

  function normalizeSaleData(sale) {
    return {
      ...sale,
      paymentType: sale.paymentType?.toLowerCase() === "cash" ? "Cash" : "Mobile",
      status: sale.status?.toLowerCase() === "completed" ? "Completed" : "Pending",
    };
  }

  function applyFilter() {
    let filtered = [...salesData];
    const currentFilter = filterSelect?.value || "all";

    if (currentFilter !== "all") {
      filtered = filtered.filter(s => currentFilter === "pending" ? s.status === "Pending" :
                                       currentFilter === "cash" ? s.paymentType === "Cash" :
                                       s.paymentType === "Mobile");
    }

    const searchTerm = searchInput?.value.trim().toLowerCase() || "";
    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.productName.toLowerCase().includes(searchTerm) ||
        s.customer.toLowerCase().includes(searchTerm)
      );
    }

    return filtered;
  }

  // -------------------- CRUD --------------------
  async function markAsCompleted(id) {
    const sale = salesData.find(s => s._id === id);
    if (!sale || sale.status === "Completed") return;

    try {
      await updateSale(id, { ...sale, status: "Completed" });
      sale.status = "Completed";
      updateDashboard();
      showToast("✅ Sale marked as completed!");
    } catch (err) {
      showToast("❌ Failed to complete sale", "error");
      console.error(err);
    }
  }

  async function deleteSale(id) {
    try {
      await deleteSaleAPI(id);
      salesData = salesData.filter(s => s._id !== id);
      updateDashboard();
      showToast("🗑️ Sale deleted", "info");
    } catch (err) {
      showToast("❌ Failed to delete sale", "error");
      console.error(err);
    }
  }

  // -------------------- FORM --------------------
  addSaleForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newSale = normalizeSaleData({
      productName: document.getElementById("productName")?.value || "",
      amount: parseFloat(document.getElementById("amount")?.value || 0),
      paymentType: document.getElementById("paymentType")?.value || "Cash",
      customer: document.getElementById("customerName")?.value || "",
      status: document.getElementById("status")?.value || "Pending",
    });

    try {
      const createdSale = await addSale(newSale);
      salesData.push(createdSale);
      showToast("✅ Sale added successfully!");
      addSaleForm.reset();
      if (modal) modal.style.display = "none";
      updateDashboard();
    } catch (err) {
      showToast("❌ Failed to add sale", "error");
      console.error(err);
    }
  });

  // -------------------- UPDATES --------------------
  function updateKPIs(filtered) {
    if (!totalSalesEl) return;
    const total = filtered.reduce((sum, s) => sum + s.amount, 0);
    const cash = filtered.filter(s => s.paymentType === "Cash").reduce((sum, s) => sum + s.amount, 0);
    const mobile = filtered.filter(s => s.paymentType === "Mobile").reduce((sum, s) => sum + s.amount, 0);
    const completed = filtered.filter(s => s.status === "Completed").length;

    totalSalesEl.textContent = `₦${total.toLocaleString()}`;
    cashSalesEl.textContent = `₦${cash.toLocaleString()}`;
    mobileSalesEl.textContent = `₦${mobile.toLocaleString()}`;
    completedOrdersEl.textContent = completed;
  }

  function updateProductTable(filtered) {
    if (!productTableBody) return;
    productTableBody.innerHTML = "";

    filtered.forEach((sale, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${sale.productName}</td>
        <td>₦${sale.amount.toLocaleString()}</td>
        <td>${sale.paymentType}</td>
        <td>${sale.customer}</td>
        <td>${sale.status}</td>
        <td>
          <button class="btn delete" data-id="${sale._id}" style="background:red;color:white;">
            <i class="fa fa-trash"></i>
          </button>
        </td>
      `;
      productTableBody.appendChild(row);
    });

    document.querySelectorAll(".btn.delete").forEach(btn => btn.addEventListener("click", () => deleteSale(btn.dataset.id)));
  }

  function updatePendingOrders() {
    if (!pendingOrdersList) return;
    pendingOrdersList.innerHTML = "";

    salesData.filter(s => s.status === "Pending").forEach(sale => {
      const li = document.createElement("li");
      li.innerHTML = `
        ${sale.productName} - ₦${sale.amount.toLocaleString()} (${sale.customer})
        <button class="btn complete-small" data-id="${sale._id}" style="background: darkgreen; color: white; margin-left:10px;">
          <i class="fa fa-check"></i>
        </button>
      `;
      pendingOrdersList.appendChild(li);
    });

    document.querySelectorAll(".btn.complete-small").forEach(btn => btn.addEventListener("click", () => markAsCompleted(btn.dataset.id)));
  }

  async function updateTopCustomers() {
    if (!topCustomersList) return;
    try {
      const data = await getTopCustomersSales();
      topCustomersList.innerHTML = "";
      data.topCustomers.forEach(([name, total]) => {
        const li = document.createElement("li");
        li.textContent = `${name || "Unknown"} - ₦${total.toLocaleString()}`;
        topCustomersList.appendChild(li);
      });
    } catch (err) { console.error(err); }
  }

  async function updateTopProducts() {
    if (!topSellingProductsBody) return;
    try {
      const data = await getTopProducts();
      topSellingProductsBody.innerHTML = "";
      data.topProducts.forEach(([name, total], index) => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${index+1}</td><td>${name}</td><td>₦${total.toLocaleString()}</td>`;
        topSellingProductsBody.appendChild(row);
      });
    } catch (err) { console.error(err); }
  }

  async function updateSalesChart() {
    if (!salesChart) return;
    try {
      const data = await getSalesAnalytics(currentView);
      let labels = [], chartData = [];
      if (currentView === "monthly") {
        labels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        chartData = data.analytics || [];
      } else {
        labels = Object.keys(data.analytics || {});
        chartData = Object.values(data.analytics || {});
      }
      salesChart.data.labels = labels;
      salesChart.data.datasets[0].data = chartData;
      salesChart.update();
    } catch (err) { console.error(err); }
  }

  async function updateDashboard() {
    const filtered = applyFilter();
    updateKPIs(filtered);
    updateProductTable(filtered);
    updatePendingOrders();
    await updateTopCustomers();
    await updateTopProducts();
    await updateSalesChart();
  }

  filterSelect?.addEventListener("change", updateDashboard);
  searchInput?.addEventListener("input", updateDashboard);

  // -------------------- INITIAL LOAD --------------------
  async function fetchSales() {
    try {
      salesData = await getSales();
      updateDashboard();
    } catch (err) {
      showToast("❌ Failed to load sales", "error");
      console.error(err);
    }
  }

  fetchSales();
});
