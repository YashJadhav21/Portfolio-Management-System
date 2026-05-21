const express = require('express');
const router = express.Router();
const createCRUDController = require('../controllers/crud.factory');
const Scheme = require('../models/Scheme.model');
const { protect } = require('../middleware/auth.middleware');

const ctrl = createCRUDController(Scheme, [
  { path: 'amcId', select: 'name' },
  { path: 'categoryId', select: 'name' },
  { path: 'subcategoryId', select: 'name' },
]);

router.use(protect);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
