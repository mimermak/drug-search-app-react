const express = require('express');
const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const router = express.Router();

console.log('Loading pcpricelist.js route');
console.log('Pcpricelist.js version 45 - Fixed param indexing, added packnr||patext, active records first');
console.log('pcpricelist.js router initialized');

function authenticateToken(req, res, next) {
  console.log('Entering authenticateToken for:', req.originalUrl);
  const authHeader = req.headers['authorization'];
  console.log('Authorization header:', authHeader);
  const token = authHeader && authHeader.split(' ')[1];
  console.log('Received token:', token ? 'Token present' : 'No token provided');
  if (!token) {
    console.log('No token provided, returning 401');
    return res.status(401).json({ error: 'Access denied, no token provided' });
  }
  try {
    console.log('JWT_SECRET used:', process.env.JWT_SECRET ? 'Set' : 'Not set');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    console.log('Token decoded successfully:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message, 'stack:', err.stack);
    return res.status(403).json({ error: 'Forbidden', details: err.message });
  }
}

// Log all incoming requests to the router
router.use((req, res, next) => {
  console.log('Incoming request to pcpricelist router:', {
    method: req.method,
    url: req.originalUrl,
    query: req.query,
    params: req.params,
    headers: { authorization: req.headers.authorization ? 'Present' : 'Missing' }
  });
  next();
});

// Test endpoint to verify routing
console.log('Registering GET /api/pcpricelist/test endpoint');
router.get('/test', (req, res) => {
  console.log('Received test request at /api/pcpricelist/test');
  res.json({ message: 'Test endpoint reached', timestamp: new Date().toISOString() });
});

// ✅ ENDPOINT 1: Όλα τα packages με packnr||patext
router.get('/all', authenticateToken, async (req, res) => {
  console.log('Received request at /api/pcpricelist/all');
  console.log('Request query:', req.query);
  try {
    const { drugid, limit = '100', offset = '0' } = req.query;
    console.log('All packages params:', { drugid, limit: parseInt(limit), offset: parseInt(offset) });

    let query = `
      SELECT DISTINCT d.drdpid, d.packnr, d.patext, d.drugid
      FROM drdp d
      JOIN dr r ON d.drugid = r.drugid
    `;
    
    // ✅ ΣΩΣΤΗ ΣΕΙΡΑ PARAMS: drugid, limit, offset
    const params = [];
    let whereClause = '';
    let paramIndex = 1;
    
    if (drugid) {
      whereClause = ` WHERE d.drugid = $${paramIndex}`;
      params.push(drugid);
      paramIndex++;
    }

    // ✅ ΣΩΣΤΑ INDICES: $1=limit, $2=offset
    query += `
      ${whereClause}
      ORDER BY d.packnr NULLS LAST, d.patext
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(parseInt(limit, 10), parseInt(offset, 10));
    
    console.log('Executing /all query:');
    console.log(query);
    console.log('Query params:', params);
    
    const result = await pool.query(query, params);
    console.log('All packages retrieved, count:', result.rows.length);
    
    // ✅ packnr||' '||patext formatting
    const options = result.rows.map(item => ({
      value: item.drdpid,
      label: `${item.packnr || ''} ${item.patext || ''}`.trim() || `ID: ${item.drdpid}`,  // Fallback to ID
      drdpid: item.drdpid,
      packnr: item.packnr || '',
      patext: item.patext || ''
    })).sort((a, b) => a.label.localeCompare(b.label));
    
    console.log('Formatted dropdown options sample:', options.slice(0, 3));
    
    res.json({
      results: options,
      total: result.rowCount || options.length
    });
  } catch (err) {
    console.error('Error in GET /api/pcpricelist/all:', err.message);
    console.error('Error stack:', err.stack);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// ✅ ENDPOINT 2: Packages με τιμές με packnr||patext
router.get('/priced', authenticateToken, async (req, res) => {
  console.log('Received request at /api/pcpricelist/priced');
  console.log('Request query:', req.query);
  try {
    const { drugid, limit = '100', offset = '0' } = req.query;
    console.log('Priced packages params:', { drugid, limit: parseInt(limit), offset: parseInt(offset) });

    let query = `
      SELECT DISTINCT d.drdpid, d.packnr, d.patext, d.drugid
      FROM drdp d
      JOIN pcpricelist p ON d.drdpid = p.drdpid
      JOIN dr r ON d.drugid = r.drugid
    `;
    
    // ✅ ΣΩΣΤΗ ΣΕΙΡΑ PARAMS
    const params = [];
    let whereClause = '';
    let paramIndex = 1;
    
    if (drugid) {
      whereClause = ` WHERE d.drugid = $${paramIndex}`;
      params.push(drugid);
      paramIndex++;
    }

    // ✅ Ενεργές εγγραφές (προαιρετικά)
    whereClause += whereClause ? ` AND (p.dateuntil IS NULL OR p.dateuntil >= CURRENT_DATE)` : ` WHERE (p.dateuntil IS NULL OR p.dateuntil >= CURRENT_DATE)`;

    query += `
      ${whereClause}
      ORDER BY d.packnr NULLS LAST, d.patext
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(parseInt(limit, 10), parseInt(offset, 10));
    
    console.log('Executing /priced query:');
    console.log(query);
    console.log('Query params:', params);
    
    const result = await pool.query(query, params);
    console.log('Priced packages retrieved, count:', result.rows.length);
    
    // ✅ packnr||' '||patext formatting
    const options = result.rows.map(item => ({
      value: item.drdpid,
      label: `${item.packnr || ''} ${item.patext || ''}`.trim() || `ID: ${item.drdpid}`,
      drdpid: item.drdpid,
      packnr: item.packnr || '',
      patext: item.patext || ''
    })).sort((a, b) => a.label.localeCompare(b.label));
    
    console.log('Priced dropdown options sample:', options.slice(0, 3));
    
    res.json({
      results: options,
      total: result.rowCount || options.length
    });
  } catch (err) {
    console.error('Error in GET /api/pcpricelist/priced:', err.message);
    console.error('Error stack:', err.stack);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// ✅ ENDPOINT 3: Τιμές για συγκεκριμένο drdpid
router.get('/:drdpid', authenticateToken, async (req, res) => {
  console.log('Received request at /api/pcpricelist/:drdpid');
  console.log('Request params:', req.params);
  try {
    const { drdpid } = req.params;
    console.log('Received pcpricelist request with params:', { drdpid });
    
    if (!drdpid) {
      console.log('Missing drdpid parameter');
      return res.status(400).json({ error: 'drdpid parameter is required' });
    }

    // ✅ ΔΙΟΡΘΩΜΕΝΟ QUERY με σωστά field names
    const query = `
      SELECT TO_CHAR(datefrom, 'YYYY-MM-DD') AS datefrom, 
             COALESCE(TO_CHAR(dateuntil, 'YYYY-MM-DD'), 'Ποτέ') AS dateuntil,
             xfactory AS producerprice,
             finalwhprice AS wholesaleprice,
             finaldtprice AS retailprice,
             finalhosprice AS hospitalprice,
             COALESCE(vat * 100, 0) AS vat,
             MISYFA,
             Negative,
             CASE 
               WHEN dateuntil IS NULL OR dateuntil >= CURRENT_DATE THEN 'Ενεργό'
               ELSE 'Ληγμένο'
             END AS status
      FROM pcpricelist 
      WHERE drdpid = $1
      ORDER BY 
        CASE WHEN dateuntil IS NULL OR dateuntil >= CURRENT_DATE THEN 0 ELSE 1 END,
        datefrom DESC
      LIMIT 50
    `;
    
    console.log('Executing pcpricelist query for drdpid:', drdpid);
    console.log('Query params:', [drdpid]);
    
    const result = await pool.query(query, [drdpid]);
    console.log('Price list retrieved, count:', result.rows.length);
    
    if (result.rows.length === 0) {
      console.log('No price list found for drdpid:', drdpid);
      // Fallback - ψάξε και σε ληγμένες εγγραφές
      const fallbackQuery = `
        SELECT TO_CHAR(datefrom, 'YYYY-MM-DD') AS datefrom, 
               COALESCE(TO_CHAR(dateuntil, 'YYYY-MM-DD'), 'Ποτέ') AS dateuntil,
               xfactory AS producerprice,
               finalwhprice AS wholesaleprice,
               finaldtprice AS retailprice,
               finalhosprice AS hospitalprice,
               COALESCE(vat * 100, 0) AS vat,
               MISYFA,
               Negative,
               'Ληγμένο' AS status
        FROM pcpricelist 
        WHERE drdpid = $1
        ORDER BY datefrom DESC
        LIMIT 50
      `;
      
      const fallbackResult = await pool.query(fallbackQuery, [drdpid]);
      if (fallbackResult.rows.length > 0) {
        console.log('Found fallback (expired) records:', fallbackResult.rows.length);
        res.json(fallbackResult.rows);
      } else {
        res.status(404).json({ error: 'No price list found', drdpid });
      }
    } else {
      console.log('Active price list found:', result.rows.length, 'rows');
      console.log('First record (active):', result.rows[0]);
      console.log('Last record (for MISYFA):', result.rows[result.rows.length - 1]);
      res.json(result.rows);
    }
  } catch (err) {
    console.error('Error in GET /api/pcpricelist/:drdpid:', err.message);
    console.error('Error details:', {
      code: err.code,
      detail: err.detail,
      stack: err.stack
    });
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

module.exports = router;