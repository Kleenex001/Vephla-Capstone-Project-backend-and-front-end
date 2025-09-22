// api.js

// CONFIG

const BASE_URL = "https://vephla-capstone-project-backend-and.onrender.com/api";


/// ---------- Utility: Handle fetch responses ----------
export async function handleFetch(res) {
  try {
    if (!res.ok) {
      let errorMessage = `Error ${res.status}: ${res.statusText}`;
      try {
        const errorData = await res.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (_) {}
      throw new Error(errorMessage);
    }
    return res.json();
  } catch (err) {
    console.error("API Error:", err.message);
    throw err;
  }
}

// ---------- Auth Helpers ----------
export async function ensureAuthToken() {
  let token = localStorage.getItem("token");

  if (!token) {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      try {
        const res = await fetch(`${BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        const data = await res.json();
        token = data.token || data.accessToken || data.jwt;
        if (token) localStorage.setItem("token", token);
      } catch (err) {
        console.error("Token refresh failed:", err);
      }
    }
  }

  if (!token) {
    localStorage.clear();
    window.location.href = "signin.html";
    return null;
  }

  return token;
}

function getAuthToken() {
  return localStorage.getItem("token");
}

// ---------- Fetch wrapper with auth ----------
export async function fetchWithAuth(url, options = {}) {
  const token = await ensureAuthToken();
  if (!token) throw new Error("No token found");

  options.headers = options.headers || {};
  options.headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, options);
  return handleFetch(res);
}

// 2️⃣ Then define loginUser
export async function loginUser(email, password) {
  const res = await fetch(`${BASE_URL}/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await handleFetch(res); // ✅ now this works
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


// ================== Dashboard APIs ==================

// GET summary (totals: sales, owed, delivery)
export async function getDashboardSummary() {
  return fetchWithAuth(`${BASE_URL}/dashboard/summary`);
}

// GET quick stats (pending delivery, pending orders, expired products)
export async function getQuickStats() {
  return fetchWithAuth(`${BASE_URL}/dashboard/quick-stats`);
}

// GET overdue payments (customers owing money)
export async function getOverduePayments() {
  return fetchWithAuth(`${BASE_URL}/dashboard/overdue-payments`);
}

// GET low stock products
export async function getLowStockProductsDashboard() {
  return fetchWithAuth(`${BASE_URL}/dashboard/low-stock`);
}

// GET top customers
export async function getTopCustomersDashboard() {
  return fetchWithAuth(`${BASE_URL}/dashboard/top-customers`);
}

// GET user info (for greeting: name + business name)
export async function getUserInfo() {
  return fetchWithAuth(`${BASE_URL}/dashboard/user-info`);
}

// Get all customers(customers dashboard)
export async function getCustomers() {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/customers`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return handleFetch(res);
}

// Add a new customer
export async function addCustomer(customer) {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(customer)
  });
  return handleFetch(res);
}

// Update a customer
export async function updateCustomer(id, data) {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/customers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  return handleFetch(res);
}

// Delete a customer
export async function deleteCustomer(id) {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/customers/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  return handleFetch(res);
}

// Get overdue customers
export async function getOverdueCustomers() {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/customers/overdue`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await handleFetch(res);

  return data;
}

// ======= Utility: Toast Notification =======
export function dueToast(message, type = 'success', duration = 4000) {
  // Create toast container if it doesn't exist
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.style.position = 'fixed';
    container.style.top = '20px';
    container.style.right = '20px';
    container.style.zIndex = '9999';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '10px';
    document.body.appendChild(container);
  }

  // Create the toast
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  // Toast styles
  toast.style.minWidth = '200px';
  toast.style.padding = '10px 15px';
  toast.style.borderRadius = '6px';
  toast.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
  toast.style.fontWeight = '500';
  toast.style.color = type === 'warning' ? '#000' : '#fff';
  toast.style.backgroundColor =
    type === 'success' ? '#28a745' :
    type === 'error' ? '#dc3545' :
    type === 'warning' ? '#ffc107' : '#17a2b8';
  
  toast.style.opacity = '0';
  toast.style.transform = 'translateX(100%)';
  toast.style.transition = 'all 0.4s ease';

  // Append to container
  container.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(0)';
  });

  // Animate out
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 400);
  }, duration);
}

// =================================================
// INVENTORY API
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
  const data = await handleFetch(res);

  // Optional: trigger toast if low-stock products exist
  if (data.count > 0) {
    showToast();
  }

  return data;
}

// Get expired products
export async function getExpiredProducts() {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/inventory/expired`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await handleFetch(res);

  // Optional: trigger toast if expired products exist
  if (data.count > 0) {
    showToast();
  }

  return data;
}

// Get out-of-stock products (optional endpoint if needed)
export async function getOutOfStockProducts() {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/inventory/low-stock`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await handleFetch(res);

  const outOfStock = data.data.filter(p => p.stockLevel === 0);
  if (outOfStock.length > 0) {
    showToast();
  }

  return { count: outOfStock.length, data: outOfStock };
}

// Utility: show toast notifications
function showToast(message, duration = 4000) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("visible");
  }, 100); // trigger CSS transition

  setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// =================================================
// DELIVERIES API
// =================================================

/**
 * Get all deliveries, optionally filtered by status
 * @param {string} status - 'pending' | 'completed' | 'cancelled' | 'all'
 */
export async function getDeliveries(status = 'all') {
  const token = getAuthToken();
  let url = `${BASE_URL}/deliveries`;
  if (status !== 'all') url += `?status=${status}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleFetch(res);
}

/**
 * Get a single delivery by ID
 */
export async function getDeliveryById(id) {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/deliveries/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleFetch(res);
}

/**
 * Add a new delivery
 */
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

/**
 * Update a delivery
 */
export async function updateDelivery(id, data) {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/deliveries/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return handleFetch(res);
}

/**
 * Delete a delivery
 */
export async function deleteDelivery(id) {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/deliveries/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleFetch(res);
}

/**
 * Get top delivery agents
 */
export async function getTopDeliveryAgents() {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/deliveries/top-agents`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleFetch(res);
}

// agentapi.js

export async function getAgents() {
  const res = await fetch(`${BASE_URL}/agents`);
  if (!res.ok) throw new Error("Failed to fetch agents");
  return res.json();
}

export async function addAgentAPI(agent) {
  const res = await fetch(`${BASE_URL}/agents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(agent)
  });
  if (!res.ok) throw new Error("Failed to add agent");
  return res.json();
}



// ================= SUPPLIERS API =================
const SUPPLIERS_URL = `${BASE_URL}/suppliers`;

// Get all suppliers (optionally filter by purchase status)
export async function getSuppliers(purchase) {
  const token = getAuthToken();
  let url = SUPPLIERS_URL;
  if (purchase) url += `?purchase=${purchase}`; // filter: Pending, Completed, Cancelled

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleFetch(res);
}

// Get a single supplier by ID
export async function getSupplierById(id) {
  const token = getAuthToken();
  const res = await fetch(`${SUPPLIERS_URL}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleFetch(res);
}

// Add a new supplier
export async function addSupplier(supplier) {
  const token = getAuthToken();

  // ensure supplier object matches model
  const body = {
    name: supplier.name,
    category: supplier.category || "Others",
    leadTime: supplier.leadTime,
    purchase: supplier.purchase || "Pending",
    email: supplier.email,
    phone: supplier.phone,
    address: supplier.address || "",
  };

  const res = await fetch(SUPPLIERS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  return handleFetch(res);
}

// Update an existing supplier
export async function updateSupplier(id, supplier) {
  const token = getAuthToken();

  // only include allowed fields
  const body = {
    ...(supplier.name && { name: supplier.name }),
    ...(supplier.category && { category: supplier.category }),
    ...(supplier.leadTime !== undefined && { leadTime: supplier.leadTime }),
    ...(supplier.purchase && { purchase: supplier.purchase }),
    ...(supplier.email && { email: supplier.email }),
    ...(supplier.phone && { phone: supplier.phone }),
    ...(supplier.address && { address: supplier.address }),
  };

  const res = await fetch(`${SUPPLIERS_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  return handleFetch(res);
}

// Delete a supplier
export async function deleteSupplier(id) {
  const token = getAuthToken();
  const res = await fetch(`${SUPPLIERS_URL}/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleFetch(res);
}

// ================= PURCHASE MANAGEMENT =================

// Confirm a supplier purchase
export async function confirmPurchase(id) {
  const token = getAuthToken();
  const res = await fetch(`${SUPPLIERS_URL}/confirm/${id}`, {
    method: "PUT", // match backend route
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleFetch(res);
}

// Cancel a supplier purchase
export async function cancelPurchase(id) {
  const token = getAuthToken();
  const res = await fetch(`${SUPPLIERS_URL}/cancel/${id}`, {
    method: "PUT", // match backend route
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleFetch(res);
}

// ================= SUPPLIERS – Additional API Calls =================

// Get recent purchases (last N suppliers)
export async function getRecentPurchases(limit = 5) {
  const token = getAuthToken();
  const res = await fetch(`${SUPPLIERS_URL}/recent?limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleFetch(res);
}

// Get top suppliers (by number of completed purchases)
export async function getTopSuppliers(limit = 5) {
  const token = getAuthToken();
  const res = await fetch(`${SUPPLIERS_URL}/top?limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleFetch(res);
}


//  SALES


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

// Get current settings
export async function getSettings() {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/settings`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` }
  });
  return handleFetch(res);
}

// Save / update settings
export async function saveSettings(settings) {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/settings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(settings)
  });
  return handleFetch(res);
}


