require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const productRoutes = require('./routes/products');
const chatRoutes = require('./routes/chat');
const orderRoutes = require('./routes/orders');
const cors = require('cors');
const decisionRoutes = require('./routes/decisions');
const cartRecoveryRoutes = require('./routes/cartRecovery');
const requireAuth = require('./middleware/requireAuth');
const authRoutes = require('./routes/auth');

connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'CartPilot backend is alive' });
});

app.use(express.static('public'));

app.use('/api/auth', authRoutes);

app.use('/api/orders/recent', requireAuth);
app.use('/api/orders', orderRoutes);

app.use('/api/products', productRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/decisions', requireAuth, decisionRoutes);
app.use('/api/cart-recovery', requireAuth, cartRecoveryRoutes);

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});