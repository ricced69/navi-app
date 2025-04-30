# NAVI App - Development Notes

Last Updated: {{TIMESTAMP}}

## Project Goal (REVISED - Enhanced MVP)

Create a **polished, feature-rich Enhanced Minimum Viable Product (MVP)** (mobile-first web application) for Debrecen, Hungary, called NAVI.
The goal is to demonstrate a highly functional, persistent, secure, and visually appealing application to potential partners and early users, showcasing the core value proposition convincingly.
Key features for this enhanced MVP include: persistent auth, points system, QR code redemption **with backend validation endpoint**, interactive map view, and a significantly improved UI/UX.

## Current Status (as of {{TIMESTAMP}})

*   **Setup:** Node.js/Express backend, Vanilla JS/HTML/CSS frontend (Basic Styling).
*   **Database:** Hosted PostgreSQL (Neon) - Persistence achieved.
*   **Version Control:** Git repository on GitHub.
*   **Deployment:** Continuous deployment via Vercel.
*   **Core Loop Implemented:**
    *   Persistent User Auth.
    *   Business/Reward Display (Seeded Data).
    *   Point Earning (Basic Rate Limit - Currently set low for testing).
    *   QR Code Generation for Redemption (User-Side).
*   **Development Notes:** Maintained.

## Revised Strategy & Key Decisions (Shift to Enhanced MVP)

*   **Ambition Increased:** Pivot from basic demo to building a more complete, polished application before initial showcasing, leveraging development momentum.
*   **UI/UX Priority:** A high-quality, modern user interface is now a key goal for this phase.
*   **Map View:** Implementing an interactive map for business discovery is now part of the enhanced MVP scope.
*   **QR Code Validation Endpoint:** Adding a backend endpoint to validate redemption tokens is now included to demonstrate the full secure loop (partner scanning interface still deferred).
*   **Persistent Database:** Implemented.
*   **Partner App Deferred:** Confirmed. Partner features (scanning UI, dashboard) will follow the enhanced MVP.
*   **Rate Limiting:** To be refined and made configurable.

## Immediate Next Steps (Revised Roadmap)

1.  **(Current Focus): UI/UX Foundation:**
    *   Decide on frontend approach (Enhanced Vanilla CSS vs. Framework like SvelteKit/Vue).
    *   Establish design system (colors, typography, layout).
    *   Refactor existing UI components with the new design.
2.  **Core Feature Polish:**
    *   Revert temporary rate limit duration to a realistic value (e.g., 8-24 hours).
    *   Improve error handling and user feedback messages.
    *   Enhance QR code modal presentation.
3.  **Map View Implementation:**
    *   Choose map library (e.g., Leaflet.js).
    *   Add coordinates to business data (DB schema update + seeding).
    *   Implement map display with interactive markers.
4.  **Partner QR Code Validation Endpoint:**
    *   Create backend API endpoint (`POST /api/redemptions/validate` or similar).
    *   Endpoint logic: Find redemption by token, check expiry/status, update status to 'REDEEMED', return success/failure.
5.  **(Later):** Gamification, Landing Page, Partner App, Admin Panel etc.

## Future Ideas / Roadmap (Post-Enhanced MVP)

*   Build Partner-Facing Interface (QR scanner, stats).
*   Build Admin Panel.
*   // ... (other items remain)

## Local Setup

*   Requires PostgreSQL connection string as `DATABASE_URL` env var (use `.env` + `dotenv`).
*   // ... npm install, npm start ...

---
*This file reflects the updated strategy for an Enhanced MVP as of {{TIMESTAMP}}.* 