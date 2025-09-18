// sales.js
import {
  getSales,
  addSale,
  updateSale,
  deleteSale,
  completeSale,
  getSalesSummary,
  getSalesAnalytics,
  getTopCustomersSales,
  getTopProductsSales,
  getPendingOrdersSales,
} from "./api.js";

// ----------------- ERROR HANDLER -----------------
function parseServerError(err) {
  try {
    if (!err) return { message: "Unknown error" };
    if (typeof err === "string") return { message: err };

    // Backend likely returns { error: "...", message: "..." }
    return {
      message: err.message || err.error || "An error occurred",
      details: err.details || null,
    };
  } catch {
    return { message: "Failed to parse error" };
  }
}

// ----------------- LOAD SALES -----------------
export async function loadSales() {
  try {
    return await getSales();
  } catch (err) {
    console.error("Failed to load sales:", err);
    throw parseServerError(err);
  }
}

// ----------------- CREATE SALE -----------------
export async function createSale(saleData) {
  try {
    return await addSale(saleData);
  } catch (err) {
    console.error("Failed to add sale:", err);
    throw parseServerError(err);
  }
}

// ----------------- UPDATE SALE -----------------
export async function editSale(id, data) {
  try {
    return await updateSale(id, data);
  } catch (err) {
    console.error("Failed to update sale:", err);
    throw parseServerError(err);
  }
}

// ----------------- DELETE SALE -----------------
export async function removeSale(id) {
  try {
    return await deleteSale(id);
  } catch (err) {
    console.error("Failed to delete sale:", err);
    throw parseServerError(err);
  }
}

// ----------------- COMPLETE SALE -----------------
export async function markSaleComplete(id) {
  try {
    return await completeSale(id);
  } catch (err) {
    console.error("Failed to complete sale:", err);
    throw parseServerError(err);
  }
}

// ----------------- DASHBOARD HELPERS -----------------
export async function fetchSalesSummary() {
  try {
    return await getSalesSummary();
  } catch (err) {
    console.error("Failed to fetch sales summary:", err);
    throw parseServerError(err);
  }
}

export async function fetchSalesAnalytics(view = "monthly") {
  try {
    return await getSalesAnalytics(view);
  } catch (err) {
    console.error("Failed to fetch sales analytics:", err);
    throw parseServerError(err);
  }
}

export async function fetchTopCustomers() {
  try {
    return await getTopCustomersSales();
  } catch (err) {
    console.error("Failed to fetch top customers:", err);
    throw parseServerError(err);
  }
}

export async function fetchTopProducts() {
  try {
    return await getTopProductsSales();
  } catch (err) {
    console.error("Failed to fetch top products:", err);
    throw parseServerError(err);
  }
}

export async function fetchPendingOrders() {
  try {
    return await getPendingOrdersSales();
  } catch (err) {
    console.error("Failed to fetch pending orders:", err);
    throw parseServerError(err);
  }
}
