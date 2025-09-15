const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/summary', dashboardController.getSummary);
router.get('/sales-analytics', dashboardController.getSalesAnalytics);
router.get('/overdue-payments', dashboardController.getOverduePayments);
router.get('/quick-stats', dashboardController.getQuickStats);
router.get('/top-customers', dashboardController.getTopCustomers);

module.exports = router;
