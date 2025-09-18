// api.js
// -------------------- CONFIG --------------------
const BASE_URL = "https://vephla-capstone-project-backend-and.onrender.com/api";

// -------------------- HELPERS --------------------
async function handleFetch(res) {
  // Handle non-JSON responses and errors
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP error! status: ${res.status}`);
  }
  return res.json();
}

function getAuthToken() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No auth token found. Please login.");
  return token;
}

// -------------------- AUTH --------------------
export async function loginUser(email, password) {
  try {
    const res = await fetch(`${BASE_URL}/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await handleFetch(res);
    localStorage.setItem("token", data.token);
    return data;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function signupUser(userData) {
  try {
    const res = await fetch(`${BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData)
    });
    const data = await handleFetch(res);
    return data;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export function logoutUser() {
  localStorage.removeItem("token");
}
// -------------------- PASSWORD RESET --------------------

// Request password reset (send OTP to email)
export async function requestPasswordReset(email) {
  try {
    const res = await fetch(`${BASE_URL}/auth/request-password-reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    return await handleFetch(res);
  } catch (err) {
    console.error("Request Password Reset Error:", err);
    throw err;
  }
}

// Verify OTP & reset password
export async function resetPassword(email, otp, newPassword) {
  try {
    const res = await fetch(`${BASE_URL}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp, newPassword })
    });
    return await handleFetch(res);
  } catch (err) {
    console.error("Reset Password Error:", err);
    throw err;
  }
}

// -------------------- DASHBOARD --------------------
export async function getDashboardSummary() {
  try {
    const token = getAuthToken();
    const res = await fetch(`${BASE_URL}/dashboard/summary`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return handleFetch(res);
  } catch (err) {
    console.error("Dashboard Summary Error:", err);
    throw err;
  }
}

export async function getQuickStats() {
  try {
    const token = getAuthToken();
    const res = await fetch(`${BASE_URL}/dashboard/quick-stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return handleFetch(res);
  } catch (err) {
    console.error("Quick Stats Error:", err);
    throw err;
  }
}

export async function getPendingOrders() {
  try {
    const token = getAuthToken();
    const res = await fetch(`${BASE_URL}/dashboard/pending-orders`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return handleFetch(res);
  } catch (err) {
    console.error("Pending Orders Error:", err);
    throw err;
  }
}

export async function getLowStockProducts() {
  try {
    const token = getAuthToken();
    const res = await fetch(`${BASE_URL}/dashboard/low-stock`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return handleFetch(res);
  } catch (err) {
    console.error("Low Stock Products Error:", err);
    throw err;
  }
}

export async function getTopCustomers() {
  try {
    const token = getAuthToken();
    const res = await fetch(`${BASE_URL}/dashboard/top-customers`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return handleFetch(res);
  } catch (err) {
    console.error("Top Customers Error:", err);
    throw err;
  }
}

export async function getUserInfo() {
  try {
    const token = getAuthToken();
    const res = await fetch(`${BASE_URL}/dashboard/user-info`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return handleFetch(res);
  } catch (err) {
    console.error("User Info Error:", err);
    throw err;
  }
}


// -------------------- CUSTOMERS --------------------
export async function getCustomers() {
  try {
    const token = getAuthToken();
    const res = await fetch(`${BASE_URL}/customers`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return handleFetch(res);
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function addCustomer(customer) {
  try {
    const token = getAuthToken();
    const res = await fetch(`${BASE_URL}/customers`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(customer)
    });
    return handleFetch(res);
  } catch (err) {
    console.error(err);
    throw err;
  }
}

// -------------------- INVENTORY --------------------
export async function getProducts() {
  try {
    const token = getAuthToken();
    const res = await fetch(`${BASE_URL}/inventory/products`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return handleFetch(res);
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function addProduct(product) {
  try {
    const token = getAuthToken();
    const res = await fetch(`${BASE_URL}/inventory/products`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(product)
    });
    return handleFetch(res);
  } catch (err) {
    console.error(err);
    throw err;
  }
}

// -------------------- DELIVERIES --------------------
export async function getDeliveries() {
  try {
    const token = getAuthToken();
    const res = await fetch(`${BASE_URL}/deliveries`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return handleFetch(res);
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function addDelivery(delivery) {
  try {
    const token = getAuthToken();
    const res = await fetch(`${BASE_URL}/deliveries`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(delivery)
    });
    return handleFetch(res);
  } catch (err) {
    console.error(err);
    throw err;
  }
}

// -------------------- SUPPLIERS --------------------
export async function getSuppliers() {
  try {
    const token = getAuthToken();
    const res = await fetch(`${BASE_URL}/suppliers`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return handleFetch(res);
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function addSupplier(supplier) {
  try {
    const token = getAuthToken();
    const res = await fetch(`${BASE_URL}/suppliers`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(supplier)
    });
    return handleFetch(res);
  } catch (err) {
    console.error(err);
    throw err;
  }
}
// -------------------- SALES API --------------------

// Get all sales
export async function getSales() {
  try {
    const token = getAuthToken();
    const res = await fetch(`${BASE_URL}/sales`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleFetch(res);
  } catch (err) {
    console.error("❌ Error fetching sales:", err);
    throw err;
  }
}

// Add a new sale
export async function addSale(sale) {
  try {
    const token = getAuthToken();
    const res = await fetch(`${BASE_URL}/sales`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(sale),
    });
    return handleFetch(res);
  } catch (err) {
    console.error("❌ Error adding sale:", err);
    throw err;
  }
}

// -------- Dashboard Helpers --------

// Get KPI summary (total sales, cash, mobile, pending orders)
export async function getSalesSummary() {
  try {
    const token = getAuthToken();
    const res = await fetch(`${BASE_URL}/sales/summary/kpis`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleFetch(res);
  } catch (err) {
    console.error("❌ Error fetching sales summary:", err);
    throw err;
  }
}

// Get sales analytics (monthly or yearly)
export async function getSalesAnalytics(view = "monthly") {
  try {
    const token = getAuthToken();
    const res = await fetch(`${BASE_URL}/sales/analytics?view=${view}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleFetch(res);
  } catch (err) {
    console.error("❌ Error fetching sales analytics:", err);
    throw err;
  }
}

// Get top customers
export async function getTopCustomers() {
  try {
    const token = getAuthToken();
    const res = await fetch(`${BASE_URL}/sales/top-customers`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleFetch(res);
  } catch (err) {
    console.error("❌ Error fetching top customers:", err);
    throw err;
  }
}

// Get top products
export async function getTopProducts() {
  try {
    const token = getAuthToken();
    const res = await fetch(`${BASE_URL}/sales/top-products`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleFetch(res);
  } catch (err) {
    console.error("❌ Error fetching top products:", err);
    throw err;
  }
}

// -------------------- SETTINGS --------------------
export async function getSettings() {
  try {
    const token = getAuthToken();
    const res = await fetch(`${BASE_URL}/settings`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return handleFetch(res);
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function saveSettings(settings) {
  try {
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
  } catch (err) {
    console.error(err);
    throw err;
  }
}
