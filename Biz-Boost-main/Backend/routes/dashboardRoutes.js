const express = require('express');
const router = express.Router();
const {
  getSummary,
  getQuickStats,
  getOverduePayments,   // keeps your existing endpoint
  getLowStockProducts,
  getTopCustomers,
  getUserInfo,
  getSalesAnalytics,    // new
  getOverdueAnalytics,  // new
} = require('../controllers/dashboardController');

const { protect } = require('../middleware/authMiddleware');

// Dashboard routes
router.get('/summary', protect, getSummary);
router.get('/quick-stats', protect, getQuickStats);
router.get('/overdue-payments', protect, getOverduePayments);
router.get('/low-stock', protect, getLowStockProducts);
router.get('/top-customers', protect, getTopCustomers);
router.get('/user-info', protect, getUserInfo);

// Analytics routes
router.get('/sales-analytics', protect, getSalesAnalytics);
router.get('/overdue-analytics', protect, getOverdueAnalytics);

module.exports = router;
