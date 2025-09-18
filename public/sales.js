// sales.js
import {
  getSales,
  addSale,
  updateSale,
  deleteSale as deleteSaleAPI,
  completeSale,
  getSalesSummary,
  getSalesAnalytics,
  getTopCustomersSales,
  getTopProducts,
  getPendingOrders,
} from "./api.js";

function parseServerError(err) {
  // handle Error where err.message might be JSON text from server
  try {
    if (!err) return { message: "Unknown error" };
    const text = typeof err === "string" ? err : err.message;
    if (!text) return { message: "Unknown error" };
    const trimmed = text.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      const obj = JSON.parse(trimmed);
      return { message: obj.error || obj.message || JSON.stringify(obj), details: obj.details || obj };
    }
    return { message: text };
  } catch (e) {
    return { message: err.message || String(err) };
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // ---------- DOM elements ----------
  const modal = document.getElementById("addSaleModal");
  const addSaleBtn = document.getElementById("addSaleBtn");
  const closeModal = modal?.querySelector(".close");
  const addSaleForm = document.getElementById("addSaleForm");

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
  const monthlyTab = document.getElementById("monthlyTab");
  const yearlyTab = document.getElementById("yearlyTab");

  // Chart
  const ctx = document.getElementById("salesAnalyticsChart")?.getContext("2d");
  const salesChart = ctx
    ? new Chart(ctx, {
        type: "line",
        data: { labels: [], datasets: [{ label: "Sales", data: [], borderColor: "#007bff", backgroundColor: "rgba(0,123,255,0.2)", tension: 0.4, fill: true }] },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
      })
    : null;

  // ---------- small UI helpers ----------
  const toastContainer = document.createElement("div");
  toastContainer.id = "toastContainer";
  Object.assign(toastContainer.style, { position: "fixed", top: "20px", right: "20px", zIndex: 9999, display: "flex", flexDirection: "column", gap: "10px" });
  document.body.appendChild(toastContainer);

  function showToast(message, type = "success", duration = 3000) {
    const t = document.createElement("div");
    t.className = `toast ${type}`;
    t.textContent = message;
    Object.assign(t.style, { padding: "10px 14px", borderRadius: "6px", color: "#fff", minWidth: "200px", boxShadow: "0 2px 6px rgba(0,0,0,0.2)", opacity: 0, transform: "translateX(100%)", transition: "all .25s ease" });
    if (type === "success") t.style.backgroundColor = "#28a745";
    if (type === "error") t.style.backgroundColor = "#dc3545";
    if (type === "info") t.style.backgroundColor = "#17a2b8";
    toastContainer.appendChild(t);
    requestAnimationFrame(() => { t.style.opacity = 1; t.style.transform = "translateX(0)"; });
    setTimeout(() => { t.style.opacity = 0; t.style.transform = "translateX(100%)"; t.addEventListener("transitionend", () => t.remove()); }, duration);
  }

  // ---------- normalization utility ----------
  function normalizeForServer(sale) {
    // ensure exact casing server expects
    const payment = (sale.paymentType || "").toString().toLowerCase() === "cash" ? "Cash" : "Mobile";
    const status = (sale.status || "").toString().toLowerCase() === "completed" ? "Completed" : "Pending";
    return { ...sale, paymentType: payment, status };
  }

  // ---------- state ----------
  let salesData = []; // fresh from server

  // ---------- event wiring ----------
  addSaleBtn?.addEventListener("click", () => { if (modal) modal.style.display = "block"; });
  closeModal?.addEventListener("click", () => { if (modal) modal.style.display = "none"; });
  window.addEventListener("click", (e) => { if (e.target === modal && modal) modal.style.display = "none"; });

  monthlyTab?.addEventListener("click", () => { currentView = "monthly"; monthlyTab.classList.add("active"); yearlyTab?.classList.remove("active"); updateDashboard(); });
  yearlyTab?.addEventListener("click", () => { currentView = "yearly"; yearlyTab.classList.add("active"); monthlyTab?.classList.remove("active"); updateDashboard(); });

  filterSelect?.addEventListener("change", updateDashboard);
  searchInput?.addEventListener("input", updateDashboard);

  // default view
  let currentView = "monthly";

  // ---------- core actions ----------
  async function safeCall(fn, ...args) {
    try { return await fn(...args); }
    catch (err) { throw err; }
  }

  async function addNewSaleFromForm() {
    if (!addSaleForm) return;
    try {
      const productName = document.getElementById("productName")?.value?.trim() || "";
      const amountRaw = document.getElementById("amount")?.value || "0";
      const amount = parseFloat(amountRaw) || 0;
      const paymentTypeRaw = document.getElementById("paymentType")?.value || "Cash";
      const customerName = document.getElementById("customerName")?.value?.trim() || "Unknown";
      const statusRaw = document.getElementById("status")?.value || "Pending";

      const payload = normalizeForServer({
        productName,
        amount,
        paymentType: paymentTypeRaw,
        customerName,
        customer: customerName, // send both to be resilient to backend field name
        status: statusRaw,
        date: new Date().toISOString(),
      });

      await safeCall(addSale, payload);
      showToast("✅ Sale added");
      addSaleForm.reset();
      if (modal) modal.style.display = "none";
      await updateDashboard();
    } catch (err) {
      const parsed = parseServerError(err);
      showToast(`❌ Add failed: ${parsed.details || parsed.message}`, "error");
      console.error("Add sale error:", err);
    }
  }

  addSaleForm?.addEventListener("submit", async (e) => { e.preventDefault(); await addNewSaleFromForm(); });

  async function deleteSale(id) {
    if (!confirm("Are you sure you want to delete this sale?")) return;
    try {
      await safeCall(deleteSaleAPI, id);
      showToast("🗑️ Deleted");
      await updateDashboard();
    } catch (err) {
      const parsed = parseServerError(err);
      showToast(`❌ Delete failed: ${parsed.details || parsed.message}`, "error");
      console.error("Delete error:", err);
    }
  }

  async function completeSaleAction(id) {
    // prefer dedicated endpoint if available, fallback to updateSale
    try {
      if (typeof completeSale === "function") {
        await safeCall(completeSale, id);
      } else {
        await safeCall(updateSale, id, { status: "Completed" });
      }
      showToast("✅ Completed");
      await updateDashboard();
    } catch (err) {
      const parsed = parseServerError(err);
      showToast(`❌ Complete failed: ${parsed.details || parsed.message}`, "error");
      console.error("Complete error:", err);
    }
  }

  // ---------- UI update functions ----------
  async function updateKPIs() {
    // prefer summary endpoint, fallback to compute from salesData
    try {
      const summary = await safeCall(getSalesSummary);
      if (totalSalesEl) totalSalesEl.textContent = `₦${(summary.totalSales || 0).toLocaleString()}`;
      if (cashSalesEl) cashSalesEl.textContent = `₦${(summary.cashSales || 0).toLocaleString()}`;
      if (mobileSalesEl) mobileSalesEl.textContent = `₦${(summary.mobileSales || 0).toLocaleString()}`;
      if (completedOrdersEl) completedOrdersEl.textContent = (summary.completedOrders ?? 0);
      return;
    } catch (err) {
      // fallback compute from salesData
    }

    // fallback
    const total = salesData.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
    const cash = salesData.filter((s) => (s.paymentType || "").toLowerCase() === "cash").reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
    const mobile = salesData.filter((s) => (s.paymentType || "").toLowerCase() === "mobile").reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
    const completed = salesData.filter((s) => (s.status || "").toLowerCase() === "completed").length;
    if (totalSalesEl) totalSalesEl.textContent = `₦${total.toLocaleString()}`;
    if (cashSalesEl) cashSalesEl.textContent = `₦${cash.toLocaleString()}`;
    if (mobileSalesEl) mobileSalesEl.textContent = `₦${mobile.toLocaleString()}`;
    if (completedOrdersEl) completedOrdersEl.textContent = completed;
  }

  function getCustomerName(sale) {
    return sale.customerName ?? sale.customer ?? "Unknown";
  }

  function renderProductTable(filtered) {
    if (!productTableBody) return;
    productTableBody.innerHTML = "";
    filtered.forEach((sale, idx) => {
      const tr = document.createElement("tr");
      const customer = getCustomerName(sale);
      tr.innerHTML = `
        <td>${idx + 1}</td>
        <td>${sale.productName || ""}</td>
        <td>₦${(Number(sale.amount) || 0).toLocaleString()}</td>
        <td>${sale.paymentType || ""}</td>
        <td>${customer}</td>
        <td>${sale.status || ""}</td>
        <td>
          <button class="btn delete-row" data-id="${sale._id}" title="Delete" style="background:#dc3545;color:#fff;border:none;padding:6px 8px;border-radius:6px"><i class="fa fa-trash"></i></button>
        </td>
      `;
      productTableBody.appendChild(tr);
    });

    // wire delete handlers
    document.querySelectorAll(".btn.delete-row").forEach((btn) => {
      btn.addEventListener("click", () => deleteSale(btn.dataset.id));
    });
  }

  async function updatePendingSidebar() {
    // try dedicated endpoint, otherwise filter from salesData
    try {
      if (typeof getPendingOrders === "function") {
        const res = await safeCall(getPendingOrders);
        const pending = res.pending || [];
        pendingOrdersList.innerHTML = "";
        pending.forEach((s) => {
          const li = document.createElement("li");
          li.innerHTML = `
            ${s.productName} - ₦${(Number(s.amount) || 0).toLocaleString()} (${s.customerName ?? s.customer ?? "Unknown"})
            <button class="btn complete-small" data-id="${s._id}" title="Complete" style="background:#006400;color:#fff;margin-left:8px;border:none;padding:6px 8px;border-radius:6px"><i class="fa fa-check"></i></button>
            <button class="btn del-small" data-id="${s._id}" title="Delete" style="background:#dc3545;color:#fff;margin-left:6px;border:none;padding:6px 8px;border-radius:6px"><i class="fa fa-trash"></i></button>
          `;
          pendingOrdersList.appendChild(li);
        });
        // wire buttons
        document.querySelectorAll(".btn.complete-small").forEach((b) => b.addEventListener("click", () => completeSaleAction(b.dataset.id)));
        document.querySelectorAll(".btn.del-small").forEach((b) => b.addEventListener("click", () => deleteSale(b.dataset.id)));
        return;
      }
    } catch (err) {
      // endpoint missing or failed -> fallback
      console.warn("getPendingOrders failed, falling back to client-side: ", err);
    }

    // fallback: compute from salesData
    if (!pendingOrdersList) return;
    pendingOrdersList.innerHTML = "";
    salesData.filter((s) => (s.status || "").toLowerCase() === "pending").forEach((s) => {
      const li = document.createElement("li");
      li.innerHTML = `
        ${s.productName} - ₦${(Number(s.amount) || 0).toLocaleString()} (${getCustomerName(s)})
        <button class="btn complete-small" data-id="${s._id}" title="Complete" style="background:#006400;color:#fff;margin-left:8px;border:none;padding:6px 8px;border-radius:6px"><i class="fa fa-check"></i></button>
        <button class="btn del-small" data-id="${s._id}" title="Delete" style="background:#dc3545;color:#fff;margin-left:6px;border:none;padding:6px 8px;border-radius:6px"><i class="fa fa-trash"></i></button>
      `;
      pendingOrdersList.appendChild(li);
    });
    document.querySelectorAll(".btn.complete-small").forEach((b) => b.addEventListener("click", () => completeSaleAction(b.dataset.id)));
    document.querySelectorAll(".btn.del-small").forEach((b) => b.addEventListener("click", () => deleteSale(b.dataset.id)));
  }

  async function updateTopCustomersUI() {
    try {
      const res = await safeCall(getTopCustomersSales);
      topCustomersList.innerHTML = "";
      (res.topCustomers || []).forEach(([name, total]) => {
        const li = document.createElement("li");
        li.textContent = `${name || "Unknown"} - ₦${(Number(total) || 0).toLocaleString()}`;
        topCustomersList.appendChild(li);
      });
    } catch (err) {
      // fallback compute client-side
      topCustomersList.innerHTML = "";
      const map = {};
      salesData.forEach((s) => { const k = getCustomerName(s); map[k] = (map[k] || 0) + (Number(s.amount) || 0); });
      Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,5).forEach(([name, total]) => {
        const li = document.createElement("li");
        li.textContent = `${name} - ₦${(Number(total) || 0).toLocaleString()}`;
        topCustomersList.appendChild(li);
      });
    }
  }

  async function updateTopProductsUI() {
    try {
      const res = await safeCall(getTopProducts);
      topSellingProductsBody.innerHTML = "";
      (res.topProducts || []).forEach(([name, total], i) => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${i+1}</td><td>${name}</td><td>₦${(Number(total) || 0).toLocaleString()}</td>`;
        topSellingProductsBody.appendChild(row);
      });
    } catch (err) {
      topSellingProductsBody.innerHTML = "";
      const map = {};
      salesData.forEach((s)=> { map[s.productName] = (map[s.productName]||0) + (Number(s.amount)||0); });
      Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,5).forEach(([name,total],i)=> {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${i+1}</td><td>${name}</td><td>₦${(Number(total)||0).toLocaleString()}</td>`;
        topSellingProductsBody.appendChild(row);
      });
    }
  }

  async function updateSalesChartUI() {
    // prefer analytics endpoint, fallback compute from salesData
    try {
      const res = await safeCall(getSalesAnalytics, currentView);
      let labels = [], data = [];
      if (currentView === "monthly") {
        labels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        // server may return array or object
        data = Array.isArray(res.analytics) ? res.analytics : (res.analytics && Object.values(res.analytics)) || [];
        // ensure length 12
        if (data.length < 12) {
          const tmp = Array(12).fill(0);
          for (let i=0;i<data.length && i<12;i++) tmp[i] = Number(data[i]||0);
          data = tmp;
        }
      } else {
        if (Array.isArray(res.analytics)) {
          // if array provided for yearly, map to labels indexes
          labels = res.analytics.map((_,i)=>String(i));
          data = res.analytics;
        } else {
          labels = Object.keys(res.analytics || {});
          data = Object.values(res.analytics || {});
        }
      }
      if (salesChart) {
        salesChart.data.labels = labels;
        salesChart.data.datasets[0].data = data;
        salesChart.update();
      }
      return;
    } catch (err) {
      console.warn("getSalesAnalytics failed, falling back to client-side chart compute", err);
    }

    // fallback: compute from salesData
    if (!salesChart) return;
    if (currentView === "monthly") {
      const months = Array(12).fill(0);
      salesData.forEach((s) => {
        const d = new Date(s.date || s.createdAt || s.createdAt || s.createdAt);
        if (!isNaN(d.getTime())) months[d.getMonth()] += Number(s.amount) || 0;
      });
      salesChart.data.labels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      salesChart.data.datasets[0].data = months;
      salesChart.update();
    } else {
      const map = {};
      salesData.forEach((s) => {
        const d = new Date(s.date || s.createdAt || s.createdAt);
        if (!isNaN(d.getTime())) {
          const y = d.getFullYear();
          map[y] = (map[y] || 0) + (Number(s.amount) || 0);
        }
      });
      const years = Object.keys(map).sort();
      salesChart.data.labels = years;
      salesChart.data.datasets[0].data = years.map((y) => map[y]);
      salesChart.update();
    }
  }

  // ---------- main dashboard refresh ----------
  async function updateDashboard() {
    try {
      // fetch fresh sales (used for fallback computations & table filtering)
      salesData = await safeCall(getSales);

      // apply filters when rendering table
      const filtered = (() => {
        const f = (filterSelect?.value || "all");
        let list = [...salesData];
        if (f !== "all") {
          if (f === "pending") list = list.filter(s => (s.status || "").toLowerCase() === "pending");
          else if (f === "cash") list = list.filter(s => (s.paymentType || "").toLowerCase() === "cash");
          else if (f === "mobile") list = list.filter(s => (s.paymentType || "").toLowerCase() === "mobile");
        }
        const term = (searchInput?.value || "").trim().toLowerCase();
        if (term) {
          list = list.filter(s => (s.productName || "").toLowerCase().includes(term) || (getCustomerName(s) || "").toLowerCase().includes(term));
        }
        return list;
      })();

      await updateKPIs();
      renderProductTable(filtered);
      await updatePendingSidebar();
      await updateTopCustomersUI();
      await updateTopProductsUI();
      await updateSalesChartUI();
    } catch (err) {
      const parsed = parseServerError(err);
      showToast(`❌ Dashboard update failed: ${parsed.message}`, "error");
      console.error("updateDashboard error:", err);
    }
  }

  // initial load
  updateDashboard();
});
