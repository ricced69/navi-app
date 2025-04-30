const express = require('express');
const path = require('path');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const bcrypt = require('bcrypt');
const db = require('./database'); // Use new PG export { pool, initializeSchema, query }
const { Pool } = require('pg');
const crypto = require('crypto'); // Need crypto for token generation

const app = express();
const PORT = process.env.PORT || 3000; // Use environment variable or default to 3000
const SALT_ROUNDS = 10; // For bcrypt password hashing

// --- Middleware ---

// 1. Body Parser for JSON requests
app.use(express.json());

// 2. Session Middleware (Using PostgreSQL Store)
app.use(session({
    store: new PgSession({
        pool : db.pool, // Use the exported pool
        tableName : 'session' // Matches table created in initializeSchema
        // createtable : false // We explicitly create table in initializeSchema
    }),
    secret: process.env.SESSION_SECRET || 'fallback-secret-dev-pg', // Use env variable!
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7 // Cookie valid for 7 days
        // secure: process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV, // Enable secure cookies only on Vercel/Prod
        // httpOnly: true
    }
}));

// 3. Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// --- Routes ---

// Basic route for the homepage (handled by static middleware)
// We might add logic here later to check if user is logged in

// Signup Route
app.post('/api/signup', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        // Check if user already exists
        const userCheck = await db.query('SELECT email FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ message: 'Email already exists.' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        // Insert new user
        const insertResult = await db.query(
            'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
            [email, passwordHash]
        );
        const newUserId = insertResult.rows[0].id;

        // Auto login
        req.session.userId = newUserId;
        req.session.email = email;
        console.log(`User ${email} signed up and logged in with ID: ${newUserId}`);
        res.status(201).json({ message: 'Signup successful!', userId: newUserId, email: email });
    } catch (error) {
        console.error("Signup Process Error:", error);
        res.status(500).json({ message: 'Internal server error during signup.' });
    }
});

// Login Route
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // Compare password
        const match = await bcrypt.compare(password, user.password_hash);

        if (match) {
            req.session.userId = user.id;
            req.session.email = user.email;
            console.log(`User ${user.email} logged in with ID: ${user.id}`);
            res.status(200).json({ message: 'Login successful!', userId: user.id, email: user.email });
        } else {
            res.status(401).json({ message: 'Invalid email or password.' });
        }
    } catch (error) {
        console.error("Login Process Error:", error);
        res.status(500).json({ message: 'Internal server error during login.' });
    }
});

// Logout Route
app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error("Logout Error:", err);
            return res.status(500).json({ message: 'Could not log out, please try again.' });
        }
        res.clearCookie('connect.sid'); // Clear the session cookie
        console.log('User logged out');
        res.status(200).json({ message: 'Logout successful.' });
    });
});

// Check Login Status Route
app.get('/api/user/status', (req, res) => {
    if (req.session.userId) {
        res.json({ loggedIn: true, email: req.session.email, userId: req.session.userId });
    } else {
        res.json({ loggedIn: false });
    }
});

// --- Business Routes ---

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        next(); // User is logged in, proceed to the route handler
    } else {
        res.status(401).json({ message: 'Unauthorized: Please log in.' });
    }
}

// Get All Businesses (requires login)
app.get('/api/businesses', isAuthenticated, async (req, res) => {
    try {
        const result = await db.query("SELECT id, name, description, address FROM businesses ORDER BY name");
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching businesses:", error);
        res.status(500).json({ message: "Error retrieving businesses from database." });
    }
});

// Earn Points at a Business (requires login)
app.post('/api/businesses/:businessId/earn', isAuthenticated, async (req, res) => {
    const userId = req.session.userId;
    const businessId = parseInt(req.params.businessId, 10);
    const pointsToAward = 10;
    const rateLimitHours = 24; // Limit to once per 24 hours per business
    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Check rate limit: Has user earned points at this business recently?
        const rateLimitCheckSql = `
            SELECT timestamp FROM earnings_log 
            WHERE user_id = $1 AND business_id = $2 
            ORDER BY timestamp DESC 
            LIMIT 1
        `;
        const lastEarningResult = await client.query(rateLimitCheckSql, [userId, businessId]);
        
        if (lastEarningResult.rows.length > 0) {
            const lastEarningTime = new Date(lastEarningResult.rows[0].timestamp);
            const timeLimit = new Date(Date.now() - rateLimitHours * 60 * 60 * 1000);
            if (lastEarningTime > timeLimit) {
                 await client.query('ROLLBACK');
                 console.log(`Rate limit hit for user ${userId} at business ${businessId}`);
                 return res.status(429).json({ message: `Rate limit: You can earn points here again in ${rateLimitHours} hours.` });
            }
        }

        // 2. Update user points balance
        const updateResult = await client.query(
            `UPDATE users SET points_balance = points_balance + $1 WHERE id = $2 RETURNING points_balance`,
            [pointsToAward, userId]
        );
        if (updateResult.rowCount === 0) {
            throw new Error("User not found during point update."); // Should be caught by transaction rollback
        }
        const newBalance = updateResult.rows[0].points_balance;

        // 3. Log the earning event
        const logSql = `
            INSERT INTO earnings_log (user_id, business_id, points_earned) 
            VALUES ($1, $2, $3)
        `;
        await client.query(logSql, [userId, businessId, pointsToAward]);

        // 4. Commit transaction
        await client.query('COMMIT');

        // 5. Success
        console.log(`User ${userId} earned ${pointsToAward} points at business ${businessId}. New balance: ${newBalance}`);
        res.status(200).json({ 
            message: `Successfully earned ${pointsToAward} points!`, 
            newBalance: newBalance 
        });

    } catch (error) {
        try { await client.query('ROLLBACK'); } catch (rollbackError) { console.error('Rollback failed:', rollbackError); }
        console.error("Error processing point earning:", error);
        // Check if it was a known error type (like user not found), otherwise generic error
        if (error.message.includes("User not found")) {
            return res.status(404).json({ message: error.message });
        }
        return res.status(500).json({ message: "Database error while processing point earning." });
    } finally {
        client.release();
    }
});

// Get Current User's Points Balance (requires login)
app.get('/api/user/points', isAuthenticated, async (req, res) => {
    const userId = req.session.userId;
    try {
        const result = await db.query("SELECT points_balance FROM users WHERE id = $1", [userId]);
        if (result.rows.length === 0) {
             req.session.destroy();
             return res.status(404).json({ message: "User not found." });
        }
        res.status(200).json({ balance: result.rows[0].points_balance });
    } catch (error) {
        console.error("Error fetching points balance:", error);
        return res.status(500).json({ message: "Database error fetching points balance." });
    }
});

// --- Rewards Routes ---

// Get Active Rewards for a Business (requires login)
app.get('/api/businesses/:businessId/rewards', isAuthenticated, async (req, res) => {
    const businessId = req.params.businessId;
    const sql = "SELECT id, description, points_cost FROM rewards WHERE business_id = $1 AND is_active = TRUE ORDER BY points_cost";
    try {
        const result = await db.query(sql, [businessId]);
        res.status(200).json(result.rows);
    } catch(error) {
        console.error(`Error fetching rewards for business ${businessId}:`, error);
        return res.status(500).json({ message: "Database error fetching rewards." });
    }
});

// Redeem a Reward (requires login)
app.post('/api/rewards/:rewardId/redeem', isAuthenticated, async (req, res) => {
    const userId = req.session.userId;
    const rewardId = parseInt(req.params.rewardId, 10);
    const client = await db.pool.connect();
    const tokenExpiryMinutes = 5;

    try {
        await client.query('BEGIN');
        
        // 1. Lock user row and get reward details (including business_id)
        const userResult = await client.query("SELECT points_balance FROM users WHERE id = $1 FOR UPDATE", [userId]);
        if (userResult.rows.length === 0) throw new Error("User not found");
        const userBalance = userResult.rows[0].points_balance;

        const rewardResult = await client.query("SELECT points_cost, business_id FROM rewards WHERE id = $1 AND is_active = TRUE", [rewardId]);
        if (rewardResult.rows.length === 0) throw new Error("Reward not found or not active");
        const { points_cost: rewardCost, business_id: businessId } = rewardResult.rows[0];

        // 2. Check points
        if (userBalance < rewardCost) {
            throw new Error("Not enough points");
        }

        // 3. Generate unique token and expiry
        const redemptionToken = crypto.randomBytes(16).toString('hex');
        const expiresAt = new Date(Date.now() + tokenExpiryMinutes * 60 * 1000);

        // 4. Insert pending redemption record
        await client.query(`
            INSERT INTO redemptions (user_id, reward_id, business_id, redemption_token, token_expires_at, status)
            VALUES ($1, $2, $3, $4, $5, 'PENDING')
        `, [userId, rewardId, businessId, redemptionToken, expiresAt]);

        // 5. Deduct points
        const newBalance = userBalance - rewardCost;
        await client.query("UPDATE users SET points_balance = $1 WHERE id = $2", [newBalance, userId]);

        // 6. Commit transaction
        await client.query('COMMIT');

        // 7. Success - Respond with token
        console.log(`User ${userId} initiated redemption for reward ${rewardId}. Token: ${redemptionToken}. New balance: ${newBalance}`);
        res.status(200).json({
            message: "Redemption initiated! Generate QR code.",
            redemptionToken: redemptionToken,
            expiresAt: expiresAt.toISOString(),
            newBalance: newBalance
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error redeeming reward ${rewardId} for user ${userId}:`, error);
        if (error.message === "Not enough points") {
            res.status(400).json({ message: error.message });
        } else if (error.message.includes("not found")) {
             res.status(404).json({ message: error.message });
        } else {
            res.status(500).json({ message: "Database error redeeming reward." });
        }
    } finally {
        client.release();
    }
});

// --- Server Start ---

// Initialize schema first, then start server
async function startServer() {
    try {
        await db.initializeSchema();
        app.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to initialize database schema or start server:", error);
        process.exit(1);
    }
}

startServer(); // Call the async function to start 