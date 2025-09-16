// routes/salesRoutes.js
const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');

// Route for creating a sale and getting all sales
router.route('/')
  .get(salesController.getAllSales)
  .post(salesController.createSale);

// Route for updating or deleting a sale by ID
router.route('/:id')
  .put(salesController.updateSale)
  .delete(salesController.deleteSale);

module.exports = router;
