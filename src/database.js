const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Path to the database file (will be created in the project root)
const dbPath = path.resolve(__dirname, '..', 'navi.db');

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
                password_hash TEXT NOT NULL
            )`, (err) => {
                if (err) console.error("Error creating users table:", err.message);
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
                    // Optional: Seed initial data if table was just created
                    // We'll add seed data separately for clarity
                }
            });

            // Add other tables here later (e.g., rewards, points)
        });
    }
});

module.exports = db; 