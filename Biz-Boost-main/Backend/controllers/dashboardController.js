const Sale = require('../models/Sales');
const Delivery = require('../models/Delivery');
const Product = require('../models/Inventory');
const Customer = require('../models/Customer');

// ===================== DASHBOARD CONTROLLERS ===================== //

// GET /api/dashboard/summary
exports.getSummary = async (req, res) => {
  try {
    const userId = req.user._id;

    const totalSales = await Sale.aggregate([
      { $match: { user: userId } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const totalOwed = await Customer.aggregate([
      { $match: { user: userId } },
      { $group: { _id: null, total: { $sum: "$outstandingBalance" } } }
    ]);

    const totalDelivery = await Delivery.aggregate([
      { $match: { user: userId } },
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
    const userId = req.user._id;

    const pendingOrders = await Sale.countDocuments({ user: userId, status: "pending" });
    const pendingDelivery = await Delivery.countDocuments({ user: userId, status: "pending" });
    const expiredProducts = await Product.countDocuments({ user: userId, expiryDate: { $lt: new Date() } });

    res.status(200).json({
      success: true,
      data: {
        pendingOrders,
        pendingDelivery,
        expiredProducts
      }
    });
  } catch (err) {
    console.error("Quick stats error:", err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// GET /api/dashboard/overdue-payments
exports.getOverduePayments = async (req, res) => {
  try {
    const userId = req.user._id;

    const overdue = await Customer.find({ user: userId, outstandingBalance: { $gt: 0 } })
      .select("name outstandingBalance")
      .sort({ outstandingBalance: -1 });

    res.status(200).json({ success: true, data: overdue });
  } catch (err) {
    console.error("Overdue payments error:", err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// GET /api/dashboard/low-stock
exports.getLowStockProducts = async (req, res) => {
  try {
    const userId = req.user._id;

    const lowStock = await Product.find({
      user: userId,
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
    const userId = req.user._id;

    const topCustomers = await Customer.find({ user: userId })
      .sort({ totalPurchases: -1 })
      .limit(5);

    res.status(200).json({ success: true, data: topCustomers });
  } catch (err) {
    console.error("Top customers error:", err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// GET /api/dashboard/user-info
exports.getUserInfo = async (req, res) => {
  try {
    const user = req.user; // from protect middleware
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

// ================= SALES ANALYTICS ================= //
exports.getSalesAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;
    const view = req.query.view || "monthly"; // daily | monthly | yearly
    let groupId;

    if (view === "daily") {
      groupId = {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
        day: { $dayOfMonth: "$createdAt" }
      };
    } else if (view === "yearly") {
      groupId = { year: { $year: "$createdAt" } };
    } else {
      groupId = {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" }
      };
    }

    const analytics = await Sale.aggregate([
      { $match: { user: userId, status: "completed" } },
      {
        $group: {
          _id: groupId,
          totalSales: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]);

    res.status(200).json({ success: true, data: analytics });
  } catch (err) {
    console.error("Sales analytics error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// ================= OVERDUE PAYMENTS ANALYTICS ================= //
exports.getOverdueAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;

    const overdueCustomers = await Customer.find({ user: userId, outstandingBalance: { $gt: 0 } });

    const totalOverdue = overdueCustomers.reduce(
      (sum, c) => sum + (c.outstandingBalance || 0),
      0
    );

    const ranges = {
      "0-30": overdueCustomers.filter(c => c.daysOverdue && c.daysOverdue <= 30).length,
      "31-60": overdueCustomers.filter(c => c.daysOverdue && c.daysOverdue > 30 && c.daysOverdue <= 60).length,
      "60+": overdueCustomers.filter(c => c.daysOverdue && c.daysOverdue > 60).length,
    };

    res.status(200).json({
      success: true,
      data: {
        totalOverdue,
        customerCount: overdueCustomers.length,
        ranges,
      },
    });
  } catch (err) {
    console.error("Overdue analytics error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};
