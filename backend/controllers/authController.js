const jwt = require('jsonwebtoken');

async function login(req, res) {
  const { password } = req.body;

  if (!password || password !== process.env.MERCHANT_PASSWORD) {
    return res.status(401).json({ error: 'Incorrect password' });
  }

  const token = jwt.sign({ role: 'merchant' }, process.env.JWT_SECRET, { expiresIn: '12h' });
  res.status(200).json({ token });
}

module.exports = { login };