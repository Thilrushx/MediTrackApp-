const router = require('express').Router();
const ctrl = require('../controllers/alertController');

router.get('/', ctrl.getAll);
router.post('/resolve/:id', ctrl.resolve);

module.exports = router;
