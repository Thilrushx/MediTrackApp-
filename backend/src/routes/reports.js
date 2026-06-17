const router = require('express').Router();
const ctrl   = require('../controllers/reportController');
const upload = require('../middleware/upload');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

// All roles can view reports
router.get('/', ctrl.getAll);

// Specific file download (must come before /:id)
router.get('/file/:filename', ctrl.download);

// Only doctors can upload or delete reports
router.post('/',      requireRole('doctor'), upload.single('pdf'), ctrl.create);
router.delete('/:id', requireRole('doctor'), ctrl.remove);

module.exports = router;
