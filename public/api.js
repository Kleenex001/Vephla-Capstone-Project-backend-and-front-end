// config
const BASE_URL = "https://vephla-capstone-project-backend-and.onrender.com/api";

// -------------------- AUTH --------------------
async function loginUser(email, password) {
  try {
    const res = await fetch(`$https://vephla-capstone-project-backend-and.onrender.com/api/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem("token", data.token);
      alert("Login successful!");
    } else {
      alert(data.message || "Login failed");
    }
  } catch (err) {
    console.error(err);
  }
}

async function signupUser(userData) {
  try {
    const res = await fetch(`$https://vephla-capstone-project-backend-and.onrender.com/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (res.ok) alert("Signup successful!");
    else alert(data.message || "Signup failed");
  } catch (err) {
    console.error(err);
  }
}

function logoutUser() {
  localStorage.removeItem("token");
  alert("Logged out");
}

// -------------------- DASHBOARD --------------------
async function getDashboardSummary() {
  const token = localStorage.getItem("token");
  const res = await fetch(`$https://vephla-capstone-project-backend-and.onrender.com/api/dashboard/summary`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

// -------------------- CUSTOMERS --------------------
async function getCustomers() {
  const token = localStorage.getItem("token");
  const res = await fetch(`$https://vephla-capstone-project-backend-and.onrender.com/api/customers`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

async function addCustomer(customer) {
  const token = localStorage.getItem("token");
  const res = await fetch(`$https://vephla-capstone-project-backend-and.onrender.com/api/customers`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(customer)
  });
  return res.json();
}

// -------------------- INVENTORY --------------------
async function getProducts() {
  const token = localStorage.getItem("token");
  const res = await fetch(`$https://vephla-capstone-project-backend-and.onrender.com/api/inventory/products`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

async function addProduct(product) {
  const token = localStorage.getItem("token");
  const res = await fetch(`$https://vephla-capstone-project-backend-and.onrender.com/api/inventory/products`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(product)
  });
  return res.json();
}

// -------------------- DELIVERIES --------------------
async function getDeliveries() {
  const token = localStorage.getItem("token");
  const res = await fetch(`$https://vephla-capstone-project-backend-and.onrender.com/api/deliveries`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

async function addDelivery(delivery) {
  const token = localStorage.getItem("token");
  const res = await fetch(`$https://vephla-capstone-project-backend-and.onrender.com/api/deliveries`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(delivery)
  });
  return res.json();
}

// -------------------- SUPPLIERS --------------------
async function getSuppliers() {
  const token = localStorage.getItem("token");
  const res = await fetch(`$https://vephla-capstone-project-backend-and.onrender.com/api/suppliers`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

async function addSupplier(supplier) {
  const token = localStorage.getItem("token");
  const res = await fetch(`$https://vephla-capstone-project-backend-and.onrender.com/api/suppliers`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(supplier)
  });
  return res.json();
}

// -------------------- SALES --------------------
async function getSales() {
  const token = localStorage.getItem("token");
  const res = await fetch(`$https://vephla-capstone-project-backend-and.onrender.com/api/sales`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

async function addSale(sale) {
  const token = localStorage.getItem("token");
  const res = await fetch(`$https://vephla-capstone-project-backend-and.onrender.com/api/sales`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(sale)
  });
  return res.json();
}

// -------------------- SETTINGS --------------------
async function getSettings() {
  const token = localStorage.getItem("token");
  const res = await fetch(`$https://vephla-capstone-project-backend-and.onrender.com/api/settings`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

async function saveSettings(settings) {
  const token = localStorage.getItem("token");
  const res = await fetch(`$https://vephla-capstone-project-backend-and.onrender.com/api/settings`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(settings)
  });
  return res.json();
}
