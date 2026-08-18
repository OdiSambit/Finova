const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

router.post('/register', validate(['full_name', 'email', 'password']), register);
router.post('/login', validate(['email', 'password']), login);
router.get('/me', auth, getMe);

module.exports = router;
