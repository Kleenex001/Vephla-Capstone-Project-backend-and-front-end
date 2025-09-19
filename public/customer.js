// customer.js
import { getCustomers, addCustomer as addCustomerAPI, updateCustomer as updateCustomerAPI, deleteCustomer as deleteCustomerAPI } from './api.js';

// State
let customers = [];

// Elements
const customerTableBody = document.getElementById('customerTableBody');
const kpiPaid = document.getElementById('kpiPaid');
const kpiOwed = document.getElementById('kpiOwed');
const kpiOverdue = document.getElementById('kpiOverdue');
const topCustomersList = document.getElementById('topCustomersList');

const addCustomerBtn = document.getElementById('addCustomerBtn');
const addCustomerModal = document.getElementById('addCustomerModal');
const closeModalBtn = addCustomerModal.querySelector('.close');
const addCustomerForm = document.getElementById('addCustomerForm');

const filterSelect = document.getElementById('filterSelect');
const searchInput = document.getElementById('searchInput');

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

// Normalize Status
function normalizeStatus(status) {
  if (!status) return status;
  status = status.toLowerCase();
  if (status === 'owed') return 'overdue';
  return status;
}

// Fetch Customers
async function fetchCustomers() {
  try {
    const res = await getCustomers();
    customers = res.data.map(c => ({ ...c, status: normalizeStatus(c.status) }));
    renderCustomers();
    updateKPIs();
    updateTopCustomers();
    updateCharts();
  } catch (err) {
    console.error(err);
    showToast("Failed to fetch customers", "error");
  }
}

// Add Customer
async function addCustomer(newCustomer) {
  newCustomer.status = normalizeStatus(newCustomer.status);
  try {
    const res = await addCustomerAPI(newCustomer);
    customers.push({ ...res.data, status: normalizeStatus(res.data.status) });
    renderCustomers();
    updateKPIs();
    updateTopCustomers();
    updateCharts();
    showToast("✅ Customer added successfully!", "success");
  } catch (err) {
    console.error(err);
    showToast("❌ Failed to add customer", "error");
  }
}

// Update Customer
async function updateCustomer(id, data) {
  if (data.status) data.status = normalizeStatus(data.status);
  try {
    const res = await updateCustomerAPI(id, data);
    const idx = customers.findIndex(c => c._id === id);
    if (idx !== -1) customers[idx] = { ...res.data, status: normalizeStatus(res.data.status) };
    renderCustomers();
    updateKPIs();
    updateTopCustomers();
    updateCharts();
  } catch (err) {
    console.error(err);
    showToast("❌ Failed to update customer", "error");
  }
}

// Delete Customer
async function deleteCustomer(id) {
  if (!confirm("⚠️ Are you sure you want to delete this customer?")) return;
  try {
    await deleteCustomerAPI(id);
    customers = customers.filter(c => c._id !== id);
    renderCustomers();
    updateKPIs();
    updateTopCustomers();
    updateCharts();
    showToast("🗑️ Customer deleted successfully!", "success");
  } catch (err) {
    console.error(err);
    showToast("❌ Failed to delete customer", "error");
  }
}

// Render Table
function renderCustomers() {
  const filter = filterSelect.value;
  const search = searchInput.value.toLowerCase();
  customerTableBody.innerHTML = '';

  let filtered = customers.filter(c => {
    if (filter !== 'all' && c.status !== filter) return false;
    if (search && !c.customerName.toLowerCase().includes(search)) return false;
    return true;
  });

  filtered.forEach((cust, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${cust.customerName}</td>
      <td>₦${cust.packageWorth.toLocaleString()}</td>
      <td>${cust.quantity}</td>
      <td>${new Date(cust.paymentDate).toLocaleDateString()}</td>
      <td>${cust.status}</td>
      <td>
        ${cust.status === 'overdue' ? `<button onclick="markPaid('${cust._id}')">Mark Paid</button>` : ''}
        <button onclick="deleteCustomer('${cust._id}')" class="delete-btn">Delete</button>
      </td>
    `;
    customerTableBody.appendChild(row);
  });
}

// Update KPIs
function updateKPIs() {
  let totalPaid = 0, totalOwed = 0, totalOverdue = 0;
  const today = new Date();

  customers.forEach(c => {
    if (c.status === 'paid') totalPaid += c.packageWorth;
    else if (c.status === 'overdue') {
      totalOwed += c.packageWorth;
      if (new Date(c.paymentDate) < today) totalOverdue += c.packageWorth;
    }
  });

  kpiPaid.textContent = "₦" + totalPaid.toLocaleString();
  kpiOwed.textContent = "₦" + totalOwed.toLocaleString();
  kpiOverdue.textContent = "₦" + totalOverdue.toLocaleString();
}

// Mark Paid
window.markPaid = function(id) {
  updateCustomer(id, { status: 'paid' });
  showToast("💰 Customer marked as Paid!", "success");
};

// Top Customers
function updateTopCustomers() {
  const top = [...customers].sort((a,b) => b.packageWorth - a.packageWorth).slice(0,3);
  topCustomersList.innerHTML = '';
  top.forEach(c => {
    const li = document.createElement("li");
    li.innerHTML = `${c.customerName} <span>₦${c.packageWorth.toLocaleString()}</span>`;
    topCustomersList.appendChild(li);
  });
}

// Update Charts
function updateCharts() {
  const monthly = Array(8).fill(0);
  const yearly = Array(8).fill(0);
  const currentYear = new Date().getFullYear();

  customers.forEach(c => {
    if (c.status === 'overdue') {
      const date = new Date(c.paymentDate);
      const month = date.getMonth();
      const yearIndex = date.getFullYear() - currentYear + 7;
      if (month >=0 && month < monthly.length) monthly[month] += c.packageWorth;
      if (yearIndex >=0 && yearIndex < yearly.length) yearly[yearIndex] += c.packageWorth;
    }
  });

  custMonthlyData.splice(0,custMonthlyData.length,...monthly);
  custYearlyData.splice(0,custYearlyData.length,...yearly);
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

// Modal Logic
addCustomerBtn.addEventListener('click', () => addCustomerModal.style.display = 'block');
closeModalBtn.addEventListener('click', () => addCustomerModal.style.display = 'none');
window.addEventListener('click', (e) => { if(e.target === addCustomerModal) addCustomerModal.style.display = 'none'; });

// Add Customer Form
addCustomerForm.addEventListener('submit', e => {
  e.preventDefault();
  let statusInput = document.getElementById('status').value.toLowerCase();
  let status = statusInput === 'owed' ? 'overdue' : statusInput;

  const newCustomer = {
    customerName: document.getElementById('customerName').value,
    packageWorth: parseFloat(document.getElementById('packageWorth').value),
    quantity: parseInt(document.getElementById('quantity').value, 10),
    paymentDate: document.getElementById('paymentDate').value,
    status
  };

  addCustomer(newCustomer);
  addCustomerForm.reset();
  addCustomerModal.style.display = 'none';
});

// Filters
filterSelect.addEventListener('change', renderCustomers);
searchInput.addEventListener('input', renderCustomers);

// Export to Excel
document.getElementById("exportExcelBtn").addEventListener("click", () => {
  if(customers.length === 0){ showToast("No data to export","error"); return; }
  const ws = XLSX.utils.json_to_sheet(customers.map((c,i)=>({
    "S/N": i+1,
    "Customer Name": c.customerName,
    "Package Worth": c.packageWorth,
    "Quantity": c.quantity,
    "Payment Date": new Date(c.paymentDate).toLocaleDateString(),
    "Status": c.status
  })));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Customers");
  XLSX.writeFile(wb,"customers.xlsx");
});

// Init
fetchCustomers();
