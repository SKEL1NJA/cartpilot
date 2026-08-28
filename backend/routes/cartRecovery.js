const express = require('express');
const router = express.Router();
const { scanForAbandonedCarts, listRecoveryOffers } = require('../controllers/cartRecoveryController');

router.post('/scan', scanForAbandonedCarts);
router.get('/', listRecoveryOffers);

module.exports = router;