const router = require('express').Router();
const ctrl   = require('../controllers/medicationController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

// All authenticated roles can read medications
router.get('/', ctrl.getAll);

// Only doctors can prescribe or remove medications
router.post('/',      requireRole('doctor'), ctrl.create);
router.delete('/:id', requireRole('doctor'), ctrl.remove);

module.exports = router;
