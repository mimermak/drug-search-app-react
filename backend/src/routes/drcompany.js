const express = require('express');
const pool = require('../config/db');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

// Endpoint για εισαγωγή νέου record DRCOMPANY
router.post('/drcompany', authenticateToken, async (req, res) => {
  try {
    const { drcomid, compid, drugid, cotype, comments, process, seq } = req.body;
    const query = `
      INSERT INTO drcompany (drcomid, compid, drugid, cotype, comments, process, seq)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const params = [drcomid, compid, drugid, cotype, comments || null, process || null, seq || 0];
    console.log('Executing query:', query, 'with params:', params);
    const result = await pool.query(query, params);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error in POST /api/drcompany:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Endpoint για ανάκτηση δεδομένων DRCOMPANY
router.get('/drcompany/:drcomid', authenticateToken, async (req, res) => {
  try {
    const { drcomid } = req.params;
    const query = `
      SELECT * FROM drcompany 
      WHERE drcomid = $1
    `;
    const params = [drcomid];
    console.log('Executing query:', query, 'with params:', params);
    const result = await pool.query(query, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error in /api/drcompany/:drcomid:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Endpoint για ενημέρωση δεδομένων DRCOMPANY
router.put('/drcompany/:drcomid', authenticateToken, async (req, res) => {
  try {
    const { drcomid } = req.params;
    const { compid, drugid, cotype, comments, process, seq } = req.body;
    const query = `
      UPDATE drcompany 
      SET compid = $2, drugid = $3, cotype = $4, comments = $5, process = $6, seq = $7
      WHERE drcomid = $1
      RETURNING *
    `;
    const params = [drcomid, compid, drugid, cotype, comments || null, process || null, seq || 0];
    console.log('Executing query:', query, 'with params:', params);
    const result = await pool.query(query, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error in /api/drcompany/:drcomid:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

module.exports = router;