import api from "@/lib/axios";

export const dashboardService = {
  getStats: () => api.get("/dashboard/stats"),
};

export const groupService = {
  getAll: (params) => api.get("/groups", { params }),
  create: (data) => api.post("/groups", data),
  update: (id, data) => api.put(`/groups/${id}`, data),
  delete: (id) => api.delete(`/groups/${id}`),
};

export const investorService = {
  getAll: (params) => api.get("/investors", { params }),
  create: (data) => api.post("/investors", data),
  update: (id, data) => api.put(`/investors/${id}`, data),
  delete: (id) => api.delete(`/investors/${id}`),
};

export const categoryService = {
  getAll: (params) => api.get("/categories", { params }),
  create: (data) => api.post("/categories", data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

export const subcategoryService = {
  getAll: (params) => api.get("/subcategories", { params }),
  create: (data) => api.post("/subcategories", data),
  update: (id, data) => api.put(`/subcategories/${id}`, data),
  delete: (id) => api.delete(`/subcategories/${id}`),
};

export const companyService = {
  getAll: (params) => api.get("/companies", { params }),
  create: (data) => api.post("/companies", data),
  update: (id, data) => api.put(`/companies/${id}`, data),
  delete: (id) => api.delete(`/companies/${id}`),
};

export const amcService = {
  getAll: (params) => api.get("/amcs", { params }),
  create: (data) => api.post("/amcs", data),
  update: (id, data) => api.put(`/amcs/${id}`, data),
  delete: (id) => api.delete(`/amcs/${id}`),
};

export const schemeService = {
  getAll: (params) => api.get("/schemes", { params }),
  create: (data) => api.post("/schemes", data),
  update: (id, data) => api.put(`/schemes/${id}`, data),
  delete: (id) => api.delete(`/schemes/${id}`),
};

export const fdService = {
  getAll: (params) => api.get("/fd", { params }),
  create: (data) => api.post("/fd", data),
  update: (id, data) => api.put(`/fd/${id}`, data),
  delete: (id) => api.delete(`/fd/${id}`),
};

export const mfService = {
  getAll: (params) => api.get("/mf", { params }),
  getHoldings: () => api.get("/mf/holdings"),
  create: (data) => api.post("/mf", data),
  update: (id, data) => api.put(`/mf/${id}`, data),
  delete: (id) => api.delete(`/mf/${id}`),
};

export const shareService = {
  getAll: (params) => api.get("/shares", { params }),
  getHoldings: () => api.get("/shares/holdings"),
  create: (data) => api.post("/shares", data),
  update: (id, data) => api.put(`/shares/${id}`, data),
  delete: (id) => api.delete(`/shares/${id}`),
};

export const reportService = {
  investorPortfolio: () => api.get("/reports/investor-portfolio"),
  amcWise: () => api.get("/reports/amc-wise"),
  fdMaturity: (params) => api.get("/reports/fd-maturity", { params }),
  mfHoldings: () => api.get("/reports/mf-holdings"),
  profitLoss: () => api.get("/reports/profit-loss"),
  assetAllocation: () => api.get("/reports/asset-allocation"),
};
