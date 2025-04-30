# NAVI App - Development Notes

Last Updated: {{TIMESTAMP}}

## Project Goal (REVISED - Enhanced MVP)

Create a **polished, feature-rich Enhanced Minimum Viable Product (MVP)** (mobile-first web application) for Debrecen, Hungary, called NAVI.
The goal is to demonstrate a highly functional, persistent, secure, and visually appealing application to potential partners and early users, showcasing the core value proposition convincingly.
Key features for this enhanced MVP include: persistent auth, points system, QR code redemption **with backend validation endpoint**, interactive map view, and a significantly improved UI/UX.

## Current Status (as of {{TIMESTAMP}})

*   **Setup:** Node.js/Express backend. ~~Vanilla JS/HTML/CSS frontend (Basic Styling).~~ **Decision made to migrate frontend.**
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

*   **Ambition Increased:** Confirmed.
*   **UI/UX Priority:** Confirmed.
    *   **Frontend Stack Chosen:** Migrate to **React (with Vite)** for structured UI development.
    *   **Styling:** Use **Tailwind CSS** for utility-first styling and rapid development.
    *   **Animation:** Incorporate **Framer Motion** for smooth, engaging animations.
    *   **Design Direction:** Aim for a modern, polished look with Duolingo-inspired gamification elements and a pink primary color scheme.
*   **Map View:** Implementing an interactive map for business discovery is now part of the enhanced MVP scope.
*   **QR Code Validation Endpoint:** Adding a backend endpoint to validate redemption tokens is now included to demonstrate the full secure loop (partner scanning interface still deferred).
*   **Persistent Database:** Implemented.
*   **Partner App Deferred:** Confirmed. Partner features (scanning UI, dashboard) will follow the enhanced MVP.
*   **Rate Limiting:** To be refined and made configurable.

## Immediate Next Steps (Revised Roadmap)

1.  **(Current Focus): Initialize React Frontend & Setup:**
    *   Scaffold a new React + TypeScript project using Vite.
    *   Install and configure Tailwind CSS.
    *   Install Framer Motion.
    *   Restructure project directories (integrate Vite frontend with Express backend).
    *   Configure Vercel/`vercel.json` for the new monorepo-like structure (serving frontend + API).
2.  **Migrate Core UI to React Components:**
    *   Rebuild Auth forms (Signup/Login).
    *   Rebuild Business/Reward list display.
    *   Rebuild QR Code modal.
    *   Integrate API calls (`fetch`) within React components/hooks.
    *   Apply initial Tailwind styling based on the pink theme.
3.  **Core Feature Polish:**
    *   Revert temporary rate limit duration to a realistic value (e.g., 8-24 hours).
    *   Improve error handling and user feedback messages.
    *   Enhance QR code modal presentation.
4.  **Map View Implementation:**
    *   Choose map library (e.g., Leaflet.js).
    *   Add coordinates to business data (DB schema update + seeding).
    *   Implement map display with interactive markers.
5.  **Partner QR Code Validation Endpoint:**
    *   Create backend API endpoint (`POST /api/redemptions/validate` or similar).
    *   Endpoint logic: Find redemption by token, check expiry/status, update status to 'REDEEMED', return success/failure.
6.  **(Later):** Gamification implementation (animations, progress bars etc.), Landing Page, Partner App, Admin Panel etc.

## Future Ideas / Roadmap (Post-Enhanced MVP)

*   Build Partner-Facing Interface (QR scanner, stats).
*   Build Admin Panel.
*   // ... (other items remain)

## Local Setup

*   Requires PostgreSQL connection string as `DATABASE_URL` env var.
*   **(Update Needed):** Will involve running both the Vite dev server (for frontend) and the Node.js server (for backend) concurrently, likely using `npm-run-all` or similar.

---
*This file reflects the updated strategy for an Enhanced MVP as of {{TIMESTAMP}}.* 