// settings.js

import { getSettings, saveSettings as saveSettingsAPI } from './api.js';

// ---------- Toast Notification ----------
export function showToast(message, type = 'info') {
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

// ---------- Formatters ----------
export function formatCurrency(value) {
  const settings = JSON.parse(localStorage.getItem('bizboostSettings')) || {};
  const currency = settings.currency || '₦';
  return `${currency}${Number(value || 0).toLocaleString()}`;
}

export function formatDate(date) {
  const settings = JSON.parse(localStorage.getItem('bizboostSettings')) || {};
  const format = settings.dateFormat || 'DD/MM/YYYY';

  const d = new Date(date);
  if (format === 'MM/DD/YYYY') return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

// ---------- Apply Settings to Page ----------
export function applySettingsToPage(settings) {
  if (!settings) return;

  // Business + User Info
  const businessNameEl = document.getElementById('businessNameHeader');
  if (businessNameEl && settings.businessName) {
    businessNameEl.textContent = settings.businessName;
  }

  const userNameEl = document.getElementById('userNameHeader');
  if (userNameEl && settings.contactPerson) {
    userNameEl.textContent = settings.contactPerson;
  }

  // Sync Status
  const syncStatusEl = document.getElementById('syncStatus');
  if (syncStatusEl) {
    syncStatusEl.textContent = settings.cloudBackup ? 'Online' : 'Offline';
    syncStatusEl.style.color = settings.cloudBackup ? 'green' : 'red';
  }

  // Currency updates
  document.querySelectorAll('[data-currency]').forEach(el => {
    el.textContent = settings.currency || '₦';
  });

  // Update all amount fields dynamically
  document.querySelectorAll('.amount-cell').forEach(cell => {
    const rawValue = cell.dataset.value || cell.textContent.replace(/\D/g, '');
    cell.textContent = formatCurrency(rawValue);
  });

  // Trigger custom event for charts/tables to re-render
  document.dispatchEvent(new CustomEvent('settingsUpdated', { detail: settings }));
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
    currency: settingsForm?.currency?.value || '₦',
    dateFormat: settingsForm?.dateFormat?.value || 'DD/MM/YYYY',
    notifications: settingsForm?.notifications?.checked ?? true,
    exportData: settingsForm?.exportData?.checked ?? false,
    cloudBackup: settingsForm?.cloudBackup?.checked ?? false,
  };

  try {
    const savedSettings = await saveSettingsAPI(updatedSettings);

    // Save to localStorage for cross-tab updates
    localStorage.setItem('bizboostSettings', JSON.stringify(savedSettings));

    // Apply immediately
    applySettingsToPage(savedSettings);

    showToast('✅ Settings saved successfully!', 'success');
  } catch (err) {
    console.error(err);
    showToast('❌ Error saving settings', 'error');
  }
}

settingsForm?.addEventListener('submit', saveSettings);

// ---------- Logout with Modal ----------
document.getElementById('logoutBtn')?.addEventListener('click', () => {
  openModal('logoutModal');
});

document.getElementById('confirmLogoutBtn')?.addEventListener('click', () => {
  localStorage.setItem('logoutAll', Date.now());
  showToast('👋 Logged out', 'info');
  window.location.href = 'signin.html';
});

document.getElementById('cancelLogoutBtn')?.addEventListener('click', () => {
  closeModal('logoutModal');
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
