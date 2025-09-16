// routes/supplierRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAllSuppliers,
  addNewSupplier,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
  getTopRatedSuppliers
} = require('../controllers/supplierController');

// Route for top-rated suppliers
router.get('/top-rated', getTopRatedSuppliers);

// Main route for getting all suppliers and adding a new one
router.route('/')
  .get(getAllSuppliers)
  .post(addNewSupplier);

// Routes for getting, updating, or deleting a specific supplier by ID
router.route('/:id')
  .get(getSupplierById)
  .put(updateSupplier)
  .delete(deleteSupplier);

module.exports = router;
