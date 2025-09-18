// routes/salesRoutes.js
const express = require("express");
const router = express.Router();
const salesController = require("../controllers/salesController");

// ---------- DASHBOARD ENDPOINTS ----------
// ⚠️ Place these BEFORE /:id so they are not caught as IDs
router.get("/summary/kpis", salesController.getSalesSummary);
router.get("/analytics", salesController.getSalesAnalytics);
router.get("/top-customers", salesController.getTopCustomers);
router.get("/top-products", salesController.getTopProducts);

// ---------- CRUD ----------
router
  .route("/")
  .get(salesController.getAllSales)
  .post(salesController.createSale);

router
  .route("/:id")
  .put(salesController.updateSale)
  .delete(salesController.deleteSale);

module.exports = router;