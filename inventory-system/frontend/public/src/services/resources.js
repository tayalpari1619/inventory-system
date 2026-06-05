import api from "./api";

// ── Products ──────────────────────────────────────────────────────────────────
export const productApi = {
  list: (params) => api.get("/products/", { params }),
  get: (id) => api.get(`/products/${id}`),
  create: (data) => api.post("/products/", data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

// ── Customers ─────────────────────────────────────────────────────────────────
export const customerApi = {
  list: (params) => api.get("/customers/", { params }),
  get: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post("/customers/", data),
  delete: (id) => api.delete(`/customers/${id}`),
};

// ── Orders ────────────────────────────────────────────────────────────────────
export const orderApi = {
  list: (params) => api.get("/orders/", { params }),
  get: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post("/orders/", data),
  delete: (id) => api.delete(`/orders/${id}`),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardApi = {
  stats: () => api.get("/dashboard/stats"),
};