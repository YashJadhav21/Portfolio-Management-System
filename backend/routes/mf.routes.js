const express = require('express');
const router = express.Router();
const { getAll, getHoldings, create, update, remove } = require('../controllers/mf.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/', getAll);
router.get('/holdings', getHoldings);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
