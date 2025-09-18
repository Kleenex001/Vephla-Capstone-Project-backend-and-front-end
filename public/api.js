// api.js
// -------------------- CONFIG --------------------
const BASE_URL = "https://vephla-capstone-project-backend-and.onrender.com/api";

// -------------------- HELPERS --------------------
async function handleFetch(res) {
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text }; // fallback if not JSON
  }

  if (!res.ok) {
    // throw the parsed object instead of Error
    throw data;
  }

  return data;
}


function getAuthToken() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No auth token found. Please login.");
  return token;
}

// -------------------- AUTH --------------------
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

// -------------------- PASSWORD RESET --------------------
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

// -------------------- DASHBOARD --------------------
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

export async function getPendingOrders() {
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

// -------------------- CUSTOMERS --------------------
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

// -------------------- INVENTORY --------------------
export async function getProducts() {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/inventory/products`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleFetch(res);
}

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

// -------------------- DELIVERIES --------------------
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

// -------------------- SUPPLIERS --------------------
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

// -------------------- SALES --------------------

// Helper to normalize enum values
function normalizeEnum(value, type) {
  if (!value) return value;
  const enums = {
    paymentType: ["Cash", "Mobile"],
    status: ["Pending", "Completed"],
  };
  const valid = enums[type].find(e => e.toLowerCase() === value.toLowerCase());
  return valid || value;
}

// Get all sales
export async function getSales() {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/sales`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleFetch(res);
}

// Add a new sale
export async function addSale(sale) {
  const token = getAuthToken();

  // Normalize enums
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

// Update a sale by ID
export async function updateSale(id, data) {
  const token = getAuthToken();

  // Normalize enums
  if (data.paymentType) data.paymentType = normalizeEnum(data.paymentType, "paymentType");
  if (data.status) data.status = normalizeEnum(data.status, "status");

  const res = await fetch(`${BASE_URL}/sales/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return handleFetch(res);
}

// Delete a sale by ID
export async function deleteSale(id) {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/sales/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleFetch(res);
}

// KPI summary
export async function getSalesSummary() {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/sales/summary/kpis`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleFetch(res);
}

// Sales analytics
export async function getSalesAnalytics(view = "monthly") {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/sales/analytics?view=${view}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleFetch(res);
}

// Top customers sales
export async function getTopCustomersSales() {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/sales/top-customers`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleFetch(res);
}

// Top products
export async function getTopProducts() {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/sales/top-products`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleFetch(res);
}


// -------------------- SETTINGS --------------------
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
