const Customer = require('../models/Customer');

// @desc    Get all customers
// @route   GET /api/customers
exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find();
    res.status(200).json(customers);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get a single customer by ID
// @route   GET /api/customers/:id
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.status(200).json(customer);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Add a new customer
// @route   POST /api/customers
exports.addNewCustomer = async (req, res) => {
  try {
    const newCustomer = await Customer.create(req.body);
    res.status(201).json(newCustomer);
  } catch (err) {
    res.status(400).json({ error: 'Invalid data' });
  }
};

// @desc    Update a customer by ID
// @route   PUT /api/customers/:id
exports.updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.status(200).json(customer);
  } catch (err) {
    res.status(400).json({ error: 'Invalid data' });
  }
};

// @desc    Delete a customer by ID
// @route   DELETE /api/customers/:id
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.status(200).json({ message: 'Customer deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get overdue payments
// @route   GET /api/customers/overdue
exports.getOverduePayments = async (req, res) => {
  try {
    const overdueCustomers = await Customer.find({ status: 'Overdue' });
    res.status(200).json(overdueCustomers);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
