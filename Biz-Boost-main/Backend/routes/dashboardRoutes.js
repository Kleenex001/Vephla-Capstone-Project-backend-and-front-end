const express = require('express');
const router = express.Router();
const {
  getSummary,
  getQuickStats,
  getPendingOrders,
  getLowStockProducts,
  getTopCustomers,
  getUserInfo
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

// Protected dashboard routes
router.get('/summary', protect, getSummary);
router.get('/quick-stats', protect, getQuickStats);
router.get('/pending-orders', protect, getPendingOrders);
router.get('/low-stock', protect, getLowStockProducts);
router.get('/top-customers', protect, getTopCustomers);
router.get('/user-info', protect, getUserInfo);

module.exports = router;
