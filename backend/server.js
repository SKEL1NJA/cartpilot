require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');

connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'CartPilot backend is alive' });
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});