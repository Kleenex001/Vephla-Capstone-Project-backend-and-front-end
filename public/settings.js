// settings.js

import { getSettings, saveSettings as saveSettingsAPI } from './api.js';

// ---------- Toast Notification ----------
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 100);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ---------- Apply Settings to Page ----------
function applySettingsToPage(settings) {
  const businessNameEl = document.getElementById('businessNameHeader');
  if (businessNameEl && settings.businessName) {
    businessNameEl.textContent = settings.businessName;
  }

  const userNameEl = document.getElementById('userNameHeader');
  if (userNameEl && settings.contactPerson) {
    userNameEl.textContent = settings.contactPerson;
  }

  const syncStatusEl = document.getElementById('syncStatus');
  if (syncStatusEl) {
    syncStatusEl.textContent = settings.cloudBackup ? 'Online' : 'Offline';
    syncStatusEl.style.color = settings.cloudBackup ? 'green' : 'red';
  }

  document.querySelectorAll('[data-currency]').forEach(el => {
    el.textContent = settings.currency;
  });
}

// ---------- Save Settings ----------
const settingsForm = document.getElementById('settingsForm');

async function saveSettings(e) {
  e?.preventDefault();

  const updatedSettings = {
    businessName: settingsForm?.businessName?.value || '',
    contactPerson: settingsForm?.contactPerson?.value || '',
    email: settingsForm?.email?.value || '',
    phone: settingsForm?.phone?.value || '',
    businessCategory: settingsForm?.businessCategory?.value || '',
    language: settingsForm?.language?.value || 'English',
    currency: settingsForm?.currency?.value || 'NGN',
    dateFormat: settingsForm?.dateFormat?.value || 'DD/MM/YYYY',
    notifications: settingsForm?.notifications?.checked ?? true,
    exportData: settingsForm?.exportData?.checked ?? false,
    cloudBackup: settingsForm?.cloudBackup?.checked ?? false,
  };

  try {
    const saved = await saveSettingsAPI(updatedSettings);

    // Save to localStorage for cross-tab updates
    localStorage.setItem('bizboostSettings', JSON.stringify(saved));

    // Dispatch event for current tab
    document.dispatchEvent(new CustomEvent('settingsApplied', { detail: saved }));

    showToast('✅ Settings saved successfully!', 'success');
  } catch (err) {
    console.error(err);
    showToast('❌ Error saving settings', 'error');
  }
}

settingsForm?.addEventListener('submit', saveSettings);

// ---------- Logout with Modal ----------
document.getElementById('logoutBtn')?.addEventListener('click', () => {
  openModal('logoutModal'); // Open the logout confirmation modal
});

document.getElementById('confirmLogoutBtn')?.addEventListener('click', () => {
  // Propagate logout to all tabs
  localStorage.setItem('logoutAll', Date.now());
  showToast('👋 Logged out', 'info');
  window.location.href = 'signin.html';
});

document.getElementById('cancelLogoutBtn')?.addEventListener('click', () => {
  closeModal('logoutModal');
});

// ---------- Manual Sync ----------
document.querySelector("#exportModal .btn.primary")?.addEventListener("click", async () => {
  showToast("🔄 Sync started...", "info");
  try {
    const res = await fetch("/api/sync", { method: "POST" });
    if (!res.ok) throw new Error("Sync failed");
    showToast("✅ Sync completed!", "success");
  } catch (err) {
    console.error(err);
    showToast("❌ Sync error", "error");
  }
});

// ---------- Download Receipt ----------
document.querySelector("#receiptModal .btn.primary")?.addEventListener("click", () => {
  const link = document.createElement("a");
  link.href = "Assets/sample-receipt.pdf";
  link.download = "Receipt.pdf";
  link.click();
  showToast("📄 Receipt downloaded", "success");
});

// ---------- Cross-Tab Event Listener ----------
window.addEventListener('storage', (event) => {
  if (event.key === 'bizboostSettings') {
    const settings = JSON.parse(event.newValue);
    applySettingsToPage(settings);
    showToast('⚡ Settings updated in another tab', 'info');
  }

  if (event.key === 'logoutAll') {
    showToast('👋 Logged out from another session', 'info');
    window.location.href = 'signin.html';
  }
});

// ---------- Modal Functions ----------
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('active');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
}

// Close modal when clicking outside
document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', e => {
    if (e.target === modal) closeModal(modal.id);
  });
});

// ---------- Initialize Settings ----------
document.addEventListener('DOMContentLoaded', async () => {
  const saved = localStorage.getItem('bizboostSettings');
  if (saved) applySettingsToPage(JSON.parse(saved));

  try {
    const latest = await getSettings();
    if (latest) {
      applySettingsToPage(latest);
      localStorage.setItem('bizboostSettings', JSON.stringify(latest));
    }
  } catch (err) {
    console.error('Failed to load settings from backend', err);
    showToast('⚠️ Could not load settings', 'error');
  }
});
