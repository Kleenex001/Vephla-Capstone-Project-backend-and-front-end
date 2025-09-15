// api.js
export const endpoints = {
  auth: '/api/auth',
  dashboard: '/api/dashboard',
  sales: '/api/sales',
  inventory: '/api/inventory',
  customers: '/api/customers',
  deliveries: '/api/deliveries',
  suppliers: '/api/suppliers',
  settings: '/api/settings',
};

export async function apiRequest(endpoints, method = 'GET', body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('authToken');
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`https://biz-boost.onrender.com${endpoints}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data;
}