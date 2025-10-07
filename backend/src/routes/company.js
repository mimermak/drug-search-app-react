const express = require('express');
const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const router = express.Router();

console.log('Loading company.js route');
console.log('Company.js version 6 - Improved error handling, query validation, and country-only search support');

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

// Endpoint για αναζήτηση εταιρειών
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { compid, coname, emeanumber, country, lang, limit = '20', offset = '0', q } = req.query;
    console.log('Received companies request:', { compid, coname, emeanumber, country, lang, limit, offset, q });
    // Χρησιμοποιούμε το q ως coname αν δεν υπάρχει coname
    const effectiveConame = coname || q;

    // Μετατροπή limit και offset σε integers
    const parsedLimit = parseInt(limit, 10);
    const parsedOffset = parseInt(offset, 10);
    if (isNaN(parsedLimit) || isNaN(parsedOffset)) {
      console.log('Invalid limit or offset:', { limit, offset });
      return res.status(400).json({ error: 'Invalid limit or offset' });
    }

    // Εξασφάλιση ότι το lang είναι string
    const effectiveLang = (lang || 'EL').toUpperCase().trim();
    console.log('Effective language:', effectiveLang);

    // Αρχικοποίηση δεικτών παραμέτρων
    let paramIndex = 1;
    let paramIndexCount = 1;

    // Query για μέτρηση του συνολικού αριθμού αποτελεσμάτων
    let countQuery = `
      SELECT COUNT(DISTINCT c.compid) AS total
      FROM company c
      WHERE 1=1
    `;
    const countParams = [];

    // Query για ανάκτηση δεδομένων
    let query = `
      SELECT DISTINCT c.compid,
             c.coname,
             (c.street_number || ' ' || c.town) AS address,
             COALESCE(pl_country.pltext, c.country) AS country_text,
             c.regnumber
      FROM company c
      LEFT JOIN pltab pl_country ON c.country = pl_country.plcode
          AND pl_country.PLCOLUMN = 'STCOUNTR'
          AND pl_country.pllang = $${paramIndex}
      WHERE 1=1
    `;
    const params = [effectiveLang];
    paramIndex++;

    if (compid) {
      query += ` AND UPPER(c.compid) ILIKE $${paramIndex}`;
      countQuery += ` AND UPPER(c.compid) ILIKE $${paramIndexCount}`;
      params.push(`%${compid.toUpperCase()}%`);
      countParams.push(`%${compid.toUpperCase()}%`);
      paramIndex++;
      paramIndexCount++;
    }
    if (effectiveConame) {
      query += ` AND UPPER(c.coname) ILIKE $${paramIndex}`;
      countQuery += ` AND UPPER(c.coname) ILIKE $${paramIndexCount}`;
      params.push(`%${effectiveConame.toUpperCase()}%`);
      countParams.push(`%${effectiveConame.toUpperCase()}%`);
      paramIndex++;
      paramIndexCount++;
    }
    if (emeanumber) {
      query += ` AND c.emeanumber ILIKE $${paramIndex}`;
      countQuery += ` AND c.emeanumber ILIKE $${paramIndexCount}`;
      params.push(`%${emeanumber}%`);
      countParams.push(`%${emeanumber}%`);
      paramIndex++;
      paramIndexCount++;
    }
    if (country) {
      query += ` AND c.country = $${paramIndex}`;
      countQuery += ` AND c.country = $${paramIndexCount}`;
      params.push(country);
      countParams.push(country);
      paramIndex++;
      paramIndexCount++;
    }

    // Ελέγχουμε αν υπάρχει τουλάχιστον ένα κριτήριο (country συμπεριλαμβάνεται)
    if (!compid && !effectiveConame && !emeanumber && !country) {
      console.log('No search query provided');
      return res.status(400).json({ error: 'No search query provided' });
    }

    query += ` ORDER BY c.coname LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parsedLimit, parsedOffset);
    console.log('Executing count query:', countQuery, 'with params:', countParams);
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total, 10);
    console.log('Total companies count:', total);
    console.log('Executing query:', query, 'with params:', params);
    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      console.log('No companies found for:', { compid, coname: effectiveConame, emeanumber, country, lang, limit, offset, q });
      return res.status(404).json({ error: 'No companies found', total: 0, results: [] });
    }

    console.log('Companies retrieved, count:', result.rows.length);
    res.json({
      results: result.rows,
      total: total
    });
  } catch (err) {
    console.error('Error in GET /api/company:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

module.exports = router;