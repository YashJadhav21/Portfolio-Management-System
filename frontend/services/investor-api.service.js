import api from "@/lib/axios";

export const investorPortalService = {
  // Dashboard
  getDashboard: () => api.get("/investor-portal/dashboard"),
  getGroupTree: () => api.get("/investor-portal/group-tree"),

  // Fixed Income
  getFD: (params) => api.get("/investor-portal/fd", { params }),
  createFD: (data) => api.post("/investor-portal/fd", data),
  updateFD: (id, data) => api.put(`/investor-portal/fd/${id}`, data),
  deleteFD: (id) => api.delete(`/investor-portal/fd/${id}`),

  // Mutual Funds
  getMF: (params) => api.get("/investor-portal/mf", { params }),
  getMFHoldings: () => api.get("/investor-portal/mf/holdings"),
  createMF: (data) => api.post("/investor-portal/mf", data),
  updateMF: (id, data) => api.put(`/investor-portal/mf/${id}`, data),
  deleteMF: (id) => api.delete(`/investor-portal/mf/${id}`),

  // Shares
  getShares: (params) => api.get("/investor-portal/shares", { params }),
  getShareHoldings: () => api.get("/investor-portal/shares/holdings"),
  createShare: (data) => api.post("/investor-portal/shares", data),
  updateShare: (id, data) => api.put(`/investor-portal/shares/${id}`, data),
  deleteShare: (id) => api.delete(`/investor-portal/shares/${id}`),

  // Reports
  getFDMaturity: (params) => api.get("/investor-portal/reports/fd-maturity", { params }),
  getProfitLoss: () => api.get("/investor-portal/reports/profit-loss"),

  // Admin
  createInvestorLogin: (investorId, data) =>
    api.post(`/investor-portal/investors/${investorId}/create-login`, data),
  getLoginStatus: (investorId) =>
    api.get(`/investor-portal/investors/${investorId}/login-status`),
};
