const express = require('express');
const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const router = express.Router();

console.log('Loading drdp.js route');
console.log('Drdp.js version 4 - Added drdpid to SELECT');

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

router.get('/:drugid', authenticateToken, async (req, res) => {
  try {
    const { drugid } = req.params;
    const { packnr, lang } = req.query;
    console.log('Received DRDP request:', { drugid, packnr, lang });

    const effectiveLang = (lang || 'EL').toUpperCase().trim();
    console.log('Effective language:', effectiveLang);

    let query = `
      SELECT 
        drdp.drdpid,
        drdp.packnr,
        drdp.patext,
        (drdp.dpsize || ' ' || COALESCE(pl_unit.pltext, drdp.dpunit)) AS size,
        COALESCE(pl_status.pltext, drdp.dpstatus) AS status_text,
        COALESCE(pl_type.pltext, drdp.dptype) AS type_text,
        COALESCE(pl_presc.pltext, drdp.lestatus) AS lestatus_text,
        drdp.narcateg,
        drdp.barcode,
        drdp.eunumber
      FROM drdp
      LEFT JOIN pltab pl_unit ON drdp.dpunit = pl_unit.plcode AND pl_unit.PLCOLUMN = 'UNIPS' AND pl_unit.pllang = $1
      LEFT JOIN pltab pl_status ON drdp.dpstatus = pl_status.plcode AND pl_status.PLCOLUMN = 'DRSTATUS' AND pl_status.pllang = $1
      LEFT JOIN pltab pl_type ON drdp.dptype = pl_type.plcode AND pl_type.PLCOLUMN = 'PATYPE' AND pl_type.pllang = $1
      LEFT JOIN pltab pl_presc ON drdp.lestatus = pl_presc.plcode AND pl_presc.PLCOLUMN = 'PRESC' AND pl_presc.pllang = $1
      WHERE drdp.drugid = $2
    `;
    const params = [effectiveLang, drugid];

    if (packnr) {
      query += ` AND drdp.packnr = $3`;
      params.push(packnr);
    }

    query += ` ORDER BY drdp.patext`;

    console.log('Executing query:', query, 'with params:', params);
    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      console.log('No packages found for:', { drugid, packnr });
      return res.status(404).json({ error: 'No packages found' });
    }

    console.log('Packages retrieved, count:', result.rows.length);
    res.json(result.rows);
  } catch (err) {
    console.error('Error in GET /api/drdp:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

module.exports = router;