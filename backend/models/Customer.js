const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Customer', customerSchema);