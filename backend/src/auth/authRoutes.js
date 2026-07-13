const express = require('express');
const authController = require('./authController');
const { verifyToken } = require('./authMiddleware');

const router = express.Router();

router.post('/login', authController.login);
router.get('/me', verifyToken, authController.me);
router.post('/logout', verifyToken, authController.logout);
router.post('/change-password', verifyToken, authController.changePassword);

module.exports = router;
