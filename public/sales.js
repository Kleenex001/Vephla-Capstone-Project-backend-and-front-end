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

  if (addSaleBtn && modal) addSaleBtn.addEventListener("click", () => (modal.style.display = "block"));
  if (closeModal) closeModal.addEventListener("click", () => (modal.style.display = "none"));
  window.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });

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

    switch (type) {
      case "success": toast.style.backgroundColor = "#28a745"; break;
      case "error": toast.style.backgroundColor = "#dc3545"; break;
      case "info": toast.style.backgroundColor = "#17a2b8"; break;
      default: toast.style.backgroundColor = "#333"; break;
    }

    toastContainer.appendChild(toast);
    requestAnimationFrame(() => { toast.style.opacity = "1"; toast.style.transform = "translateX(0)"; });
    setTimeout(() => { toast.style.opacity = "0"; toast.style.transform = "translateX(100%)"; toast.addEventListener("transitionend", () => toast.remove()); }, duration);
  }

  // -------------------- KPI ELEMENTS --------------------
  const totalSalesEl = document.getElementById("totalSales");
  const cashSalesEl = document.getElementById("cashSales");
  const mobileSalesEl = document.getElementById("mobileSales");
  const completedOrdersEl = document.getElementById("completedOrders");

  // -------------------- DASHBOARD ELEMENTS --------------------
  const productTableBody = document.getElementById("productTableBody");
  const pendingOrdersList = document.getElementById("pendingOrdersList");
  const topCustomersList = document.getElementById("topCustomers");
  const topSellingProductsBody = document.getElementById("topSellingProducts");
  const filterSelect = document.getElementById("filterSelect");
  const searchInput = document.getElementById("searchInput");

  // -------------------- SALES CHART --------------------
  const ctx = document.getElementById("salesAnalyticsChart").getContext("2d");
  let salesChart = new Chart(ctx, {
    type: "line",
    data: { labels: [], datasets: [{ label: "Sales", data: [], borderColor: "#007bff", backgroundColor: "rgba(0,123,255,0.2)", tension: 0.4, fill: true }] },
    options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
  });

  let salesData = [];
  let currentView = "monthly";
  const monthlyTab = document.getElementById("monthlyTab");
  const yearlyTab = document.getElementById("yearlyTab");

  if (monthlyTab && yearlyTab) {
    monthlyTab.addEventListener("click", () => { currentView = "monthly"; monthlyTab.classList.add("active"); yearlyTab.classList.remove("active"); updateDashboard(); });
    yearlyTab.addEventListener("click", () => { currentView = "yearly"; yearlyTab.classList.add("active"); monthlyTab.classList.remove("active"); updateDashboard(); });
  }

  // -------------------- HELPERS --------------------
  function normalizeSaleData(sale) {
    return {
      ...sale,
      amount: parseFloat(sale.amount) || 0,
      paymentType: sale.paymentType === "Cash" ? "Cash" : "Mobile",
      status: sale.status === "Completed" ? "Completed" : "Pending",
      customer: sale.customer || "Unknown",
    };
  }

  function applyFilter() {
    let filtered = [...salesData];
    const currentFilter = filterSelect?.value || "all";

    if (currentFilter !== "all") {
      filtered = filtered.filter((s) => currentFilter === "pending" ? s.status === "Pending" : s.paymentType.toLowerCase() === currentFilter);
    }

    const searchTerm = searchInput?.value.trim().toLowerCase() || "";
    if (searchTerm) {
      filtered = filtered.filter((s) => s.productName.toLowerCase().includes(searchTerm) || s.customer.toLowerCase().includes(searchTerm));
    }

    return filtered;
  }

  function updateKPIs(filteredData) {
    const total = filteredData.reduce((sum, s) => sum + s.amount, 0);
    const cash = filteredData.filter((s) => s.paymentType === "Cash").reduce((sum, s) => sum + s.amount, 0);
    const mobile = filteredData.filter((s) => s.paymentType === "Mobile").reduce((sum, s) => sum + s.amount, 0);
    const completed = filteredData.filter((s) => s.status === "Completed").length;

    if(totalSalesEl) totalSalesEl.textContent = `₦${total.toLocaleString()}`;
    if(cashSalesEl) cashSalesEl.textContent = `₦${cash.toLocaleString()}`;
    if(mobileSalesEl) mobileSalesEl.textContent = `₦${mobile.toLocaleString()}`;
    if(completedOrdersEl) completedOrdersEl.textContent = completed;
  }

  // -------------------- CRUD --------------------
  async function fetchSales() {
    try {
      salesData = (await getSales()).map(normalizeSaleData);
      updateDashboard();
    } catch (err) { console.error(err); showToast("❌ Failed to load sales", "error"); }
  }

  if(addSaleForm){
    addSaleForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const newSale = normalizeSaleData({
        productName: document.getElementById("productName")?.value.trim(),
        amount: parseFloat(document.getElementById("amount")?.value),
        paymentType: document.getElementById("paymentType")?.value,
        customer: document.getElementById("customerName")?.value.trim(),
        status: document.getElementById("status")?.value,
      });
      try {
        const created = await addSale(newSale);
        salesData.push(normalizeSaleData(created));
        showToast("✅ Sale added successfully!");
        addSaleForm.reset();
        if(modal) modal.style.display = "none";
        updateDashboard();
      } catch(err){ console.error(err); showToast("❌ Error adding sale", "error"); }
    });
  }

  async function deleteSale(id){
    try { await deleteSaleAPI(id); salesData = salesData.filter(s => s._id !== id); showToast("🗑️ Sale deleted", "info"); updateDashboard(); } 
    catch(err){ console.error(err); showToast("❌ Failed to delete sale", "error"); }
  }

  async function markAsCompleted(id){
    const sale = salesData.find(s => s._id === id);
    if(!sale || sale.status === "Completed") return;
    try{
      const updated = {...sale, status:"Completed"};
      await updateSale(id, updated);
      sale.status = "Completed";
      showToast("✅ Sale completed!", "success");
      updateDashboard();
    }catch(err){ console.error(err); showToast("❌ Failed to mark complete", "error"); }
  }

  // -------------------- SIDEBAR & TABLE --------------------
  function updateProductTable(filtered){
    if(!productTableBody) return;
    productTableBody.innerHTML = "";
    filtered.forEach((s,i)=>{
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${i+1}</td>
        <td>${s.productName}</td>
        <td>₦${s.amount.toLocaleString()}</td>
        <td>${s.paymentType}</td>
        <td>${s.customer}</td>
        <td>${s.status}</td>
        <td>
          <button class="btn delete" data-id="${s._id}" style="background:red;color:#fff;border:none;padding:4px 8px;border-radius:4px;"><i class="fa fa-trash"></i></button>
        </td>
      `;
      productTableBody.appendChild(row);
    });
    document.querySelectorAll(".btn.delete").forEach(btn => btn.addEventListener("click", ()=>deleteSale(btn.dataset.id)));
  }

  function updatePendingOrders(){
    if(!pendingOrdersList) return;
    pendingOrdersList.innerHTML = "";
    salesData.filter(s=>s.status==="Pending").forEach(s=>{
      const li = document.createElement("li");
      li.innerHTML = `${s.productName} - ₦${s.amount.toLocaleString()} (${s.customer}) <button class="complete-btn" data-id="${s._id}" style="background:#006400;color:#fff;border:none;padding:4px 6px;border-radius:4px;margin-left:8px;"><i class="fa fa-check"></i></button>`;
      pendingOrdersList.appendChild(li);
    });
    document.querySelectorAll(".complete-btn").forEach(btn=>btn.addEventListener("click", ()=>markAsCompleted(btn.dataset.id)));
  }

  async function updateTopCustomers(){
    if(!topCustomersList) return;
    try{
      const data = await getTopCustomersSales();
      topCustomersList.innerHTML="";
      data.topCustomers.forEach(([name,total])=>{
        const li = document.createElement("li");
        li.textContent = `${name} - ₦${total.toLocaleString()}`;
        topCustomersList.appendChild(li);
      });
    }catch(err){ console.error(err); }
  }

  async function updateTopProducts(){
    if(!topSellingProductsBody) return;
    try{
      const data = await getTopProducts();
      topSellingProductsBody.innerHTML="";
      data.topProducts.forEach(([name,total],i)=>{
        const row = document.createElement("tr");
        row.innerHTML=`<td>${i+1}</td><td>${name}</td><td>₦${total.toLocaleString()}</td>`;
        topSellingProductsBody.appendChild(row);
      });
    }catch(err){ console.error(err); }
  }

  async function updateSalesChart(){
    try{
      const data = await getSalesAnalytics(currentView);
      let labels=[], chartData=[];
      if(currentView==="monthly"){
        labels=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        chartData=data.analytics;
      }else{
        labels=Object.keys(data.analytics);
        chartData=Object.values(data.analytics);
      }
      salesChart.data.labels=labels;
      salesChart.data.datasets[0].data=chartData;
      salesChart.update();
    }catch(err){ console.error(err); }
  }

  async function updateDashboard(){
    const filtered = applyFilter();
    updateKPIs(filtered);
    updateProductTable(filtered);
    updatePendingOrders();
    await updateTopCustomers();
    await updateTopProducts();
    await updateSalesChart();
  }

  if(filterSelect) filterSelect.addEventListener("change", updateDashboard);
  if(searchInput) searchInput.addEventListener("input", updateDashboard);

  // -------------------- INITIAL LOAD --------------------
  fetchSales();
});
