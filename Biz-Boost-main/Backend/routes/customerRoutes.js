const express = require('express');
const router = express.Router();
const { getAllCustomers, addNewCustomer, getCustomerById, updateCustomer, deleteCustomer, getOverduePayments } = require('../controllers/customerController');

// Main route for getting all customers and adding a new one
router.route('/')
    .get(getAllCustomers)
    .post(addNewCustomer);

// Route for getting, updating, or deleting a specific customer
router.route('/:id')
    .get(getCustomerById)
    .put(updateCustomer)
    .delete(deleteCustomer);

// Route for getting overdue payments
router.get('/overdue', getOverduePayments);

module.exports = router;
