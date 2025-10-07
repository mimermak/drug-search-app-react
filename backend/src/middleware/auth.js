const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  console.log('Entering authenticateToken for:', req.originalUrl);
  const authHeader = req.headers['authorization'];
  console.log('Authorization header:', authHeader);
  const token = authHeader && authHeader.split(' ')[1];
  console.log('Received token:', token ? 'Token present' : 'No token provided');
  if (!token) {
    console.log('No token provided, returning 401');
    return res.status(401).json({ error: 'Access denied, no token provided' });
  }
  try {
    console.log('JWT_SECRET used:', process.env.JWT_SECRET || 'your_jwt_secret');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    console.log('Token decoded successfully:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    res.status(403).json({ error: 'Invalid token' });
  }
}

// Υβριδική εξαγωγή για συμβατότητα με pltab.js (απευθείας) και drugs.js (αντικείμενο)
module.exports = authenticateToken;
module.exports.authenticateToken = authenticateToken;