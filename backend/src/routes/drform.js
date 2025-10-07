const express = require('express');
const pool = require('../config/db');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

// GET /drform - Retrieve all DRFORM records
router.get('/drform', authenticateToken, async (req, res) => {
  const { limit = 50 } = req.query;
  try {
    const result = await pool.query('SELECT * FROM drform ORDER BY pharmid LIMIT $1', [limit]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /drform/:pharmid - Retrieve a single DRFORM record
router.get('/drform/:pharmid', authenticateToken, async (req, res) => {
  const { pharmid } = req.params;
  try {
    const result = await pool.query('SELECT * FROM drform WHERE pharmid = $1', [pharmid]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'DRFORM not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post('/drform', authenticateToken, async (req, res) => {
  const {
    pharmid, drugid, formcode, seq, strength, administered, pharmdescr, drvolum, unitcode, formcateg
  } = req.body;
  try {
    const query = `
      INSERT INTO drform (
        pharmid, drugid, formcode, seq, strength, administered, pharmdescr, drvolum, unitcode, formcateg
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;
    const values = [
      pharmid, drugid, formcode, seq, strength, administered, pharmdescr, drvolum, unitcode, formcateg
    ];
    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/drform/:pharmid', authenticateToken, async (req, res) => {
  const { pharmid } = req.params;
  const {
    drugid, formcode, seq, strength, administered, pharmdescr, drvolum, unitcode, formcateg
  } = req.body;
  try {
    const query = `
      UPDATE drform SET
        drugid = $1, formcode = $2, seq = $3, strength = $4, administered = $5,
        pharmdescr = $6, drvolum = $7, unitcode = $8, formcateg = $9
      WHERE pharmid = $10
      RETURNING *;
    `;
    const values = [
      drugid, formcode, seq, strength, administered, pharmdescr, drvolum, unitcode, formcateg, pharmid
    ];
    const result = await pool.query(query, values);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;