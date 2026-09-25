/**
 * BizSmart API client.
 *
 * VITE_API_BASE_URL controls where the backend lives:
 *   ""                         -> offline demo mode (no backend, browser-only data)
 *   "/"                        -> same origin (Render: the Spring Boot service also serves this UI)
 *   "https://api.example.com"  -> separately hosted backend
 */
const RAW_BASE = (import.meta.env.VITE_API_BASE_URL || '').trim();

/** True when a backend is configured (same-origin or remote). */
export const API_ENABLED = RAW_BASE !== '';

/** Prefix for API URLs. Empty string means relative ("/api/...") i.e. same origin. */
export const API_BASE_URL = RAW_BASE === '/' ? '' : RAW_BASE.replace(/\/+$/, '');

const TOKEN_KEY = 'bizsmart_jwt_token';

export function getAuthToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function setAuthToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable (private mode) - ignore */
  }
}

/** Error carrying the HTTP status so callers can distinguish 401/403/409 etc. */
export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

async function request(endpoint, options = {}) {
  if (!API_ENABLED) {
    throw new ApiError('No backend configured. Running in offline demo mode.', 0);
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const token = getAuthToken();
  const { timeout = 15000, headers: extraHeaders, ...fetchOptions } = options;

  const headers = {
    Accept: 'application/json',
    ...(fetchOptions.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extraHeaders || {})
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, { ...fetchOptions, headers, signal: controller.signal });
    const text = await res.text();
    let data = {};
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }
    }

    if (!res.ok) {
      // Expired/invalid session: drop the token so the next login starts clean
      if (res.status === 401 && token) setAuthToken(null);
      throw new ApiError(data.message || data.error || `HTTP Error ${res.status}`, res.status, data);
    }
    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new ApiError('The server took too long to respond. It may be waking up - please retry.', 0);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

const json = (body) => JSON.stringify(body);

// -------------------------------------------------------------
// Response normalisers: map backend entities to the UI's shapes
// -------------------------------------------------------------
function daysUntil(dateStr) {
  if (!dateStr) return 999;
  const exp = new Date(dateStr);
  if (Number.isNaN(exp.getTime())) return 999;
  exp.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((exp.getTime() - today.getTime()) / 86400000);
}

/** Backend Product -> UI product (category/supplier become names, batches synthesised). */
export function normalizeProduct(p) {
  if (!p) return p;
  const quantity = Number(p.quantity ?? p.stockQuantity ?? 0);
  const purchasePrice = Number(p.purchasePrice ?? p.costPrice ?? 0);
  const expiryDate = p.expiryDate || '';
  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    description: p.description || '',
    category: typeof p.category === 'object' && p.category !== null ? p.category.name : p.category || 'Uncategorised',
    supplier: typeof p.supplier === 'object' && p.supplier !== null ? p.supplier.name : p.supplier || '',
    purchasePrice,
    sellingPrice: Number(p.sellingPrice ?? p.price ?? 0),
    quantity,
    minStock: Number(p.minStock ?? p.safetyStock ?? 10),
    reorderQuantity: Number(p.reorderQuantity ?? 50),
    expiryDate,
    daysToExpiry: daysUntil(expiryDate),
    batches: Array.isArray(p.batches)
      ? p.batches
      : [{ id: `B-${p.id}`, batchNo: `BAT-${p.sku || p.id}`, quantity, purchasePrice, expiryDate }]
  };
}

/** Backend Customer -> UI customer. */
export function normalizeCustomer(c) {
  if (!c) return c;
  return {
    id: c.id,
    name: c.name,
    phone: c.phone || '',
    email: c.email || '',
    city: c.city || '',
    balance: Number(c.outstandingBalance ?? c.balance ?? 0),
    limit: Number(c.creditLimit ?? c.limit ?? 5000),
    lastBillDate: '-',
    loyaltyPoints: 0,
    totalVisits: 0,
    lifetimeSpent: 0
  };
}

/** Maps backend role names to the UI's four portals. */
export function portalForRoles(roles = []) {
  const set = new Set(roles);
  if (set.has('ROLE_PLATFORM_ADMIN')) return { role: 'ADMIN', roleTitle: 'Platform Admin', tab: 'platform-admin' };
  if (set.has('ROLE_BUSINESS_OWNER') || set.has('ROLE_ADMIN') || set.has('ROLE_MANAGER')) {
    return {
      role: 'OWNER',
      roleTitle: set.has('ROLE_MANAGER') && !set.has('ROLE_BUSINESS_OWNER') ? 'Store Manager' : 'Store Owner',
      tab: 'dashboard'
    };
  }
  if (set.has('ROLE_SUPPLIER')) return { role: 'SUPPLIER', roleTitle: 'Wholesale Supplier', tab: 'supplier-portal' };
  return { role: 'EMPLOYEE', roleTitle: 'Store Cashier', tab: 'employee-dashboard' };
}

export const api = {
  // Health & connectivity
  checkHealth: async () => {
    if (!API_ENABLED) return { connected: false, reason: 'LOCAL_MODE' };
    try {
      const data = await request('/api/health', { timeout: 8000 });
      return { connected: data?.status === 'UP', data };
    } catch (e) {
      return { connected: false, error: e.message };
    }
  },

  // Authentication
  login: async (login, password) => {
    setAuthToken(null);
    const data = await request('/api/auth/signin', {
      method: 'POST',
      body: json({ username: login, password })
    });
    if (data?.token) setAuthToken(data.token);
    return data;
  },
  register: async ({ email, password, fullName, phone }) =>
    request('/api/auth/signup', { method: 'POST', body: json({ email, password, fullName, phone }) }),
  me: async () => request('/api/auth/me'),
  logout: () => setAuthToken(null),
  hasSession: () => !!getAuthToken(),

  // Products / inventory
  getProducts: async () => {
    const list = await request('/api/products');
    return Array.isArray(list) ? list.map(normalizeProduct) : [];
  },
  createProduct: async (productData) =>
    normalizeProduct(await request('/api/products', { method: 'POST', body: json(productData) })),
  updateProduct: async (id, productData) =>
    normalizeProduct(await request(`/api/products/${id}`, { method: 'PUT', body: json(productData) })),
  adjustStock: async (id, delta) =>
    normalizeProduct(await request(`/api/products/${id}/stock?delta=${encodeURIComponent(delta)}`, { method: 'PATCH' })),
  deleteProduct: async (id) => request(`/api/products/${id}`, { method: 'DELETE' }),
  getLowStockProducts: async () => {
    const list = await request('/api/products/low-stock');
    return Array.isArray(list) ? list.map(normalizeProduct) : [];
  },
  getExpiringProducts: async (days = 30) => {
    const list = await request(`/api/products/expiring?days=${days}`);
    return Array.isArray(list) ? list.map(normalizeProduct) : [];
  },

  // Customers & khata
  getCustomers: async () => {
    const list = await request('/api/customers');
    return Array.isArray(list) ? list.map(normalizeCustomer) : [];
  },
  createCustomer: async (customerData) =>
    normalizeCustomer(await request('/api/customers', { method: 'POST', body: json(customerData) })),
  recordKhataPayment: async (customerId, amount, mode, note) =>
    normalizeCustomer(await request(`/api/customers/${customerId}/payments`, {
      method: 'POST',
      body: json({ amount, mode, note })
    })),

  // Employees (owner only)
  getEmployees: async () => request('/api/employees'),
  createEmployee: async ({ email, password, fullName, phone, jobTitle }) =>
    request('/api/employees', { method: 'POST', body: json({ email, password, fullName, phone, jobTitle }) }),

  // Orders / sales
  createOrder: async (orderPayload) => request('/api/orders', { method: 'POST', body: json(orderPayload) }),
  getOrders: async () => request('/api/orders'),

  // Expenses
  getExpenses: async () => request('/api/expenses'),
  createExpense: async (expense) => request('/api/expenses', { method: 'POST', body: json(expense) }),

  // Analytics
  getAnalyticsSummary: async () => request('/api/analytics/dashboard')
};

export default api;
