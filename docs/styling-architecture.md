# Styling Architecture

This document outlines the technical choices and architecture for styling the Approvio Frontend.

## Overview

Approvio Frontend uses a modern, utility-first styling stack built on **Tailwind CSS**. The architecture is designed to be highly maintainable, type-safe, and capable of supporting advanced features like dynamic theming and accessible UI components.

## Technical Stack

| Technology                         | Purpose                                                                              |
| :--------------------------------- | :----------------------------------------------------------------------------------- |
| **Tailwind CSS**                   | Core utility-first CSS framework for rapid UI development.                           |
| **Shadcn UI**                      | Component collection strategy based on Radix UI primitives.                          |
| **Radix UI**                       | Headless primitives for accessible interactive components (modals, dropdowns, etc.). |
| **CVA (class-variance-authority)** | Type-safe management of component variants (size, intent, state).                    |
| **Tailwind Merge / CLSX**          | Utilities for safe class composition and conflict resolution.                        |
| **CSS Variables (HSL)**            | Runtime-swappable tokens for theme management.                                       |
| **Framer Motion**                  | Engine for high-performance React animations.                                        |

## Key Decisions & Rationale

### 1. Utility-First Approach (Tailwind CSS)

**Choice:** Tailwind CSS v3.
**Rationale:**

- **Developer Velocity:** Styling happens directly in the JSX, eliminating the need to context-switch between files or invent arbitrary class names.
- **Maintainability:** Avoids "Append Only" CSS. When a component is deleted, its styles are effectively gone too.
- **Consistency:** Uses a predefined design token system (spacing, colors, typography) which prevents "layout drift."
- **Performance:** PostCSS purges unused styles, resulting in tiny CSS bundles.

### 2. Radical Accessibility (Radix UI)

**Choice:** Using Radix UI as the foundation for complex interactive components.
**Rationale:**

- **WCAG Compliance:** Radix handles the difficult parts of accessibility (keyboard navigation, focus management, ARIA attributes).
- **Headless Design:** We get all the logic without being forced into a specific visual style, allowing Approvio to maintain its unique premium aesthetic.

### 3. Component Variants (CVA)

**Choice:** Using `class-variance-authority` for building UI components.
**Rationale:**

- **Type Safety:** Variants (e.g., `primary`, `secondary`, `outline`) are strictly typed in TypeScript.
- **Clarity:** It separates the styling logic from the component rendering, making it easy to see all available states for a component at a glance.

```tsx
// Example of the pattern used for buttons:
const buttonVariants = cva("...", {
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground",
      destructive: "bg-destructive text-destructive-foreground"
    },
    size: {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3"
    }
  }
})
```

### 4. Dynamic Theming (CSS Variables)

**Choice:** HSL-based CSS variables linked to Tailwind tokens.
**Rationale:**

- **Zero Runtime Overhead:** Theme switching (like Dark Mode) is handled by the browser by simply toggling a class on the `<html>` or `<body>` element.
- **Runtime Flexibility:** We can dynamically adjust colors at runtime (e.g., user-defined primary colors) without re-compiling Tailwind.
- **Integration:** Tailwind is configured to use these variables directly:
  ```js
  // tailwind.config.js
  colors: {
    primary: "hsl(var(--primary))",
  }
  ```

### 5. Managing Class Conflicts (Tailwind Merge)

**Choice:** `cn` utility wrapper.
**Rationale:**

- Standard string concatenation often leads to duplicate classes (e.g., `px-2 px-4`). `tailwind-merge` intelligently overrides conflicting utility classes, ensuring the last one applied is the one that takes effect.

```ts
import {clsx, type ClassValue} from "clsx"
import {twMerge} from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

## Theme Configuration

The project uses a monochromatic/neutral base color palette (`neutral`) with semantic aliases.

- **Colors:** Defined in `src/index.css` using HSL values.
- **Transitions:** Dark mode is supported via the `.dark` class.
- **Typography:** Uses **Inter** as the default sans-serif font and system monospaced fonts for code blocks.

---

> [!NOTE]
> This styling architecture is intended to be strict. Avoid writing custom CSS in `index.css` unless absolutely necessary (e.g., for complex third-party library integrations).
