const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { updateProfile, changePassword } = require('../controllers/profileController');

router.use(auth);

router.put('/', updateProfile);
router.put('/change-password', changePassword);

module.exports = router;
