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

const { protect } = require('../middleware/authMiddleware');

// --- Notification/Filtered routes first to avoid conflicts ---
router.get('/low-stock', protect, getLowStockProducts);
router.get('/out-of-stock', protect, getOutOfStockProducts);
router.get('/expired', protect, getExpiredProducts);
router.get('/notifications', protect, getNotificationProducts);

// --- CRUD routes ---
router.route('/products')
  .get(protect, getAllProducts)
  .post(protect, addNewProduct);

router.route('/products/:id')
  .get(protect, getProductById)
  .put(protect, updateProduct)
  .delete(protect, deleteProduct);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: Product inventory management
 */

/**
 * @swagger
 * /inventory/low-stock:
 *   get:
 *     summary: Get products that are low in stock
 *     tags: [Inventory]
 *     responses:
 *       200:
 *         description: Low stock products list
 */

/**
 * @swagger
 * /inventory/out-of-stock:
 *   get:
 *     summary: Get products that are out of stock
 *     tags: [Inventory]
 *     responses:
 *       200:
 *         description: Out-of-stock products list
 */

/**
 * @swagger
 * /inventory/expired:
 *   get:
 *     summary: Get expired products
 *     tags: [Inventory]
 *     responses:
 *       200:
 *         description: Expired products list
 */

/**
 * @swagger
 * /inventory/notifications:
 *   get:
 *     summary: Get products needing attention
 *     tags: [Inventory]
 *     responses:
 *       200:
 *         description: Products for notifications
 */

/**
 * @swagger
 * /inventory/products:
 *   get:
 *     summary: Get all products
 *     tags: [Inventory]
 *     responses:
 *       200:
 *         description: List of all products
 *   post:
 *     summary: Add a new product
 *     tags: [Inventory]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productName
 *               - stockLevel
 *               - reorderLevel
 *               - expiryDate
 *               - category
 *               - unitPrice
 */

/**
 * @swagger
 * /inventory/products/{id}:
 *   get:
 *     summary: Get a single product by ID
 *     tags: [Inventory]
 *   put:
 *     summary: Update a product
 *     tags: [Inventory]
 *   delete:
 *     summary: Delete a product
 *     tags: [Inventory]
 */
