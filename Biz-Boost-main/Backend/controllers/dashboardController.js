const Sale = require('../models/Sales');
const Expense = require('../models/Expense');
const Product = require('../models/Inventory');
const Customer = require('../models/Customer');

// GET /api/dashboard/summary
exports.getSummary = async (req, res) => {
  try {
    const totalSales = await Sale.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]);
    const totalExpenses = await Expense.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]);
    const sales = totalSales[0]?.total || 0;
    const expenses = totalExpenses[0]?.total || 0;
    const profit = sales - expenses;

    res.status(200).json({ success: true, data: { totalSales: sales, expenses, profit } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// GET /api/dashboard/sales-analytics
exports.getSalesAnalytics = async (req, res) => {
  try {
    const analytics = await Sale.aggregate([
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, totalSales: { $sum: "$amount" } } },
      { $sort: { _id: 1 } }
    ]);
    res.status(200).json({ success: true, data: analytics });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// GET /api/dashboard/overdue-payments
exports.getOverduePayments = async (req, res) => {
  try {
    const overdue = await Customer.find({ paymentDue: { $lt: new Date() } });
    res.status(200).json({ success: true, data: overdue });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// GET /api/dashboard/quick-stats
exports.getQuickStats = async (req, res) => {
  try {
    const salesToday = await Sale.countDocuments({ createdAt: { $gte: new Date().setHours(0,0,0,0) } });
    const lowStockProducts = await Product.countDocuments({ $expr: { $lt: ["$stockLevel", "$reorderLevel"] } });
    res.status(200).json({ success: true, data: { salesToday, lowStockProducts } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// GET /api/dashboard/top-customers
exports.getTopCustomers = async (req, res) => {
  try {
    const topCustomers = await Customer.find().sort({ totalPurchases: -1 }).limit(5);
    res.status(200).json({ success: true, data: topCustomers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
