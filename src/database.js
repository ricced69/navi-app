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

// Dummy Rewards Data (assuming business IDs 1, 2, 3 correspond to the seeded businesses)
const initialRewards = [
    { business_id: 1, description: "Free Croissant with any Coffee", points_cost: 50 },
    { business_id: 1, description: "15% off total bill", points_cost: 120 },
    { business_id: 2, description: "Free Soft Drink with Lunch Menu", points_cost: 30 },
    { business_id: 3, description: "€5 Off Any Cocktail", points_cost: 80 },
    { business_id: 3, description: "Skip the Queue Pass (One Time)", points_cost: 40 }
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
                    // Seed data if table is empty - Add a slight delay
                    setTimeout(() => {
                        db.get("SELECT COUNT(*) as count FROM businesses", (err, row) => {
                            if (!err && row.count === 0) {
                                console.log("(Delayed) Seeding initial business data...");
                                const stmt = db.prepare("INSERT INTO businesses (name, description, address) VALUES (?, ?, ?)");
                                initialBusinesses.forEach(business => {
                                    stmt.run(business.name, business.description, business.address);
                                });
                                stmt.finalize((err) => {
                                    if (!err) console.log("(Delayed) Finished seeding businesses.");
                                    else console.error("Error finalizing business seed statement:", err.message);
                                });
                            } else if (err) {
                                console.error("Error checking business count for seeding:", err.message);
                            }
                        });
                    }, 100); // Delay 100ms
                }
            });

            // Create the rewards table
            db.run(`CREATE TABLE IF NOT EXISTS rewards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                business_id INTEGER NOT NULL,
                description TEXT NOT NULL,
                points_cost INTEGER NOT NULL CHECK(points_cost > 0),
                is_active BOOLEAN DEFAULT TRUE NOT NULL,
                FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE
            )`, (err) => {
                if (err) console.error("Error creating rewards table:", err.message);
                else {
                    // Seed rewards if table is empty - Add a slight delay
                    setTimeout(() => {
                        db.get("SELECT COUNT(*) as count FROM rewards", (err, row) => {
                            if (!err && row.count === 0) {
                                console.log("(Delayed) Seeding initial reward data...");
                                const stmt = db.prepare("INSERT INTO rewards (business_id, description, points_cost) VALUES (?, ?, ?)");
                                initialRewards.forEach(reward => {
                                    stmt.run(reward.business_id, reward.description, reward.points_cost);
                                });
                                stmt.finalize((err) => {
                                    if (!err) console.log("(Delayed) Finished seeding rewards.");
                                    else console.error("Error finalizing reward seed statement:", err.message);
                                });
                            } else if (err) {
                                console.error("Error checking reward count for seeding:", err.message);
                            }
                        });
                    }, 150); // Delay 150ms (slightly longer than business seed)
                }
            });

            // Add other tables here later (e.g., points)
        });
    }
});

module.exports = db; 