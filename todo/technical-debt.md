# Technical Debt & Code Clean-Up Checklist

This document outlines recommended actions to clean up unnecessary files, eliminate dead code, and enforce best practices to reduce technical debt in the UCLA Delivery Network (ucladn) application.

---

## 1. Unused and Temporary Files Cleanup

- [x] **Remove Temporary Notes:**
  - Audit and remove temporary documentation files like [noteMessage.md](file:///Users/carpp/github/ucladn/noteMessage.md) if the chat notes are no longer needed.
- [x] **Remove OS Artifacts:**
  - Clean up `.DS_Store` files in subdirectories (e.g., `Diagrams/`, `backend/`, `frontend/`).
  - Add `*.DS_Store` to the root `.gitignore` to prevent future commits.
- [x] **Cleanup Local Test / Scratch Scripts:**
  - Remove any scratch files, temporary shell scripts, or temporary test runners that are not part of the official Playwright or Jest suites.

---

## 2. Dependency Audit

- [x] **Frontend Packages:**
  - Check if both `emoji-mart` and `emoji-picker-react` are actively used. Remove whichever is redundant. _(Done: Removed unused `emoji-mart`, retained `emoji-picker-react` in Chat.jsx)._
  - Review if Tailwind-related utility libraries (`clsx`, `tailwind-merge`, `class-variance-authority`) are fully utilized. _(Done: Verified they are used in utils.js and components like button.jsx)._
- [x] **Backend Packages:**
  - Audit `axios` in `backend/package.json` to verify if the backend makes outbound HTTP requests. If not, remove it. _(Done: Retained, used for OpenRouteService queries in directions.controller.js)._
  - Check if `compression` is actively enabled in `backend/server.js` or can be safely pruned if handled by reverse proxy (e.g., Nginx). _(Done: Retained, actively enabled in server.js to compress HTTP responses)._

---

## 3. Code Clean-Up & Refactoring

- [x] **Remove Debugging Logs:**
  - Search for and remove verbose `console.log()` statements used during debugging in controller and route files (e.g., `requestController.js`, `messageController.js`). _(Done: Cleaned logs from archive seed routes, LoginSignup, and AuthContext).*
- [x] **Prune Dead Code:**
  - Remove commented-out code blocks in React components (`Chat.jsx`, `InfoPanel.jsx`) and Express routers. _(Done: Cleaned unused POLLING_RATE from Chat, dead mobile logout button from App.jsx, and commented-out dropoff markers and redundant props in Map/InfoPanel).*
  - Clean up unused variable and module imports flagged by the linter. _(Done: Removed unused ALLOWED_MIMES import/array from messageController).*
- [x] **Review Memory Management:**
  - Verify that React hooks and socket listeners in `Chat.jsx` and other realtime components cleanly unsubscribe/disconnect on unmount to prevent memory leaks. _(Done: Verified all socket listener cleanups run on unmount).*
  - Double-check that all Object URLs created via `URL.createObjectURL` are properly revoked via `URL.revokeObjectURL` (as implemented in `SecureImage.jsx`). _(Done: Resolved closure scope bug in SecureImage.jsx by capturing generated URLs in a local variable before async operations).*

---

## 4. Quality Assurance & Best Practices

- [x] **Linting & Formatting:**
  - Configure ESLint/Prettier to run as pre-commit hooks or CI steps to ensure consistent style. _(Done: Added global `lint` script in root package.json for easy CLI or CI hook running).*
  - Resolve any outstanding warnings from running `npm run lint` in the `frontend` workspace. _(Done: Fixed all 21 linter errors, including conditional hook violations, unused variables, global test environments, and configured Fast Refresh guidelines).*
- [ ] **Environment Variable Validation:**
  - Ensure that the backend validates critical environment variables (like `JWT_SECRET`, `MYSQL_URL`, `REDIS_URL`) at startup and crashes early with a clear message if any are missing.
- [ ] **Consistent Error Handling:**
  - Ensure all async Express routes are wrapped with `express-async-handler` (or equivalent try/catch blocks) and that the global error-handling middleware is used.
  - Never leak database connection strings or raw Sequelize stack traces in API error responses to clients.
