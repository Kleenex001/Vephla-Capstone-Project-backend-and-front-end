// 
// Delivery Management Logic
// 

// Data store
let deliveries = [];
let agents = ["James Walker", "Susan Lee", "Michael Brown"]; // default agents
let agentStats = {
  "James Walker": 250,
  "Susan Lee": 200,
  "Michael Brown": 180
};

// DOM elements
const deliveryTableBody = document.querySelector("#deliveryTable tbody");
const deliveryModal = document.getElementById("deliveryModal");
const agentModal = document.getElementById("agentModal");
const deliveryAgentSelect = document.getElementById("deliveryAgent");
const topAgentsList = document.getElementById("topAgentsList");

// KPI elements
const kpiTotal = document.getElementById("kpiTotal");
const kpiCompleted = document.getElementById("kpiCompleted");
const kpiPending = document.getElementById("kpiPending");
const kpiCancelled = document.getElementById("kpiCancelled");

// Chart
const ctxDel = document.getElementById("deliveryOverviewChart").getContext("2d");
let deliveryOverviewChart = new Chart(ctxDel, {
  type: "bar",
  data: {
    labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug"],
    datasets: [{
      label: "Deliveries",
      data: [0,0,0,0,0,0,0,0],
      backgroundColor: "#0e8a70"
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


// Functions


// Render deliveries
function renderDeliveries() {
  deliveryTableBody.innerHTML = "";
  deliveries.forEach((d, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${d.customer}</td>
      <td>${d.package}</td>
      <td><span class="status ${d.status}">${capitalize(d.status)}</span></td>
      <td>${d.date}</td>
      <td>${d.agent}</td>
      <td>
        ${d.status === "pending" ? `
          <button class="btn small success" onclick="confirmDelivery(${index})">Confirm</button>
          <button class="btn small danger" onclick="cancelDelivery(${index})">Cancel</button>
        ` : `<em>—</em>`}
      </td>
    `;
    deliveryTableBody.appendChild(row);
  });
}

// Update KPIs
function updateKPIs() {
  kpiTotal.textContent = deliveries.length;
  kpiCompleted.textContent = deliveries.filter(d => d.status === "completed").length;
  kpiPending.textContent = deliveries.filter(d => d.status === "pending").length;
  kpiCancelled.textContent = deliveries.filter(d => d.status === "cancelled").length;
}

// Update Top Agents list
function updateTopAgents() {
  topAgentsList.innerHTML = "";
  const sorted = Object.entries(agentStats)
    .sort((a, b) => b[1] - a[1]);
  sorted.forEach(([agent, count]) => {
    const li = document.createElement("li");
    li.innerHTML = `${agent} <span>${count} Deliveries</span>`;
    topAgentsList.appendChild(li);
  });
}

// Add delivery
function addDelivery(customer, pkg, date, agent) {
  deliveries.push({ customer, package: pkg, date, agent, status: "pending" });
  renderDeliveries();
  updateKPIs();
}

// Confirm delivery
function confirmDelivery(index) {
  const delivery = deliveries[index];
  delivery.status = "completed";
  agentStats[delivery.agent] = (agentStats[delivery.agent] || 0) + 1;
  renderDeliveries();
  updateKPIs();
  updateTopAgents();
}

// Cancel delivery
function cancelDelivery(index) {
  deliveries[index].status = "cancelled";
  renderDeliveries();
  updateKPIs();
}

// Add new agent
function addAgent(name) {
  if (!agents.includes(name)) {
    agents.push(name);
    agentStats[name] = 0;
    populateAgentDropdown();
    updateTopAgents();
  }
}

// Populate agent dropdown
function populateAgentDropdown() {
  deliveryAgentSelect.innerHTML = "";
  agents.forEach(agent => {
    const opt = document.createElement("option");
    opt.value = agent;
    opt.textContent = agent;
    deliveryAgentSelect.appendChild(opt);
  });
}

// Helper
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// =========================
// Event Listeners
// 

// Open add delivery modal
document.getElementById("addDeliveryBtn").addEventListener("click", () => {
  deliveryModal.style.display = "flex";
});

// Save delivery
document.getElementById("saveDeliveryBtn").addEventListener("click", () => {
  const customer = document.getElementById("customerName").value.trim();
  const pkg = document.getElementById("packageDetails").value.trim();
  const date = document.getElementById("deliveryDate").value;
  const agent = deliveryAgentSelect.value;

  if (customer && pkg && date && agent) {
    addDelivery(customer, pkg, date, agent);
    deliveryModal.style.display = "none";
    document.getElementById("customerName").value = "";
    document.getElementById("packageDetails").value = "";
    document.getElementById("deliveryDate").value = "";
  } else {
    alert("Please fill all fields");
  }
});

// Close delivery modal
document.getElementById("closeModalBtn").addEventListener("click", () => {
  deliveryModal.style.display = "none";
});

// Open add agent modal
document.getElementById("addAgentBtn").addEventListener("click", () => {
  agentModal.style.display = "flex";
});

// Save agent
document.getElementById("saveAgentBtn").addEventListener("click", () => {
  const agentName = document.getElementById("agentName").value.trim();
  if (agentName) {
    addAgent(agentName);
    agentModal.style.display = "none";
    document.getElementById("agentName").value = "";
  }
});

// Close agent modal
document.getElementById("closeAgentModalBtn").addEventListener("click", () => {
  agentModal.style.display = "none";
});

// Initialize
populateAgentDropdown();
updateTopAgents();
renderDeliveries();
updateKPIs();
document.addEventListener("DOMContentLoaded", () => {
  const ctx1 = document.getElementById("salesAnalyticsChart").getContext("2d");
  const ctx2 = document.getElementById("overduePaymentsChart").getContext("2d");
  const ctxDel = document.getElementById("deliveryOverviewChart").getContext("2d");
  let deliveryOverviewChart = new Chart(ctxDel, {
    type: "line",
    data: {
      labels: ["January", "February", "March", "April", "May", "June"],
      datasets: [{
        label: "Deliveries",
        data: [12, 19, 3, 5, 2, 3],
        backgroundColor: "rgba(14, 138, 112, 0.2)",
        borderColor: "rgba(14, 138, 112, 1)",
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
});
document.addEventListener("DOMContentLoaded", () => {
  setActivePage(location.hash.replace("#", "") || "dashboard");
});
window.addEventListener("hashchange", () => {
  setActivePage(location.hash.replace("#", "") || "dashboard");
});

