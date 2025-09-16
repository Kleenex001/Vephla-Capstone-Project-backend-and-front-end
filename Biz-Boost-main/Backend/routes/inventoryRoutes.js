const express = require('express');
const router = express.Router();
const {
  getProductById,
  getAllProducts,
  addNewProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  getExpiredProducts
} = require('../controllers/inventoryController');

// Routes for filtered views first to avoid conflicts with /products/:id
router.get('/low-stock', getLowStockProducts);
router.get('/expired', getExpiredProducts);

// Route for getting all products and adding a new product
router.route('/products')
  .get(getAllProducts)
  .post(addNewProduct);

// Route for getting, updating, or deleting a specific product by ID
router.route('/products/:id')
  .get(getProductById)
  .put(updateProduct)
  .delete(deleteProduct);

module.exports = router;
