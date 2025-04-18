const express = require('express');
const { register, login, getProfile } = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validation.middleware');
const { registerSchema, loginSchema } = require('../validators/auth.validators');

const router = express.Router();

// Register
router.post('/register', validate(registerSchema), register);

// Login
router.post('/login', validate(loginSchema), login);

// Get profile
router.get('/profile', authenticate, getProfile);

module.exports = router; 