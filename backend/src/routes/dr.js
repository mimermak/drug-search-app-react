const express = require('express');
const pool = require('../config/db');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

console.log('Loading company.js route'); // Debugging log

// Endpoint για ανάκτηση δεδομένων COMPANY
router.get('/', authenticateToken, async (req, res) => {
  const { q, limit = 20 } = req.query;
  try {
    let query = `
      SELECT compid, compname
      FROM company
    `;
    const values = [];
    let paramIndex = 1;

    if (q) {
      query += ` WHERE compid ILIKE $${paramIndex} OR compname ILIKE $${paramIndex}`;
      values.push(`%${q}%`);
      paramIndex++;
    }

    query += ` ORDER BY compid LIMIT $${paramIndex}`;
    values.push(limit);

    console.log('Executing COMPANY query:', query, 'with params:', values);
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      console.log('No COMPANY data found');
      return res.status(404).json({ error: 'No COMPANY data found' });
    }

    console.log('COMPANY data retrieved:', result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error('Error in GET /api/company:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Endpoint για ανάκτηση ενός COMPANY record
router.get('/:compid', authenticateToken, async (req, res) => {
  const { compid } = req.params;
  try {
    const result = await pool.query('SELECT compid, compname FROM company WHERE compid = $1', [compid]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'COMPANY record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error in GET /api/company/:compid:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Endpoint για εισαγωγή νέου COMPANY record
router.post('/', authenticateToken, async (req, res) => {
  const { compid, compname } = req.body;
  try {
    const query = `
      INSERT INTO company (compid, compname)
      VALUES ($1, $2)
      RETURNING *;
    `;
    const values = [compid, compname];
    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error in POST /api/company:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Endpoint για ενημέρωση υπάρχοντος COMPANY record
router.put('/:compid', authenticateToken, async (req, res) => {
  const { compid } = req.params;
  const { compname } = req.body;
  try {
    const query = `
      UPDATE company
      SET compname = $1
      WHERE compid = $2
      RETURNING *;
    `;
    const values = [compname, compid];
    const result = await pool.query(query, values);
    if (result.rows.length === 0) return res.status(404).json({ error: 'COMPANY record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error in PUT /api/company/:compid:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

module.exports = router;