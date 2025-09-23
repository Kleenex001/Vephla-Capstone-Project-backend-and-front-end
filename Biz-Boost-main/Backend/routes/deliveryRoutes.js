// routes/deliveryRoutes.js

const express = require('express');
const router = express.Router();
const {
  getAllDeliveries,
  addNewDelivery,
  getDeliveryById,
  updateDelivery,
  deleteDelivery,
  getTopAgents
} = require('../controllers/deliveryController');

const { protect } = require('../middleware/authMiddleware');

// Get all deliveries or add a new delivery
router.route('/')
  .get(protect, getAllDeliveries)
  .post(protect, addNewDelivery);

// Get, update, or delete a delivery by ID
router.route('/:id')
  .get(protect, getDeliveryById)
  .put(protect, updateDelivery)
  .delete(protect, deleteDelivery);

// Get top delivery agents
router.get('/top-agents', protect, getTopAgents);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Deliveries
 *   description: Manage deliveries and delivery agents
 */

/**
 * @swagger
 * /deliveries:
 *   get:
 *     summary: Get all deliveries
 *     tags: [Deliveries]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of deliveries
 *   post:
 *     summary: Add a new delivery
 *     tags: [Deliveries]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customer
 *               - package
 *               - date
 *               - agent
 *             properties:
 *               customer:
 *                 type: string
 *               package:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               agent:
 *                 type: object
 *                 required:
 *                   - name
 *                   - type
 *                   - phone
 *                 properties:
 *                   name:
 *                     type: string
 *                   type:
 *                     type: string
 *                     enum: [waybill, logistic company, other]
 *                   phone:
 *                     type: string
 */

/**
 * @swagger
 * /deliveries/{id}:
 *   get:
 *     summary: Get a delivery by ID
 *     tags: [Deliveries]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *   put:
 *     summary: Update a delivery
 *     tags: [Deliveries]
 *   delete:
 *     summary: Delete a delivery
 *     tags: [Deliveries]
 */

/**
 * @swagger
 * /deliveries/top-agents:
 *   get:
 *     summary: Get top performing delivery agents
 *     tags: [Deliveries]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of top agents
 */
