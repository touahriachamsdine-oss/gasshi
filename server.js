require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_mine_key';

// Enable CORS and parsing of JSON bodies
app.use(cors());
app.use(express.json());

// Initialize Postgres connection pool with Neon connection string
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Resiliency Fallback: Local file-based cache database
const DATA_CACHE_PATH = path.join(__dirname, 'data_cache.json');
let localData = { users: [], device_configs: [], readings: [], audit_logs: [] };

function loadLocalData() {
  try {
    if (fs.existsSync(DATA_CACHE_PATH)) {
      localData = JSON.parse(fs.readFileSync(DATA_CACHE_PATH, 'utf8'));
    }
  } catch (err) {
    console.error('Error loading data_cache.json:', err);
  }
}

function saveLocalData() {
  try {
    fs.writeFileSync(DATA_CACHE_PATH, JSON.stringify(localData, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving data_cache.json:', err);
  }
}

// Load data cache initially
loadLocalData();

// Database Query Wrapper with Offline Fallback
async function safeQuery(queryText, values = []) {
  try {
    return await pool.query(queryText, values);
  } catch (err) {
    console.warn('[Warning] Neon Database connection failure. Using offline-first local storage cache. Error:', err.message);
    
    // 1. SELECT * FROM users WHERE username = $1
    if (queryText.includes('FROM users') && queryText.includes('username = $1')) {
      const user = localData.users.find(u => u.username === values[0]);
      return { rows: user ? [user] : [] };
    }
    
    // 2. INSERT INTO users (username, password_hash, role)
    if (queryText.includes('INSERT INTO users')) {
      const exists = localData.users.some(u => u.username === values[0]);
      if (exists) {
        throw new Error('duplicate key value violates unique constraint "users_username_key"');
      }
      const newUser = {
        id: localData.users.length + 1,
        username: values[0],
        password_hash: values[1],
        role: values[2],
        created_at: new Date().toISOString()
      };
      localData.users.push(newUser);
      saveLocalData();
      return { rows: [newUser] };
    }

    // 3. SELECT * FROM device_configs
    if (queryText.includes('FROM device_configs')) {
      return { rows: localData.device_configs };
    }

    // 4. INSERT INTO device_configs (key, value) ... ON CONFLICT
    if (queryText.includes('INSERT INTO device_configs') || queryText.includes('UPDATE device_configs')) {
      const key = values[0];
      const value = values[1];
      const idx = localData.device_configs.findIndex(c => c.key === key);
      if (idx !== -1) {
        localData.device_configs[idx].value = String(value);
      } else {
        localData.device_configs.push({ key, value: String(value) });
      }
      saveLocalData();
      return { rows: [{ key, value }] };
    }

    // 5. INSERT INTO pm_readings
    if (queryText.includes('INSERT INTO pm_readings')) {
      const newReading = {
        id: localData.readings.length + 1,
        pm1: values[0], pm25: values[1], pm4: values[2], pm10: values[3],
        nc05: values[4], nc1: values[5], nc25: values[6], nc4: values[7], nc10: values[8],
        tps: values[9], relay: values[10], mode: values[11], source: values[12],
        created_at: new Date().toISOString()
      };
      localData.readings.push(newReading);
      if (localData.readings.length > 200) localData.readings.shift(); // Keep latest 200 locally
      saveLocalData();
      return { rows: [newReading] };
    }

    // 6. SELECT * FROM pm_readings
    if (queryText.includes('FROM pm_readings')) {
      const sorted = [...localData.readings].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      return { rows: sorted };
    }

    // 7. INSERT INTO audit_logs (user_id, username, action, details, ip_address)
    if (queryText.includes('INSERT INTO audit_logs')) {
      const newLog = {
        id: localData.audit_logs.length + 1,
        user_id: values[0],
        username: values[1],
        action: values[2],
        details: typeof values[3] === 'string' ? JSON.parse(values[3]) : values[3],
        ip_address: values[4],
        created_at: values[5] || new Date().toISOString()
      };
      localData.audit_logs.push(newLog);
      saveLocalData();
      return { rows: [newLog] };
    }

    // 8. SELECT * FROM audit_logs
    if (queryText.includes('FROM audit_logs')) {
      return { rows: [...localData.audit_logs].reverse() };
    }

    throw err;
  }
}

// Test database connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('[Error] Neon database connection failed on startup. Server running in offline-first mode.');
  } else {
    console.log('[OK] Connected to Neon PostgreSQL database at:', res.rows[0].now);
  }
});

// Authentication and Authorization Middlewares
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }
    req.user = user;
    next();
  });
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges.' });
    }
    next();
  };
}

// Security Audit Event Logger
async function logSecurityEvent(userId, username, action, details = {}, req = null) {
  try {
    const ip = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress) : '127.0.0.1';
    
    // Retrieve previous hash signature to enforce hash chaining
    let previousHash = '0';
    const lastLogs = await safeQuery('SELECT details FROM audit_logs ORDER BY id DESC LIMIT 1');
    if (lastLogs.rows.length > 0) {
      const lastDetails = typeof lastLogs.rows[0].details === 'string' 
        ? JSON.parse(lastLogs.rows[0].details) 
        : lastLogs.rows[0].details;
      if (lastDetails && lastDetails.hash) {
        previousHash = lastDetails.hash;
      }
    }

    const payload = {
      action,
      username,
      details,
      timestamp: new Date().toISOString()
    };

    // Construct tamper-evident cryptographic SHA256 chain signature
    const chainPayload = previousHash + JSON.stringify(payload);
    const hash = crypto.createHash('sha256').update(chainPayload).digest('hex');
    
    const finalDetails = {
      ...payload,
      hash,
      previous_hash: previousHash
    };

    await safeQuery(
      `INSERT INTO audit_logs (user_id, username, action, details, ip_address) 
       VALUES ($1, $2, $3, $4, $5)`,
      [userId || null, username, action, JSON.stringify(finalDetails), ip]
    );
  } catch (err) {
    console.error('Audit logger failed:', err.message);
  }
}

// Authentication APIs
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password || !role) {
      return res.status(400).json({ error: 'All fields (username, password, role) are required.' });
    }

    const validRoles = ['operator', 'engineer', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role configuration.' });
    }

    // Require admin token for creating subsequent users unless database is empty (bootstrap phase)
    let requireAdmin = false;
    const usersCount = await safeQuery('SELECT id FROM users LIMIT 1');
    if (usersCount.rows.length > 0) {
      requireAdmin = true;
    }

    if (requireAdmin) {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: 'Administrator authorization token required to register users.' });
      }
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') {
          return res.status(403).json({ error: 'Only administrators can register new accounts.' });
        }
      } catch (err) {
        return res.status(403).json({ error: 'Invalid administrator token.' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const passwordSha256 = crypto.createHash('sha256').update(password).digest('hex');

    const result = await safeQuery(
      'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role',
      [username, passwordHash, role]
    );

    const localUser = localData.users.find(u => u.username === username);
    if (localUser) {
      localUser.password_sha256 = passwordSha256;
      saveLocalData();
    }

    await logSecurityEvent(
      result.rows[0].id,
      username,
      'user_registered',
      { role },
      req
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Registration failed:', err);
    if (err.message.includes('unique constraint')) {
      return res.status(400).json({ error: 'Username already exists.' });
    }
    res.status(500).json({ error: 'Failed to create user account.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const userRes = await safeQuery('SELECT * FROM users WHERE username = $1', [username]);
    if (userRes.rows.length === 0) {
      await logSecurityEvent(null, username, 'login_failed_user_not_found', {}, req);
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const user = userRes.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      await logSecurityEvent(user.id, username, 'login_failed_wrong_password', {}, req);
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Sign cryptographic JWT token with role claims
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    await logSecurityEvent(user.id, user.username, 'login_success', {}, req);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server login handler error.' });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    }
  });
});

// Device Credential Sync Endpoint (X-Device-Token protected)
app.get('/api/auth/device-sync-users', (req, res) => {
  const deviceToken = req.headers['x-device-token'];
  if (!deviceToken || deviceToken !== JWT_SECRET) {
    return res.status(401).json({ error: 'Unauthorized device access.' });
  }

  const syncedUsers = localData.users.map(u => {
    let passwordSha256 = u.password_sha256;
    if (!passwordSha256) {
      if (u.username === 'admin') passwordSha256 = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';
      else if (u.username === 'engineer') passwordSha256 = '80ca306ac6e68366dd0a26125c9647e0c61fac6668cec6016f5fe30fb12e99bd';
      else if (u.username === 'operator') passwordSha256 = 'ec6e1c25258002eb1c67d15c7f45da7945fa4c58778fd7d88faa5e53e3b4698d';
      else {
        passwordSha256 = crypto.createHash('sha256').update(u.username + '123').digest('hex');
      }
    }
    return {
      username: u.username,
      role: u.role,
      password_sha256: passwordSha256
    };
  });

  res.json({ success: true, users: syncedUsers });
});

// Device Offline Audit Log Sync Endpoint (X-Device-Token protected)
app.post('/api/auth/sync-audit-logs', async (req, res) => {
  const deviceToken = req.headers['x-device-token'];
  if (!deviceToken || deviceToken !== JWT_SECRET) {
    return res.status(401).json({ error: 'Unauthorized device access.' });
  }

  const { logs } = req.body;
  if (!Array.isArray(logs)) {
    return res.status(400).json({ error: 'Invalid logs format. Expected an array.' });
  }

  try {
    for (const log of logs) {
      const { username, action, details, ip_address, created_at } = log;
      
      // Get the last log's hash to maintain cryptographic chain continuity
      let previousHash = '0';
      const lastLogs = await safeQuery('SELECT details FROM audit_logs ORDER BY id DESC LIMIT 1');
      if (lastLogs.rows.length > 0) {
        const lastDetails = typeof lastLogs.rows[0].details === 'string'
          ? JSON.parse(lastLogs.rows[0].details)
          : lastLogs.rows[0].details;
        if (lastDetails && lastDetails.hash) {
          previousHash = lastDetails.hash;
        }
      }

      const payload = {
        action: action || 'offline_action',
        username: username || 'unknown',
        details: details || {},
        timestamp: created_at || new Date().toISOString()
      };

      // Add a flag to details showing it was synced from offline cache
      payload.details.offline_synced = true;

      // Construct tamper-evident cryptographic SHA256 chain signature
      const chainPayload = previousHash + JSON.stringify(payload);
      const hash = crypto.createHash('sha256').update(chainPayload).digest('hex');

      const finalDetails = {
        ...payload,
        hash,
        previous_hash: previousHash
      };

      // Find user id if possible
      let userId = null;
      const userRes = await safeQuery('SELECT id FROM users WHERE username = $1', [username]);
      if (userRes.rows.length > 0) {
        userId = userRes.rows[0].id;
      }

      await safeQuery(
        `INSERT INTO audit_logs (user_id, username, action, details, ip_address, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, username || 'unknown', action || 'offline_action', JSON.stringify(finalDetails), ip_address || '127.0.0.1', created_at || new Date().toISOString()]
      );
    }

    res.json({ success: true, message: `Successfully synced ${logs.length} offline audit logs.` });
  } catch (err) {
    console.error('Offline log sync failed:', err);
    res.status(500).json({ error: 'Failed to sync offline audit logs.' });
  }
});

// Secure Configuration Management APIs
app.get('/api/config', async (req, res) => {
  try {
    const configRes = await safeQuery('SELECT * FROM device_configs');
    // Map list of config rows to simple key-value pairs
    const configs = {};
    configRes.rows.forEach(row => {
      configs[row.key] = row.value;
    });
    res.json({ success: true, configs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve device configurations.' });
  }
});

app.post('/api/config', authenticateToken, requireRole(['engineer', 'admin']), async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key || value === undefined) {
      return res.status(400).json({ error: 'Configuration key and value are required.' });
    }

    const query = `
      INSERT INTO device_configs (key, value, updated_at) 
      VALUES ($1, $2, CURRENT_TIMESTAMP) 
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;
    `;
    await safeQuery(query, [key, String(value)]);

    await logSecurityEvent(
      req.user.id,
      req.user.username,
      'config_updated',
      { config_key: key, config_value: value },
      req
    );

    res.json({
      success: true,
      message: `Configuration ${key} successfully updated.`
    });
  } catch (err) {
    console.error('Config update failed:', err);
    res.status(500).json({ error: 'Failed to store device configurations.' });
  }
});

// Secure Audit Log Trail Retrieval (Admin Only)
app.get('/api/auth/audit-logs', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const auditRes = await safeQuery('SELECT * FROM audit_logs ORDER BY id DESC');
    
    // Validate the cryptographic integrity of the audit logs chain
    let isValid = true;
    let computedNextHash = '';
    const logs = auditRes.rows.map(row => {
      const details = typeof row.details === 'string' ? JSON.parse(row.details) : row.details;
      return {
        id: row.id,
        user_id: row.user_id,
        username: row.username,
        action: row.action,
        ip_address: row.ip_address,
        created_at: row.created_at,
        details
      };
    });

    // Verification traverses sequentially from oldest log (end of array) to newest (front of array)
    const reversedLogs = [...logs].reverse();
    for (let i = 0; i < reversedLogs.length; i++) {
      const log = reversedLogs[i];
      const details = log.details;
      const expectedPrevHash = i === 0 ? '0' : reversedLogs[i-1].details.hash;

      if (!details || !details.hash || details.previous_hash !== expectedPrevHash) {
        isValid = false;
        break;
      }

      // Re-verify the SHA256 signature
      const payload = {
        action: log.action,
        username: log.username,
        details: details.details,
        timestamp: details.timestamp
      };

      const chainPayload = expectedPrevHash + JSON.stringify(payload);
      const recomputedHash = crypto.createHash('sha256').update(chainPayload).digest('hex');

      if (recomputedHash !== details.hash) {
        isValid = false;
        break;
      }
    }

    res.json({
      success: true,
      logs,
      isChainValid: isValid
    });
  } catch (err) {
    console.error('Audit fetch error:', err);
    res.status(500).json({ error: 'Failed to retrieve audit log data.' });
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

    if (pm25 === undefined || relay === undefined) {
      return res.status(400).json({ error: 'Missing required reading fields.' });
    }

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

    const result = await safeQuery(queryText, values);
    res.status(201).json({
      success: true,
      message: 'Reading successfully stored.',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error logging reading:', err);
    res.status(500).json({ error: 'Database insertion error.' });
  }
});

// API Endpoint to fetch historical readings for chart
app.get('/api/readings', authenticateToken, async (req, res) => {
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

    const result = await safeQuery(queryText);
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
  });
}

module.exports = app;

