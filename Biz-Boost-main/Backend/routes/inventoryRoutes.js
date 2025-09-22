const express = require('express');
const router = express.Router();
const {
  getProductById,
  getAllProducts,
  addNewProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  getOutOfStockProducts,
  getExpiredProducts,
  getNotificationProducts
} = require('../controllers/inventoryController');

// --- Notification/Filtered routes first to avoid conflicts ---
router.get('/low-stock', getLowStockProducts);
router.get('/out-of-stock', getOutOfStockProducts);
router.get('/expired', getExpiredProducts);
router.get('/notifications', getNotificationProducts);

// --- CRUD routes ---
router.route('/products')
  .get(getAllProducts)
  .post(addNewProduct);

router.route('/products/:id')
  .get(getProductById)
  .put(updateProduct)
  .delete(deleteProduct);

module.exports = router;
