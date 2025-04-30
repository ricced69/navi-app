const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs'); // Need filesystem module

// Determine database path based on environment
const isVercel = process.env.VERCEL_ENV === 'production' || process.env.VERCEL_ENV === 'preview';
const dbDirectory = isVercel ? '/tmp' : path.resolve(__dirname, '..');
const dbPath = path.join(dbDirectory, 'navi.db');

// Ensure the /tmp directory exists on Vercel (it usually does, but doesn't hurt to check)
if (isVercel && !fs.existsSync(dbDirectory)) {
    try {
        fs.mkdirSync(dbDirectory);
        console.log(`Created directory: ${dbDirectory}`);
    } catch (err) {
        console.error(`Error creating directory ${dbDirectory}:`, err);
        // Decide how to handle this - maybe throw error to prevent connection attempt
    }
}

console.log(`Using database path: ${dbPath}`); // Log the path for debugging

// Dummy Business Data
const initialBusinesses = [
    { name: "Cafe Central", description: "Cozy spot for coffee & cake", address: "Főtér 1" },
    { name: "Bistro Byte", description: "Modern eatery, quick lunch", address: "Piac u. 10" },
    { name: "Retro Bar", description: "Evening drinks & music", address: "Simonffy u. 5" }
];

// Connect to the database (or create it if it doesn't exist)
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error opening database:", err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.serialize(() => { // Use serialize to ensure table creation order
            // Create the users table if it doesn't exist
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                points_balance INTEGER DEFAULT 0 NOT NULL
            )`, (err) => {
                if (err) console.error("Error creating/altering users table:", err.message);
                else {
                    // Add points_balance column if it doesn't exist (for existing dbs)
                    db.run(`ALTER TABLE users ADD COLUMN points_balance INTEGER DEFAULT 0 NOT NULL`, (err) => {
                        if (err && !err.message.includes('duplicate column name')) {
                            console.error("Error adding points_balance column:", err.message);
                        }
                    });
                }
            });

            // Create the businesses table if it doesn't exist
            db.run(`CREATE TABLE IF NOT EXISTS businesses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                address TEXT
            )`, (err) => {
                if (err) {
                    console.error("Error creating businesses table:", err.message);
                } else {
                    // Seed data if table is empty
                    db.get("SELECT COUNT(*) as count FROM businesses", (err, row) => {
                        if (!err && row.count === 0) {
                            console.log("Seeding initial business data...");
                            const stmt = db.prepare("INSERT INTO businesses (name, description, address) VALUES (?, ?, ?)");
                            initialBusinesses.forEach(business => {
                                stmt.run(business.name, business.description, business.address);
                            });
                            stmt.finalize((err) => {
                                if (!err) console.log("Finished seeding businesses.");
                                else console.error("Error finalizing business seed statement:", err.message);
                            });
                        } else if (err) {
                            console.error("Error checking business count for seeding:", err.message);
                        }
                    });
                }
            });

            // Add other tables here later (e.g., rewards, points)
        });
    }
});

module.exports = db; 