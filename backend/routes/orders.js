const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment, markOrderFailed } = require('../controllers/orderController');
const { getRecentOrders } = require('../controllers/orderQueryController');

router.post('/', createOrder);
router.post('/verify', verifyPayment);
router.post('/fail', markOrderFailed);
router.get('/recent', getRecentOrders);

module.exports = router;