require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and parsing of JSON bodies
app.use(cors());
app.use(express.json());

// Initialize Postgres connection pool with Neon connection string
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('[Error] Neon database connection failed:', err);
  } else {
    console.log('[OK] Connected to Neon PostgreSQL database at:', res.rows[0].now);
  }
});

// API Endpoint to log sensor readings
app.post('/api/readings', async (req, res) => {
  try {
    const {
      pm1, pm25, pm4, pm10,
      nc05, nc1, nc25, nc4, nc10,
      tps, relay, mode, source
    } = req.body;

    // Validate request body
    if (pm25 === undefined || relay === undefined) {
      return res.status(400).json({ error: 'Missing required reading fields.' });
    }

    // Cast relay state to integer (0 or 1) to match DB schema constraints
    const relayVal = (relay === true || String(relay).toLowerCase() === 'true' || parseInt(relay) === 1) ? 1 : 0;

    const queryText = `
      INSERT INTO pm_readings (
        pm1, pm25, pm4, pm10,
        nc05, nc1, nc25, nc4, nc10,
        tps, relay, mode, source
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id, created_at;
    `;

    const values = [
      parseFloat(pm1) || 0, parseFloat(pm25) || 0, parseFloat(pm4) || 0, parseFloat(pm10) || 0,
      parseFloat(nc05) || 0, parseFloat(nc1) || 0, parseFloat(nc25) || 0, parseFloat(nc4) || 0, parseFloat(nc10) || 0,
      parseFloat(tps) || 0, relayVal, mode || 'auto', source || 'simulator'
    ];

    const result = await pool.query(queryText, values);
    res.status(201).json({
      success: true,
      message: 'Reading successfully stored in Neon.',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error logging reading:', err);
    res.status(500).json({ error: 'Database insertion error.' });
  }
});

// API Endpoint to fetch the last 100 historical readings for dashboard charting
app.get('/api/readings', async (req, res) => {
  try {
    const queryText = `
      SELECT * FROM (
        SELECT id, pm1, pm25, pm4, pm10, nc05, nc1, nc25, nc4, nc10, tps, relay, mode, source, created_at
        FROM pm_readings
        ORDER BY created_at DESC
        LIMIT 100
      ) sub
      ORDER BY created_at ASC;
    `;

    const result = await pool.query(queryText);
    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error('Error querying readings:', err);
    res.status(500).json({ error: 'Database query error.' });
  }
});

// Serve static assets from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Fallback to serving index.html for undefined routes
app.get('/*splat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[OK] AeroSpray server is running at http://localhost:${PORT}`);
    console.log(`[OK] Serving static files from: ${__dirname}`);
  });
}

module.exports = app;
