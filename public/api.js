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
    alert("Login successful!");
    return data;
  } catch (err) {
    console.error(err);
    alert("Login failed: " + err.message);
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
    alert("Signup successful!");
    return data;
  } catch (err) {
    console.error(err);
    alert("Signup failed: " + err.message);
  }
}

export function logoutUser() {
  localStorage.removeItem("token");
  alert("Logged out successfully");
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
    console.error(err);
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

// -------------------- SALES --------------------
export async function getSales() {
  try {
    const token = getAuthToken();
    const res = await fetch(`${BASE_URL}/sales`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return handleFetch(res);
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function addSale(sale) {
  try {
    const token = getAuthToken();
    const res = await fetch(`${BASE_URL}/sales`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(sale)
    });
    return handleFetch(res);
  } catch (err) {
    console.error(err);
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
