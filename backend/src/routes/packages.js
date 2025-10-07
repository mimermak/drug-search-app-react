const express = require('express');
const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const router = express.Router();

console.log('Loading packages.js route');

// Middleware για έλεγχο JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  console.log('Received token:', token ? 'Token present' : 'No token provided');
  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ error: 'Access denied, no token provided' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    console.log('Token decoded:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.log('Token verification failed:', err.message);
    return res.status(403).json({ error: 'Forbidden' });
  }
}

// Existing endpoint for all packages
router.get('/packages', authenticateToken, async (req, res) => {
  try {
    const { packageid, packdesc, package, lang, limit = '20', offset = '0' } = req.query;
    console.log('Received packages request:', { packageid, packdesc, package, lang, limit, offset });

    let query = `
      SELECT p.packageid, p.packdesc, p.package
      FROM packages p
      WHERE 1=1
    `;
    const params = [];

    if (packageid) {
      query += ' AND p.packageid ILIKE $1';
      params.push(`%${packageid}%`);
    }
    if (packdesc) {
      query += ' AND p.packdesc ILIKE $' + (params.length + 1);
      params.push(`%${packdesc}%`);
    }
    if (package) {
      query += ' AND p.package ILIKE $' + (params.length + 1);
      params.push(`%${package}%`);
    }

    query += ' LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    console.log('Executing query:', query, 'with params:', params);
    const result = await pool.query(query, params);
    console.log('Packages retrieved, count:', result.rows.length);

    res.json({
      results: result.rows,
      total: result.rowCount
    });
  } catch (err) {
    console.error('Error in GET /api/packages:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// New endpoint for packages with pricelist entries
router.get('/packages/with-pricelist', authenticateToken, async (req, res) => {
  try {
    const { packageid, packdesc, package, lang, limit = '20', offset = '0' } = req.query;
    console.log('Received packages with pricelist request:', { packageid, packdesc, package, lang, limit, offset });

    let query = `
      SELECT DISTINCT p.packageid, p.packdesc, p.package
      FROM packages p
      INNER JOIN pcpricelist pl ON p.packageid = pl.packageid
      WHERE 1=1
    `;
    const params = [];

    if (packageid) {
      query += ' AND p.packageid ILIKE $1';
      params.push(`%${packageid}%`);
    }
    if (packdesc) {
      query += ' AND p.packdesc ILIKE $' + (params.length + 1);
      params.push(`%${packdesc}%`);
    }
    if (package) {
      query += ' AND p.package ILIKE $' + (params.length + 1);
      params.push(`%${package}%`);
    }

    query += ' LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    console.log('Executing query:', query, 'with params:', params);
    const result = await pool.query(query, params);
    console.log('Packages with pricelist retrieved, count:', result.rows.length);

    res.json({
      results: result.rows,
      total: result.rowCount
    });
  } catch (err) {
    console.error('Error in GET /api/packages/with-pricelist:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

module.exports = router;