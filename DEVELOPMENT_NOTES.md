# NAVI App - Development Notes

Last Updated: {{TIMESTAMP}}

## Project Goal

Create a **demo-ready, Minimum Viable Product (MVP)** (mobile-first web application) for Debrecen, Hungary, called NAVI.
Users can discover partner businesses, earn points through simple tasks, and **securely redeem** points for discounts using a **QR code-based verification** system.
The goal is to demonstrate a functional, persistent, and reasonably secure core loop to potential partners and test the concept's appeal.

## Current Status (as of {{TIMESTAMP}})

*   **Setup:** Node.js/Express backend, Vanilla JS/HTML/CSS frontend.
*   **Database:** Migrated to hosted PostgreSQL (Neon) solving persistence issues.
*   **Version Control:** Git repository on GitHub (`https://github.com/ricced69/navi-app.git`).
*   **Deployment:** Continuous deployment via Vercel, now with persistent data. Live at: [Insert Vercel URL Here - User needs to add this].
*   **Core Features Implemented:**
    *   Persistent User Signup/Login/Logout.
    *   Displaying seeded partner businesses.
    *   Point earning via repeatable button clicks.
    *   Displaying user point balance.
    *   Displaying seeded rewards.
    *   **Secure Reward Redemption (User-Side):**
        *   Backend generates unique, short-lived token and logs redemption attempt.
        *   Frontend displays QR code containing the token in a modal upon redemption.
*   **Styling:** Basic CSS improvements applied.
*   **Development Notes:** Being maintained.

## Revised Strategy & Key Decisions (Shift from basic PoC to Demo MVP)

*   **Increased Scope for Demo:** Recognizing that a simple visual redemption confirmation is insecure (easily spoofed) and untrackable for partners (hindering business model validation), the MVP scope is increased to include a more robust flow.
*   **QR Code Redemption:** User app now generates QR code containing unique token. **Partner scanning interface deferred** post-MVP demo.
*   **Persistent Database Required:** **Implemented** (Migrated to PostgreSQL/Neon).
*   **Partner App Deferred:** Confirmed. Initial MVP demo focuses on user app. **Future partner features will likely start integrated (role-based) within the main app** before potentially separating later if needed.
*   **Focus on User App First:** Development will concentrate on making the user-facing web app fully functional with the persistent database and QR code generation.
*   **Rate Limiting for Points:** Basic server-side rate limiting for point earning tasks will be implemented to make the demo more realistic.
*   **Admin Panel Deferred:** Partner onboarding and reward management will remain manual (code seeding or direct DB manipulation by the developer) for the MVP; a proper admin panel is a future feature.

## Immediate Next Steps (Revised)

1.  ~~**(DONE): Migrate Database to Hosted PostgreSQL**~~
2.  ~~**(DONE): Implement QR Code Redemption Flow (User App Side)**~~
3.  **(Current Focus): Implement Basic Point Earning Rate Limiting:**
    *   Add necessary DB schema (e.g., `earnings_log` table or timestamps).
    *   Modify `POST /api/businesses/:businessId/earn` endpoint to check limits (e.g., once per hour/day per business) before awarding points.
    *   Provide appropriate feedback to the user if the limit is hit.
4.  **Improve Redemption Confirmation UI:** Enhance the modal displaying the QR code (e.g., clearer expiry time, maybe reward details).

## Future Ideas / Roadmap (Post-MVP Demo)

*   Build Partner-Facing Interface (role-based or separate app) - incl. QR scanner/validator.
*   Build Admin Panel (for managing businesses, rewards, users).
*   Implement different point-earning tasks.
*   Map View on User App.
*   Advanced UI/UX, Search/Filtering.
*   Notifications.

## Local Setup

*   Requires PostgreSQL connection string set as `DATABASE_URL` environment variable (e.g., using a `.env` file locally with `dotenv` package).
*   // ... npm install, npm start ...

---
*This file reflects the updated strategy for a demo-ready MVP as of {{TIMESTAMP}}.* 