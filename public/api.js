// api.js

// CONFIG
const BASE_URL = "https://vephla-capstone-project-backend-and.onrender.com/api";

// ---------- Utility: Handle fetch responses ----------
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

// ---------- Fetch wrapper with auth ----------
export async function fetchWithAuth(url, options = {}) {
  const token = await ensureAuthToken();
  if (!token) throw new Error("No token found");

  options.headers = options.headers || {};
  options.headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, options);
  return handleFetch(res);
}

// ---------- Auth API ----------
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

// ---------- Password Reset ----------
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
export async function getDashboardSummary() {
  return fetchWithAuth(`${BASE_URL}/dashboard/summary`);
}
export async function getQuickStats() {
  return fetchWithAuth(`${BASE_URL}/dashboard/quick-stats`);
}
export async function getOverduePayments() {
  return fetchWithAuth(`${BASE_URL}/dashboard/overdue-payments`);
}
export async function getLowStockProductsDashboard() {
  return fetchWithAuth(`${BASE_URL}/dashboard/low-stock`);
}
export async function getTopCustomersDashboard() {
  return fetchWithAuth(`${BASE_URL}/dashboard/top-customers`);
}
export async function getUserInfo() {
  return fetchWithAuth(`${BASE_URL}/dashboard/user-info`);
}

// ================== Customers ==================
export async function getCustomers() {
  return fetchWithAuth(`${BASE_URL}/customers`);
}
export async function addCustomer(customer) {
  return fetchWithAuth(`${BASE_URL}/customers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(customer),
  });
}
export async function updateCustomer(id, data) {
  return fetchWithAuth(`${BASE_URL}/customers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
export async function deleteCustomer(id) {
  return fetchWithAuth(`${BASE_URL}/customers/${id}`, { method: "DELETE" });
}
export async function getOverdueCustomers() {
  return fetchWithAuth(`${BASE_URL}/customers/overdue`);
}

// ================== Inventory ==================
export async function getProducts() {
  return fetchWithAuth(`${BASE_URL}/inventory/products`);
}
export async function getProductById(id) {
  return fetchWithAuth(`${BASE_URL}/inventory/products/${id}`);
}
export async function addProduct(product) {
  return fetchWithAuth(`${BASE_URL}/inventory/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product),
  });
}
export async function updateProduct(id, updatedFields) {
  return fetchWithAuth(`${BASE_URL}/inventory/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedFields),
  });
}
export async function deleteProduct(id) {
  return fetchWithAuth(`${BASE_URL}/inventory/products/${id}`, { method: "DELETE" });
}
export async function getLowStockProducts() {
  const data = await fetchWithAuth(`${BASE_URL}/inventory/low-stock`);
  if (data.count > 0) showToast();
  return data;
}
export async function getExpiredProducts() {
  const data = await fetchWithAuth(`${BASE_URL}/inventory/expired`);
  if (data.count > 0) showToast();
  return data;
}
export async function getOutOfStockProducts() {
  const data = await fetchWithAuth(`${BASE_URL}/inventory/low-stock`);
  const outOfStock = data.data.filter(p => p.stockLevel === 0);
  if (outOfStock.length > 0) showToast();
  return { count: outOfStock.length, data: outOfStock };
}

// ================== Deliveries ==================
export async function getDeliveries(status = "all") {
  let url = `${BASE_URL}/deliveries`;
  if (status !== "all") url += `?status=${status}`;
  return fetchWithAuth(url);
}
export async function getDeliveryById(id) {
  return fetchWithAuth(`${BASE_URL}/deliveries/${id}`);
}
export async function addDelivery(delivery) {
  return fetchWithAuth(`${BASE_URL}/deliveries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(delivery),
  });
}
export async function updateDelivery(id, data) {
  return fetchWithAuth(`${BASE_URL}/deliveries/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
export async function deleteDelivery(id) {
  return fetchWithAuth(`${BASE_URL}/deliveries/${id}`, { method: "DELETE" });
}
export async function getTopDeliveryAgents() {
  return fetchWithAuth(`${BASE_URL}/deliveries/top-agents`);
}

// ================== Suppliers ==================
const SUPPLIERS_URL = `${BASE_URL}/suppliers`;
export async function getSuppliers(purchase) {
  let url = SUPPLIERS_URL;
  if (purchase) url += `?purchase=${purchase}`;
  return fetchWithAuth(url);
}
export async function getSupplierById(id) {
  return fetchWithAuth(`${SUPPLIERS_URL}/${id}`);
}
export async function addSupplier(supplier) {
  const body = {
    name: supplier.name,
    category: supplier.category || "Others",
    leadTime: supplier.leadTime,
    purchase: supplier.purchase || "Pending",
    email: supplier.email,
    phone: supplier.phone,
    address: supplier.address || "",
  };
  return fetchWithAuth(SUPPLIERS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
export async function updateSupplier(id, supplier) {
  const body = {
    ...(supplier.name && { name: supplier.name }),
    ...(supplier.category && { category: supplier.category }),
    ...(supplier.leadTime !== undefined && { leadTime: supplier.leadTime }),
    ...(supplier.purchase && { purchase: supplier.purchase }),
    ...(supplier.email && { email: supplier.email }),
    ...(supplier.phone && { phone: supplier.phone }),
    ...(supplier.address && { address: supplier.address }),
  };
  return fetchWithAuth(`${SUPPLIERS_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
export async function deleteSupplier(id) {
  return fetchWithAuth(`${SUPPLIERS_URL}/${id}`, { method: "DELETE" });
}
export async function confirmPurchase(id) {
  return fetchWithAuth(`${SUPPLIERS_URL}/confirm/${id}`, { method: "PUT" });
}
export async function cancelPurchase(id) {
  return fetchWithAuth(`${SUPPLIERS_URL}/cancel/${id}`, { method: "PUT" });
}
export async function getRecentPurchases(limit = 5) {
  return fetchWithAuth(`${SUPPLIERS_URL}/recent?limit=${limit}`);
}
export async function getTopSuppliers(limit = 5) {
  return fetchWithAuth(`${SUPPLIERS_URL}/top?limit=${limit}`);
}

// ================== Sales ==================
function normalizeEnum(value, type) {
  if (!value) return value;
  const enums = { paymentType: ["cash", "mobile"], status: ["pending", "completed"] };
  const valid = enums[type].find(e => e === value.toLowerCase());
  return valid || value.toLowerCase();
}
export async function getSales() {
  return fetchWithAuth(`${BASE_URL}/sales`);
}
export async function addSale(sale) {
  sale.paymentType = normalizeEnum(sale.paymentType, "paymentType");
  sale.status = normalizeEnum(sale.status, "status");
  return fetchWithAuth(`${BASE_URL}/sales`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sale),
  });
}
export async function updateSale(id, data) {
  if (data.paymentType) data.paymentType = normalizeEnum(data.paymentType, "paymentType");
  if (data.status) data.status = normalizeEnum(data.status, "status");
  return fetchWithAuth(`${BASE_URL}/sales/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
export async function deleteSale(id) {
  return fetchWithAuth(`${BASE_URL}/sales/${id}`, { method: "DELETE" });
}
export async function completeSale(id) {
  return fetchWithAuth(`${BASE_URL}/sales/${id}/complete`, { method: "PATCH" });
}
export async function getSalesSummary() {
  return fetchWithAuth(`${BASE_URL}/sales/summary/kpis`);
}
export async function getSalesAnalytics(view = "monthly") {
  return fetchWithAuth(`${BASE_URL}/sales/analytics?view=${view}`);
}
export async function getTopCustomersSales() {
  return fetchWithAuth(`${BASE_URL}/sales/top-customers`);
}
export async function getTopProductsSales() {
  return fetchWithAuth(`${BASE_URL}/sales/top-products`);
}
export async function getPendingOrdersSales() {
  return fetchWithAuth(`${BASE_URL}/sales/pending-orders`);
}

// ================== Settings ==================
export async function getSettings() {
  return fetchWithAuth(`${BASE_URL}/settings`);
}
export async function saveSettings(settings) {
  return fetchWithAuth(`${BASE_URL}/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
}

// ================== Toast Utility ==================
export function dueToast(message, type = "success", duration = 4000) {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.style.position = "fixed";
    container.style.top = "20px";
    container.style.right = "20px";
    container.style.zIndex = "9999";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "10px";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.style.minWidth = "200px";
  toast.style.padding = "10px 15px";
  toast.style.borderRadius = "6px";
  toast.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
  toast.style.fontWeight = "500";
  toast.style.color = type === "warning" ? "#000" : "#fff";
  toast.style.backgroundColor =
    type === "success" ? "#28a745" : type === "error" ? "#dc3545" : type === "warning" ? "#ffc107" : "#17a2b8";
  toast.style.opacity = "0";
  toast.style.transform = "translateX(100%)";
  toast.style.transition = "all 0.4s ease";

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateX(0)";
  });

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    setTimeout(() => toast.remove(), 400);
  }, duration);
}
// ================= AGENTS API =================

// Get all agents
export async function getAgents() {
  return fetchWithAuth(`${BASE_URL}/agents`);
}

// Add a new agent
export async function addAgent(agent) {
  return fetchWithAuth(`${BASE_URL}/agents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(agent)
  });
}

// Update an existing agent
export async function updateAgent(id, agent) {
  return fetchWithAuth(`${BASE_URL}/agents/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(agent)
  });
}

// Delete an agent
export async function deleteAgent(id) {
  return fetchWithAuth(`${BASE_URL}/agents/${id}`, {
    method: "DELETE"
  });
}
