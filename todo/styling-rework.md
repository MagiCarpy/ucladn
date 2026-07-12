# Styling, CSS, and Tailwind Refactoring Checklist

This document tracks the tasks for auditing the application's styling architecture, eliminating visual design bloat, modernizing the UI aesthetics, and optimizing for responsiveness and accessibility.

---

## 1. Audit and Document Styling Architecture

- [ ] **Document CSS & Tailwind Setup:**
  - Create a styling architecture document explaining how Tailwind CSS, CSS variables, and Shadcn UI components interact (e.g., [index.css](file:///Users/carpp/github/ucladn/frontend/src/index.css) and [tailwind.config.js](file:///Users/carpp/github/ucladn/frontend/tailwind.config.js)).
- [ ] **Identify Redundant Dependencies:**
  - Audit libraries to see if any styling dependencies overlap or create conflicts (e.g., standard leaflet/cluster styling vs. customized React leaflet classes).

---

## 2. Research & Explore Modern, Clean UI Alternatives

- [x] **Aesthetics Audit (Current Design is "Too Cliche"):**
  - Review color schemes, fonts, cards, shadows, and interactive components.
  - Propose modern design updates (e.g., custom elegant dark/light palettes, subtle gradients, soft shadows, glassmorphism, or modern sans-serif typography like _Inter_ or _Outfit_).
  - Evaluate swapping `lucide-react` for `@remixicon/react` (or `@radix-ui/react-icons`) to match the new sharper, cleaner aesthetic (e.g., `--radius: 0.25rem`).
- [x] **Explore Minimal UI Libraries:**
  - Explore whether to expand the use of Radix Primitives/Shadcn UI or evaluate lightweight, minimal components that align with a premium aesthetic.
- [x] **Low-Latency & High-Performance UX:**
  - Prioritize lightweight, highly responsive, and low-latency styling choices to ensure instant user feedback, minimal runtime overhead, and a fast, buttery-smooth UX.

---

## 3. Prune Styling Bloat and Certify CSS Specificity

- [x] **Clean Up Redundant ClassNames:**
  - Search for components with highly repetitive, nested, or redundant inline Tailwind classes and refactor them into clean, reusable structures.
- [x] **Resolve Class Conflicts and Specificity:**
  - Identify areas where custom CSS stylesheet overrides clash with Tailwind utilities, and replace them with standard Tailwind classes or use `tailwind-merge` (`cn`).
  - Standardize components to use standard Tailwind spacing and layout tokens rather than ad-hoc margin or padding values.


---

## 4. Responsive Design, Accessibility (a11y), and Appearance

- [x] **Phase 1: Foundation (Current Priority)**
  - [x] **Responsive Layouts:** Implement mobile-first layouts (`flex-col md:flex-row`) across the App. Ensure seamless wrapping on iPhones (mobile) and tablet views.
    - [x] Dashboard & Map (NavBar, map container, dynamic InfoPanel)
    - [x] Profile page & Settings
    - [x] Cover/Landing page
    - [x] Requests List page
    - [x] New Request page
    - [x] Chat UI
  - [x] **Mobile Behaviors:** Floating panels (like the Map InfoPanel) stack correctly or snap to the bottom on small screens so they don't block the UI. Implemented fluid iOS-style draggable sheet physics.
  - [x] **Semantic HTML & Basic a11y:** Audit icon buttons (add `aria-label`), ensure proper `<button>` elements instead of clickable divs, and confirm keyboard tab-indexing focus states work.
    - [x] InfoPanel toggle, map controls, navbar navigation
    - [x] Remaining buttons in Requests List and Create Request flows

- [ ] **Phase 2: Final Polish & Animations (Postponed)**
  - **Micro-Animations:** Add Framer Motion spring physics for hover states, button click-scales, and accordion menus.
  - **Page Transitions:** Implement route-level fade-ins and skeleton loaders for all API boundaries.
  - **WCAG Audit:** Perform a full formal contrast ratio audit across all light/dark theme variables for AA compliance.
