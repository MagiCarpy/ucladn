# Styling Guide: Tailwind CSS & Shadcn/ui

This project uses **Tailwind CSS** for styling and **shadcn/ui** for component patterns.

- This is an AI generated guide explaining the current theme and how to extend it manually.

## 1. Current Theme (UCLA Palette)

The application uses a custom UCLA-inspired color theme defined in `src/index.css`.

### Gemini 3.0 (High) Prompt:

> `"Color palette: light theme = [#FFFFFF, #1E4B9A, #3D78D8, #FFB300]; dark theme = [#0A1F3D, #FFFFFF, #2D68C4, #F2A900]. Generate a styling skeleton using Tailwind CSS and shadcn/ui components that incorporates the themes in the provided color palette."`

### Light Mode Colors

- **Background**: `#FFFFFF` (White)
- **Foreground**: `#1E4B9A` (UCLA Blue - Dark)
- **Primary Button**: `#3D78D8` (Lighter Blue)
- **Secondary**: `#FFB300` (UCLA Gold)

### Dark Mode Colors

- **Background**: `#0A1F3D` (Deep Blue)
- **Foreground**: `#FFFFFF` (White)
- **Primary Button**: `#2D68C4` (UCLA Blue)
- **Secondary**: `#F2A900` (Darker Gold)

## 2. The "Utility-First" Workflow

**We do not write separate `.css` files** for components. Instead, we apply styles directly to JSX elements using Tailwind's utility classes.

**❌ Avoid:**

```css
/* Button.css */
.my-button {
  background-color: blue;
  padding: 10px 20px;
  border-radius: 5px;
}
```

**✅ Do:**

```jsx
// Button.jsx
import { Button } from "@/components/ui/button";

<Button>
  Click Me
</Button>
```

**⚠️ Warning on Ad-Hoc Styling:**
Never attach massive strings of custom states like `className="px-4 py-2 border rounded-md focus:ring-blue-500"` on an `<input>` or raw `<button>`. All global elements are already styled via `index.css` or Shadcn components. Adding inline styling fights the global aesthetic and causes specificity conflicts.

## 3. Modifying the Theme

To change the global theme colors, you do **not** edit individual components. Instead, you modify the CSS variables in `src/index.css`.

### How to Change a Color

1.  Open `src/index.css`.
2.  Locate the `:root` block for Light Mode or `.dark` block for Dark Mode.
3.  Update the HSL values (Hue Saturation Lightness) for the variable you want to change.
    - **Note**: Do not wrap the values in `hsl()`. Just provide the numbers (e.g., `217 66% 54%`).

**Example: Changing the Primary Color**

```css
/* src/index.css */
:root {
  /* Change this line to update the primary color in Light Mode */
  --primary: 220 70% 50%;
}

.dark {
  /* Change this line to update the primary color in Dark Mode */
  --primary: 220 70% 40%;
}
```

### Available Variables

- `--background`: Page background color.
- `--foreground`: Default text color.
- `--primary`: Main action buttons and active states.
- `--secondary`: Secondary actions or highlights.
- `--muted`: Subtle backgrounds and text.
- `--accent`: Hover states and accents.
- `--destructive`: Error states and delete buttons.
- `--border`: Border color for inputs and cards.

## 4. Common Patterns

### Layout (Flexbox)

- `flex`: Enables flexbox.
- `flex-col`: Stacks items vertically.
- `items-center`: Centers items vertically (cross-axis).
- `justify-between`: Spreads items apart (main-axis).
- `gap-4`: Adds 1rem (16px) gap between items.

### Spacing

- `p-4`: Padding of 1rem on all sides.
- `px-4`: Horizontal padding (left/right).
- `py-2`: Vertical padding (top/bottom).
- `m-4`, `mt-4`, `mx-auto`: Margins.

### Responsive Design

Use prefixes to apply styles only at certain breakpoints. The style applies to that breakpoint **and larger**.

- `md:flex-row`: On medium screens and up, use flex-row.
- `lg:p-8`: On large screens and up, use padding 2rem.

```jsx
// Stacks vertically on mobile, side-by-side on desktop
<div className="flex flex-col md:flex-row gap-4">
  <div className="w-full md:w-1/2">Left</div>
  <div className="w-full md:w-1/2">Right</div>
</div>
```

## 5. Arbitrary Values & Hardcoded Dimensions (Avoid When Possible)

While Tailwind allows arbitrary values like `w-[300px]`, **you should avoid this** because it breaks the standardized layout grid and can cause overlap/responsive issues. 

Instead, find the closest standard Tailwind spacing token:

**❌ Avoid:**
```jsx
<div className="w-[300px]">
  Breaks responsive grids
</div>
```

**✅ Do:**
```jsx
<div className="w-72 md:w-80">
  Uses standard 4px scaling grid
</div>
```

Only use arbitrary brackets `[]` for extremely specific positioning (e.g., `top-[15%] z-[1000]`) or third-party integrations.

## 6. Conditional Styling (`cn` helper)

For reusable components where you want to merge default styles with props, use the `cn` utility (imported from `@/lib/utils`).

```jsx
import { cn } from "@/lib/utils";

function Card({ className, children }) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card text-card-foreground shadow",
        className
      )}
    >
      {children}
    </div>
  );
}

// Usage: The 'p-8' here will merge with the default styles
<Card className="p-8 border-red-500">Content</Card>;
```
