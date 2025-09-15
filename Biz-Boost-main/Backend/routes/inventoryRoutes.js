const express = require('express');
const router = express.Router();
const { getProductById, getAllProducts, addNewProduct, updateProduct, deleteProduct, getLowStockProducts, getExpiredProducts } = require('../controllers/inventoryController');

// Route for getting all products and adding a new product
router.route('/products')
  .get(getAllProducts)
  .post(addNewProduct);

// Route for getting, updating, or deleting a specific product by ID
router.route('/products/:id')
  .get(getProductById)
  .put(updateProduct)
  .delete(deleteProduct);

// Routes for filtered views
router.get('/low-stock', getLowStockProducts);
router.get('/expired', getExpiredProducts);

module.exports = router;
