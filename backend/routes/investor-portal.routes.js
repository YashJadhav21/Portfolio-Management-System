const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const {
  getGroupTree, getMyDashboard,
  getMyFD, createMyFD, updateMyFD, deleteMyFD,
  getMyMF, createMyMF, updateMyMF, deleteMyMF, getMyMFHoldings,
  getMyShares, createMyShare, updateMyShare, deleteMyShare, getMyShareHoldings,
  createInvestorLogin, getInvestorLoginStatus,
  getMyFDMaturity, getMyProfitLoss,
} = require('../controllers/investor-portal.controller');

// All routes require authentication
router.use(protect);

// ─── Admin-only routes ────────────────────────────────────────────────────────
router.post('/investors/:id/create-login', requireRole('admin'), createInvestorLogin);
router.get('/investors/:id/login-status', requireRole('admin'), getInvestorLoginStatus);

// ─── Investor-only routes ─────────────────────────────────────────────────────
router.use(requireRole('investor'));

router.get('/dashboard', getMyDashboard);
router.get('/group-tree', getGroupTree);

// Fixed Income
router.get('/fd', getMyFD);
router.post('/fd', createMyFD);
router.put('/fd/:id', updateMyFD);
router.delete('/fd/:id', deleteMyFD);

// Mutual Funds
router.get('/mf', getMyMF);
router.get('/mf/holdings', getMyMFHoldings);
router.post('/mf', createMyMF);
router.put('/mf/:id', updateMyMF);
router.delete('/mf/:id', deleteMyMF);

// Shares
router.get('/shares', getMyShares);
router.get('/shares/holdings', getMyShareHoldings);
router.post('/shares', createMyShare);
router.put('/shares/:id', updateMyShare);
router.delete('/shares/:id', deleteMyShare);

// Reports (scoped to this investor)
router.get('/reports/fd-maturity', getMyFDMaturity);
router.get('/reports/profit-loss', getMyProfitLoss);

module.exports = router;
