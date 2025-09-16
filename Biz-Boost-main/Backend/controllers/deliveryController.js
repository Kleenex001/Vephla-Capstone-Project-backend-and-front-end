const Delivery = require('../models/Delivery');

// @desc    Get all deliveries with optional status filter
// @route   GET /api/deliveries
exports.getAllDeliveries = async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};

    const deliveries = await Delivery.find(query);
    res.status(200).json({ success: true, data: deliveries });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error', details: err.message });
  }
};

// @desc    Get a single delivery by ID
// @route   GET /api/deliveries/:id
exports.getDeliveryById = async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) {
      return res.status(404).json({ success: false, error: 'Delivery not found' });
    }
    res.status(200).json({ success: true, data: delivery });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error', details: err.message });
  }
};

// @desc    Add a new delivery
// @route   POST /api/deliveries
exports.addNewDelivery = async (req, res) => {
  try {
    const newDelivery = await Delivery.create(req.body);
    res.status(201).json({ success: true, data: newDelivery });
  } catch (err) {
    res.status(400).json({ success: false, error: 'Invalid data', details: err.message });
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
      return res.status(404).json({ success: false, error: 'Delivery not found' });
    }
    res.status(200).json({ success: true, data: delivery });
  } catch (err) {
    res.status(400).json({ success: false, error: 'Invalid data', details: err.message });
  }
};

// @desc    Delete a delivery by ID
// @route   DELETE /api/deliveries/:id
exports.deleteDelivery = async (req, res) => {
  try {
    const delivery = await Delivery.findByIdAndDelete(req.params.id);
    if (!delivery) {
      return res.status(404).json({ success: false, error: 'Delivery not found' });
    }
    res.status(200).json({ success: true, message: 'Delivery deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error', details: err.message });
  }
};
