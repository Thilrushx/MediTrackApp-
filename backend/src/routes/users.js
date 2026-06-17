const router = require('express').Router();
const ctrl   = require('../controllers/userController');
const { verifyToken, requireRole } = require('../middleware/auth');

// All user routes require authentication
router.use(verifyToken);

// Any authenticated role can read user lists (needed for dropdowns etc.)
router.get('/',    ctrl.getAll);
router.get('/:id', ctrl.getOne);

// Doctor-only mutations
router.post('/caregivers',        requireRole('doctor'), ctrl.createCaregiver);
router.put('/:id',                requireRole('doctor'), ctrl.updateUser);
router.patch('/:id/active',       requireRole('doctor'), ctrl.setActive);
router.delete('/:id',             requireRole('doctor'), ctrl.deleteUser);

module.exports = router;
