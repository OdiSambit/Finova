const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createTransfer, getTransfers } = require('../controllers/transferController');

router.use(auth);

router.get('/', getTransfers);
router.post('/', createTransfer);

module.exports = router;
