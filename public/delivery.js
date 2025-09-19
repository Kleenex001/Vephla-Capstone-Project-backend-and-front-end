// delivery.js
import {
  getDeliveries,
  addDelivery as addDeliveryAPI,
  updateDelivery,
  deleteDelivery as deleteDeliveryAPI,
} from './deliveryApi.js';

// ---------- State ----------
let deliveries = [];
let agents = []; // empty, add dynamically

// ---------- DOM Elements ----------
const deliveryTableBody = document.querySelector("#deliveryTable tbody");
const deliveryModal = document.getElementById("deliveryModal");
const agentModal = document.getElementById("agentModal");
const deliveryAgentSelect = document.getElementById("deliveryAgent");
const topAgentsList = document.getElementById("topAgentsList");

const kpiTotal = document.getElementById("kpiTotal");
const kpiCompleted = document.getElementById("kpiCompleted");
const kpiPending = document.getElementById("kpiPending");
const kpiCancelled = document.getElementById("kpiCancelled");

// Chart
const ctxDel = document.getElementById("deliveryOverviewChart").getContext("2d");
let deliveryChart = new Chart(ctxDel, {
  type: "line",
  data: {
    labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug"],
    datasets: [{
      label: "Deliveries",
      data: Array(8).fill(0),
      borderColor: "rgba(14,138,112,0.8)",
      backgroundColor: "rgba(14,138,112,0.2)",
      fill: true,
      tension: 0.4
    }]
  },
  options: {
    responsive: true,
    plugins: { legend: { display: false }},
    scales: {
      y: { beginAtZero: true },
      x: { grid: { display: false }}
    }
  }
});

// ---------- Toast ----------
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

// ---------- Render Deliveries ----------
function renderDeliveries() {
  deliveryTableBody.innerHTML = "";
  deliveries.forEach((d, i) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${i+1}</td>
      <td>${d.customer}</td>
      <td>${d.package}</td>
      <td><span class="status ${d.status}">${capitalize(d.status)}</span></td>
      <td>${new Date(d.date).toLocaleDateString()}</td>
      <td>${d.agent.name} (${d.agent.type})</td>
      <td>
        ${d.status === "pending" ? `
          <button class="btn small success" onclick="confirmDelivery('${d._id}')">Confirm</button>
          <button class="btn small danger" onclick="cancelDelivery('${d._id}')">Cancel</button>
        ` : `<em>—</em>`}
      </td>
    `;
    deliveryTableBody.appendChild(row);
  });
}

// ---------- Update KPIs ----------
function updateKPIs() {
  kpiTotal.textContent = deliveries.length;
  kpiCompleted.textContent = deliveries.filter(d => d.status === "completed").length;
  kpiPending.textContent = deliveries.filter(d => d.status === "pending").length;
  kpiCancelled.textContent = deliveries.filter(d => d.status === "cancelled").length;
}

// ---------- Update Top Agents ----------
function updateTopAgents() {
  const stats = {};
  deliveries.forEach(d => {
    if (!stats[d.agent.name]) stats[d.agent.name] = 0;
    if (d.status === "completed") stats[d.agent.name]++;
  });

  topAgentsList.innerHTML = "";
  Object.entries(stats)
    .sort((a,b) => b[1]-a[1])
    .forEach(([name,count]) => {
      const li = document.createElement("li");
      li.innerHTML = `${name} <span>${count} Deliveries</span>`;
      topAgentsList.appendChild(li);
    });
}

// ---------- Update Chart ----------
function updateChart() {
  const monthly = Array(8).fill(0);
  const currentYear = new Date().getFullYear();
  deliveries.forEach(d => {
    if(d.status === "completed") {
      const date = new Date(d.date);
      const month = date.getMonth();
      if(month >= 0 && month < monthly.length) monthly[month] += 1;
    }
  });
  deliveryChart.data.datasets[0].data = monthly;
  deliveryChart.update();
}

// ---------- Confirm/Cancel Delivery ----------
window.confirmDelivery = async function(id) {
  try {
    await updateDelivery(id, { status: "completed" });
    await fetchAndRenderDeliveries();
    showToast("✅ Delivery confirmed", "success");
  } catch(err) {
    console.error(err);
    showToast("❌ Failed to confirm delivery", "error");
  }
};

window.cancelDelivery = async function(id) {
  try {
    await updateDelivery(id, { status: "cancelled" });
    await fetchAndRenderDeliveries();
    showToast("❌ Delivery cancelled", "error");
  } catch(err) {
    console.error(err);
    showToast("❌ Failed to cancel delivery", "error");
  }
};

// ---------- Fetch Deliveries ----------
async function fetchAndRenderDeliveries() {
  try {
    const res = await getDeliveries();
    deliveries = res.data;
    renderDeliveries();
    updateKPIs();
    updateTopAgents();
    updateChart();
  } catch(err) {
    console.error(err);
    showToast("❌ Failed to load deliveries", "error");
  }
}

// ---------- Add Delivery ----------
document.getElementById("saveDeliveryBtn").addEventListener("click", async () => {
  const customer = document.getElementById("customerName").value.trim();
  const pkg = document.getElementById("packageDetails").value.trim();
  const date = document.getElementById("deliveryDate").value;
  const agentName = deliveryAgentSelect.value;
  const agentType = document.getElementById("agentType")?.value || "Waybill";
  const agentPhone = document.getElementById("agentPhone")?.value || "";

  if(customer && pkg && date && agentName) {
    try {
      await addDeliveryAPI({
        customer,
        package: pkg,
        date,
        agent: { name: agentName, type: agentType, phone: agentPhone },
        status: "pending"
      });
      deliveryModal.style.display = "none";
      showToast("✅ Delivery added", "success");
      await fetchAndRenderDeliveries();
      document.getElementById("customerName").value = "";
      document.getElementById("packageDetails").value = "";
      document.getElementById("deliveryDate").value = "";
    } catch(err) {
      console.error(err);
      showToast("❌ Failed to add delivery", "error");
    }
  } else showToast("⚠️ Fill all fields", "info");
});

// ---------- Add Agent ----------
document.getElementById("saveAgentBtn").addEventListener("click", () => {
  const name = document.getElementById("agentName").value.trim();
  if(name && !agents.includes(name)) {
    agents.push(name);
    populateAgentDropdown();
    agentModal.style.display = "none";
    document.getElementById("agentName").value = "";
    showToast("✅ Agent added", "success");
  } else showToast("⚠️ Agent already exists or empty", "info");
});

// Populate dropdown
function populateAgentDropdown() {
  deliveryAgentSelect.innerHTML = "";
  agents.forEach(a => {
    const opt = document.createElement("option");
    opt.value = a;
    opt.textContent = a;
    deliveryAgentSelect.appendChild(opt);
  });
}

// ---------- Helpers ----------
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ---------- Modal controls ----------
document.getElementById("addDeliveryBtn").addEventListener("click", () => deliveryModal.style.display = "flex");
document.getElementById("closeModalBtn").addEventListener("click", () => deliveryModal.style.display = "none");
document.getElementById("addAgentBtn").addEventListener("click", () => agentModal.style.display = "flex");
document.getElementById("closeAgentModalBtn").addEventListener("click", () => agentModal.style.display = "none");

// ---------- Init ----------
populateAgentDropdown();
fetchAndRenderDeliveries();
