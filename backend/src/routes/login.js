const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
require('dotenv').config();

router.post('/', async (req, res) => {
  console.log('Login endpoint reached');
  console.log('Request body:', req.body);
  const { username, password, lang } = req.body;

  try {
    // Έλεγχος σύνδεσης με τη βάση δεδομένων
    console.log('Testing database connection...');
    await pool.query('SELECT 1');
    console.log('Database connection successful');

    // Ερώτημα για έλεγχο διαπιστευτηρίων
    const query = `
      SELECT * FROM users WHERE username = $1 AND password = $2
    `;
    console.log('Executing query:', query, 'with params:', [username, password]);
    const result = await pool.query(query, [username, password]);

    if (result.rows.length === 0) {
      console.log('Invalid credentials for:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const token = jwt.sign({ username: user.username, lang }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });
    console.log('Login successful, token generated:', token);
    res.json({ token });
  } catch (err) {
    console.error('Error in POST /api/login:', err.message, err.stack);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

module.exports = router;