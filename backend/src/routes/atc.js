const express = require('express');
const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const router = express.Router();

console.log('Loading atc.js route'); // Debugging log
console.log('Updated atc.js version 4 - Search includes atccode and atcdescr with improved error handling'); // Ελέγχος έκδοσης

// Middleware για έλεγχο JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  console.log('Received token:', token); // Debugging log
  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ error: 'Access denied, no token provided' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    console.log('Token decoded:', decoded); // Debugging log
    req.user = decoded;
    next();
  } catch (err) {
    console.log('Token verification failed:', err.message);
    return res.status(403).json({ error: 'Forbidden' });
  }
}

// GET /atc - Αναζήτηση ATC κωδικών με query parameter q
router.get('/', authenticateToken, async (req, res) => {
  const { q, limit = 20 } = req.query;
  try {
    if (!q) {
      console.log('Missing query parameter');
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    const parsedLimit = parseInt(limit, 10);
    if (isNaN(parsedLimit)) {
      return res.status(400).json({ error: 'Invalid limit parameter' });
    }
    const query = `
      SELECT atccode, atcdescr
      FROM atc
      WHERE atccode LIKE $1 OR atcdescr ILIKE $1
      ORDER BY atccode
      LIMIT $2
    `;
    const values = [`%${q.toUpperCase()}%`, parsedLimit];
    console.log('Executing ATC query:', query, 'with params:', values);
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      console.log('No ATC data found for:', { q });
      return res.status(404).json({ error: 'No ATC data found', results: [] });
    }
    console.log('ATC data retrieved:', result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error('Error in GET /api/atc:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// GET /atc/:atccode - Ανάκτηση ενός ATC record
router.get('/:atccode', authenticateToken, async (req, res) => {
  const { atccode } = req.params;
  try {
    const result = await pool.query('SELECT atccode, atcdescr FROM atc WHERE atccode = $1', [atccode.toUpperCase()]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'ATC record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error in GET /api/atc/:atccode:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// POST /atc - Εισαγωγή νέου ATC record
router.post('/', authenticateToken, async (req, res) => {
  const { atccode, atcdescr } = req.body;
  try {
    const query = `
      INSERT INTO atc (atccode, atcdescr)
      VALUES ($1, $2)
      RETURNING *;
    `;
    const values = [atccode.toUpperCase(), atcdescr];
    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error in POST /api/atc:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// PUT /atc/:atccode - Ενημέρωση υπάρχοντος ATC record
router.put('/:atccode', authenticateToken, async (req, res) => {
  const { atccode } = req.params;
  const { atcdescr } = req.body;
  try {
    const query = `
      UPDATE atc
      SET atcdescr = $1
      WHERE atccode = $2
      RETURNING *;
    `;
    const values = [atcdescr, atccode.toUpperCase()];
    const result = await pool.query(query, values);
    if (result.rows.length === 0) return res.status(404).json({ error: 'ATC record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error in PUT /api/atc/:atccode:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

module.exports = router;