const Bank = require('../models/Bank.model');
const createCRUDController = require('./crud.factory');

const {
  create: createBank,
  getAll: getAllBanks,
  getOne: getBank,
  update: updateBank,
  remove: deleteBank,
} = createCRUDController(Bank);

module.exports = {
  createBank,
  getAllBanks,
  getBank,
  updateBank,
  deleteBank,
};