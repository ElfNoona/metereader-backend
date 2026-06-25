const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Access Denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const verified = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = verified; 
    next();
  } catch (err) {
    res.status(401).json({ success: false, error: 'Token expired or invalid.', code: 'TOKEN_EXPIRED' });
  }
};