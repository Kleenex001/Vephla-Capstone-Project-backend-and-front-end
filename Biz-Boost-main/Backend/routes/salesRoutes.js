const express = require("express");
const router = express.Router();
const salesController = require("../controllers/salesController");
const { protect } = require("../middleware/authMiddleware");

// ---------------- DASHBOARD ENDPOINTS ----------------
// Place these BEFORE /:id to avoid conflicts
router.get("/summary/kpis", protect, salesController.getSalesSummary);
router.get("/analytics", protect, salesController.getSalesAnalytics);
router.get("/top-customers", protect, salesController.getTopCustomers);
router.get("/top-products", protect, salesController.getTopProducts);
router.get("/pending-orders", protect, salesController.getPendingOrders); // optional helper

// ---------------- CRUD ----------------
router
  .route("/")
  .get(protect, salesController.getAllSales)
  .post(protect, salesController.createSale);

router
  .route("/:id")
  .put(protect, salesController.updateSale) // update sale
  .delete(protect, salesController.deleteSale); // delete sale

// ---------------- SALE ACTIONS ----------------
router.patch("/:id/complete", protect, salesController.completeSale); // mark sale as completed

module.exports = router;


/**
 * @swagger
 * tags:
 *   name: Sales
 *   description: Sales management and analytics
 */

/**
 * @swagger
 * /sales/summary/kpis:
 *   get:
 *     summary: Get sales KPI summary
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: KPIs returned
 */

/**
 * @swagger
 * /sales/analytics:
 *   get:
 *     summary: Get sales analytics
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: view
 *         schema:
 *           type: string
 *           enum: [monthly, yearly]
 *         description: Analytics view type
 *     responses:
 *       200:
 *         description: Analytics data
 */

/**
 * @swagger
 * /sales/top-customers:
 *   get:
 *     summary: Get top customers by sales
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Top customers list
 */

/**
 * @swagger
 * /sales/top-products:
 *   get:
 *     summary: Get top selling products
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Top products list
 */

/**
 * @swagger
 * /sales/pending-orders:
 *   get:
 *     summary: Get pending sales orders
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending orders
 */

/**
 * @swagger
 * /sales:
 *   get:
 *     summary: Get all sales
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of sales
 *   post:
 *     summary: Create a new sale
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productName
 *               - amount
 *               - paymentType
 *             properties:
 *               productName:
 *                 type: string
 *               amount:
 *                 type: number
 *               paymentType:
 *                 type: string
 *                 enum: [cash, mobile]
 *               customer:
 *                 type: string
 *               customerName:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [completed, pending]
 */

/**
 * @swagger
 * /sales/{id}:
 *   put:
 *     summary: Update a sale
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Sale ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productName:
 *                 type: string
 *               amount:
 *                 type: number
 *               paymentType:
 *                 type: string
 *                 enum: [cash, mobile]
 *               customerName:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [completed, pending]
 *   delete:
 *     summary: Delete a sale
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Sale ID
 */

/**
 * @swagger
 * /sales/{id}/complete:
 *   patch:
 *     summary: Mark a sale as completed
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Sale ID
 *     responses:
 *       200:
 *         description: Sale marked as completed
 */
