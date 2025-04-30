# NAVI App - Development Notes

Last Updated: {{TIMESTAMP}}

## Project Goal

Create a **demo-ready, Minimum Viable Product (MVP)** (mobile-first web application) for Debrecen, Hungary, called NAVI.
Users can discover partner businesses, earn points through simple tasks, and **securely redeem** points for discounts using a **QR code-based verification** system.
The goal is to demonstrate a functional, persistent, and reasonably secure core loop to potential partners and test the concept's appeal.

## Current Status (as of {{TIMESTAMP}})

*   **Setup:** Node.js/Express backend, Vanilla JS/HTML/CSS frontend.
*   **Database:** ~~SQLite (`navi.db`/`sessions.db`) used locally and in Vercel's `/tmp` directory.~~ **Identified as insufficient due to lack of persistence on Vercel.**
*   **Version Control:** Git repository on GitHub (`https://github.com/ricced69/navi-app.git`).
*   **Deployment:** Continuous deployment via Vercel. Live at: [Insert Vercel URL Here - User needs to add this]. **Currently experiencing login persistence issues due to SQLite limitations.**
*   **Core Features Implemented (Technically, Pre-Persistence Fix):**
    *   User Signup/Login/Logout (using ephemeral SQLite/sessions).
    *   Displaying seeded partner businesses.
    *   Basic point earning via repeatable button clicks (no rate limiting).
    *   Displaying seeded rewards.
    *   Basic (insecure, non-persistent) reward redemption flow.
*   **Styling:** Basic CSS improvements applied.
*   **Development Notes:** This file established for context tracking.

## Revised Strategy & Key Decisions (Shift from basic PoC to Demo MVP)

*   **Increased Scope for Demo:** Recognizing that a simple visual redemption confirmation is insecure (easily spoofed) and untrackable for partners (hindering business model validation), the MVP scope is increased to include a more robust flow.
*   **QR Code Redemption:** Implementing a QR code system for redemption is now **essential** for the MVP demo. The user app will generate a QR code containing a unique, short-lived token upon redemption.
*   **Persistent Database Required:** The ephemeral nature of SQLite on Vercel `/tmp` is unacceptable for a demo requiring persistent logins and data tracking. **Migrating to a hosted PostgreSQL database (via a free-tier service like Supabase or Neon) is the immediate priority.**
*   **Partner App Deferred:** While partners will eventually need their own interface (web app/portal) to scan QR codes and view stats, this partner-facing app **will not** be built for the *initial* MVP demo. The demo will focus on the user app generating the QR code, with the partner scanning process explained verbally or mocked up.
*   **Focus on User App First:** Development will concentrate on making the user-facing web app fully functional with the persistent database and QR code generation.
*   **Rate Limiting for Points:** Basic server-side rate limiting for point earning tasks will be implemented to make the demo more realistic.
*   **Admin Panel Deferred:** Partner onboarding and reward management will remain manual (code seeding or direct DB manipulation by the developer) for the MVP; a proper admin panel is a future feature.

## Immediate Next Steps (Revised)

1.  **(Current Focus): Migrate Database to Hosted PostgreSQL**
    *   User to choose and set up a free-tier account (e.g., Supabase, Neon).
    *   Obtain database connection credentials.
    *   Install `pg` Node.js library.
    *   Update `database.js` connection logic.
    *   Update `server.js` session store logic (using `connect-pg-simple` or similar).
    *   Update Vercel environment variables with new DB credentials and potentially a new session secret.
    *   Ensure database seeding works with PostgreSQL.
    *   **Goal:** Achieve persistent logins and data on the Vercel deployment.
2.  **Implement QR Code Redemption Flow (User App Side):**
    *   Add `redemptions` table to DB schema.
    *   Modify `POST /api/rewards/:rewardId/redeem` endpoint:
        *   Generate unique, short-lived redemption token.
        *   Log redemption as 'pending' in `redemptions` table.
        *   Return token to frontend.
    *   Modify frontend `handleRedeemRewardClick`:
        *   Add QR code generation library.
        *   On successful redeem API call, generate and display QR code containing the token.
3.  **Implement Basic Point Earning Rate Limiting:**
    *   Add necessary DB schema (e.g., `earnings_log` table or timestamps).
    *   Modify `POST /api/businesses/:businessId/earn` endpoint to check limits before awarding points.
4.  **Improve Redemption Confirmation UI:** Enhance the screen/modal displaying the QR code for clarity.

## Future Ideas / Roadmap (Post-MVP Demo)

*   Build Partner-Facing App/Interface (including QR scanner).
*   Build Admin Panel (for managing businesses, rewards, users).
*   Implement different point-earning tasks.
*   Map View on User App.
*   Advanced UI/UX, Search/Filtering.
*   Notifications.

## Local Setup

*   (Will require update after DB migration - need PostgreSQL running locally or connection to hosted DB)

---
*This file reflects the updated strategy for a demo-ready MVP as of {{TIMESTAMP}}.* 