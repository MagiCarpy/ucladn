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

- [ ] **Clean Up Redundant ClassNames:**
  - Search for components with highly repetitive, nested, or redundant inline Tailwind classes and refactor them into clean, reusable structures.
- [ ] **Resolve Class Conflicts and Specificity:**
  - Identify areas where custom CSS stylesheet overrides clash with Tailwind utilities, and replace them with standard Tailwind classes or use `tailwind-merge` (`cn`).
  - Standardize components to use standard Tailwind spacing and layout tokens rather than ad-hoc margin or padding values.

---

## 4. Responsive Design, Accessibility (a11y), and Appearance

- [ ] **Verify Responsive Layouts:**
  - Audit all core screens (Map, Dashboard, Chat, Request List, details panels) on mobile (under 400px), tablet, and desktop viewports to ensure clean stacking and scrolling behavior.
- [ ] **Accessibility (a11y) & Contrast:**
  - Check color contrast ratios (conforming to WCAG AA guidelines) across light and dark modes.
  - Add missing ARIA labels, focus-visible outlines, and screen reader-friendly roles for interactive elements.
- [ ] **Polish Interactive Transitions:**
  - Implement subtle micro-animations (e.g., smooth hover transitions, scale-on-click for buttons, page fade-ins) to make the interface feel responsive and premium.
