const express = require('express');
const pool = require('../config/db');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

console.log('Loading pltab.js route'); // Debugging log

// Endpoint για ανάκτηση δεδομένων PLTAB
router.get('/', async (req, res) => {
  try {
    const { lang, column } = req.query;
    console.log('Received pltab request:', { lang, column }); // Debugging log

    if (!lang || !column) {
      console.log('Missing lang or column parameter');
      return res.status(400).json({ error: 'Language and column parameters are required' });
    }

    // Χρησιμοποιούμε toUpperCase για τον έλεγχο εγκυρότητας
    const validColumns = ['drstatus', 'formcode', 'WSSTATUS', 'Test', 'test2', 'LANGGREDIS'].map(c => c.toUpperCase());
    if (!validColumns.includes(column.toUpperCase())) {
      console.log('Invalid column:', column);
      return res.status(400).json({ error: 'Invalid column parameter' });
    }

    const query = `
      SELECT plcolumn, plcode, pltext, plstext, eutct, selectable, pllang
      FROM pltab
      WHERE pllang = $1 AND plcolumn = $2
      ORDER BY seq, pltext
    `;
    console.log('Executing query:', query, 'with params:', [lang, column]);
    const result = await pool.query(query, [lang, column]);

    if (result.rows.length === 0) {
      console.log('No data found for:', { lang, column });
      return res.status(404).json({ error: 'No data found' });
    }

    console.log('Pltab data retrieved:', result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error('Error in GET /api/pltab:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Endpoint για ανάκτηση διακριτών plcolumn
router.get('/columns', async (req, res) => {
  try {
    console.log('Received pltab columns request'); // Debugging log
    const query = `
      SELECT plcode, pltext
      FROM pltab
      WHERE plcolumn = 'column'
      ORDER BY plcode
    `;
    console.log('Executing query:', query);
    const result = await pool.query(query);
    console.log('Pltab columns retrieved:', result.rows);
    res.json(result.rows.map(row => ({ value: row.plcode, label: row.pltext || row.plcode })));
  } catch (err) {
    console.error('Error in GET /api/pltab/columns:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Endpoint για ανάκτηση περιγραφών pllang
router.get('/languages', async (req, res) => {
  try {
    console.log('Received pltab languages request'); // Debugging log
    const query = `
      SELECT plcode, pltext
      FROM pltab
      WHERE plcolumn = 'LANGGREDIS'
      ORDER BY plcode
    `;
    console.log('Executing query:', query);
    const result = await pool.query(query);
    console.log('Pltab languages retrieved:', result.rows);
    res.json(result.rows.map(row => ({ value: row.plcode, label: row.pltext })));
  } catch (err) {
    console.error('Error in GET /api/pltab/languages:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Endpoint για ανάκτηση συγκεκριμένου record PLTAB
router.get('/:plcolumn/:plcode/:pllang', authenticateToken, async (req, res) => {
  try {
    const { plcolumn, plcode, pllang } = req.params;
    const query = `
      SELECT *
      FROM pltab
      WHERE plcolumn = $1 AND plcode = $2 AND pllang = $3
    `;
    console.log('Executing query:', query, 'with params:', [plcolumn, plcode, pllang]);
    const result = await pool.query(query, [plcolumn, plcode, pllang]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error in GET /api/pltab/:plcolumn/:plcode/:pllang:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Endpoint για εισαγωγή νέου record PLTAB
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { plcolumn, plcode, pllang, pltext, plstext, eutct, selectable, seq, htmlstyle } = req.body;
    const query = `
      INSERT INTO pltab (plcolumn, plcode, pllang, pltext, plstext, eutct, selectable, seq, htmlstyle)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const params = [plcolumn, plcode, pllang, pltext, plstext || null, eutct || null, selectable || 1, seq || 0, htmlstyle || null];
    console.log('Executing query:', query, 'with params:', params);
    const result = await pool.query(query, params);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error in POST /api/pltab:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Endpoint για ενημέρωση δεδομένων PLTAB
router.put('/:plcolumn/:plcode/:pllang', authenticateToken, async (req, res) => {
  try {
    const { plcolumn, plcode, pllang } = req.params;
    const { pltext, plstext, eutct, selectable, seq, htmlstyle } = req.body;
    const query = `
      UPDATE pltab
      SET pltext = $4, plstext = $5, eutct = $6, selectable = $7, seq = $8, htmlstyle = $9
      WHERE plcolumn = $1 AND plcode = $2 AND pllang = $3
      RETURNING *
    `;
    const params = [plcolumn, plcode, pllang, pltext, plstext || null, eutct || null, selectable, seq, htmlstyle || null];
    console.log('Executing query:', query, 'with params:', params);
    const result = await pool.query(query, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error in PUT /api/pltab/:plcolumn/:plcode/:pllang:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

module.exports = router;