const express = require('express');
const router = express.Router();
const {
  createBank,
  getAllBanks,
  getBank,
  updateBank,
  deleteBank,
} = require('../controllers/bank.controller');

router.route('/')
  .post(createBank)
  .get(getAllBanks);

router.route('/:id')
  .get(getBank)
  .put(updateBank)
  .delete(deleteBank);

module.exports = router;