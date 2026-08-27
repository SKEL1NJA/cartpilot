const Order = require('../models/Order');

async function getRecentOrders(req, res) {
  try {
    const orders = await Order.find({})
      .populate('productId', 'name')
      .sort({ createdAt: -1 })
      .limit(20);
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders', details: err.message });
  }
}

module.exports = { getRecentOrders };