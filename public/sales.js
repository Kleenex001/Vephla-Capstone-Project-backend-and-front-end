import {
  getSales,
  addSale,
  updateSale,
  deleteSale as deleteSaleAPI,
  getTopCustomersSales,
  getTopProducts,
} from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("addSaleModal");
  const addSaleBtn = document.getElementById("addSaleBtn");
  const closeModal = modal.querySelector(".close");
  const addSaleForm = document.getElementById("addSaleForm");

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

  addSaleBtn.addEventListener("click", () => (modal.style.display = "block"));
  closeModal.addEventListener("click", () => (modal.style.display = "none"));
  window.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  const pendingOrdersList = document.getElementById("pendingOrdersList");
  const topCustomersList = document.getElementById("topCustomers");
  const topSellingProductsBody = document.getElementById("topSellingProducts");

  let salesData = [];

  function normalizeSaleData(sale) {
    return {
      ...sale,
      status:
        sale.status === "Completed" || sale.status.toLowerCase() === "completed"
          ? "Completed"
          : "Pending",
    };
  }

  async function fetchSales() {
    try {
      salesData = await getSales();
      updateSidebar();
    } catch (err) {
      console.error(err);
      showToast("❌ Failed to load sales", "error");
    }
  }

  async function markAsCompleted(id) {
    const sale = salesData.find((s) => s._id === id);
    if (!sale || sale.status === "Completed") return;

    const updatedSale = normalizeSaleData({ ...sale, status: "Completed" });
    try {
      await updateSale(id, updatedSale);
      sale.status = "Completed";
      updateSidebar();
      showToast("✅ Sale marked as completed!");
    } catch (err) {
      const errorMessage = err.details
        ? `❌ Sale validation failed: ${err.details}`
        : `❌ ${err.message}`;
      showToast(errorMessage, "error");
      console.error(err);
    }
  }

  async function deleteSale(id) {
    try {
      await deleteSaleAPI(id);
      salesData = salesData.filter((s) => s._id !== id);
      updateSidebar();
      showToast("🗑️ Sale deleted successfully", "info");
    } catch (err) {
      const errorMessage = err.details
        ? `❌ Failed to delete sale: ${err.details}`
        : `❌ ${err.message}`;
      showToast(errorMessage, "error");
      console.error(err);
    }
  }

  addSaleForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const rawPaymentType = document.getElementById("paymentType").value.trim().toLowerCase();
    const rawStatus = document.getElementById("Status").value.trim().toLowerCase();

    const normalizedSale = {
      productName: document.getElementById("productName").value.trim(),
      amount: parseFloat(document.getElementById("amount").value),
      paymentType: rawPaymentType === "cash" ? "Cash" : "Mobile",
      customer: document.getElementById("customerName").value.trim(),
      status: rawStatus === "pending" ? "Pending" : "Completed",
    };

    try {
      const createdSale = await addSale(normalizedSale);
      salesData.push(createdSale);
      showToast("✅ Sale added successfully!");
      addSaleForm.reset();
      modal.style.display = "none";
      updateSidebar();
    } catch (err) {
      const errorMessage = err.details
        ? `❌ Sale validation failed: ${err.details}`
        : `❌ ${err.message || "Unknown error"}`;
      showToast(errorMessage, "error");
      console.error(err);
    }
  });

  // -------------------- SIDEBAR UPDATE --------------------
  function updatePendingOrders() {
    pendingOrdersList.innerHTML = "";
    salesData
      .filter((s) => normalizeSaleData(s).status === "Pending")
      .forEach((sale) => {
        const li = document.createElement("li");
        li.innerHTML = `
          ${sale.productName} - ₦${sale.amount.toLocaleString()} (${sale.customer})
          <button class="btn complete-small" data-id="${sale._id}" style="margin-left:10px;"><i class="fa fa-check"></i></button>
        `;
        pendingOrdersList.appendChild(li);
      });

    document.querySelectorAll(".btn.complete-small").forEach((btn) => {
      btn.addEventListener("click", () => markAsCompleted(btn.dataset.id));
    });
  }

  async function updateTopCustomers() {
    try {
      const data = await getTopCustomersSales();
      topCustomersList.innerHTML = "";
      data.topCustomers.forEach(([name, total]) => {
        const li = document.createElement("li");
        li.textContent = `${name} - ₦${total.toLocaleString()}`;
        topCustomersList.appendChild(li);
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function updateTopProducts() {
    try {
      const data = await getTopProducts();
      topSellingProductsBody.innerHTML = "";
      data.topProducts.forEach(([name, total], index) => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${index + 1}</td><td>${name}</td><td>₦${total.toLocaleString()}</td>`;
        topSellingProductsBody.appendChild(row);
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function updateSidebar() {
    updatePendingOrders();
    await updateTopCustomers();
    await updateTopProducts();
  }

  fetchSales();
});
