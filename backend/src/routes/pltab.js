const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

console.log('Loading pltab.js route');
console.log('Pltab.js version 10 - Updated authenticateToken import');

// GET /pltab
router.get('/', async (req, res) => {
  const { lang, column } = req.query;
  console.log('Received pltab request:', { lang, column });

  // Επιτρέπουμε πρόσβαση χωρίς authentication για PLCOLUMN='LANGGREDIS'
  if (column && column.toUpperCase() === 'LANGGREDIS') {
    try {
      if (!lang) {
        console.log('Missing lang parameter for LANGGREDIS');
        return res.status(400).json({ error: 'Language parameter is required' });
      }
      const query = `
        SELECT PLCOLUMN, plcode, pltext, plstext, eutct, selectable, pllang
        FROM pltab
        WHERE pllang = $1 AND PLCOLUMN = $2 AND selectable = 1
        ORDER BY seq, pltext
      `;
      const params = [lang.toUpperCase().trim(), column.toUpperCase().trim()];
      console.log('Executing query:', query, 'with params:', params);
      const result = await pool.query(query, params);
      if (result.rows.length === 0) {
        console.log('No data found for:', { lang, column });
        return res.status(404).json({ error: 'No data found' });
      }
      res.json(result.rows);
    } catch (err) {
      console.error('Error in GET /api/pltab:', err);
      res.status(500).json({ error: 'Internal server error', details: err.message });
    }
  } else {
    // Εφαρμόζουμε authenticateToken για όλες τις άλλες περιπτώσεις
    authenticateToken(req, res, async () => {
      try {
        if (!lang || !column) {
          console.log('Missing lang or column parameter');
          return res.status(400).json({ error: 'Language and column parameters are required' });
        }
        const validColumns = ['DRSTATUS', 'FORM', 'WSSTATUS', 'LANGGREDIS', 'COTYPE', 'DRTYPE', 'STCOUNTR', 'UNIPS', 'PATYPE', 'PRESC', 'APPLICPROC'];
        if (!validColumns.includes(column.toUpperCase())) {
          console.log('Invalid column:', column);
          return res.status(400).json({ error: `Invalid column: ${column}` });
        }
        const query = `
          SELECT PLCOLUMN, plcode, pltext, plstext, eutct, selectable, pllang
          FROM pltab
          WHERE pllang = $1 AND PLCOLUMN = $2 AND selectable = 1
          ORDER BY seq, pltext
        `;
        const params = [lang.toUpperCase().trim(), column.toUpperCase().trim()];
        console.log('Executing query:', query, 'with params:', params);
        const debugQuery = `
          SELECT PLCOLUMN, plcode, pltext, pllang, LENGTH(pllang) AS lang_length, LENGTH(PLCOLUMN) AS column_length,
                 encode(pllang::bytea, 'hex') AS lang_hex, encode(PLCOLUMN::bytea, 'hex') AS column_hex
          FROM pltab
          WHERE pllang = $1 AND PLCOLUMN = $2 AND selectable = 1
        `;
        const debugResult = await pool.query(debugQuery, params);
        console.log('Debug query result:', debugResult.rows);
        const allDataQuery = `
          SELECT PLCOLUMN, plcode, pltext, pllang, LENGTH(pllang) AS lang_length, LENGTH(PLCOLUMN) AS column_length,
                 encode(pllang::bytea, 'hex') AS lang_hex, encode(PLCOLUMN::bytea, 'hex') AS column_hex
          FROM pltab
          WHERE pllang = 'EL' AND selectable = 1 AND PLCOLUMN IN ('DRSTATUS', 'FORM', 'WSSTATUS', 'LANGGREDIS', 'COTYPE', 'DRTYPE', 'STCOUNTR', 'UNIPS', 'PATYPE', 'PRESC', 'APPLICPROC')
        `;
        const allDataResult = await pool.query(allDataQuery);
        // console.log('All pltab data for EL:', allDataResult.rows);
        const result = await pool.query(query, params);
        if (result.rows.length === 0) {
          console.log('No data found for:', { lang, column });
          return res.status(404).json({ error: 'No data found' });
        }
        res.json(result.rows);
      } catch (err) {
        console.error('Error in GET /api/pltab:', err);
        res.status(500).json({ error: 'Internal server error', details: err.message });
      }
    });
  }
});

// Endpoint για ανάκτηση διακριτών PLCOLUMN
router.get('/columns', authenticateToken, async (req, res) => {
  try {
    console.log('Received pltab columns request');
    const query = `
      SELECT plcode, pltext
      FROM pltab
      WHERE PLCOLUMN = 'COLUMN' AND selectable = 1
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
router.get('/languages', authenticateToken, async (req, res) => {
  try {
    console.log('Received pltab languages request');
    const query = `
      SELECT plcode, pltext
      FROM pltab
      WHERE PLCOLUMN = 'LANGGREDIS' AND selectable = 1
      ORDER BY plcode
    `;
    console.log('Executing query:', query);
    const result = await pool.query(query);
    console.log('Pltab columns retrieved:', result.rows);
    res.json(result.rows.map(row => ({ value: row.plcode, label: row.pltext || row.plcode })));
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
      WHERE PLCOLUMN = $1 AND plcode = $2 AND pllang = $3 AND selectable = 1
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
      INSERT INTO pltab (PLCOLUMN, plcode, pllang, pltext, plstext, eutct, selectable, seq, htmlstyle)
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
      WHERE PLCOLUMN = $1 AND plcode = $2 AND pllang = $3 AND selectable = 1
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