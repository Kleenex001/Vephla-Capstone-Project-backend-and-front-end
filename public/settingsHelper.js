// settingsHelper.js
import { getSettings } from './api.js';

// ---------- Apply Settings to Page ----------
export function applySettingsToPage(settings) {
  if (!settings) return;

  // Business name
  const businessNameEl = document.getElementById('businessNameHeader');
  if (businessNameEl && settings.businessName) {
    businessNameEl.textContent = settings.businessName;
  }

  // Contact person / username
  const userNameEl = document.getElementById('userNameHeader');
  if (userNameEl && settings.contactPerson) {
    userNameEl.textContent = settings.contactPerson;
  }

  // Cloud sync status
  const syncStatusEl = document.getElementById('syncStatus');
  if (syncStatusEl) {
    syncStatusEl.textContent = settings.cloudBackup ? 'Online' : 'Offline';
    syncStatusEl.style.color = settings.cloudBackup ? 'green' : 'red';
  }

  // Currency symbol everywhere
  document.querySelectorAll('[data-currency]').forEach(el => {
    el.textContent = settings.currency || '₦';
  });
}

// ---------- Initialize Settings ----------
export async function initSettings() {
  // 1. Load from localStorage
  const saved = localStorage.getItem('bizboostSettings');
  if (saved) applySettingsToPage(JSON.parse(saved));

  // 2. Load from API
  try {
    const latest = await getSettings();
    if (latest) {
      applySettingsToPage(latest);
      localStorage.setItem('bizboostSettings', JSON.stringify(latest));
    }
  } catch (err) {
    console.error(' Could not load settings from backend', err);
  }
}

// ---------- Listen for Cross-Tab Updates ----------
document.addEventListener('settingsApplied', e => {
  applySettingsToPage(e.detail);
});

window.addEventListener('storage', (event) => {
  if (event.key === 'bizboostSettings') {
    const settings = JSON.parse(event.newValue);
    applySettingsToPage(settings);
  }
});
