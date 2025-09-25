import {
  getCustomers,
  addCustomer as addCustomerAPI,
  updateCustomer as updateCustomerAPI,
  deleteCustomer as deleteCustomerAPI,
  dueToast,
} from './api.js';

import { initSettings } from './settingsHelper.js';

document.addEventListener('DOMContentLoaded', () => {
  initSettings();  // This applies settings automatically
});


// ---------- State ----------
let customers = [];

// ---------- DOM Elements ----------
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

const custMonthlyTab = document.getElementById("custMonthlyTab");
const custYearlyTab = document.getElementById("custYearlyTab");

// ---------- Inject CSS ----------
const styleEl = document.createElement('style');
styleEl.textContent = `
#toastContainer { position: fixed; top: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px; }
.toast { padding: 10px 14px; border-radius: 6px; opacity: 0; transform: translateX(100%); transition: transform 0.4s ease, opacity 0.4s ease; min-width: 200px; box-shadow: 0 2px 6px rgba(0,0,0,0.2); color: #fff; }
.toast.show { opacity: 1; transform: translateX(0); }
.toast.success { background-color: #28a745; }
.toast.error { background-color: #dc3545; }
.toast.warning { background-color: #0e8a70; color: #000; }

.status { padding: 4px 8px; border-radius: 4px; font-weight: 500; text-transform: capitalize; }
.status.paid { background-color: rgba(40,167,69,0.2); color: #0e8a70; }
.status.owed { background-color: rgba(255,193,7,0.2); color: #ffc107; }
.status.overdue { background-color: rgba(220,53,69,0.2); color: #dc3545; }

.btn-paid, .btn-delete { padding: 5px 10px; border-radius: 4px; border: none; cursor: pointer; margin-right: 5px; font-size: 0.6rem; transition: 0.3s; }
.btn-paid { background-color: #0e8a70; color: #fff; }
.btn-paid:hover { background-color: #0e8a70; }
.btn-delete { background-color: #dc3545; color: #fff; }
.btn-delete:hover { background-color: #c82333; }
`;
document.head.appendChild(styleEl);

// ---------- Toast Container ----------
let toastContainer = document.getElementById('toastContainer');
if (!toastContainer) {
  toastContainer = document.createElement('div');
  toastContainer.id = 'toastContainer';
  toastContainer.style.position = 'fixed';
  toastContainer.style.top = '20px';
  toastContainer.style.right = '20px';
  toastContainer.style.zIndex = 9999;
  toastContainer.style.display = 'flex';
  toastContainer.style.flexDirection = 'column';
  toastContainer.style.gap = '10px';
  document.body.appendChild(toastContainer);
}

// ---------- Status Calculation ----------
function calcStatus(customer) {
  if (customer.status === 'paid') return 'paid';
  const today = new Date();
  const payDate = new Date(customer.paymentDate);
  if (payDate < today) return 'overdue';
  return 'owed';
}

// ---------- Notify Overdue ----------
function notifyOverdue() {
  const overdueCustomers = customers.filter(c => calcStatus(c) === 'overdue');
  if (overdueCustomers.length === 0) return;
  const names = overdueCustomers.map(c => c.customerName).join(", ");
  dueToast(`Overdue Payment: ${names}`, "warning", 6000);
}

// ---------- API Calls ----------
async function fetchCustomers() {
  try {
    const res = await getCustomers();
    customers = res.data;
    renderCustomers();
    updateKPIs();
    updateTopCustomers();
    updateCharts();
    notifyOverdue();
  } catch (err) {
    console.error(err);
    dueToast("Failed to fetch customers", "error");
  }
}

async function addCustomer(newCustomer) {
  try {
    const res = await addCustomerAPI(newCustomer);
    customers.push(res.data);
    renderCustomers();
    updateKPIs();
    updateTopCustomers();
    updateCharts();
    dueToast("Customer added successfully!", "success");
    notifyOverdue();
  } catch (err) {
    console.error(err);
    dueToast("Failed to add customer", "error");
  }
}

async function updateCustomer(id, data) {
  try {
    const res = await updateCustomerAPI(id, data);
    const idx = customers.findIndex(c => c._id === id);
    if (idx !== -1) customers[idx] = res.data;
    renderCustomers();
    updateKPIs();
    updateTopCustomers();
    updateCharts();
    notifyOverdue();
  } catch (err) {
    console.error(err);
    dueToast("Failed to update customer", "error");
  }
}

async function deleteCustomer(id) {
  try {
    await deleteCustomerAPI(id);
    customers = customers.filter(c => c._id !== id);
    renderCustomers();
    updateKPIs();
    updateTopCustomers();
    updateCharts();
    dueToast("Customer deleted successfully!", "success");
    notifyOverdue();
  } catch (err) {
    console.error(err);
    dueToast("Failed to delete customer", "error");
  }
}

// ---------- Render ----------
function renderCustomers() {
  const filter = filterSelect.value;
  const search = searchInput.value.toLowerCase();
  customerTableBody.innerHTML = '';

  const filtered = customers.filter(c => {
    const status = calcStatus(c);
    if (filter !== 'all' && status !== filter) return false;
    if (search && !c.customerName.toLowerCase().includes(search)) return false;
    return true;
  });

  filtered.forEach((cust, index) => {
    const status = calcStatus(cust);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${cust.customerName}</td>
      <td>₦${cust.packageWorth.toLocaleString()}</td>
      <td>${cust.quantity}</td>
      <td>${new Date(cust.paymentDate).toLocaleDateString()}</td>
      <td><span class="status ${status}">${status}</span></td>
      <td>
        ${status === 'overdue' || status === 'owed' ? `<button class="btn-paid" onclick="markPaid('${cust._id}')">-Paid-</button>` : ''}
        <button class="btn-delete" onclick="deleteCustomer('${cust._id}')">Delete</button>
      </td>
    `;
    customerTableBody.appendChild(row);
  });
}

// ---------- KPIs ----------
function updateKPIs() {
  let totalPaid = 0, totalOwed = 0, totalOverdue = 0;
  customers.forEach(c => {
    const status = calcStatus(c);
    if (status === 'paid') totalPaid += c.packageWorth;
    else if (status === 'owed') totalOwed += c.packageWorth;
    else if (status === 'overdue') {
      totalOwed += c.packageWorth;
      totalOverdue += c.packageWorth;
    }
  });
  kpiPaid.textContent = "₦" + totalPaid.toLocaleString();
  kpiOwed.textContent = "₦" + totalOwed.toLocaleString();
  kpiOverdue.textContent = "₦" + totalOverdue.toLocaleString();
}

// ---------- Top Customers ----------
function updateTopCustomers() {
  const top = [...customers].sort((a,b) => b.packageWorth - a.packageWorth).slice(0,3);
  topCustomersList.innerHTML = '';
  top.forEach(c => {
    const li = document.createElement("li");
    li.innerHTML = `${c.customerName} <span>₦${c.packageWorth.toLocaleString()}</span>`;
    topCustomersList.appendChild(li);
  });
}

// ---------- Charts ----------
const ctxCust = document.getElementById("customerOverdueChart")?.getContext("2d");
const custMonthlyData = [];
const custYearlyData = [];
const monthsLabels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const lastYears = Array.from({length: 8}, (_,i)=> new Date().getFullYear() - 7 + i);

const customerOverdueChart = new Chart(ctxCust, {
  type: "line",
  data: {
    labels: monthsLabels,
    datasets: [{
      label: "Overdue Payment",
      data: custMonthlyData,
      borderColor: "rgba(231, 54, 23, 0.79)",
      backgroundColor: "rgba(220,53,69,0.2)",
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointBackgroundColor: "rgba(247, 232, 23, 0.92)"
    }]
  },
  options: {
    responsive: true,
    plugins: { legend: { display: false }},
    scales: {
      y: { beginAtZero: true, ticks: { color: "#333" }, grid: { color: "#eee" } },
      x: { grid: { color: "#eee" }, ticks: { color: "#333" } }
    }
  }
});

function updateCharts() {
  const monthly = Array(12).fill(0);
  const yearly = Array(8).fill(0);
  const currentYear = new Date().getFullYear();

  customers.forEach(c => {
    const status = calcStatus(c);
    if (status === 'overdue') {
      const date = new Date(c.paymentDate);
      monthly[date.getMonth()] += c.packageWorth;

      const yearIndex = date.getFullYear() - (currentYear - 7);
      if (yearIndex >=0 && yearIndex < 8) yearly[yearIndex] += c.packageWorth;
    }
  });

  custMonthlyData.splice(0,custMonthlyData.length,...monthly);
  custYearlyData.splice(0,custYearlyData.length,...yearly);

  if (custMonthlyTab.classList.contains("active")) {
    customerOverdueChart.data.labels = monthsLabels;
    customerOverdueChart.data.datasets[0].data = custMonthlyData;
  } else {
    customerOverdueChart.data.labels = lastYears;
    customerOverdueChart.data.datasets[0].data = custYearlyData;
  }

  customerOverdueChart.update();
}

// ---------- Mark Paid ----------
window.markPaid = function(id) {
  updateCustomer(id, { status: 'paid' });
  dueToast("Customer marked as Paid!", "success");
};

// ---------- Modal ----------
addCustomerBtn.addEventListener('click', () => addCustomerModal.style.display = 'block');
closeModalBtn.addEventListener('click', () => addCustomerModal.style.display = 'none');
window.addEventListener('click', (e) => { if(e.target === addCustomerModal) addCustomerModal.style.display = 'none'; });

// ---------- Form Submit ----------
addCustomerForm.addEventListener('submit', e => {
  e.preventDefault();
  const newCustomer = {
    customerName: document.getElementById('customerName').value,
    packageWorth: parseFloat(document.getElementById('packageWorth').value),
    quantity: parseInt(document.getElementById('quantity').value, 10),
    paymentDate: document.getElementById('paymentDate').value,
    status: 'owed'
  };
  addCustomer(newCustomer);
  addCustomerForm.reset();
  addCustomerModal.style.display = 'none';
});

// ---------- Filters ----------
filterSelect.addEventListener('change', renderCustomers);
searchInput.addEventListener('input', renderCustomers);

// ---------- Tabs ----------
custMonthlyTab.addEventListener("click", () => {
  customerOverdueChart.data.labels = monthsLabels;
  customerOverdueChart.data.datasets[0].data = custMonthlyData;
  customerOverdueChart.update();
  custMonthlyTab.classList.add("active");
  custYearlyTab.classList.remove("active");
});

custYearlyTab.addEventListener("click", () => {
  customerOverdueChart.data.labels = lastYears;
  customerOverdueChart.data.datasets[0].data = custYearlyData;
  customerOverdueChart.update();
  custYearlyTab.classList.add("active");
  custMonthlyTab.classList.remove("active");
});

// ---------- Export to Excel ----------
document.getElementById("exportExcelBtn").addEventListener("click", () => {
  if(customers.length === 0){ dueToast("No data to export","error"); return; }
  const ws = XLSX.utils.json_to_sheet(customers.map((c,i)=>({
    "S/N": i+1,
    "Customer Name": c.customerName,
    "Package Worth": c.packageWorth,
    "Quantity": c.quantity,
    "Payment Date": new Date(c.paymentDate).toLocaleDateString(),
    "Status": calcStatus(c)
  })));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Customers");
  XLSX.writeFile(wb,"customers.xlsx");
});

// ---------- Expose global ----------
window.deleteCustomer = deleteCustomer;

// ---------- Init ----------
fetchCustomers();

window.addEventListener('storage', (event) => {
  if (event.key === 'logoutAll') {
    dueToast('Logged out from another session', 'info');
    window.location.href = 'signin.html';
  }
});
