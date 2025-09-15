
// Customer Management Logic (Backend Ready + Delete + Toasts)


// State
let customers = [];

// Elements
const customerTableBody = document.getElementById("customerTableBody");
const kpiPaid = document.getElementById("kpiPaid");
const kpiOwed = document.getElementById("kpiOwed");
const kpiOverdue = document.getElementById("kpiOverdue");
const topCustomersList = document.getElementById("topCustomersList");

const addCustomerBtn = document.getElementById("addCustomerBtn");
const addCustomerModal = document.getElementById("addCustomerModal");
const closeModalBtn = addCustomerModal.querySelector(".close");
const addCustomerForm = document.getElementById("addCustomerForm");

const filterSelect = document.getElementById("filterSelect");
const searchInput = document.getElementById("searchInput");

// Chart Setup
const ctxCust = document.getElementById("customerOverdueChart").getContext("2d");
const custMonthlyData = [];
const custYearlyData = [];

const customerOverdueChart = new Chart(ctxCust, {
  type: "line",
  data: {
    labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug"],
    datasets: [{
      label: "Overdue Payment",
      data: custMonthlyData,
      borderColor: "#0e8a70",
      backgroundColor: "rgba(14,138,112,0.1)",
      fill: true,
      tension: 0.4
    }]
  },
  options: {
    responsive: true,
    plugins: { legend: { display: false }},
    scales: {
      y: { beginAtZero: false },
      x: { grid: { display: false }}
    }
  }
});


// Toast

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 100);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// API Calls


async function fetchCustomers() {
  try {
    const res = await fetch("/api/customers");
    customers = await res.json();
    renderCustomers();
    updateKPIs();
    updateTopCustomers();
    updateCharts();
  } catch (err) {
    console.error("Failed to fetch customers:", err);
  }
}

async function addCustomer(newCustomer) {
  try {
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCustomer),
    });
    const saved = await res.json();
    customers.push(saved);
    renderCustomers();
    updateKPIs();
    updateTopCustomers();
    updateCharts();
    showToast("✅ Customer added successfully!", "success");
  } catch (err) {
    console.error("Failed to add customer:", err);
    showToast("❌ Failed to add customer", "error");
  }
}

async function updateCustomer(id, data) {
  try {
    const res = await fetch(`/api/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const updated = await res.json();
    const idx = customers.findIndex(c => c.id === id);
    if (idx !== -1) customers[idx] = updated;
    renderCustomers();
    updateKPIs();
    updateTopCustomers();
    updateCharts();
  } catch (err) {
    console.error("Failed to update customer:", err);
  }
}

async function deleteCustomer(id) {
  if (!confirm("⚠️ Are you sure you want to delete this customer?")) return;

  try {
    await fetch(`/api/customers/${id}`, { method: "DELETE" });
    customers = customers.filter(c => c.id !== id);
    renderCustomers();
    updateKPIs();
    updateTopCustomers();
    updateCharts();
    showToast("🗑️ Customer deleted successfully!", "success");
  } catch (err) {
    console.error("Failed to delete customer:", err);
    showToast("❌ Failed to delete customer", "error");
  }
}


// Modal Logic


addCustomerBtn.addEventListener("click", () => {
  addCustomerModal.style.display = "block";
});

closeModalBtn.addEventListener("click", () => {
  addCustomerModal.style.display = "none";
});

window.addEventListener("click", (e) => {
  if (e.target === addCustomerModal) {
    addCustomerModal.style.display = "none";
  }
});


// Add Customer Form


addCustomerForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("custName").value;
  const amount = parseFloat(document.getElementById("custAmount").value);
  const qty = parseInt(document.getElementById("custQty").value, 10);
  const date = document.getElementById("custDate").value;
  const status = document.getElementById("custStatus").value;

  const newCustomer = { name, amount, qty, date, status };
  addCustomer(newCustomer);

  addCustomerModal.style.display = "none";
  addCustomerForm.reset();
});


// Render Table


function renderCustomers() {
  const filter = filterSelect.value;
  const search = searchInput.value.toLowerCase();

  customerTableBody.innerHTML = "";

  let filtered = customers.filter(cust => {
    if (filter !== "all" && cust.status !== filter) return false;
    if (search && !cust.name.toLowerCase().includes(search)) return false;
    return true;
  });

  filtered.forEach((cust, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${cust.name}</td>
      <td>₦${cust.amount.toLocaleString()}</td>
      <td>${cust.qty}</td>
      <td>${cust.date}</td>
      <td>${cust.status}</td>
      <td>
        ${cust.status === "owed" ? `<button onclick="markPaid(${cust.id})">Mark Paid</button>` : ""}
        <button onclick="deleteCustomer(${cust.id})" class="delete-btn">Delete</button>
      </td>
    `;
    customerTableBody.appendChild(row);
  });
}


// KPIs


function updateKPIs() {
  let totalPaid = 0;
  let totalOwed = 0;
  let totalOverdue = 0;
  const today = new Date();

  customers.forEach(cust => {
    if (cust.status === "paid") {
      totalPaid += cust.amount;
    } else if (cust.status === "owed") {
      totalOwed += cust.amount;
      if (new Date(cust.date) < today) {
        totalOverdue += cust.amount;
      }
    }
  });

  kpiPaid.textContent = "₦" + totalPaid.toLocaleString();
  kpiOwed.textContent = "₦" + totalOwed.toLocaleString();
  kpiOverdue.textContent = "₦" + totalOverdue.toLocaleString();
}


// Mark Paid


function markPaid(id) {
  updateCustomer(id, { status: "paid" });
  showToast("💰 Customer marked as Paid!", "success");
}


// Top Customers


function updateTopCustomers() {
  const sorted = [...customers].sort((a, b) => b.amount - a.amount).slice(0, 3);

  topCustomersList.innerHTML = "";
  sorted.forEach(cust => {
    const li = document.createElement("li");
    li.innerHTML = `${cust.name} <span>₦${cust.amount.toLocaleString()}</span>`;
    topCustomersList.appendChild(li);
  });
}


// Charts


function updateCharts() {
  const monthlyOverdue = Array(8).fill(0);
  const yearlyOverdue = Array(8).fill(0);

  customers.forEach(cust => {
    if (cust.status === "owed") {
      const date = new Date(cust.date);
      const month = date.getMonth();
      const year = date.getFullYear() - new Date().getFullYear() + 7;

      monthlyOverdue[month] += cust.amount;
      if (year >= 0 && year < yearlyOverdue.length) {
        yearlyOverdue[year] += cust.amount;
      }
    }
  });

  custMonthlyData.splice(0, custMonthlyData.length, ...monthlyOverdue);
  custYearlyData.splice(0, custYearlyData.length, ...yearlyOverdue);

  customerOverdueChart.data.datasets[0].data = custMonthlyData;
  customerOverdueChart.update();
}


// Tabs for Chart


document.getElementById("custMonthlyTab").addEventListener("click", () => {
  customerOverdueChart.data.datasets[0].data = custMonthlyData;
  customerOverdueChart.update();
  document.getElementById("custMonthlyTab").classList.add("active");
  document.getElementById("custYearlyTab").classList.remove("active");
});

document.getElementById("custYearlyTab").addEventListener("click", () => {
  customerOverdueChart.data.datasets[0].data = custYearlyData;
  customerOverdueChart.update();
  document.getElementById("custYearlyTab").classList.add("active");
  document.getElementById("custMonthlyTab").classList.remove("active");
});


// Filters


filterSelect.addEventListener("change", renderCustomers);
searchInput.addEventListener("input", renderCustomers);


// Export to Excel


document.getElementById("exportExcelBtn").addEventListener("click", () => {
  if (customers.length === 0) {
    alert("No data to export!");
    return;
  }

  const ws = XLSX.utils.json_to_sheet(customers.map((c, i) => ({
    "S/N": i + 1,
    "Customer Name": c.name,
    "Package Worth": c.amount,
    "Quantity": c.qty,
    "Payment Date": c.date,
    "Status": c.status
  })));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Customers");
  XLSX.writeFile(wb, "customers.xlsx");
});


// Init


document.addEventListener("DOMContentLoaded", () => {
  fetchCustomers();
  setActivePage(location.hash.replace("#", "") || "dashboard");
});

window.addEventListener("hashchange", () => {
  setActivePage(location.hash.replace("#", "") || "dashboard");
});
