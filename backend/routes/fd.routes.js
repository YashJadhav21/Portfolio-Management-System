const express = require('express');
const router = express.Router();
const { getAll, getOne, create, update, remove } = require('../controllers/fd.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
