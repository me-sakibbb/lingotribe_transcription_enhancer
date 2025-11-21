// example-backend.js
// Example Node.js + Express backend for user authorization
// This is a reference implementation - adapt to your needs

const express = require('express');
const cors = require('cors');
const app = express();

// Enable CORS for Chrome extension
app.use(cors({
    origin: '*', // In production, specify your extension ID
    methods: ['GET', 'POST']
}));

app.use(express.json());

// In-memory database (replace with real database in production)
const authorizedUsers = new Set([
    'user1@gmail.com',
    'user2@example.com',
    'admin@company.com'
]);

// Endpoint to get all authorized emails
app.get('/api/authorized-users', (req, res) => {
    // In production, add authentication to protect this endpoint
    res.json({
        emails: Array.from(authorizedUsers)
    });
});

// Endpoint to check if a specific email is authorized
app.post('/api/check-authorization', (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email required' });
    }

    const isAuthorized = authorizedUsers.has(email.toLowerCase());

    // Log the attempt
    console.log(`Authorization check for ${email}: ${isAuthorized}`);

    res.json({
        authorized: isAuthorized,
        email: email
    });
});

// Admin endpoint to add a user (protect with authentication in production)
app.post('/api/admin/add-user', (req, res) => {
    const { email, adminKey } = req.body;

    // Simple admin key check (use proper authentication in production)
    if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    authorizedUsers.add(email.toLowerCase());

    console.log(`Added user: ${email}`);

    res.json({
        success: true,
        message: `User ${email} added successfully`
    });
});

// Admin endpoint to remove a user
app.post('/api/admin/remove-user', (req, res) => {
    const { email, adminKey } = req.body;

    if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    const removed = authorizedUsers.delete(email.toLowerCase());

    if (removed) {
        console.log(`Removed user: ${email}`);
        res.json({
            success: true,
            message: `User ${email} removed successfully`
        });
    } else {
        res.status(404).json({
            error: 'User not found'
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Authorization server running on port ${PORT}`);
    console.log(`Authorized users: ${authorizedUsers.size}`);
});

// ============================================
// PRODUCTION IMPROVEMENTS:
// ============================================

// 1. Use a real database (PostgreSQL, MongoDB, etc.)
/*
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

app.post('/api/check-authorization', async (req, res) => {
  const { email } = req.body;
  const result = await pool.query(
    'SELECT * FROM authorized_users WHERE email = $1',
    [email.toLowerCase()]
  );
  res.json({ authorized: result.rows.length > 0 });
});
*/

// 2. Add rate limiting
/*
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);
*/

// 3. Add request logging
/*
const morgan = require('morgan');
app.use(morgan('combined'));
*/

// 4. Add API key authentication
/*
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
};
app.use('/api/', authenticateApiKey);
*/

// 5. Add HTTPS in production
/*
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

https.createServer(options, app).listen(443);
*/
