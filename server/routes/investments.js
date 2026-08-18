const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getInvestments,
  getInvestment,
  createInvestment,
  updateInvestment,
  deleteInvestment,
  getPortfolioSummary,
} = require('../controllers/investmentController');

router.use(auth);

router.get('/portfolio/summary', getPortfolioSummary);
router.get('/', getInvestments);
router.get('/:id', getInvestment);
router.post('/', createInvestment);
router.put('/:id', updateInvestment);
router.delete('/:id', deleteInvestment);

module.exports = router;
