const router = require('express').Router();
const ctrl   = require('../controllers/reportController');
const upload = require('../middleware/upload');

router.get('/',                       ctrl.getAll);
router.post('/', upload.single('pdf'), ctrl.create);
router.get('/file/:filename',         ctrl.download);  // specific before /:id
router.delete('/:id',                 ctrl.remove);

module.exports = router;
