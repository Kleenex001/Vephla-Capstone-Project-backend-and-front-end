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

// =================================================
// Supplier Routes
// =================================================

// GET /api/suppliers/top-rated?limit=5 - Get top-rated suppliers (optional query param 'limit')
router.get('/top-rated', getTopRatedSuppliers);

// GET /api/suppliers - Get all suppliers (optional query param 'status')
// POST /api/suppliers - Add a new supplier
router.route('/')
  .get(getAllSuppliers)
  .post(addNewSupplier);

// GET /api/suppliers/:id - Get supplier by ID
// PUT /api/suppliers/:id - Update supplier by ID
// DELETE /api/suppliers/:id - Delete supplier by ID
router.route('/:id')
  .get(getSupplierById)
  .put(updateSupplier)
  .delete(deleteSupplier);

module.exports = router;
