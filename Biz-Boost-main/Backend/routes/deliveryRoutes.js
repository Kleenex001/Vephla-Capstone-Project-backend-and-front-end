const express = require('express');
const router = express.Router();
const { getAllDeliveries, addNewDelivery, getDeliveryById, updateDelivery, deleteDelivery } = require('../controllers/deliveryController');

router.route('/')
    .get(getAllDeliveries)
    .post(addNewDelivery);

router.route('/:id')
    .get(getDeliveryById)
    .put(updateDelivery)
    .delete(deleteDelivery);

module.exports = router;
