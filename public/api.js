// api.js
// =================================================
// CONFIG
// =================================================
const BASE_URL = "https://vephla-capstone-project-backend-and.onrender.com/api";

// =================================================
// HELPERS
// =================================================
async function handleFetch(res) {
  const text = await res.text();

  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text || "Invalid JSON response" };
  }

  if (!res.ok) {
    throw data;
  }
  return data;
}

function getAuthToken() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No auth token found. Please login.");
  return token;
}

// =================================================
// AUTH
// =================================================
export async function loginUser(email, password) {
  const res = await fetch(`${BASE_URL}/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await handleFetch(res);
  localStorage.setItem("token", data.token);
  return data;
}

export async function signupUser(userData) {
  const res = await fetch(`${BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  return handleFetch(res);
}

export function logoutUser() {
  localStorage.removeItem("token");
}

// =================================================
// PASSWORD RESET
// =================================================
export async function requestPasswordReset(email) {
  const res = await fetch(`${BASE_URL}/auth/request-password-reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return handleFetch(res);
}

export async function resetPassword(email, otp, newPassword) {
  const res = await fetch(`${BASE_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp, newPassword }),
  });
  return handleFetch(res);
}

// =================================================
// DASHBOARD
// =================================================
export async function getDashboardSummary() {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/dashboard/summary`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleFetch(res);
}

export async function getQuickStats() {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/dashboard/quick-stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleFetch(res);
}

// dashboard pending orders
export async function getPendingOrdersDashboard() {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/dashboard/pending-orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleFetch(res);
}

export async function getLowStockProducts() {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/dashboard/low-stock`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleFetch(res);
}

export async function getTopCustomersDashboard() {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/dashboard/top-customers`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleFetch(res);
}

export async function getUserInfo() {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/dashboard/user-info`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleFetch(res);
}

// =================================================
// CUSTOMERS
// =================================================
export async function getCustomers() {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/customers`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleFetch(res);
}

export async function addCustomer(customer) {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/customers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(customer),
  });
  return handleFetch(res);
}

// =================================================
// INVENTORY
// =================================================
// Get all products
export async function getProducts() {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/inventory/products`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleFetch(res);
}

// Get a single product by ID
export async function getProductById(id) {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/inventory/products/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleFetch(res);
}

// Add a new product
export async function addProduct(product) {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/inventory/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(product),
  });
  return handleFetch(res);
}

// Update an existing product
export async function updateProduct(id, updatedFields) {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/inventory/products/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updatedFields),
  });
  return handleFetch(res);
}

// Delete a product
export async function deleteProduct(id) {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/inventory/products/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleFetch(res);
}

// Get products with low stock
export async function getLowStockProducts() {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/inventory/low-stock`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleFetch(res);
}

// Get expired products
export async function getExpiredProducts() {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/inventory/expired`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleFetch(res);
}
// =================================================
// DELIVERIES
// =================================================
export async function getDeliveries() {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/deliveries`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleFetch(res);
}

export async function addDelivery(delivery) {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/deliveries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(delivery),
  });
  return handleFetch(res);
}

// =================================================
// SUPPLIERS
// =================================================
export async function getSuppliers() {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/suppliers`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleFetch(res);
}

export async function addSupplier(supplier) {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/suppliers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(supplier),
  });
  return handleFetch(res);
}

// =================================================
// SALES
// =================================================

// normalize enums (must match backend lowercase)
function normalizeEnum(value, type) {
  if (!value) return value;
  const enums = {
    paymentType: ["cash", "mobile"],
    status: ["pending", "completed"],
  };
  const valid = enums[type].find(e => e === value.toLowerCase());
  return valid || value.toLowerCase();
}

// get all sales
export async function getSales() {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/sales`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleFetch(res);
}

// add new sale
export async function addSale(sale) {
  const token = getAuthToken();

  sale.paymentType = normalizeEnum(sale.paymentType, "paymentType");
  sale.status = normalizeEnum(sale.status, "status");

  const res = await fetch(`${BASE_URL}/sales`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(sale),
  });
  return handleFetch(res);
}

// update sale
export async function updateSale(id, data) {
  const token = getAuthToken();

  if (data.paymentType) data.paymentType = normalizeEnum(data.paymentType, "paymentType");
  if (data.status) data.status = normalizeEnum(data.status, "status");

  const res = await fetch(`${BASE_URL}/sales/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return handleFetch(res);
}

// delete sale
export async function deleteSale(id) {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/sales/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleFetch(res);
}

// complete sale
export async function completeSale(id) {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/sales/${id}/complete`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleFetch(res);
}

// sales summary
export async function getSalesSummary() {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/sales/summary/kpis`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleFetch(res);
}

// sales analytics
export async function getSalesAnalytics(view = "monthly") {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/sales/analytics?view=${view}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleFetch(res);
}

// sales top customers
export async function getTopCustomersSales() {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/sales/top-customers`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleFetch(res);
}

// sales top products
export async function getTopProductsSales() {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/sales/top-products`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleFetch(res);
}

// sales pending orders
export async function getPendingOrdersSales() {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/sales/pending-orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleFetch(res);
}

// =================================================
// SETTINGS
// =================================================
export async function getSettings() {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/settings`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleFetch(res);
}

export async function saveSettings(settings) {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/settings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(settings),
  });
  return handleFetch(res);
}
