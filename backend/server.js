const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

console.log('Starting server.js ...');
console.log('Server.js version 26 - Fixed all router paths to ./routes/');

try {
  // Load routers with try-catch and absolute path logging
  let drugsRouter, plRouter, spcRouter, companyRouter, pltabRouter, atcRouter, drdpRouter, pcpricelistRouter, loginRouter;

  // Εισαγωγή routers από ./routes/
  try {
    drugsRouter = require('./routes/drugs');
    console.log('drugsRouter loaded:', drugsRouter, 'from:', require.resolve('./routes/drugs'));
  } catch (err) {
    console.error('Error loading drugsRouter:', err.message, err.stack);
  }

  try {
    plRouter = require('./routes/pl');
    console.log('plRouter loaded:', plRouter, 'from:', require.resolve('./routes/pl'));
  } catch (err) {
    console.error('Error loading plRouter:', err.message, err.stack);
  }

  try {
    spcRouter = require('./routes/spc');
    console.log('spcRouter loaded:', spcRouter, 'from:', require.resolve('./routes/spc'));
  } catch (err) {
    console.error('Error loading spcRouter:', err.message, err.stack);
  }

  try {
    companyRouter = require('./routes/company');
    console.log('companyRouter loaded:', companyRouter, 'from:', require.resolve('./routes/company'));
  } catch (err) {
    console.error('Error loading companyRouter:', err.message, err.stack);
  }

  try {
    pltabRouter = require('./routes/pltab');
    console.log('pltabRouter loaded:', pltabRouter, 'from:', require.resolve('./routes/pltab'));
  } catch (err) {
    console.error('Error loading pltabRouter:', err.message, err.stack);
  }

  try {
    atcRouter = require('./routes/atc');
    console.log('atcRouter loaded:', atcRouter, 'from:', require.resolve('./routes/atc'));
  } catch (err) {
    console.error('Error loading atcRouter:', err.message, err.stack);
  }

  try {
    drdpRouter = require('./routes/drdp');
    console.log('drdpRouter loaded:', drdpRouter, 'from:', require.resolve('./routes/drdp'));
  } catch (err) {
    console.error('Error loading drdpRouter:', err.message, err.stack);
  }

  try {
    pcpricelistRouter = require('./routes/pcpricelist');
    console.log('pcpricelistRouter loaded:', pcpricelistRouter, 'from:', require.resolve('./routes/pcpricelist'));
  } catch (err) {
    console.error('Error loading pcpricelistRouter:', err.message, err.stack);
  }

  try {
    loginRouter = require('./routes/login');
    console.log('loginRouter loaded:', loginRouter, 'from:', require.resolve('./routes/login'));
  } catch (err) {
    console.error('Error loading loginRouter:', err.message, err.stack);
  }

  // Middleware για logging όλων των εισερχόμενων αιτημάτων
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] Incoming request: ${req.method} ${req.url}`);
    console.log('Request headers:', req.headers);
    console.log('Request query:', req.query);
    console.log('Request body:', req.body);
    console.log('Checking for route conflicts with:', req.url);
    next();
  });

  // CORS configuration
  app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
  }));

  app.use(express.json());

  // API routes με σειρά που αποτρέπει συγκρούσεις
  if (pltabRouter) {
    console.log('Registering /api/pltab route');
    app.use('/api/pltab', pltabRouter);
  } else {
    console.error('pltabRouter is not defined, skipping /api/pltab route');
  }

  if (atcRouter) {
    console.log('Registering /api/atc route');
    app.use('/api/atc', atcRouter);
  } else {
    console.error('atcRouter is not defined, skipping /api/atc route');
  }

  if (drugsRouter) {
    console.log('Registering /api/drugs route');
    app.use('/api/drugs', drugsRouter);
  } else {
    console.error('drugsRouter is not defined, skipping /api/drugs route');
  }

  if (plRouter) {
    console.log('Registering /api/pl route');
    app.use('/api/pl', plRouter);
  } else {
    console.error('plRouter is not defined, skipping /api/pl route');
  }

  if (spcRouter) {
    console.log('Registering /api/spc route');
    app.use('/api/spc', spcRouter);
  } else {
    console.error('spcRouter is not defined, skipping /api/spc route');
  }

  if (companyRouter) {
    console.log('Registering /api/company route');
    app.use('/api/company', companyRouter);
  } else {
    console.error('companyRouter is not defined, skipping /api/company route');
  }

  if (drdpRouter) {
    console.log('Registering /api/drdp route');
    app.use('/api/drdp', drdpRouter);
  } else {
    console.error('drdpRouter is not defined, skipping /api/drdp route');
  }

  if (pcpricelistRouter) {
    console.log('Registering /api/pcpricelist route');
    app.use('/api/pcpricelist', pcpricelistRouter);
  } else {
    console.error('pcpricelistRouter is not defined, skipping /api/pcpricelist route');
  }

  if (loginRouter) {
    console.log('Registering /api/login route');
    app.use('/api/login', loginRouter);
  } else {
    console.error('loginRouter is not defined, skipping /api/login route');
  }

  // Catch-all handler για unmatched routes
  app.use((req, res) => {
    console.log('Unmatched route:', req.originalUrl);
    res.status(404).json({ error: `Route ${req.originalUrl} not found` });
  });

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
} catch (err) {
  console.error('Failed to start server:', err.message, err.stack);
  process.exit(1);
}