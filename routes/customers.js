const express = require('express');
const router = express.Router();
const customersController = require('../controllers/customersController');

// Route to get customer by ID
router.get('/:id', customersController.getCustomerById);

module.exports = router;