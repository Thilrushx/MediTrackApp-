const router     = require('express').Router();
const ctrl       = require('../controllers/authController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Public
router.post('/login',  ctrl.login);

// Authenticated (any role)
router.get('/me',               verifyToken, ctrl.getMe);
router.post('/logout',          verifyToken, ctrl.logout);
router.post('/change-password', verifyToken, ctrl.changePassword);

// Doctor only — reset another user's password
router.post('/reset-password/:userId', verifyToken, requireRole('doctor'), ctrl.resetPassword);

module.exports = router;
