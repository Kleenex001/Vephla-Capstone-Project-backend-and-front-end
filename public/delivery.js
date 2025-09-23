// delivery.js
import {
  getDeliveries,
  addDelivery,
  updateDelivery,
  deleteDelivery,
  getAgents as getAgentsAPI,
  addAgent as addAgentAPI,
} from "./api.js";

/* -------------------------
   DOM refs
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
const agentMethodSelect = document.getElementById("agentMethod");
const agentPhoneInput = document.getElementById("agentPhone");

const filterSelect = document.getElementById("filterDeliveries");
const searchInput = document.getElementById("searchDeliveries");

/* -------------------------
   Toast
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
let deliveries = [];
let agents = [];
let displayedDeliveries = [];

/* -------------------------
   Helpers
------------------------- */
const capitalize = s => s ? s[0].toUpperCase() + s.slice(1) : "";

function persistAgents() {
  try { localStorage.setItem("delivery_agents", JSON.stringify(agents)); } catch {}
}
function loadAgentsFromStorage() {
  try { return JSON.parse(localStorage.getItem("delivery_agents") || "[]"); } catch { return []; }
}

/* -------------------------
   Agents
------------------------- */
async function loadAgents() {
  agents = [];
  try {
    const res = await getAgentsAPI();
    if (res && Array.isArray(res.data)) {
      agents = res.data.map(a => ({ name: a.name, agentType: a.type || "other", phone: a.phone || "" }));
    }
  } catch { /* fallback */ }
  if (!agents.length) agents = loadAgentsFromStorage();
  populateAgentDropdown();
  updateTopAgentsUI();
}

async function addAgent(name, type, phone) {
  if (!name || !type) { showToast("Agent name and type are required", "error"); return false; }
  name = name.trim();
  if (agents.find(a => a.name.toLowerCase() === name.toLowerCase())) { showToast("Agent already exists", "info"); return false; }

  const agentObj = { name, agentType: type, phone: phone || "" };

  try {
    const res = await addAgentAPI({ name, type, phone });
    if (res && res.data) {
      agents.push({ name: res.data.name || name, agentType: res.data.type || type, phone: res.data.phone || phone || "" });
      persistAgents();
      populateAgentDropdown();
      updateTopAgentsUI();
      showToast("Agent added", "success");
      return true;
    }
  } catch { /* fallback */ }

  agents.push(agentObj);
  persistAgents();
  populateAgentDropdown();
  updateTopAgentsUI();
  showToast("Agent added (local)", "success");
  return true;
}

function populateAgentDropdown() {
  if (!deliveryAgentSelect) return;
  deliveryAgentSelect.innerHTML = "";
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
   Deliveries
------------------------- */
async function loadDeliveries(status = "all") {
  try {
    const res = await getDeliveries(status);
    deliveries = Array.isArray(res) ? res : (res && res.data ? res.data : []);
    updateUI();
  } catch (err) {
    console.error("loadDeliveries error:", err);
    showToast("Failed to load deliveries", "error");
  }
}

function updateUI() {
  renderDeliveries();
  updateKPIs();
  updateTopAgentsUI();
  updateChart();
}

function renderDeliveries() {
  if (!deliveryTableBody) return;
  const filter = filterSelect?.value || "all";
  const term = (searchInput?.value || "").trim().toLowerCase();

  displayedDeliveries = deliveries.filter(d => {
    if (filter !== "all" && d.status !== filter.toLowerCase()) return false;
    const combined = `${d.customer || ""} ${d.package || ""} ${d.agent?.name || ""} ${d.agent?.phone || ""}`.toLowerCase();
    return !term || combined.includes(term);
  });

  deliveryTableBody.innerHTML = displayedDeliveries.length
    ? displayedDeliveries.map((d,i) => {
        const statusClass = d.status || "pending";
        const statusHTML = `<span class="status-pill ${statusClass}">${capitalize(d.status)}</span>`;
        return `<tr>
          <td>${i+1}</td>
          <td>${d.customer || ""}</td>
          <td>${d.package || ""}</td>
          <td>${statusHTML}</td>
          <td>${d.date ? new Date(d.date).toLocaleDateString() : ""}</td>
          <td>${d.agent?.name || ""}<br><small>${d.agent?.phone || ""}</small></td>
          <td class="actions-cell">
            ${d.status === "pending" 
              ? `<button class="btn-confirm small" data-id="${d._id}">Confirm</button>
                 <button class="btn-cancel small" data-id="${d._id}">Cancel</button>` 
              : `<button class="btn-delete small" data-id="${d._id}">Delete</button>`}
          </td>
        </tr>`; 
      }).join('')
    : `<tr><td colspan="7" style="text-align:center;opacity:.7">No deliveries</td></tr>`;
}

function updateKPIs() {
  kpiTotal && (kpiTotal.textContent = deliveries.length);
  kpiCompleted && (kpiCompleted.textContent = deliveries.filter(d => d.status === "completed").length);
  kpiPending && (kpiPending.textContent = deliveries.filter(d => d.status === "pending").length);
  kpiCancelled && (kpiCancelled.textContent = deliveries.filter(d => d.status === "cancelled").length);
}

function updateTopAgentsUI() {
  const counts = {};
  deliveries.forEach(d => {
    const name = d.agent?.name;
    if (!name) return;
    counts[name] = counts[name] || { count:0, phone: d.agent?.phone || "" };
    if(d.status==="completed") counts[name].count++;
    if(!counts[name].phone && d.agent?.phone) counts[name].phone = d.agent.phone;
  });
  agents.forEach(a => { if(!counts[a.name]) counts[a.name]={count:0,phone:a.phone||""}; });
  const top5 = Object.entries(counts)
    .map(([name,{count,phone}])=>({name,count,phone}))
    .sort((a,b)=>b.count-a.count)
    .slice(0,5);
  if(!topAgentsList) return;
  topAgentsList.innerHTML = top5.length
    ? top5.map((a,i)=>`<li><strong>#${i+1}</strong> ${a.name} <span class="muted">(${a.phone||"no phone"})</span> — ${a.count} deliveries</li>`).join('')
    : "<li style='opacity:.7'>No agents yet</li>";
}

/* -------------------------
   Chart.js
------------------------- */
const ctx = document.getElementById("deliveryOverviewChart")?.getContext("2d");
let deliveryChart = null;
function updateChart() {
  if(!ctx) return;
  const counts={pending:0,completed:0,cancelled:0};
  deliveries.forEach(d=>counts[d.status]++);
  if(deliveryChart) deliveryChart.destroy();
  deliveryChart=new Chart(ctx,{
    type:"doughnut",
    data:{labels:["Pending","Completed","Cancelled"],datasets:[{data:[counts.pending,counts.completed,counts.cancelled],backgroundColor:["#ffc107","#28a745","#dc3545"]}]},
    options:{responsive:true,plugins:{legend:{position:"bottom"}}}
  });
}

/* -------------------------
   Event handlers
------------------------- */
// Open/close modals
addDeliveryBtn?.addEventListener("click", () => deliveryModal.style.display = "block");
closeDeliveryModalBtn?.addEventListener("click", () => deliveryModal.style.display = "none");

addAgentBtn?.addEventListener("click", () => agentModal.style.display = "block");
closeAgentModalBtn?.addEventListener("click", () => agentModal.style.display = "none");

// Save agent
saveAgentBtn?.addEventListener("click", async () => {
  const added = await addAgent(agentNameInput.value, agentMethodSelect.value, agentPhoneInput.value);
  if (added) agentModal.style.display = "none";
  agentNameInput.value = "";
  agentPhoneInput.value = "";
});

// Save delivery
saveDeliveryBtn?.addEventListener("click", async () => {
  const customer = customerInput.value.trim();
  const pkg = packageInput.value.trim();
  const date = dateInput.value;
  const agentName = deliveryAgentSelect.value;

  if (!customer || !pkg || !date || !agentName) {
    showToast("All fields are required", "error");
    return;
  }

  const agent = agents.find(a => a.name === agentName);
  const payload = {
    customer,
    package: pkg,
    date,
    agentName: agent.name,
    agentType: agent.agentType || "other",
    agentPhone: agent.phone || "",
    status: "pending"
  };

  try {
    await addDelivery(payload);
    showToast("Delivery added", "success");
    deliveryModal.style.display = "none";
    customerInput.value = "";
    packageInput.value = "";
    dateInput.value = "";
    deliveryAgentSelect.value = "";
    loadDeliveries();
  } catch (err) {
    showToast(err.message || "Failed to add delivery", "error");
  }
});

filterSelect?.addEventListener("change",()=>loadDeliveries(filterSelect.value));
searchInput?.addEventListener("input",renderDeliveries);

deliveryTableBody?.addEventListener("click",async(e)=>{
  const id=e.target.dataset.id;
  if(!id) return;
  if(e.target.classList.contains("btn-delete")){
    if(confirm("Delete this delivery?")){
      try{await deleteDelivery(id);showToast("Delivery deleted","success");loadDeliveries();}
      catch(err){showToast(err.message||"Failed to delete","error");}
    }
  } else if(e.target.classList.contains("btn-confirm")){
    try{await updateDelivery(id,{status:"completed"});showToast("Delivery marked completed","success");loadDeliveries();}
    catch(err){showToast(err.message||"Failed to update","error");}
  } else if(e.target.classList.contains("btn-cancel")){
    try{await updateDelivery(id,{status:"cancelled"});showToast("Delivery cancelled","info");loadDeliveries();}
    catch(err){showToast(err.message||"Failed to update","error");}
  }
});

/* -------------------------
   Initialize
------------------------- */
document.addEventListener("DOMContentLoaded",()=>{
  loadAgents();
  loadDeliveries();
});
