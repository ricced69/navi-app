const { Pool } = require('pg');
const path = require('path');
const fs = require('fs'); // Need filesystem module

// Get the PostgreSQL connection string from environment variables
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("Error: DATABASE_URL environment variable is not set.");
    process.exit(1); // Exit if database URL is missing
}

// Create a connection pool
const pool = new Pool({
    connectionString: connectionString,
    ssl: process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV ? { rejectUnauthorized: false } : false // Enable SSL for production/Vercel, disable for local dev if needed
});

pool.on('connect', () => {
    console.log('Connected to the PostgreSQL database via pool.');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// --- Schema Initialization Function ---
// We run this once when the server starts
async function initializeSchema() {
    const client = await pool.connect();
    console.log("Initializing database schema...");
    try {
        await client.query('BEGIN');

        // Create users table
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                points_balance INTEGER DEFAULT 0 NOT NULL
            );
        `);
        console.log("Users table checked/created.");

        // Create businesses table
        await client.query(`
            CREATE TABLE IF NOT EXISTS businesses (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                address TEXT
            );
        `);
        console.log("Businesses table checked/created.");

        // Create rewards table
        await client.query(`
            CREATE TABLE IF NOT EXISTS rewards (
                id SERIAL PRIMARY KEY,
                business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
                description TEXT NOT NULL,
                points_cost INTEGER NOT NULL CHECK(points_cost > 0),
                is_active BOOLEAN DEFAULT TRUE NOT NULL
            );
        `);
        console.log("Rewards table checked/created.");

        // Create redemptions table
        await client.query(`
            CREATE TABLE IF NOT EXISTS redemptions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL, -- Keep log even if user deleted?
                reward_id INTEGER NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
                business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE, -- Denormalized for easier querying
                redemption_token TEXT UNIQUE NOT NULL, -- The unique token for the QR code
                token_expires_at TIMESTAMPTZ NOT NULL, -- When the token becomes invalid
                status VARCHAR(10) DEFAULT 'PENDING' NOT NULL, -- PENDING, REDEEMED, EXPIRED
                redeemed_at TIMESTAMPTZ, -- When it was actually scanned/confirmed
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
            );
        `);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_redemptions_token ON redemptions (redemption_token);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_redemptions_status_expiry ON redemptions (status, token_expires_at);`);
        console.log("Redemptions table checked/created.");

        // Create sessions table (needed for connect-pg-simple)
        // Define primary key directly in CREATE TABLE
        await client.query(`
            CREATE TABLE IF NOT EXISTS "session" (
                "sid" varchar NOT NULL COLLATE "default",
                "sess" json NOT NULL,
                "expire" timestamp(6) NOT NULL,
                CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE
            ) WITH (OIDS=FALSE);
        `);
         await client.query(`
            CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
        `);
        console.log("Session table checked/created.");

        // --- Seeding Logic --- (Run only if tables were likely just created)
        // Note: This is a simple check; more robust seeding might involve flags

        // Seed businesses
        const businessCheck = await client.query("SELECT COUNT(*) as count FROM businesses");
        if (businessCheck.rows[0].count === '0') {
            console.log("Seeding initial business data...");
            const initialBusinesses = [
                { name: "Cafe Central", description: "Cozy spot for coffee & cake", address: "Főtér 1" },
                { name: "Bistro Byte", description: "Modern eatery, quick lunch", address: "Piac u. 10" },
                { name: "Retro Bar", description: "Evening drinks & music", address: "Simonffy u. 5" }
            ];
            for (const biz of initialBusinesses) {
                await client.query("INSERT INTO businesses (name, description, address) VALUES ($1, $2, $3)", 
                                     [biz.name, biz.description, biz.address]);
            }
            console.log("Finished seeding businesses.");
        }

        // Seed rewards
        const rewardCheck = await client.query("SELECT COUNT(*) as count FROM rewards");
        if (rewardCheck.rows[0].count === '0') {
            console.log("Seeding initial reward data...");
             const initialRewards = [
                // IMPORTANT: Assumes seeded businesses get IDs 1, 2, 3 in order
                // This might be fragile. A better way is to query IDs after seeding businesses.
                // For MVP demo simplicity, we keep the assumption.
                { business_id: 1, description: "Free Croissant with any Coffee", points_cost: 50 },
                { business_id: 1, description: "15% off total bill", points_cost: 120 },
                { business_id: 2, description: "Free Soft Drink with Lunch Menu", points_cost: 30 },
                { business_id: 3, description: "€5 Off Any Cocktail", points_cost: 80 },
                { business_id: 3, description: "Skip the Queue Pass (One Time)", points_cost: 40 }
            ];
             for (const reward of initialRewards) {
                await client.query("INSERT INTO rewards (business_id, description, points_cost) VALUES ($1, $2, $3)", 
                                     [reward.business_id, reward.description, reward.points_cost]);
            }
             console.log("Finished seeding rewards.");
        }

        await client.query('COMMIT');
        console.log("Schema initialization committed.");
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Error during schema initialization, rolled back:", e);
        throw e; // Re-throw error to prevent server start if init fails
    } finally {
        client.release(); // Release the client back to the pool
        console.log("Schema initialization client released.");
    }
}

// Export the pool and the initialization function
module.exports = {
    pool,
    initializeSchema,
    // Helper function to query the database easily
    query: (text, params) => pool.query(text, params),
}; 