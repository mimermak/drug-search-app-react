const express = require('express');
const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const router = express.Router();

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Access denied, no token provided' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Forbidden' });
  }
}

router.get('/:drugid', authenticateToken, async (req, res) => {
  try {
    const { drugid } = req.params;
    const query = `
      SELECT 
        version,
        TO_CHAR(pldate, 'YYYY-MM-DD') AS pldate,
        doctype,
        username,
        encode(doc, 'base64') AS doc
      FROM pl
      WHERE drugid = $1
      ORDER BY version DESC
    `;
    const params = [drugid];
    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No PL data found' });
    }

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

module.exports = router;