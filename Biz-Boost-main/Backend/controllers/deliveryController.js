// controllers/deliveryController.js

const Delivery = require('../models/Delivery');

// @desc    Get all deliveries, optional status filter
// @route   GET /api/deliveries
exports.getAllDeliveries = async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status: status.toLowerCase() } : {};

    const deliveries = await Delivery.find(query).sort({ date: -1 });
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
    const {
      customer,
      package: pkg,
      date,
      agentName,
      agentType,
      agentPhone,
      status
    } = req.body;

    const newDelivery = await Delivery.create({
      customer,
      package: pkg,
      date,
      agent: {
        name: agentName,
        type: agentType || 'other',
        phone: agentPhone,
        deliveriesCompleted: 0
      },
      status: status ? status.toLowerCase() : 'pending'
    });

    res.status(201).json({ success: true, data: newDelivery });
  } catch (err) {
    res.status(400).json({ success: false, error: 'Invalid data', details: err.message });
  }
};

// @desc    Update a delivery by ID
// @route   PUT /api/deliveries/:id
exports.updateDelivery = async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Ensure status is lowercase
    if (updateData.status) updateData.status = updateData.status.toLowerCase();

    // If updating agent info, wrap it in the embedded object
    if (updateData.agentName || updateData.agentType || updateData.agentPhone) {
      updateData.agent = {
        name: updateData.agentName || undefined,
        type: updateData.agentType || undefined,
        phone: updateData.agentPhone || undefined
      };
      delete updateData.agentName;
      delete updateData.agentType;
      delete updateData.agentPhone;
    }

    const delivery = await Delivery.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
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

// @desc    Get top delivery agents by number of completed deliveries
// @route   GET /api/deliveries/top-agents
exports.getTopAgents = async (req, res) => {
  try {
    const topAgents = await Delivery.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: { name: "$agent.name", phone: "$agent.phone" },
          deliveriesCompleted: { $sum: 1 }
        }
      },
      { $sort: { deliveriesCompleted: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          name: "$_id.name",
          phone: "$_id.phone",
          deliveriesCompleted: 1
        }
      }
    ]);

    res.status(200).json({ success: true, data: topAgents });
  } catch (err) {
    res.status(500).json({ success: false, error: "Server error", details: err.message });
  }
};
