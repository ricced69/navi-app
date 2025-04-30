# NAVI App - Development Notes

Last Updated: {{TIMESTAMP}}

## Project Goal

Create a mobile-first web application (Proof of Concept) for Debrecen, Hungary, called NAVI.
Users can discover partner businesses, earn points through simple interactions (initially tasks, not purchases), and redeem points for discounts at those businesses.
The goal is to test the viability of this hyperlocal loyalty concept.

## Current Status (as of {{TIMESTAMP}})

*   **Setup:** Node.js/Express backend, Vanilla JS/HTML/CSS frontend.
*   **Database:** SQLite (`navi.db` for data, `sessions.db` for sessions) used locally and in Vercel's `/tmp` directory.
*   **Version Control:** Git repository set up and pushed to GitHub (`https://github.com/ricced69/navi-app.git`).
*   **Deployment:** Continuous deployment set up via Vercel. Live at: [Insert Vercel URL Here - User needs to add this]
*   **Core Features Implemented:**
    *   User Signup (email/password, bcrypt hashing).
    *   User Login/Logout (session management via `express-session` and `connect-sqlite3`).
    *   Displaying a list of hardcoded/seeded partner businesses (`/api/businesses`) to logged-in users.
*   **Dummy Data:** Using 3 dummy businesses for testing.

## Key Decisions & Context

*   **PoC First:** Building a minimal viable product first, aiming for foundational code quality to allow iteration, not a throwaway prototype.
*   **Web App:** Starting with a web application (mobile-first) instead of native apps for speed.
*   **SQLite for Now:** Using SQLite for ease of local setup and initial Vercel deployment (using `/tmp` path on Vercel). Acknowledged that this means separate user accounts/data locally vs deployed, and data is ephemeral on Vercel.
*   **Persistent DB Later:** Plan to migrate to a free-tier hosted PostgreSQL (e.g., Supabase, Neon) later for persistent data if the PoC is successful.
*   **Task-Based Points:** Initial point earning will be via simple tasks (like check-ins), not purchase verification, to reduce MVP complexity.
*   **Manual Business Onboarding:** Businesses are currently added via code seeding (`database.js`). An admin panel is a future feature.
*   **Vercel:** Chosen for deployment due to ease of use and free tier.
*   **GitHub:** Used for version control and triggering Vercel builds.

## Immediate Next Steps

1.  Implement the first point-earning mechanism (e.g., a "Check-in" or "Earn Points" button per business).
    *   Create necessary database table(s) (`user_points`? `activity_log`?).
    *   Add backend API endpoint(s) to record the action and award points.
    *   Update frontend to display the button and handle clicks.
    *   Update frontend to display the user's current point balance.

## Future Ideas / Roadmap

*   Display user point balance.
*   Implement reward definition and redemption.
*   Build an Admin Panel for managing businesses and rewards.
*   Migrate to a persistent database (e.g., PostgreSQL on Supabase/Neon).
*   Implement different point-earning tasks (surveys, ratings?).
*   Add location-based features (e.g., map view, check-in verification).
*   Improve UI/UX design.
*   Consider native mobile apps if PoC succeeds.

## Local Setup

1.  Clone the repository.
2.  Ensure Node.js and npm are installed.
3.  Run `npm install` in the root directory.
4.  Run `npm start` to start the local server.
5.  Access the app at `http://localhost:3000`.

---
*This file will be updated periodically to reflect project progress.* 