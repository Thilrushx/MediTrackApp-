const router = require('express').Router();
const ctrl = require('../controllers/adherenceController');

router.get('/', ctrl.getAll);
router.post('/take', ctrl.takeDose);
router.post('/miss', ctrl.missDose);

module.exports = router;
