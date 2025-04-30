const express = require('express');
const path = require('path');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const bcrypt = require('bcrypt');
const db = require('./database'); // Import the database connection

const app = express();
const PORT = process.env.PORT || 3000; // Use environment variable or default to 3000
const SALT_ROUNDS = 10; // For bcrypt password hashing

// --- Middleware ---

// 1. Body Parser for JSON requests
app.use(express.json());

// 2. Session Middleware
app.use(session({
    store: new SQLiteStore({
        db: 'navi.db', // Use the same db file
        dir: path.resolve(__dirname, '..'), // Root directory
        table: 'sessions' // Optional: table name for sessions
    }),
    secret: 'your secret key', // IMPORTANT: Change this to a real secret! Use an environment variable.
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 // Cookie valid for 1 day
        // secure: process.env.NODE_ENV === 'production', // Use secure cookies in production (HTTPS)
        // httpOnly: true // Helps prevent XSS attacks
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

// Check Login Status Route (Example)
app.get('/api/user/status', (req, res) => {
    if (req.session.userId) {
        res.json({ loggedIn: true, email: req.session.email, userId: req.session.userId });
    } else {
        res.json({ loggedIn: false });
    }
});


// --- Server Start ---

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
}); 