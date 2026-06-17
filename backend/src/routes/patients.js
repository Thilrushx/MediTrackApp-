const router = require('express').Router();
const ctrl   = require('../controllers/patientController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

router.get('/',       ctrl.getAll);
router.get('/:id',    ctrl.getById);

// Only doctors can create, update, or delete patients
router.post('/',      requireRole('doctor'), ctrl.create);
router.put('/:id',    requireRole('doctor'), ctrl.update);
router.delete('/:id', requireRole('doctor'), ctrl.remove);

module.exports = router;
