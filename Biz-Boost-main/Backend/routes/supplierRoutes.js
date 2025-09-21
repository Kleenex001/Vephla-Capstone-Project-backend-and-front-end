const express = require("express");
const router = express.Router();
const supplierController = require("../controllers/supplierController");

// CRUD
router.get("/", supplierController.getSuppliers);
router.post("/", supplierController.addSupplier);
router.put("/:id", supplierController.updateSupplier);
router.delete("/:id", supplierController.deleteSupplier);

// Purchase actions
router.put("/confirm/:id", supplierController.confirmPurchase);
router.put("/cancel/:id", supplierController.cancelPurchase);

module.exports = router;
