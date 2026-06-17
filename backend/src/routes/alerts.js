const router = require('express').Router();
const ctrl   = require('../controllers/alertController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

// All authenticated roles can view alerts
router.get('/', ctrl.getAll);

// Doctors and caregivers can resolve alerts
router.post('/resolve/:id', requireRole('doctor', 'caregiver'), ctrl.resolve);

module.exports = router;
