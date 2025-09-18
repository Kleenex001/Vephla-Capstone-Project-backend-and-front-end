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
  const modal = document.getElementById("addSaleModal");
  const addSaleBtn = document.getElementById("addSaleBtn");
  const closeModal = modal?.querySelector(".close");
  const addSaleForm = document.getElementById("addSaleForm");

  // ---------------- TOAST ----------------
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

    switch (type) {
      case "success": toast.style.backgroundColor = "#28a745"; break;
      case "error": toast.style.backgroundColor = "#dc3545"; break;
      case "info": toast.style.backgroundColor = "#17a2b8"; break;
      default: toast.style.backgroundColor = "#333"; break;
    }

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

  // ---------------- ELEMENTS ----------------
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

  const ctx = document.getElementById("salesAnalyticsChart")?.getContext("2d");
  let salesChart = ctx ? new Chart(ctx, {
    type: "line",
    data: { labels: [], datasets: [{ label: "Sales", data: [], borderColor: "#007bff", backgroundColor: "rgba(0,123,255,0.2)", tension: 0.4, fill: true }] },
    options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
  }) : null;

  let salesData = [];

  // ---------------- HELPERS ----------------
  function normalizeSaleData(sale) {
    return {
      ...sale,
      paymentType: sale.paymentType?.toLowerCase() === "cash" ? "Cash" : "Mobile",
      status: sale.status?.toLowerCase() === "completed" ? "Completed" : "Pending",
      date: sale.date ? new Date(sale.date) : new Date()
    };
  }

  // ---------------- FETCH ----------------
  async function fetchSales() {
    try {
      salesData = (await getSales()).map(normalizeSaleData);
      await updateDashboard();
    } catch (err) {
      console.error(err);
      showToast("❌ Failed to load sales", "error");
    }
  }

  // ---------------- CRUD ----------------
  async function addNewSale(sale) {
    const newSale = normalizeSaleData({ ...sale, date: new Date().toISOString() });
    try {
      const created = await addSale(newSale);
      salesData.push(normalizeSaleData(created));
      showToast("✅ Sale added successfully!");
      if (addSaleForm) addSaleForm.reset();
      if (modal) modal.style.display = "none";
      await updateDashboard();
    } catch (err) {
      showToast(`❌ ${err.details || err.message}`, "error");
      console.error(err);
    }
  }

  async function deleteSale(id) {
    try {
      await deleteSaleAPI(id);
      salesData = salesData.filter(s => s._id !== id);
      await updateDashboard();
      showToast("🗑️ Sale deleted successfully", "info");
    } catch (err) {
      showToast(`❌ ${err.details || err.message}`, "error");
      console.error(err);
    }
  }

  async function markAsCompleted(id) {
    const sale = salesData.find(s => s._id === id);
    if (!sale || sale.status === "Completed") return;
    sale.status = "Completed";
    try {
      await updateSale(id, sale);
      await updateDashboard();
      showToast("✅ Sale marked as completed!");
    } catch (err) {
      showToast(`❌ ${err.details || err.message}`, "error");
      console.error(err);
    }
  }

  // ---------------- UPDATE DASHBOARD ----------------
  function updateKPIs(filteredData) {
    if (!totalSalesEl || !cashSalesEl || !mobileSalesEl || !completedOrdersEl) return;

    const total = filteredData.reduce((sum, s) => sum + s.amount, 0);
    const cash = filteredData.filter(s => s.paymentType === "Cash").reduce((sum, s) => sum + s.amount, 0);
    const mobile = filteredData.filter(s => s.paymentType === "Mobile").reduce((sum, s) => sum + s.amount, 0);
    const completed = filteredData.filter(s => s.status === "Completed").length;

    totalSalesEl.textContent = `₦${total.toLocaleString()}`;
    cashSalesEl.textContent = `₦${cash.toLocaleString()}`;
    mobileSalesEl.textContent = `₦${mobile.toLocaleString()}`;
    completedOrdersEl.textContent = completed;
  }

  function updatePendingOrders() {
    if (!pendingOrdersList) return;
    pendingOrdersList.innerHTML = "";
    salesData.filter(s => s.status === "Pending").forEach(sale => {
      const li = document.createElement("li");
      li.innerHTML = `
        ${sale.productName} - ₦${sale.amount.toLocaleString()} (${sale.customer})
        <button class="complete-btn" data-id="${sale._id}" style="margin-left:10px;">✔</button>
      `;
      pendingOrdersList.appendChild(li);
    });

    document.querySelectorAll(".complete-btn").forEach(btn => {
      btn.onclick = () => markAsCompleted(btn.dataset.id);
    });
  }

  function updateProductTable(filteredData) {
    if (!productTableBody) return;
    productTableBody.innerHTML = "";
    filteredData.forEach((sale, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${sale.productName}</td>
        <td>₦${sale.amount.toLocaleString()}</td>
        <td>${sale.paymentType}</td>
        <td>${sale.customer}</td>
        <td>${sale.status}</td>
        <td>
          ${sale.status === "Pending" ? `<button class="complete-btn" data-id="${sale._id}">✔</button>` : ""}
          <button class="delete-btn" data-id="${sale._id}">🗑</button>
        </td>
      `;
      productTableBody.appendChild(row);
    });

    document.querySelectorAll(".complete-btn").forEach(btn => btn.onclick = () => markAsCompleted(btn.dataset.id));
    document.querySelectorAll(".delete-btn").forEach(btn => btn.onclick = () => deleteSale(btn.dataset.id));
  }

  async function updateTopCustomers() {
    if (!topCustomersList) return;
    try {
      const data = await getTopCustomersSales();
      topCustomersList.innerHTML = "";
      data.topCustomers.forEach(([name, total]) => {
        const li = document.createElement("li");
        li.textContent = `${name} - ₦${total.toLocaleString()}`;
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
        row.innerHTML = `<td>${index + 1}</td><td>${name}</td><td>₦${total.toLocaleString()}</td>`;
        topSellingProductsBody.appendChild(row);
      });
    } catch (err) { console.error(err); }
  }

  async function updateSalesChart() {
    if (!salesChart) return;
    try {
      const data = await getSalesAnalytics("monthly"); // or "yearly" if needed
      salesChart.data.labels = Object.keys(data.analytics);
      salesChart.data.datasets[0].data = Object.values(data.analytics);
      salesChart.update();
    } catch (err) { console.error(err); }
  }

  async function updateDashboard() {
    const filtered = [...salesData]; // or apply filter/search if needed
    updateKPIs(filtered);
    updateProductTable(filtered);
    updatePendingOrders();
    await updateTopCustomers();
    await updateTopProducts();
    await updateSalesChart();
  }

  // ---------------- EVENTS ----------------
  if (addSaleBtn && modal) addSaleBtn.onclick = () => modal.style.display = "block";
  if (closeModal) closeModal.onclick = () => modal.style.display = "none";
  window.onclick = e => { if (e.target === modal) modal.style.display = "none"; };

  if (addSaleForm) {
    addSaleForm.onsubmit = e => {
      e.preventDefault();
      addNewSale({
        productName: document.getElementById("productName")?.value.trim() || "",
        amount: parseFloat(document.getElementById("amount")?.value || 0),
        paymentType: document.getElementById("paymentType")?.value || "Cash",
        customer: document.getElementById("customerName")?.value.trim() || "",
        status: document.getElementById("status")?.value || "Pending",
      });
    };
  }

  // Initial load
  fetchSales();
});
