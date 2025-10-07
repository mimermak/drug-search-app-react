const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

console.log('Loading drugs.js route');
console.log('Drugs.js version 57 - Default cotype=AG when no company type');
console.log('drugs.js router initialized');

// Endpoint για αναζήτηση φαρμάκων
router.get('/drugs', authenticateToken, async (req, res) => {
  console.log('🔍 Drugs.js endpoint /drugs reached');
  console.log('Handling /api/drugs/drugs request');
  console.log('Request query:', req.query);
  console.log('Request body:', req.body);
  const { drname, drnameMatch, drstatus, FORM, drtype, applicproc, atc, substancs, company, cotype, lang = 'EL', limit = 10, offset = 0 } = req.query;

  try {
    // ✅ ΒΑΣΗ QUERY
    let query = `
      SELECT DISTINCT d.drugid, 
             d.drname || ' ' || COALESCE(df.strength, '') AS drname,
             pl_status.pltext AS drstatus, 
             pl_form.plstext AS form, 
             pl_type.pltext AS drtype,
             atc.atccode, 
             atc.atcdescr, 
             s.substancs, 
             c.coname AS company
      FROM dr d
      LEFT JOIN pltab pl_status ON d.drstatus = pl_status.plcode AND pl_status.PLCOLUMN = 'DRSTATUS' AND pl_status.pllang = $1
      LEFT JOIN drform df ON d.drugid = df.drugid
      LEFT JOIN pltab pl_form ON df.formcode = pl_form.plcode AND pl_form.PLCOLUMN = 'FORM' AND pl_form.pllang = $1
      LEFT JOIN pltab pl_type ON d.drtype = pl_type.plcode AND pl_type.PLCOLUMN = 'DRTYPE' AND pl_type.pllang = $1
      LEFT JOIN dratc ON d.drugid = dratc.drugid
      LEFT JOIN atc ON dratc.atccode = atc.atccode
      LEFT JOIN drsub s ON d.drugid = s.drugid
      LEFT JOIN drcompany dc ON d.drugid = dc.drugid
      LEFT JOIN company c ON dc.compid = c.compid
      WHERE 1=1
    `;
    
    let params = [lang];
    let paramIndex = 2;

    // ✅ LOG: Βάση query ΠΡΙΝ τις conditions
    console.log('📋 === BASE QUERY STRUCTURE ===');
    console.log('Lang parameter:', lang);
    console.log('Company:', company);
    console.log('Cotype:', cotype);
    console.log('==============================');

    // ✅ Dynamic conditions
    if (drname) {
      query += ` AND UPPER(d.drname) ${drnameMatch === 'startsWith' ? 'LIKE' : 'ILIKE'} $${paramIndex++}`;
      params.push(drnameMatch === 'startsWith' ? `${drname}%` : `%${drname}%`);
      console.log(`✅ Added drname condition: ${drname}`);
    }
    
    if (drstatus) {
      if (drstatus.length === 1) {
        query += ` AND d.drstatus LIKE $${paramIndex++}`;
        params.push(`${drstatus}%`);
        console.log(`✅ Added drstatus LIKE: ${drstatus} -> '${drstatus}%'`);
      } else {
        query += ` AND d.drstatus = $${paramIndex++}`;
        params.push(drstatus);
        console.log(`✅ Added drstatus =: ${drstatus}`);
      }
    }
    
    if (FORM) {
      query += ` AND df.formcode = $${paramIndex++}`;
      params.push(FORM);
      console.log(`✅ Added FORM condition: ${FORM}`);
    }
    
    if (drtype) {
      if (drtype.length === 1) {
        query += ` AND d.drtype LIKE $${paramIndex++}`;
        params.push(`${drtype}%`);
        console.log(`✅ Added drtype LIKE: ${drtype} -> '${drtype}%'`);
      } else {
        query += ` AND d.drtype = $${paramIndex++}`;
        params.push(drtype);
        console.log(`✅ Added drtype =: ${drtype}`);
      }
    }
    
    if (applicproc) {
      if (applicproc.length === 1) {
        query += ` AND d.applicproc LIKE $${paramIndex++}`;
        params.push(`${applicproc}%`);
        console.log(`✅ Added applicproc LIKE: ${applicproc} -> '${applicproc}%'`);
      } else {
        query += ` AND d.applicproc = $${paramIndex++}`;
        params.push(applicproc);
        console.log(`✅ Added applicproc =: ${applicproc}`);
      }
    }
    
    if (atc) {
      if (atc.length === 7) {
        query += ` AND atc.atccode = $${paramIndex++}`;
        params.push(atc);
        console.log(`✅ Added ATC exact: ${atc}`);
      } else {
        query += ` AND atc.atccode LIKE $${paramIndex++}`;
        params.push(`${atc}%`);
        console.log(`✅ Added ATC LIKE: ${atc} -> '${atc}%'`);
      }
    }
    
    if (substancs) {
      query += ` AND UPPER(s.substancs) ILIKE $${paramIndex++}`;
      params.push(`%${substancs}%`);
      console.log(`✅ Added substancs condition: ${substancs}`);
    }

    // ✅ ΔΙΟΡΘΩΣΗ: Company logic με default cotype='AG'
    if (company) {
      if (cotype) {
        // ✅ Και τα δύο δίνονται - χρησιμοποιούμε τα δοθέντα
        query += ` AND dc.compid = $${paramIndex++} AND dc.cotype = $${paramIndex++}`;
        params.push(company, cotype);
        console.log(`✅ Added company with cotype: ${company}, ${cotype}`);
      } else {
        // ✅ Μόνο company δίνεται - default cotype='AG'
        query += ` AND dc.compid = $${paramIndex++} AND dc.cotype = $${paramIndex++}`;
        params.push(company, 'AG');
        console.log(`✅ Added company with DEFAULT cotype='AG': ${company}`);
      }
    } else if (cotype) {
      // ✅ Μόνο cotype δίνεται (σπάνια περίπτωση)
      query += ` AND dc.cotype = $${paramIndex++}`;
      params.push(cotype);
      console.log(`✅ Added cotype only: ${cotype}`);
    }

    // ✅ Προσθήκη ORDER BY και LIMIT
    query += ` ORDER BY 1 LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(parseInt(limit), parseInt(offset));
    console.log(`✅ Added ORDER BY 1, LIMIT ${limit}, OFFSET ${offset}`);

    // ✅ CRITICAL LOG: Πλήρες query ΠΡΙΝ την εκτέλεση
    console.log('\n🚀 === FINAL QUERY BEFORE EXECUTION ===');
    console.log('Query length:', query.length);
    console.log('Full query:');
    console.log(query);
    console.log('\nParameters:', params);
    console.log('Params length:', params.length);
    console.log('=====================================\n');

    // ✅ ΕΚΤΕΛΕΣΗ QUERY
    console.log('🔄 Executing main query...');
    const result = await pool.query(query, params);
    console.log('✅ Main query completed! Rows:', result.rows.length);

    if (result.rows.length > 0) {
      console.log('\n📊 First result:');
      console.log(JSON.stringify(result.rows[0], null, 2));
      console.log('─'.repeat(50));
    }

    // ✅ COUNT QUERY με ίδια company logic
    let countQuery = `
      SELECT COUNT(DISTINCT d.drugid) as total
      FROM dr d
      LEFT JOIN pltab pl_status ON d.drstatus = pl_status.plcode AND pl_status.PLCOLUMN = 'DRSTATUS' AND pl_status.pllang = $1
      LEFT JOIN drform df ON d.drugid = df.drugid
      LEFT JOIN pltab pl_form ON df.formcode = pl_form.plcode AND pl_form.PLCOLUMN = 'FORM' AND pl_form.pllang = $1
      LEFT JOIN pltab pl_type ON d.drtype = pl_type.plcode AND pl_type.PLCOLUMN = 'DRTYPE' AND pl_type.pllang = $1
      LEFT JOIN dratc ON d.drugid = dratc.drugid
      LEFT JOIN atc ON dratc.atccode = atc.atccode
      LEFT JOIN drsub s ON d.drugid = s.drugid
      LEFT JOIN drcompany dc ON d.drugid = dc.drugid
      LEFT JOIN company c ON dc.compid = c.compid
      WHERE 1=1
    `;
    
    let countParams = [lang];
    let countParamIndex = 2;

    if (drname) {
      countQuery += ` AND UPPER(d.drname) ${drnameMatch === 'startsWith' ? 'LIKE' : 'ILIKE'} $${countParamIndex++}`;
      countParams.push(drnameMatch === 'startsWith' ? `${drname}%` : `%${drname}%`);
    }
    
    if (drstatus) {
      if (drstatus.length === 1) {
        countQuery += ` AND d.drstatus LIKE $${countParamIndex++}`;
        countParams.push(`${drstatus}%`);
      } else {
        countQuery += ` AND d.drstatus = $${countParamIndex++}`;
        countParams.push(drstatus);
      }
    }
    
    if (FORM) {
      countQuery += ` AND df.formcode = $${countParamIndex++}`;
      countParams.push(FORM);
    }
    
    if (drtype) {
      if (drtype.length === 1) {
        countQuery += ` AND d.drtype LIKE $${countParamIndex++}`;
        countParams.push(`${drtype}%`);
      } else {
        countQuery += ` AND d.drtype = $${countParamIndex++}`;
        countParams.push(drtype);
      }
    }
    
    if (applicproc) {
      if (applicproc.length === 1) {
        countQuery += ` AND d.applicproc LIKE $${countParamIndex++}`;
        countParams.push(`${applicproc}%`);
      } else {
        countQuery += ` AND d.applicproc = $${countParamIndex++}`;
        countParams.push(applicproc);
      }
    }
    
    if (atc) {
      if (atc.length === 7) {
        countQuery += ` AND atc.atccode = $${countParamIndex++}`;
        countParams.push(atc);
      } else {
        countQuery += ` AND atc.atccode LIKE $${countParamIndex++}`;
        countParams.push(`${atc}%`);
      }
    }
    
    if (substancs) {
      countQuery += ` AND UPPER(s.substancs) ILIKE $${countParamIndex++}`;
      countParams.push(`%${substancs}%`);
    }

    // ✅ Ίδια company logic για countQuery
    if (company) {
      if (cotype) {
        countQuery += ` AND dc.compid = $${countParamIndex++} AND dc.cotype = $${countParamIndex++}`;
        countParams.push(company, cotype);
      } else {
        countQuery += ` AND dc.compid = $${countParamIndex++} AND dc.cotype = $${countParamIndex++}`;
        countParams.push(company, 'AG');
      }
    } else if (cotype) {
      countQuery += ` AND dc.cotype = $${countParamIndex++}`;
      countParams.push(cotype);
    }

    // ✅ LOG: Count query ΠΡΙΝ την εκτέλεση
    console.log('\n🔢 === COUNT QUERY BEFORE EXECUTION ===');
    console.log('Count query length:', countQuery.length);
    console.log('Count query:');
    console.log(countQuery);
    console.log('\nCount parameters:', countParams);
    console.log('====================================\n');

    // ✅ ΕΚΤΕΛΕΣΗ COUNT QUERY
    console.log('🔄 Executing count query...');
    const countResult = await pool.query(countQuery, countParams);
    console.log('✅ Count query completed! Total:', countResult.rows[0].total);

    const total = parseInt(countResult.rows[0].total, 10);
    
    console.log('\n🎉 FINAL RESULT:');
    console.log(`Rows returned: ${result.rows.length}`);
    console.log(`Total count: ${total}`);
    console.log('─'.repeat(50));

    res.json({ results: result.rows, total });

  } catch (err) {
    console.error('\n💥 ERROR OCCURRED:');
    console.error('Error message:', err.message);
    console.error('Error code:', err.code);
    console.error('Error stack:', err.stack);
    console.error('─'.repeat(50));
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Τα υπόλοιπα endpoints...
router.get('/dr/autocomplete', authenticateToken, async (req, res) => {
  console.log('🔍 Autocomplete endpoint reached');
  console.log('Request query:', req.query);
  const { q } = req.query;

  if (!q || q.length < 3) {
    console.log('❌ Query too short:', q);
    return res.json([]);
  }

  try {
    console.log('🔄 Executing autocomplete...');
    const query = `
      SELECT DISTINCT d.drname
      FROM dr d
      WHERE UPPER(d.drname) ILIKE $1
      ORDER BY d.drname
      LIMIT 20
    `;
    const params = [`%${q}%`];
    
    console.log('Autocomplete query:', query);
    console.log('Autocomplete params:', params);
    
    const result = await pool.query(query, params);
    console.log('✅ Autocomplete completed:', result.rows.length, 'results');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Autocomplete error:', err.message);
    res.status(500).json({ error: 'Autocomplete error', details: err.message });
  }
});

router.get('/drsub', authenticateToken, async (req, res) => {
  console.log('🔍 Drsub endpoint reached');
  console.log('Request query:', req.query);
  const { q, limit = 20, offset = 0 } = req.query;

  if (!q || q.length < 3) {
    console.log('❌ Query too short:', q);
    return res.json([]);
  }

  try {
    console.log('🔄 Executing drsub query...');
    const query = `
      SELECT DISTINCT substancs
      FROM drsub
      WHERE UPPER(substancs) ILIKE $1
      ORDER BY substancs
      LIMIT $2 OFFSET $3
    `;
    const params = [`%${q}%`, parseInt(limit), parseInt(offset)];
    
    console.log('Drsub query:', query);
    console.log('Drsub params:', params);
    
    const result = await pool.query(query, params);
    console.log('✅ Drsub completed:', result.rows.length, 'results');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Drsub error:', err.message);
    res.status(500).json({ error: 'Drsub error', details: err.message });
  }
});

router.get('/company', authenticateToken, async (req, res) => {
  console.log('🔍 Company endpoint reached');
  console.log('Request query:', req.query);
  const { q, lang = 'EL', limit = 20, offset = 0 } = req.query;

  if (!q || q.length < 3) {
    console.log('❌ Query too short:', q);
    return res.json([]);
  }

  try {
    console.log('🔄 Executing company query...');
    const query = `
      SELECT DISTINCT c.compid,
             c.coname,
             (c.street_number || ' ' || c.town) AS address,
             COALESCE(pl_country.pltext, c.country) AS country_text,
             c.regnumber
      FROM company c
      LEFT JOIN pltab pl_country ON c.country = pl_country.plcode
          AND pl_country.PLCOLUMN = 'STCOUNTR'
          AND pl_country.pllang = $1
      WHERE UPPER(c.coname) ILIKE $2
      ORDER BY c.coname
      LIMIT $3 OFFSET $4
    `;
    const params = [lang, `%${q}%`, parseInt(limit), parseInt(offset)];
    
    console.log('Company query:', query);
    console.log('Company params:', params);
    
    const result = await pool.query(query, params);
    console.log('✅ Company completed:', result.rows.length, 'results');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Company error:', err.message);
    res.status(500).json({ error: 'Company error', details: err.message });
  }
});

module.exports = router;