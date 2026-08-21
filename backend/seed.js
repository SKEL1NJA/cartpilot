require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Merchant = require('./models/Merchant');
const Product = require('./models/Product');

async function seed() {
  await connectDB();

  await Merchant.deleteMany({});
  await Product.deleteMany({});

  const merchant = await Merchant.create({
    name: 'Glow & Co.',
    discountApprovalThreshold: 10,
    maxDiscountPercent: 25
  });

  await Product.insertMany([
    {
      merchantId: merchant._id,
      name: 'Vitamin C Serum',
      description: 'Brightening serum for daily glow, suits all skin types.',
      price: 89900,
      category: 'skincare',
      tags: ['bestseller', 'gift-friendly'],
      stock: 40,
      isUpsellEligible: true
    },
    {
      merchantId: merchant._id,
      name: 'Ceramide Moisturizer',
      description: 'Deep hydration barrier-repair cream, pairs well with serums.',
      price: 74900,
      category: 'skincare',
      tags: ['gift-friendly'],
      stock: 30,
      isUpsellEligible: true
    },
    {
      merchantId: merchant._id,
      name: 'Travel Pouch (Set of 2)',
      description: 'Small zip pouches, perfect for carrying skincare while traveling.',
      price: 29900,
      category: 'accessories',
      tags: ['add-on', 'gift-friendly'],
      stock: 100,
      isUpsellEligible: true
    }
  ]);

  console.log('Seed complete: 1 merchant, 3 products created');
  await mongoose.connection.close();
  process.exit(0);
}

seed();