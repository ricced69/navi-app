const express = require('express');
const path = require('path');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const bcrypt = require('bcrypt');
const db = require('./database'); // Import the database connection

const app = express();
const PORT = process.env.PORT || 3000; // Use environment variable or default to 3000
const SALT_ROUNDS = 10; // For bcrypt password hashing

// Determine session store directory based on environment
const isVercel = process.env.VERCEL_ENV === 'production' || process.env.VERCEL_ENV === 'preview';
const sessionDbDirectory = isVercel ? '/tmp' : path.resolve(__dirname, '..');
console.log(`Using session store directory: ${sessionDbDirectory}`); // Log for debugging

// --- Middleware ---

// 1. Body Parser for JSON requests
app.use(express.json());

// 2. Session Middleware
app.use(session({
    store: new SQLiteStore({
        db: 'sessions.db', // Separate file for sessions is cleaner
        dir: sessionDbDirectory, // Use environment-specific directory
        table: 'sessions'
    }),
    secret: process.env.SESSION_SECRET || 'fallback-secret-dev', // Use env variable!
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 // 1 day
        // secure: isVercel, // Enable secure cookies only on Vercel (HTTPS)
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
        db.get('SELECT email FROM users WHERE email = ?', [email], async (err, row) => {
            if (err) {
                console.error("Signup DB Error:", err.message);
                return res.status(500).json({ message: 'Database error during signup check.' });
            }
            if (row) {
                return res.status(400).json({ message: 'Email already exists.' });
            }

            // Hash password
            const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

            // Insert new user
            db.run('INSERT INTO users (email, password_hash) VALUES (?, ?)', [email, passwordHash], function(err) {
                if (err) {
                    console.error("Signup Insert Error:", err.message);
                    return res.status(500).json({ message: 'Database error during user creation.' });
                }
                // Automatically log in user after successful signup
                req.session.userId = this.lastID; // Store user ID in session
                req.session.email = email;
                console.log(`User ${email} signed up and logged in with ID: ${this.lastID}`);
                res.status(201).json({ message: 'Signup successful!', userId: this.lastID, email: email });
            });
        });
    } catch (error) {
        console.error("Signup Process Error:", error);
        res.status(500).json({ message: 'Internal server error during signup.' });
    }
});

// Login Route
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) {
            console.error("Login DB Error:", err.message);
            return res.status(500).json({ message: 'Database error during login.' });
        }
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password.' }); // Keep message generic
        }

        // Compare submitted password with stored hash
        const match = await bcrypt.compare(password, user.password_hash);

        if (match) {
            // Passwords match - Create session
            req.session.userId = user.id;
            req.session.email = user.email;
            console.log(`User ${user.email} logged in with ID: ${user.id}`);
            res.status(200).json({ message: 'Login successful!', userId: user.id, email: user.email });
        } else {
            // Passwords don't match
            res.status(401).json({ message: 'Invalid email or password.' });
        }
    });
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
app.get('/api/businesses', isAuthenticated, (req, res) => {
    db.all("SELECT id, name, description, address FROM businesses ORDER BY name", [], (err, rows) => {
        if (err) {
            console.error("Error fetching businesses:", err.message);
            res.status(500).json({ message: "Error retrieving businesses from database." });
        } else {
            res.status(200).json(rows); // Send the array of businesses
        }
    });
});

// Earn Points at a Business (requires login)
app.post('/api/businesses/:businessId/earn', isAuthenticated, (req, res) => {
    const userId = req.session.userId;
    const businessId = req.params.businessId;
    const pointsToAward = 10; // Hardcoded for now

    // TODO: Implement rate limiting later (e.g., only earn once per day per business)

    const sql = `UPDATE users SET points_balance = points_balance + ? WHERE id = ?`;
    db.run(sql, [pointsToAward, userId], function(err) {
        if (err) {
            console.error("Error updating points balance:", err.message);
            return res.status(500).json({ message: "Database error while updating points." });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        db.get("SELECT points_balance FROM users WHERE id = ?", [userId], (err, user) => {
            if (err || !user) {
                console.error("Error fetching new points balance:", err ? err.message : "User not found after update");
                return res.status(500).json({ message: "Points awarded, but failed to fetch new balance." });
            }
            console.log(`User ${userId} earned ${pointsToAward} points. New balance: ${user.points_balance}`);
            res.status(200).json({ 
                message: `Successfully earned ${pointsToAward} points!`, 
                newBalance: user.points_balance 
            });
        });
    });
});

// Get Current User's Points Balance (requires login)
app.get('/api/user/points', isAuthenticated, (req, res) => {
    const userId = req.session.userId;
    db.get("SELECT points_balance FROM users WHERE id = ?", [userId], (err, user) => {
        if (err) {
            console.error("Error fetching points balance:", err.message);
            return res.status(500).json({ message: "Database error fetching points balance." });
        }
        if (!user) {
            req.session.destroy();
            return res.status(404).json({ message: "User not found." });
        }
        res.status(200).json({ balance: user.points_balance });
    });
});

// --- Rewards Routes ---

// Get Active Rewards for a Business (requires login)
app.get('/api/businesses/:businessId/rewards', isAuthenticated, (req, res) => {
    const businessId = req.params.businessId;
    const sql = "SELECT id, description, points_cost FROM rewards WHERE business_id = ? AND is_active = TRUE ORDER BY points_cost";

    db.all(sql, [businessId], (err, rows) => {
        if (err) {
            console.error(`Error fetching rewards for business ${businessId}:`, err.message);
            return res.status(500).json({ message: "Database error fetching rewards." });
        }
        res.status(200).json(rows);
    });
});

// Redeem a Reward (requires login)
app.post('/api/rewards/:rewardId/redeem', isAuthenticated, (req, res) => {
    const userId = req.session.userId;
    const rewardId = req.params.rewardId;

    // 1. Get reward details and user's current points in one go (or two queries)
    db.get("SELECT points_cost FROM rewards WHERE id = ? AND is_active = TRUE", [rewardId], (err, reward) => {
        if (err) {
            console.error(`Error fetching reward ${rewardId}:`, err.message);
            return res.status(500).json({ message: "Database error checking reward." });
        }
        if (!reward) {
            return res.status(404).json({ message: "Reward not found or not active." });
        }

        // 2. Get user's current points
        db.get("SELECT points_balance FROM users WHERE id = ?", [userId], (err, user) => {
            if (err) {
                console.error(`Error fetching user ${userId} points:`, err.message);
                return res.status(500).json({ message: "Database error checking user points." });
            }
            if (!user) {
                return res.status(404).json({ message: "User not found." }); // Should not happen
            }

            // 3. Check if user has enough points
            if (user.points_balance < reward.points_cost) {
                return res.status(400).json({ message: "Not enough points to redeem this reward." });
            }

            // 4. Deduct points
            const newBalance = user.points_balance - reward.points_cost;
            const sqlUpdate = "UPDATE users SET points_balance = ? WHERE id = ?";
            db.run(sqlUpdate, [newBalance, userId], function(err) {
                if (err) {
                    console.error(`Error deducting points for user ${userId}:`, err.message);
                    return res.status(500).json({ message: "Database error redeeming reward." });
                }
                if (this.changes === 0) {
                     return res.status(404).json({ message: "User not found during points deduction." }); // Should not happen
                }

                // 5. Success - Respond (In real app, might also log redemption)
                console.log(`User ${userId} redeemed reward ${rewardId}. New balance: ${newBalance}`);
                res.status(200).json({
                    message: "Reward redeemed successfully! Show this confirmation.", // Simple confirmation
                    newBalance: newBalance
                });
                // TODO: Log this redemption event in a separate table later
            });
        });
    });
});

// --- Server Start ---

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
}); 