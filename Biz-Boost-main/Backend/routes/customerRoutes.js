const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); // import protect
const {
  getAllCustomers,
  addNewCustomer,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  getOverduePayments
} = require('../controllers/customerController');

// Apply authentication to all customer routes
router.use(protect);

// Get customers with overdue payments
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

/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: Customer management
 */

/**
 * @swagger
 * /customers:
 *   get:
 *     summary: Get all customers
 *     tags: [Customers]
 *     responses:
 *       200:
 *         description: List of customers
 *   post:
 *     summary: Add a new customer
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerName
 *               - packageWorth
 *               - quantity
 *               - paymentDate
 *               - status
 *             properties:
 *               customerName:
 *                 type: string
 *               packageWorth:
 *                 type: number
 *               quantity:
 *                 type: number
 *               paymentDate:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [paid, overdue]
 *     responses:
 *       201:
 *         description: Customer added
 */
