// delivery.js
// ES module that integrates with api.js
import {
  getDeliveries,
  addDelivery,
  updateDelivery,
  deleteDelivery,
  getAgents as getAgentsAPI,
  addAgentAPI,
} from "./api.js";

/* -------------------------
   DOM refs (match your HTML)
   ------------------------- */
const deliveryTableBody = document.querySelector("#deliveryTable tbody");
const deliveryModal = document.getElementById("deliveryModal");
const agentModal = document.getElementById("agentModal");
const deliveryAgentSelect = document.getElementById("deliveryAgent");
const topAgentsList = document.getElementById("topAgentsList");

const kpiTotal = document.getElementById("kpiTotal");
const kpiCompleted = document.getElementById("kpiCompleted");
const kpiPending = document.getElementById("kpiPending");
const kpiCancelled = document.getElementById("kpiCancelled");

const addDeliveryBtn = document.getElementById("addDeliveryBtn");
const saveDeliveryBtn = document.getElementById("saveDeliveryBtn");
const closeDeliveryModalBtn = document.getElementById("closeModalBtn");

const addAgentBtn = document.getElementById("addAgentBtn");
const saveAgentBtn = document.getElementById("saveAgentBtn");
const closeAgentModalBtn = document.getElementById("closeAgentModalBtn");

const customerInput = document.getElementById("customerName");
const packageInput = document.getElementById("packageDetails");
const dateInput = document.getElementById("deliveryDate");

const agentNameInput = document.getElementById("agentName");
const agentMethodSelect = document.getElementById("agentMethod"); // matches your HTML
const agentPhoneInput = document.getElementById("agentPhone");

const filterSelect = document.getElementById("filterDeliveries");
const searchInput = document.getElementById("searchDeliveries");

/* -------------------------
   Toast container / styles
   ------------------------- */
const appContainer = document.querySelector("main") || document.body;
const toastContainer = document.createElement("div");
toastContainer.id = "toastContainer";
Object.assign(toastContainer.style, {
  position: "fixed",
  top: "20px",
  right: "20px",
  zIndex: 9999,
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  pointerEvents: "none",
});
appContainer.appendChild(toastContainer);

function showToast(message, type = "info", duration = 3000) {
  const t = document.createElement("div");
  t.className = `delivery-toast ${type}`;
  t.textContent = message;
  Object.assign(t.style, {
    pointerEvents: "auto",
    padding: "8px 12px",
    borderRadius: "6px",
    color: "#fff",
    background:
      type === "success" ? "rgba(14,138,112,.95)" :
      type === "error" ? "rgba(220,53,69,.95)" :
      "rgba(23,162,184,.95)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    transform: "translateX(12px)",
    opacity: "0",
    transition: "all .18s ease",
  });
  toastContainer.appendChild(t);
  requestAnimationFrame(() => { t.style.opacity = "1"; t.style.transform = "translateX(0)"; });
  setTimeout(() => {
    t.style.opacity = "0"; t.style.transform = "translateX(12px)";
    t.addEventListener("transitionend", () => t.remove(), { once: true });
  }, duration);
}

/* -------------------------
   State
   ------------------------- */
let deliveries = []; // data pulled from backend (array of objects)
let agents = [];     // { name, agentType, phone }
let displayedDeliveries = []; // currently displayed after filter/search

/* -------------------------
   Chart setup (Chart.js)
   ------------------------- */
const ctx = document.getElementById("deliveryOverviewChart")?.getContext("2d");
let deliveryOverviewChart = null;
if (ctx) {
  deliveryOverviewChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [], // months (filled later)
      datasets: [{
        label: "Deliveries",
        data: [],
        borderColor: "rgba(14,138,112,1)",
        backgroundColor: "rgba(14,138,112,0.12)",
        tension: 0.45, // wavelike curve
        pointRadius: 3,
        fill: true,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

/* -------------------------
   Helpers
   ------------------------- */
function capitalize(s) { return s ? s[0].toUpperCase() + s.slice(1) : ""; }

function persistAgents() {
  try { localStorage.setItem("delivery_agents", JSON.stringify(agents)); } catch (e) { /* ignore */ }
}
function loadAgentsFromStorage() {
  try {
    const raw = localStorage.getItem("delivery_agents");
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) { return []; }
}

/* -------------------------
   Agents: load (API fallback to localStorage)
   ------------------------- */
async function loadAgents() {
  agents = [];
  // try API first if available
  if (typeof getAgentsAPI === "function") {
    try {
      const res = await getAgentsAPI();
      // note: your API version may return { success:true, data: [...] } or raw array
      if (res && res.data && Array.isArray(res.data)) {
        agents = res.data.map(a => ({ name: a.name, agentType: a.type || a.agentType || "other", phone: a.phone || "" }));
      } else if (Array.isArray(res)) {
        agents = res.map(a => ({ name: a.name, agentType: a.type || a.agentType || "other", phone: a.phone || "" }));
      }
    } catch (err) {
      // ignore - fallback to localStorage
    }
  }

  if (!agents.length) {
    // fallback to localStorage if API didn't give data
    agents = loadAgentsFromStorage();
  }

  populateAgentDropdown();
  updateTopAgentsUI(); // show top agents (from deliveries + agents)
}

/* -------------------------
   Add agent (tries API then local store)
   ------------------------- */
async function addAgent(name, type, phone) {
  if (!name || !type) {
    showToast("Agent name and type are required", "error");
    return false;
  }
  name = name.trim();
  if (agents.find(a => a.name.toLowerCase() === name.toLowerCase())) {
    showToast("Agent already exists", "info");
    return false;
  }

  const agentObj = { name, agentType: type, phone: phone || "" };

  // try API if available
  if (typeof addAgentAPI === "function") {
    try {
      const res = await addAgentAPI({ name, type, phone });
      // api may return { success:true, data: { ... } } or similar
      if (res && res.data) {
        agents.push({ name: res.data.name || name, agentType: res.data.type || type, phone: res.data.phone || phone || "" });
        persistAgents();
        populateAgentDropdown();
        updateTopAgentsUI();
        showToast("Agent added", "success");
        return true;
      }
    } catch (err) {
      // fallback to local
      console.warn("addAgentAPI failed, falling back to local storage:", err);
    }
  }

  // local fallback
  agents.push(agentObj);
  persistAgents();
  populateAgentDropdown();
  updateTopAgentsUI();
  showToast("Agent added (local)", "success");
  return true;
}

/* -------------------------
   Populate agent dropdown in Delivery modal
   ------------------------- */
function populateAgentDropdown() {
  if (!deliveryAgentSelect) return;
  deliveryAgentSelect.innerHTML = "";
  // default option
  const defaultOpt = document.createElement("option");
  defaultOpt.value = "";
  defaultOpt.textContent = "-- choose agent --";
  deliveryAgentSelect.appendChild(defaultOpt);

  agents.forEach(agent => {
    const opt = document.createElement("option");
    opt.value = agent.name;
    opt.textContent = `${agent.name} (${agent.agentType}${agent.phone ? " • " + agent.phone : ""})`;
    deliveryAgentSelect.appendChild(opt);
  });
}

/* -------------------------
   Load deliveries from API and update UI
   ------------------------- */
async function loadDeliveries(status = "all") {
  try {
    const res = await getDeliveries(status);
    // API returns { success:true, data: [...] }
    deliveries = Array.isArray(res) ? res : (res && res.data ? res.data : []);
    if (!Array.isArray(deliveries)) deliveries = [];

    // calculate agent completed counts if agent embedded has deliveriesCompleted
    // we'll derive top agents from deliveries: count completed by agent name
    updateUI();
  } catch (err) {
    console.error("loadDeliveries error:", err);
    showToast("Failed to load deliveries", "error");
  }
}

/* -------------------------
   Update UI: table, KPIs, chart, top agents
   ------------------------- */
function updateUI() {
  renderDeliveries();
  updateKPIs();
  updateTopAgentsUI();
  updateChart();
}

/* render table with search+filter applied */
function renderDeliveries() {
  if (!deliveryTableBody) return;
  const filter = filterSelect?.value || "all";
  const term = (searchInput?.value || "").trim().toLowerCase();

  displayedDeliveries = deliveries.filter(d => {
    if (filter && filter !== "all") {
      if ((d.status || "").toLowerCase() !== filter.toLowerCase()) return false;
    }
    if (term) {
      const combined = `${d.customer || ""} ${d.package || ""} ${d.agent?.name || ""} ${(d.agent?.phone || "")}`.toLowerCase();
      if (!combined.includes(term)) return false;
    }
    return true;
  });

  deliveryTableBody.innerHTML = "";
  if (!displayedDeliveries.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="7" style="text-align:center;opacity:.7">No deliveries</td>`;
    deliveryTableBody.appendChild(tr);
    return;
  }

  displayedDeliveries.forEach((d, i) => {
    const tr = document.createElement("tr");

    // Status pill classes and faint colors
    const statusClass = d.status || "pending";
    const statusHTML = `<span class="status-pill ${statusClass}">${capitalize(d.status)}</span>`;

    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${d.customer || ""}</td>
      <td>${d.package || ""}</td>
      <td>${statusHTML}</td>
      <td>${d.date ? new Date(d.date).toLocaleDateString() : ""}</td>
      <td>${d.agent?.name || ""}<br><small>${d.agent?.phone || ""}</small></td>
      <td class="actions-cell">
        ${d.status === "pending" ? `<button class="btn-confirm small" data-id="${d._id}">Confirm</button>
                                   <button class="btn-cancel small" data-id="${d._id}">Cancel</button>` :
                                 `<button class="btn-delete small" data-id="${d._id}">Delete</button>`}
      </td>
    `;
    deliveryTableBody.appendChild(tr);
  });
}

/* KPI counts */
function updateKPIs() {
  kpiTotal && (kpiTotal.textContent = deliveries.length);
  kpiCompleted && (kpiCompleted.textContent = deliveries.filter(d => d.status === "completed").length);
  kpiPending && (kpiPending.textContent = deliveries.filter(d => d.status === "pending").length);
  kpiCancelled && (kpiCancelled.textContent = deliveries.filter(d => d.status === "cancelled").length);
}

/* Top 5 agents derived from deliveries + agent objects
   We count completed deliveries per agent name and show phone when available
*/
function updateTopAgentsUI() {
  const counts = {};
  deliveries.forEach(d => {
    const name = d.agent?.name || null;
    if (!name) return;
    counts[name] = counts[name] || { count: 0, phone: d.agent?.phone || "" };
    if (d.status === "completed") counts[name].count++;
    // keep phone if missing
    if (!counts[name].phone && d.agent?.phone) counts[name].phone = d.agent.phone;
  });

  // also ensure agents saved locally appear with 0 if not in deliveries
  agents.forEach(a => {
    const n = a.name;
    if (!counts[n]) counts[n] = { count: 0, phone: a.phone || "" };
  });

  const arr = Object.entries(counts).map(([name, {count, phone}]) => ({ name, count, phone }));
  arr.sort((a,b) => b.count - a.count);
  const top5 = arr.slice(0, 5);

  if (!topAgentsList) return;
  topAgentsList.innerHTML = "";
  if (!top5.length) {
    topAgentsList.innerHTML = "<li style='opacity:.7'>No agents yet</li>";
    return;
  }
  top5.forEach((a, idx) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>#${idx+1}</strong> ${a.name} <span class="muted">(${a.phone || "no phone"})</span> — ${a.count} deliveries`;
    topAgentsList.appendChild(li);
  });
}

/* Chart: monthly counts (wavelike line) */
function updateChart() {
  if (!deliveryOverviewChart) return;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const counts = new Array(12).fill(0);
  deliveries.forEach(d => {
    if (!d.date) return;
    const m = new Date(d.date).getMonth();
    counts[m] = (counts[m] || 0) + 1;
  });
  deliveryOverviewChart.data.labels = months;
  deliveryOverviewChart.data.datasets[0].data = counts;
  deliveryOverviewChart.update();
}

/* -------------------------
   Actions: saving a delivery
   ------------------------- */
async function onSaveDelivery() {
  const customer = (customerInput?.value || "").trim();
  const pkg = (packageInput?.value || "").trim();
  const date = (dateInput?.value || "").trim();
  const agentName = (deliveryAgentSelect?.value || "").trim();

  if (!customer || !pkg || !date || !agentName) {
    showToast("Please fill all delivery fields (including selecting an agent)", "error");
    return;
  }

  const agent = agents.find(a => a.name === agentName);
  const payload = {
    customer,
    package: pkg,
    date,
    agentName: agent?.name || agentName,
    agentType: agent?.agentType || "other",
    agentPhone: agent?.phone || "",
    status: "pending"
  };

  try {
    const res = await addDelivery(payload);
    // handle API responses { success:true, data: ... } or raw data
    const saved = res && res.data ? res.data : (res || null);
    if (!saved) throw new Error("Invalid response from server");

    deliveries.unshift(saved); // show new one at top
    populateAgentDropdown(); // in case agent was added in modal just now
    updateUI();
    showToast("Delivery added", "success");

    // close and clear modal
    if (deliveryModal) deliveryModal.style.display = "none";
    customerInput.value = ""; packageInput.value = ""; dateInput.value = ""; deliveryAgentSelect.value = "";
  } catch (err) {
    console.error("Failed to add delivery:", err);
    // show server details if present
    const message = (err && (err.details || err.error || err.message)) ? (err.details || err.error || err.message) : "Failed to add delivery";
    showToast(message, "error");
  }
}

/* -------------------------
   Confirm / Cancel / Delete actions by delivery _id
   ------------------------- */
async function confirmDeliveryById(id) {
  if (!id) return;
  try {
    const res = await updateDelivery(id, { status: "completed" });
    const updated = res && res.data ? res.data : res;
    // replace in deliveries
    const idx = deliveries.findIndex(d => String(d._id) === String(id));
    if (idx > -1) deliveries[idx] = updated;
    updateUI();
    showToast("Delivery confirmed", "success");
  } catch (err) {
    console.error("confirmDelivery error:", err);
    showToast("Failed to confirm delivery", "error");
  }
}

async function cancelDeliveryById(id) {
  if (!id) return;
  try {
    const res = await updateDelivery(id, { status: "cancelled" });
    const updated = res && res.data ? res.data : res;
    const idx = deliveries.findIndex(d => String(d._id) === String(id));
    if (idx > -1) deliveries[idx] = updated;
    updateUI();
    showToast("Delivery cancelled", "info");
  } catch (err) {
    console.error("cancelDelivery error:", err);
    showToast("Failed to cancel delivery", "error");
  }
}

async function deleteDeliveryById(id) {
  if (!id) return;
  if (!confirm("Are you sure you want to delete this delivery?")) return;
  try {
    await deleteDelivery(id);
    deliveries = deliveries.filter(d => String(d._id) !== String(id));
    updateUI();
    showToast("Delivery deleted", "success");
  } catch (err) {
    console.error("deleteDelivery error:", err);
    showToast("Failed to delete delivery", "error");
  }
}

/* -------------------------
   Event delegation on table for action buttons
   ------------------------- */
if (deliveryTableBody) {
  deliveryTableBody.addEventListener("click", (ev) => {
    const btn = ev.target.closest("button");
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.classList.contains("btn-confirm")) confirmDeliveryById(id);
    else if (btn.classList.contains("btn-cancel")) cancelDeliveryById(id);
    else if (btn.classList.contains("btn-delete")) deleteDeliveryById(id);
  });
}

/* -------------------------
   Wire up modal open/close and buttons
   ------------------------- */
addDeliveryBtn?.addEventListener("click", () => { if (deliveryModal) deliveryModal.style.display = "flex"; });
closeDeliveryModalBtn?.addEventListener("click", () => { if (deliveryModal) deliveryModal.style.display = "none"; });
saveDeliveryBtn?.addEventListener("click", onSaveDelivery);

addAgentBtn?.addEventListener("click", () => { if (agentModal) agentModal.style.display = "flex"; });
closeAgentModalBtn?.addEventListener("click", () => { if (agentModal) agentModal.style.display = "none"; });

saveAgentBtn?.addEventListener("click", async () => {
  const name = (agentNameInput?.value || "").trim();
  const type = (agentMethodSelect?.value || "").trim();
  const phone = (agentPhoneInput?.value || "").trim();

  const added = await addAgent(name, type, phone);
  if (added) {
    if (agentModal) agentModal.style.display = "none";
    agentNameInput.value = ""; agentPhoneInput.value = "";
  }
});

/* Filter / Search */
filterSelect?.addEventListener("change", () => {
  loadDeliveries(filterSelect.value || "all");
});
searchInput?.addEventListener("input", () => {
  renderDeliveries();
});

/* Close modals when clicking outside content */
window.addEventListener("click", (ev) => {
  if (ev.target === deliveryModal) deliveryModal.style.display = "none";
  if (ev.target === agentModal) agentModal.style.display = "none";
});

/* expose some functions if you still used inline onclicks elsewhere */
window.confirmDelivery = (idxOrId) => {
  // if passed an index number, try map to displayed list
  if (!idxOrId) return;
  if (/^[0-9]+$/.test(String(idxOrId))) {
    const row = displayedDeliveries[Number(idxOrId)];
    if (row) confirmDeliveryById(row._id);
  } else {
    confirmDeliveryById(idxOrId);
  }
};
window.cancelDelivery = (idxOrId) => {
  if (!idxOrId) return;
  if (/^[0-9]+$/.test(String(idxOrId))) {
    const row = displayedDeliveries[Number(idxOrId)];
    if (row) cancelDeliveryById(row._id);
  } else {
    cancelDeliveryById(idxOrId);
  }
};

/* -------------------------
   Initial load
   ------------------------- */
(async function init() {
  // restore agents from storage (in case API unavailable)
  const local = loadAgentsFromStorage();
  if (local && local.length && !agents.length) agents = local;

  await loadAgents();
  await loadDeliveries();
})();
