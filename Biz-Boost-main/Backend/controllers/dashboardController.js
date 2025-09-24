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
// GET /api/dashboard/user-info
exports.getUserInfo = async (req, res) => {
  try {
    const user = req.user; // from protect middleware

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    // Combine firstName and lastName
    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();

    res.status(200).json({
      success: true,
      data: {
        name: fullName || "User",
        businessName: user.businessName || "Your Business",
        email: user.email || ""
      }
    });
  } catch (err) {
    console.error("User info error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};




// ================= SALES ANALYTICS ================= //
// Sales analytics
exports.getSalesAnalytics = async (req, res) => {
  try {
    const { view = "monthly" } = req.query;

    // Fetch all sales for this user
    const sales = await Sale.find({ userId: req.user.id });
    console.log("Total sales fetched:", sales.length);

    if (!sales.length) {
      return res.status(200).json({
        status: "success",
        view,
        analytics: view === "monthly" ? Array(12).fill(0) : {},
        message: "No sales found for this user"
      });
    }

    let analytics;

    if (view === "monthly") {
      analytics = Array(12).fill(0);

      sales.forEach(s => {
        // Use 'date' if present, else fallback to 'createdAt'
        const rawDate = s.date || s.createdAt;
        if (!rawDate) return;

        const date = new Date(rawDate);
        if (isNaN(date)) return;

        const month = date.getMonth(); // 0 = Jan, 11 = Dec
        analytics[month] += Number(s.amount || 0);

        console.log(`Adding ${s.amount} to month ${month} for sale on ${date}`);
      });

    } else {
      analytics = {};
      sales.forEach(s => {
        const rawDate = s.date || s.createdAt;
        if (!rawDate) return;

        const date = new Date(rawDate);
        if (isNaN(date)) return;

        const year = date.getFullYear();
        analytics[year] = (analytics[year] || 0) + Number(s.amount || 0);

        console.log(`Adding ${s.amount} to year ${year} for sale on ${date}`);
      });
    }

    res.status(200).json({ status: "success", view, analytics });

  } catch (error) {
    console.error("Error in getSalesAnalytics:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch analytics",
      error: error.message
    });
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
