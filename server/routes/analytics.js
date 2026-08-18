const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getExpenseAnalytics,
  getIncomeAnalytics,
  getNetWorth,
  getPortfolioAnalytics,
  getMonthlyTrends,
} = require('../controllers/analyticsController');

router.use(auth);

router.get('/expenses', getExpenseAnalytics);
router.get('/income', getIncomeAnalytics);
router.get('/net-worth', getNetWorth);
router.get('/portfolio', getPortfolioAnalytics);
router.get('/monthly-trends', getMonthlyTrends);

module.exports = router;
