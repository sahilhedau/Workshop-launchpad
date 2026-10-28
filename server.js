/**
 * Workshop Launchpad Server
 * Lightweight zero-dependency HTTP server & REST API
 * Supports NxtWave Growth Challenge campaign tracking & attribution
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';
const DATA_FILE = path.join(__dirname, 'data', 'campaign-store.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

// MIME types for static asset serving
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

// In-memory state cache
let stateCache = null;

// Helper: load state from JSON file or fall back to defaults
function loadState() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      stateCache = JSON.parse(raw);
      return stateCache;
    }
  } catch (err) {
    console.error('Error reading campaign-store.json, creating fallback:', err.message);
  }

  // Fallback default state
  stateCache = {
    version: 2,
    lastUpdated: new Date().toISOString(),
    meta: {
      workshopName: "Build Your First AI Project in 60 Minutes",
      goal: 500,
      totalDays: 7,
      budget: 2000,
      dailyTargets: [40, 120, 210, 300, 390, 450, 500],
      channels: {
        wa: "WhatsApp Groups (Connectors)",
        club: "Clubs & Communities",
        ref: "Student Referrals",
        paid: "Paid Test (Contingency)"
      }
    },
    day: 4,
    daily: [36, 68, 85, 73, 0, 0, 0],
    links: [],
    recentRegistrations: []
  };
  saveState();
  return stateCache;
}

// Helper: persist state to disk
function saveState() {
  try {
    if (!stateCache) return;
    stateCache.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DATA_FILE, JSON.stringify(stateCache, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving state:', err.message);
  }
}

// Collision-resistant code generator
function generateCode(label, channel) {
  const cleanLabel = (label.replace(/[^a-zA-Z]/g, '').toUpperCase() + 'XXX').slice(0, 3);
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous chars 0, 1, I, O
  let suffix = '';
  for (let i = 0; i < 3; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${cleanLabel}-${suffix}`;
}

// Ensure code uniqueness
function getUniqueCode(label, channel) {
  let code = generateCode(label, channel);
  const existing = new Set(stateCache.links.map(l => l.c));
  let attempts = 0;
  while (existing.has(code) && attempts < 100) {
    code = generateCode(label, channel);
    attempts++;
  }
  return code;
}

// Helper: send JSON response with standard CORS headers
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  });
  res.end(JSON.stringify(data));
}

// Helper: parse request body JSON
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) { // 1MB limit
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });
  });
}

// Create HTTP Server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    });
    return res.end();
  }

  // Initialize state if not cached
  if (!stateCache) loadState();

  // ==========================================
  // API ROUTING
  // ==========================================

  // GET /api/health
  if (req.method === 'GET' && pathname === '/api/health') {
    return sendJson(res, 200, {
      status: 'ok',
      service: 'Workshop Launchpad API',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  }

  // GET /api/state - Full campaign state
  if (req.method === 'GET' && pathname === '/api/state') {
    return sendJson(res, 200, stateCache);
  }

  // POST /api/links - Create new referral link
  if (req.method === 'POST' && pathname === '/api/links') {
    try {
      const body = await parseJsonBody(req);
      const label = (body.label || '').trim();
      const channel = body.channel || 'wa';
      const college = (body.college || '').trim();
      const targetUrl = (body.targetUrl || '').trim() || 'http://localhost:3000/register.html';

      if (!label) {
        return sendJson(res, 400, { error: 'Label (who is sharing) is required' });
      }

      const validChannels = ['wa', 'club', 'ref', 'paid'];
      const ch = validChannels.includes(channel) ? channel : 'wa';

      const code = getUniqueCode(label, ch);
      const newLink = {
        c: code,
        l: label,
        ch: ch,
        k: college || 'General / Unspecified',
        clicks: 0,
        n: 0,
        createdAt: new Date().toISOString()
      };

      stateCache.links.unshift(newLink);
      saveState();

      // Build tracked URL
      const sep = targetUrl.includes('?') ? '&' : '?';
      const trackedUrl = `${targetUrl}${sep}ref=${encodeURIComponent(code)}&src=${encodeURIComponent(ch)}`;

      return sendJson(res, 201, {
        success: true,
        link: newLink,
        trackedUrl,
        code
      });
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
  }

  // POST /api/click - Track referral link click (separate from registration)
  if (req.method === 'POST' && pathname === '/api/click') {
    try {
      const body = await parseJsonBody(req);
      const code = (body.code || '').trim().toUpperCase();

      const link = stateCache.links.find(l => l.c === code);
      if (link) {
        link.clicks = (link.clicks || 0) + 1;
        saveState();
        return sendJson(res, 200, { success: true, code, clicks: link.clicks });
      } else {
        return sendJson(res, 404, { error: 'Referral code not found' });
      }
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
  }

  // POST /api/register - Record completed registration with attribution
  if (req.method === 'POST' && pathname === '/api/register') {
    try {
      const body = await parseJsonBody(req);
      const code = (body.code || '').trim().toUpperCase();
      const studentName = (body.studentName || 'Student').trim();
      const college = (body.college || '').trim();
      const branch = (body.branch || '').trim();

      // Find referral link
      const link = stateCache.links.find(l => l.c === code);
      const channel = link ? link.ch : (body.src || 'direct');
      const connectorName = link ? link.l : 'Direct Registration';

      // Increment link registration counter if attributed
      if (link) {
        link.n = (link.n || 0) + 1;
      }

      // Increment active day registrations
      const currentDay = Math.min(Math.max(1, stateCache.day || 1), 7);
      while (stateCache.daily.length < 7) {
        stateCache.daily.push(0);
      }
      stateCache.daily[currentDay - 1] = (stateCache.daily[currentDay - 1] || 0) + 1;

      // Log registration entry with privacy protection (anonymized initials)
      const regId = 'REG-' + Math.floor(1000 + Math.random() * 9000);
      const initials = studentName.split(' ').map(p => p[0]).join('.').toUpperCase();
      const entry = {
        id: regId,
        code: code || 'DIRECT',
        connector: connectorName,
        channel: channel,
        college: college || (link ? link.k : 'Unspecified'),
        branch: branch || 'B.Tech Final Year',
        studentInitials: initials,
        timestamp: new Date().toISOString()
      };

      if (!stateCache.recentRegistrations) stateCache.recentRegistrations = [];
      stateCache.recentRegistrations.unshift(entry);
      if (stateCache.recentRegistrations.length > 50) {
        stateCache.recentRegistrations.pop();
      }

      saveState();

      const totalRegistrations = stateCache.daily.reduce((a, b) => a + b, 0);

      return sendJson(res, 201, {
        success: true,
        registrationId: regId,
        attributedCode: code,
        attributedChannel: channel,
        totalRegistrations,
        currentDayRegistrations: stateCache.daily[currentDay - 1]
      });
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
  }

  // POST /api/simulate - Quick simulated bump (+1 or +10) for demo
  if (req.method === 'POST' && pathname === '/api/simulate') {
    try {
      const body = await parseJsonBody(req);
      const code = (body.code || '').trim().toUpperCase();
      const delta = parseInt(body.delta, 10) || 1;

      const link = stateCache.links.find(l => l.c === code);
      if (!link) {
        return sendJson(res, 404, { error: 'Referral code not found' });
      }

      // Add registrations
      link.n = Math.max(0, (link.n || 0) + delta);
      // Also add simulated clicks proportionally (e.g. 5x clicks to registrations)
      link.clicks = Math.max(link.n, (link.clicks || 0) + delta * 5);

      const d = Math.min(Math.max(1, stateCache.day || 1), 7);
      while (stateCache.daily.length < 7) stateCache.daily.push(0);
      stateCache.daily[d - 1] = Math.max(0, (stateCache.daily[d - 1] || 0) + delta);

      // Add recent log entry
      if (delta > 0) {
        stateCache.recentRegistrations.unshift({
          id: 'SIM-' + Math.floor(1000 + Math.random() * 9000),
          code: link.c,
          connector: link.l,
          channel: link.ch,
          college: link.k,
          branch: 'B.Tech Final Year',
          timestamp: new Date().toISOString(),
          simulatedBatch: delta > 1 ? `+${delta} batch` : false
        });
        if (stateCache.recentRegistrations.length > 50) stateCache.recentRegistrations.pop();
      }

      saveState();
      return sendJson(res, 200, { success: true, link, daily: stateCache.daily });
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
  }

  // POST /api/day - Set current evaluation day (non-destructive!)
  if (req.method === 'POST' && pathname === '/api/day') {
    try {
      const body = await parseJsonBody(req);
      const newDay = parseInt(body.day, 10);
      if (isNaN(newDay) || newDay < 1 || newDay > 7) {
        return sendJson(res, 400, { error: 'Day must be an integer between 1 and 7' });
      }

      stateCache.day = newDay;
      while (stateCache.daily.length < 7) stateCache.daily.push(0);
      saveState();

      return sendJson(res, 200, { success: true, day: stateCache.day, daily: stateCache.daily });
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
  }

  // POST /api/reset - Reset to predefined demo scenarios
  if (req.method === 'POST' && pathname === '/api/reset') {
    try {
      const body = await parseJsonBody(req);
      const scenario = body.scenario || 'default';

      if (scenario === 'on_track') {
        // Day 4 On Track (312 registrations vs 300 target)
        stateCache.day = 4;
        stateCache.daily = [45, 80, 95, 92, 0, 0, 0];
        stateCache.links = [
          { c: "ADI-7KQ", l: "Aditi Sharma (Campus Connector)", ch: "wa", k: "VNR VJIET", clicks: 380, n: 64, createdAt: new Date().toISOString() },
          { c: "CHE-9PL", l: "Chetan Verma (Campus Connector)", ch: "wa", k: "Gokaraju Rangaraju IT", clicks: 340, n: 55, createdAt: new Date().toISOString() },
          { c: "BHA-3MX", l: "Bhavna Patel (Campus Connector)", ch: "wa", k: "CBIT Hyderabad", clicks: 310, n: 50, createdAt: new Date().toISOString() },
          { c: "COD-2RT", l: "CSE Coding Club", ch: "club", k: "VNR VJIET", clicks: 280, n: 46, createdAt: new Date().toISOString() },
          { c: "GDS-8WN", l: "GDSC Student Chapter", ch: "club", k: "Vasavi Engg", clicks: 250, n: 40, createdAt: new Date().toISOString() },
          { c: "STU-4ZA", l: "Karthik Reddy (Peer Advocate)", ch: "ref", k: "CBIT Hyderabad", clicks: 140, n: 25, createdAt: new Date().toISOString() },
          { c: "STU-6HB", l: "Sneha Kulkarni (Peer Advocate)", ch: "ref", k: "Gokaraju Rangaraju IT", clicks: 110, n: 20, createdAt: new Date().toISOString() },
          { c: "STU-5DC", l: "Rahul Nair (Peer Advocate)", ch: "ref", k: "VNR VJIET", clicks: 75, n: 12, createdAt: new Date().toISOString() }
        ];
      } else if (scenario === 'behind') {
        // Day 4 Behind Pace (220 registrations vs 300 target -> triggers fallback!)
        stateCache.day = 4;
        stateCache.daily = [30, 55, 65, 70, 0, 0, 0];
        stateCache.links = [
          { c: "ADI-7KQ", l: "Aditi Sharma (Campus Connector)", ch: "wa", k: "VNR VJIET", clicks: 280, n: 44, createdAt: new Date().toISOString() },
          { c: "CHE-9PL", l: "Chetan Verma (Campus Connector)", ch: "wa", k: "Gokaraju Rangaraju IT", clicks: 240, n: 38, createdAt: new Date().toISOString() },
          { c: "BHA-3MX", l: "Bhavna Patel (Campus Connector)", ch: "wa", k: "CBIT Hyderabad", clicks: 220, n: 35, createdAt: new Date().toISOString() },
          { c: "COD-2RT", l: "CSE Coding Club", ch: "club", k: "VNR VJIET", clicks: 190, n: 32, createdAt: new Date().toISOString() },
          { c: "GDS-8WN", l: "GDSC Student Chapter", ch: "club", k: "Vasavi Engg", clicks: 170, n: 28, createdAt: new Date().toISOString() },
          { c: "STU-4ZA", l: "Karthik Reddy (Peer Advocate)", ch: "ref", k: "CBIT Hyderabad", clicks: 90, n: 18, createdAt: new Date().toISOString() },
          { c: "STU-6HB", l: "Sneha Kulkarni (Peer Advocate)", ch: "ref", k: "Gokaraju Rangaraju IT", clicks: 80, n: 14, createdAt: new Date().toISOString() },
          { c: "STU-5DC", l: "Rahul Nair (Peer Advocate)", ch: "ref", k: "VNR VJIET", clicks: 60, n: 11, createdAt: new Date().toISOString() }
        ];
      } else {
        // Standard Day 4 Base Demonstration (262 registrations vs 300 target)
        stateCache.day = 4;
        stateCache.daily = [36, 68, 85, 73, 0, 0, 0];
        stateCache.links = [
          { c: "ADI-7KQ", l: "Aditi Sharma (Campus Connector)", ch: "wa", k: "VNR VJIET Hyderabad", clicks: 325, n: 52, createdAt: new Date().toISOString() },
          { c: "CHE-9PL", l: "Chetan Verma (Campus Connector)", ch: "wa", k: "Gokaraju Rangaraju IT", clicks: 280, n: 45, createdAt: new Date().toISOString() },
          { c: "BHA-3MX", l: "Bhavna Patel (Campus Connector)", ch: "wa", k: "CBIT Hyderabad", clicks: 260, n: 41, createdAt: new Date().toISOString() },
          { c: "COD-2RT", l: "CSE Coding Club & AI Circle", ch: "club", k: "VNR VJIET Hyderabad", clicks: 240, n: 38, createdAt: new Date().toISOString() },
          { c: "GDS-8WN", l: "Google Developer Student Club", ch: "club", k: "Vasavi College of Engg", clicks: 210, n: 32, createdAt: new Date().toISOString() },
          { c: "STU-4ZA", l: "Karthik Reddy (Peer Advocate)", ch: "ref", k: "CBIT Hyderabad", clicks: 120, n: 21, createdAt: new Date().toISOString() },
          { c: "STU-6HB", l: "Sneha Kulkarni (Peer Advocate)", ch: "ref", k: "Gokaraju Rangaraju IT", clicks: 95, n: 18, createdAt: new Date().toISOString() },
          { c: "STU-5DC", l: "Rahul Nair (Peer Advocate)", ch: "ref", k: "VNR VJIET Hyderabad", clicks: 80, n: 15, createdAt: new Date().toISOString() }
        ];
      }

      stateCache.recentRegistrations = [
        { id: "REG-1049", code: "ADI-7KQ", connector: "Aditi Sharma", channel: "wa", college: "VNR VJIET", branch: "CSE Final Year", timestamp: new Date().toISOString() },
        { id: "REG-1048", code: "COD-2RT", connector: "CSE Coding Club", channel: "club", college: "VNR VJIET", branch: "IT Final Year", timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: "REG-1047", code: "STU-4ZA", connector: "Karthik Reddy", channel: "ref", college: "CBIT", branch: "ECE Final Year", timestamp: new Date(Date.now() - 7200000).toISOString() }
      ];

      saveState();
      return sendJson(res, 200, { success: true, scenario, state: stateCache });
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
  }

  // GET /api/export - CSV export of links and metrics
  if (req.method === 'GET' && pathname === '/api/export') {
    const csvHeader = 'Code,Label,Channel,College,Clicks,Registrations,ConversionRate\n';
    const csvRows = stateCache.links.map(l => {
      const cr = l.clicks ? ((l.n / l.clicks) * 100).toFixed(1) + '%' : '0.0%';
      const cleanLabel = `"${(l.l || '').replace(/"/g, '""')}"`;
      const cleanCollege = `"${(l.k || '').replace(/"/g, '""')}"`;
      return `${l.c},${cleanLabel},${l.ch},${cleanCollege},${l.clicks || 0},${l.n || 0},${cr}`;
    }).join('\n');

    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="workshop-launchpad-export.csv"'
    });
    return res.end(csvHeader + csvRows);
  }

  // ==========================================
  // STATIC FILE SERVING
  // ==========================================

  // Map URL paths to filesystem paths in public directory
  let filePath = '';
  if (pathname === '/' || pathname === '/index.html') {
    filePath = path.join(PUBLIC_DIR, 'index.html');
  } else if (pathname === '/register' || pathname === '/register.html') {
    filePath = path.join(PUBLIC_DIR, 'register.html');
  } else {
    // Sanitize path to prevent directory traversal
    const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
    filePath = path.join(PUBLIC_DIR, safePath);
  }

  // Check if file exists
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(`
        <!DOCTYPE html>
        <html>
        <head><title>404 - Not Found | Workshop Launchpad</title><style>body{font-family:system-ui;padding:40px;background:#0f172a;color:#f8fafc;text-align:center}a{color:#818cf8}</style></head>
        <body>
          <h1>404 - Page Not Found</h1>
          <p>The requested path <code>${pathname}</code> was not found.</p>
          <p><a href="/">Return to Workshop Launchpad Dashboard</a></p>
        </body>
        </html>
      `);
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

// Start listening
server.listen(PORT, HOST, () => {
  console.log(`====================================================`);
  console.log(`🚀 Workshop Launchpad v2.0 - Running on http://${HOST}:${PORT}`);
  console.log(`📊 Dashboard & Studio:  http://${HOST}:${PORT}/`);
  console.log(`📝 Student Reg Demo:    http://${HOST}:${PORT}/register.html?ref=ADI-7KQ&src=wa`);
  console.log(`🔌 REST API State:     http://${HOST}:${PORT}/api/state`);
  console.log(`💾 Data Store:          ${DATA_FILE}`);
  console.log(`====================================================`);
});
