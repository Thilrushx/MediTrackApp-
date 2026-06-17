const router = require('express').Router();
const ctrl   = require('../controllers/adherenceController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

// All roles can read adherence logs
router.get('/', ctrl.getAll);

// Only patients can mark doses taken/missed
router.post('/take', requireRole('patient'), ctrl.takeDose);
router.post('/miss', requireRole('patient'), ctrl.missDose);

module.exports = router;
