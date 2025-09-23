const express = require("express");
const router = express.Router();
const supplierController = require("../controllers/supplierController");
const { protect } = require("../middleware/authMiddleware");

// --- CRUD Operations ---
router.get("/", protect, supplierController.getSuppliers);
router.post("/", protect, supplierController.addSupplier);
router.put("/:id", protect, supplierController.updateSupplier);
router.delete("/:id", protect, supplierController.deleteSupplier);

// --- Purchase Actions ---
router.put("/confirm/:id", protect, supplierController.confirmPurchase);
router.put("/cancel/:id", protect, supplierController.cancelPurchase);

// --- Additional Routes for Dashboard/Stats ---
router.get("/recent", protect, supplierController.getRecentSuppliers);
router.get("/top", protect, supplierController.getTopSuppliers);

module.exports = router;


/**
 * @swagger
 * tags:
 *   name: Suppliers
 *   description: Supplier management and purchase actions
 */

/**
 * @swagger
 * /suppliers:
 *   get:
 *     summary: Get all suppliers
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *   post:
 *     summary: Add a new supplier
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *               - leadTime
 *               - email
 *               - phone
 */

/**
 * @swagger
 * /suppliers/{id}:
 *   put:
 *     summary: Update a supplier by ID
 *     tags: [Suppliers]
 *   delete:
 *     summary: Delete a supplier by ID
 *     tags: [Suppliers]
 */

/**
 * @swagger
 * /suppliers/confirm/{id}:
 *   put:
 *     summary: Confirm purchase for a supplier
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 */

/**
 * @swagger
 * /suppliers/cancel/{id}:
 *   put:
 *     summary: Cancel purchase for a supplier
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 */

/**
 * @swagger
 * /suppliers/recent:
 *   get:
 *     summary: Get recent supplier purchases
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 */

/**
 * @swagger
 * /suppliers/top:
 *   get:
 *     summary: Get top suppliers by completed purchases
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 */
