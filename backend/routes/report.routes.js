const express = require('express');
const router = express.Router();
const {
  investorPortfolio, amcWise, fdMaturity,
  mfHoldings, profitLoss, assetAllocation,
} = require('../controllers/report.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/investor-portfolio', investorPortfolio);
router.get('/amc-wise', amcWise);
router.get('/fd-maturity', fdMaturity);
router.get('/mf-holdings', mfHoldings);
router.get('/profit-loss', profitLoss);
router.get('/asset-allocation', assetAllocation);

module.exports = router;
