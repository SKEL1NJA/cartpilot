require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Conversation = require('./models/Conversation');
const Customer = require('./models/Customer');
const AgentDecision = require('./models/AgentDecision');
const Order = require('./models/Order');

async function resetDemoData() {
  await connectDB();
  await Conversation.deleteMany({});
  await Customer.deleteMany({});
  await AgentDecision.deleteMany({});
  await Order.deleteMany({});
  console.log('Demo data reset — Merchant and Product catalog left untouched.');
  await mongoose.connection.close();
  process.exit(0);
}

resetDemoData();