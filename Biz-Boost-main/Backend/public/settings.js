//  Sidebar navigation 
function setActivePage(page) {
  document.querySelectorAll('.nav-link').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.querySelector(`.nav-link[data-target="${page}"]`);
  if (activeBtn) activeBtn.classList.add('active');
}

//  Go Back button 
document.getElementById('goBackBtn')?.addEventListener('click', () => {
  window.history.back();
});

//  Toast Notification 
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

//  Modal functions
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('active');
}
function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
}
document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', e => {
    if (e.target === modal) closeModal(modal.id);
  });
});

//  Settings Form Save (Backend Ready) 
const settingsForm = document.getElementById("settingsForm");

async function saveSettings(e) {
  e?.preventDefault();

  const settings = {
    notifications: settingsForm?.notifications.checked ?? true,
    currency: settingsForm?.currency.value ?? "NGN",
    dateFormat: settingsForm?.dateFormat.value ?? "DD/MM/YYYY",
    syncOnline: settingsForm?.syncOnline.checked ?? true,
  };

  try {
    const res = await fetch("/api/settings", {
      method: "POST", // or PUT depending on your backend
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });

    if (!res.ok) throw new Error("Failed to save settings");

    showToast("✅ Settings saved successfully!", "success");

    // Dispatch global event so dashboard can react
    document.dispatchEvent(new CustomEvent("settingsApplied", { detail: settings }));
  } catch (err) {
    console.error(err);
    showToast("❌ Error saving settings", "error");
  }
}

settingsForm?.addEventListener("submit", saveSettings);

//  Load + Apply Settings (from Backend) 
async function loadSettings() {
  try {
    const res = await fetch("/api/settings");
    if (!res.ok) throw new Error("Failed to load settings");

    const saved = await res.json();
    if (!saved) return;

    if (settingsForm) {
      settingsForm.notifications.checked = saved.notifications ?? true;
      settingsForm.currency.value = saved.currency ?? "NGN";
      settingsForm.dateFormat.value = saved.dateFormat ?? "DD/MM/YYYY";
      settingsForm.syncOnline.checked = saved.syncOnline ?? true;
    }

    applySettingsToPage(saved);
  } catch (err) {
    console.error(err);
    showToast("⚠️ Unable to load settings from server", "error");
  }
}

function applySettingsToPage(settings) {
  const syncStatusEl = document.getElementById("syncStatus");
  if (syncStatusEl) {
    syncStatusEl.textContent = settings.syncOnline ? "Online" : "Offline";
    syncStatusEl.style.color = settings.syncOnline ? "green" : "red";
  }
}

//  Live Previews 
document.querySelector('input[name="notifications"]')?.addEventListener("change", e => {
  showToast(e.target.checked ? "🔔 Notifications enabled" : "🔕 Notifications disabled");
});
document.querySelector("select[name='currency']")?.addEventListener("change", e => {
  showToast(`💱 Currency changed to: ${e.target.value}`);
});
document.querySelector("select[name='dateFormat']")?.addEventListener("change", e => {
  showToast(`📅 Date format set to: ${e.target.value}`);
});

//  Export / Sync actions 
function downloadReceipt() {
  const link = document.createElement("a");
  link.href = "Assets/sample-receipt.pdf";
  link.download = "Receipt.pdf";
  link.click();
  showToast("📄 Receipt downloaded", "success");
}
async function manualSync() {
  showToast("🔄 Sync started...", "info");
  try {
    const res = await fetch("/api/sync", { method: "POST" });
    if (!res.ok) throw new Error("Sync failed");
    showToast("✅ Sync completed!", "success");
  } catch (err) {
    console.error(err);
    showToast("❌ Sync error", "error");
  }
}
document.querySelector("#receiptModal .btn.primary")?.addEventListener("click", downloadReceipt);
document.querySelector("#exportModal .btn.primary")?.addEventListener("click", manualSync);

//  Logout 
document.getElementById("logoutBtn")?.addEventListener("click", () => {
  if (confirm("Are you sure you want to logout?")) {
    showToast("👋 Logged out", "info");
    window.location.href = "sign in.html";
  }
});

// Global Settings Listener 
document.addEventListener("settingsApplied", e => {
  const settings = e.detail;

  // Example: update all currency fields
  document.querySelectorAll("[data-currency]").forEach(el => {
    el.textContent = settings.currency;
  });

  // Example: re-render charts if present
  if (window.updateDashboardCharts) {
    window.updateDashboardCharts(settings);
  }

  // Example: refresh KPIs if function exists
  if (window.updateKPIs) {
    window.updateKPIs(settings);
  }
});

// Init 
document.addEventListener("DOMContentLoaded", () => {
  setActivePage(location.hash.replace("#", "") || "dashboard");
  loadSettings();
});
window.addEventListener("hashchange", () => {
  setActivePage(location.hash.replace("#", "") || "dashboard");
});
