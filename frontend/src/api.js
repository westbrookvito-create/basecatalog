import { getInitData } from './telegram.js';

const API_URL = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.error || 'request_failed');
    error.code = data.error;
    error.status = res.status;
    throw error;
  }
  return data;
}

export function fetchProducts() {
  return request('/api/products');
}

export function fetchProduct(id) {
  return request(`/api/products/${id}`);
}

export function fetchConfig() {
  return request('/api/config');
}

export function createOrder(payload) {
  return request('/api/orders', {
    method: 'POST',
    body: JSON.stringify({ ...payload, initData: getInitData() }),
  });
}

export function fetchOrder(id) {
  return request(`/api/orders/${id}?initData=${encodeURIComponent(getInitData())}`);
}
