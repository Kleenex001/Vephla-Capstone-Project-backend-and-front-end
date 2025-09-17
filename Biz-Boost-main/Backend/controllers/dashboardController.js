const Sale = require('../models/Sales');
const Delivery = require('../models/Delivery');
const Product = require('../models/Inventory');
const Customer = require('../models/Customer');
const Order = require('../models/Order'); // if you have a separate orders model

// ===================== DASHBOARD CONTROLLERS ===================== //

// GET /api/dashboard/summary
exports.getSummary = async (req, res) => {
  try {
    const totalSales = await Sale.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const totalOwed = await Customer.aggregate([
      { $group: { _id: null, total: { $sum: "$outstandingBalance" } } }
    ]);

    const totalDelivery = await Delivery.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalSales: totalSales[0]?.total || 0,
        totalOwed: totalOwed[0]?.total || 0,
        totalDelivery: totalDelivery[0]?.total || 0
      }
    });
  } catch (err) {
    console.error("Summary error:", err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// GET /api/dashboard/quick-stats
exports.getQuickStats = async (req, res) => {
  try {
    const totalPurchase = await Sale.countDocuments(); // or Purchase model if you have one
    const pendingDelivery = await Delivery.countDocuments({ status: "pending" });
    const expiredProducts = await Product.countDocuments({ expiryDate: { $lt: new Date() } });

    res.status(200).json({
      success: true,
      data: {
        totalPurchase,
        pendingDelivery,
        expiredProducts
      }
    });
  } catch (err) {
    console.error("Quick stats error:", err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// GET /api/dashboard/pending-orders
exports.getPendingOrders = async (req, res) => {
  try {
    const orders = await Order.find({ status: "pending" });
    res.status(200).json({ success: true, data: orders });
  } catch (err) {
    console.error("Pending orders error:", err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// GET /api/dashboard/low-stock
exports.getLowStockProducts = async (req, res) => {
  try {
    const lowStock = await Product.find({
      $expr: { $lt: ["$stockLevel", "$reorderLevel"] }
    }).limit(10);

    res.status(200).json({ success: true, data: lowStock });
  } catch (err) {
    console.error("Low stock error:", err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// GET /api/dashboard/top-customers
exports.getTopCustomers = async (req, res) => {
  try {
    const topCustomers = await Customer.find()
      .sort({ totalPurchases: -1 })
      .limit(5);

    res.status(200).json({ success: true, data: topCustomers });
  } catch (err) {
    console.error("Top customers error:", err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// GET /api/dashboard/user-info (for greeting header)
exports.getUserInfo = async (req, res) => {
  try {
    const user = req.user; // populated by protect middleware
    res.status(200).json({
      success: true,
      data: {
        name: user.name,
        businessName: user.businessName
      }
    });
  } catch (err) {
    console.error("User info error:", err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
