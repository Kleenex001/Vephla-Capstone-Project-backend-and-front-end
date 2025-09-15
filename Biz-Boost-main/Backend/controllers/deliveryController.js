const Delivery = require('../models/Delivery');

// @desc    Get all deliveries with optional status filter
// @route   GET /api/deliveries
exports.getAllDeliveries = async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status) {
      query.status = status;
    }

    const deliveries = await Delivery.find(query);
    res.status(200).json(deliveries);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get a single delivery by ID
// @route   GET /api/deliveries/:id
exports.getDeliveryById = async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }
    res.status(200).json(delivery);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Add a new delivery
// @route   POST /api/deliveries
exports.addNewDelivery = async (req, res) => {
  try {
    const newDelivery = await Delivery.create(req.body);
    res.status(201).json(newDelivery);
  } catch (err) {
    res.status(400).json({ error: 'Invalid data' });
  }
};

// @desc    Update a delivery by ID
// @route   PUT /api/deliveries/:id
exports.updateDelivery = async (req, res) => {
  try {
    const delivery = await Delivery.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }
    res.status(200).json(delivery);
  } catch (err) {
    res.status(400).json({ error: 'Invalid data' });
  }
};

// @desc    Delete a delivery by ID
// @route   DELETE /api/deliveries/:id
exports.deleteDelivery = async (req, res) => {
  try {
    const delivery = await Delivery.findByIdAndDelete(req.params.id);
    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }
    res.status(200).json({ message: 'Delivery deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
