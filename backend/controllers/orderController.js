const crypto = require('crypto');
const razorpay = require('../services/razorpayService');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Merchant = require('../models/Merchant');
const AgentDecision = require('../models/AgentDecision');

async function createOrder(req, res) {
  try {
    const { productId, conversationId, discountPercent } = req.body;

    if (!productId || typeof productId !== 'string') {
      return res.status(400).json({ error: 'productId is required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const merchant = await Merchant.findOne();
    if (!merchant) {
      return res.status(500).json({ error: 'No merchant configured' });
    }

    let finalAmount = product.price;

    if (discountPercent) {
      const approvedDecision = await AgentDecision.findOne({
        conversationId,
        productId,
        decisionType: 'discount',
        discountPercent: Number(discountPercent),
        status: { $in: ['auto_approved', 'approved'] }
      }).sort({ createdAt: -1 });

      if (!approvedDecision) {
        return res.status(400).json({
          error: 'No approved discount found for this conversation/product/percentage combination.'
        });
      }

      finalAmount = Math.round(product.price * (1 - discountPercent / 100));
    }

    const receipt = `rcpt_${crypto.randomUUID()}`;

    const razorpayOrder = await razorpay.orders.create({
      amount: finalAmount,
      currency: 'INR',
      receipt
    });

    const order = await Order.create({
      conversationId,
      merchantId: merchant._id,
      productId: product._id,
      amount: finalAmount,
      receipt,
      razorpayOrderId: razorpayOrder.id,
      status: 'created'
    });

    res.status(201).json({
      orderId: order._id,
      razorpayOrderId: razorpayOrder.id,
      amount: finalAmount,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create order', details: err.message });
  }
}

async function verifyPayment(req, res) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment verification fields' });
    }

    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      order.status = 'failed';
      await order.save();
      return res.status(400).json({ verified: false, error: 'Signature verification failed' });
    }

    order.status = 'paid';
    order.razorpayPaymentId = razorpay_payment_id;
    await order.save();

    res.status(200).json({ verified: true, orderId: order._id });
  } catch (err) {
    res.status(500).json({ error: 'Verification failed', details: err.message });
  }
}

async function markOrderFailed(req, res) {
  try {
    const { razorpay_order_id, reason } = req.body;

    if (!razorpay_order_id) {
      return res.status(400).json({ error: 'razorpay_order_id is required' });
    }

    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status === 'paid') {
      return res.status(200).json({ note: 'Order already paid, ignoring failure notice.' });
    }

    order.status = 'failed';
    order.failureReason = reason || 'Payment failed';
    await order.save();

    res.status(200).json({ orderId: order._id, status: order.status });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record payment failure', details: err.message });
  }
}

module.exports = { createOrder, verifyPayment, markOrderFailed };