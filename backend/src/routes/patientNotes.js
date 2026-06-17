const router = require('express').Router();
const ctrl   = require('../controllers/patientNoteController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

// All roles can read notes
router.get('/', ctrl.getAll);

// Only patients can submit their own notes
router.post('/', requireRole('patient'), ctrl.create);

module.exports = router;
