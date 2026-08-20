const express = require('express');

const app = express();
const PORT = 5000;

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'CartPilot backend is alive' });
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});