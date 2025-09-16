const express = require('express');
const router = express.Router();
const {
  getAllCustomers,
  addNewCustomer,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  getOverduePayments
} = require('../controllers/customerController');

// Get overdue payments
router.get('/overdue', getOverduePayments);

// Get all customers / Add a new customer
router.route('/')
  .get(getAllCustomers)
  .post(addNewCustomer);

// Get, update, or delete a specific customer by ID
router.route('/:id')
  .get(getCustomerById)
  .put(updateCustomer)
  .delete(deleteCustomer);

module.exports = router;
