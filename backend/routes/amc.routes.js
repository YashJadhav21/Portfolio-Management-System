const express = require('express');
const router = express.Router();
const createCRUDController = require('../controllers/crud.factory');
const AMC = require('../models/AMC.model');
const { protect } = require('../middleware/auth.middleware');

const ctrl = createCRUDController(AMC);

router.use(protect);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
