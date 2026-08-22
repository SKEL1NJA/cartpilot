const Product = require('../models/Product');

// GET /api/products
async function getProducts(req, res) {
  try {
    const { category, maxPrice, tag } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (tag) filter.tags = tag;
    if (maxPrice) filter.price = { $lte: Number(maxPrice) };

    const products = await Product.find(filter);
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products', details: err.message });
  }
}

// GET /api/products/:id
async function getProductById(req, res) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product', details: err.message });
  }
}

module.exports = { getProducts, getProductById };