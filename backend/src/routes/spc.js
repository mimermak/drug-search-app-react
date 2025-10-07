const express = require('express');
const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const router = express.Router();

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    console.log('No token provided for request:', req.url);
    return res.status(401).json({ error: 'Access denied, no token provided' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.user = decoded;
    next();
  } catch (err) {
    console.log('Token verification failed:', err.message);
    return res.status(403).json({ error: 'Forbidden' });
  }
}

router.get('/:drugid', authenticateToken, async (req, res) => {
  try {
    const { drugid } = req.params;
    console.log('Fetching SPC data for drugid:', drugid); // Debug log
    const query = `
      SELECT 
        version,
        TO_CHAR(spcdate, 'YYYY-MM-DD') AS spcdate,
        doctype,
        username,
        encode(doc, 'base64') AS doc
      FROM spc
      WHERE drugid = $1
      ORDER BY version DESC
    `;
    const params = [drugid];
    const result = await pool.query(query, params);
    console.log('Query result rows:', result.rows.length); // Debug log

    if (result.rows.length === 0) {
      console.log('No SPC data found for drugid:', drugid);
      return res.status(404).json({ error: 'No SPC data found' });
    }

    res.json(result.rows);
  } catch (err) {
    console.error('Error executing SPC query:', err.message);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

module.exports = router;