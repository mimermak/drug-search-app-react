const express = require('express');
const pool = require('../config/db');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

// GET /dratc - Retrieve all DRATC records
router.get('/dratc', authenticateToken, async (req, res) => {
  const { limit = 50 } = req.query;
  try {
    const result = await pool.query('SELECT * FROM dratc ORDER BY drugid, atccode LIMIT $1', [limit]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /dratc/:drugid/:atccode - Retrieve a single DRATC record
router.get('/dratc/:drugid/:atccode', authenticateToken, async (req, res) => {
  const { drugid, atccode } = req.params;
  try {
    const result = await pool.query('SELECT * FROM dratc WHERE drugid = $1 AND atccode = $2', [drugid, atccode]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'DRATC record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /dratc - Insert a new DRATC record
router.post('/dratc', authenticateToken, async (req, res) => {
  const { drugid, atccode } = req.body;
  try {
    const query = `
      INSERT INTO dratc (drugid, atccode)
      VALUES ($1, $2)
      RETURNING *;
    `;
    const values = [drugid, atccode];
    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/dratc/:drugid/:atccode', authenticateToken, async (req, res) => {
  const { drugid, atccode } = req.params;
  const { new_drugid, new_atccode } = req.body;
  try {
    const query = `
      UPDATE dratc SET
        drugid = $1, atccode = $2
      WHERE drugid = $3 AND atccode = $4
      RETURNING *;
    `;
    const values = [new_drugid || drugid, new_atccode || atccode, drugid, atccode];
    const result = await pool.query(query, values);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;