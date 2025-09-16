const express = require('express');
const router = express.Router();
const {
  getAllDeliveries,
  addNewDelivery,
  getDeliveryById,
  updateDelivery,
  deleteDelivery
} = require('../controllers/deliveryController');

// Get all deliveries or add a new delivery
router.route('/')
  .get(getAllDeliveries)
  .post(addNewDelivery);

// Get, update, or delete a delivery by ID
router.route('/:id')
  .get(getDeliveryById)
  .put(updateDelivery)
  .delete(deleteDelivery);

module.exports = router;
