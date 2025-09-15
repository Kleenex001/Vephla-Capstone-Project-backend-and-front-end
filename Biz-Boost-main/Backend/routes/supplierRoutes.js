const express = require('express');
const router = express.Router();
const { getAllSuppliers, addNewSupplier, getSupplierById, updateSupplier, deleteSupplier, getTopRatedSuppliers } = require('../controllers/supplierController');

router.route('/')
    .get(getAllSuppliers)
    .post(addNewSupplier);

router.route('/:id')
    .get(getSupplierById)
    .put(updateSupplier)
    .delete(deleteSupplier);

router.get('/top-rated', getTopRatedSuppliers);

module.exports = router;
