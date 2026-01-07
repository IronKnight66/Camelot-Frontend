## Cyberpunk–Medieval Camelot Theme – Visual System

This document defines the design tokens and core component rules for the new **cyberpunk–medieval** theme.  
It is meant to sit alongside the existing medieval theme (`CAMELOT_THEME_TRANSFORMATION.md`) and can be wired into the app by importing the new CSS theme file described below.

---

### 1. Color System

**Palette goals**
- Dark, cinematic base reminiscent of a night‑time futuristic Camelot.
- Neon teal/blue for technology, scanning, and primary actions.
- Warm orange/red accents for CTAs, warnings, and energy.
- Maintain WCAG AA contrast for all primary text on backgrounds.

**Core tokens (hex)**

- **Backgrounds**
  - `--camelot-cyber-bg`: `#020617` – primary page background (near‑black navy).
  - `--camelot-cyber-bg-soft`: `#050b1f` – softer background for full‑bleed sections.
  - `--camelot-cyber-surface`: `#0b1220` – main panel/card background.
  - `--camelot-cyber-surface-alt`: `#111827` – alternate panels, navigation, modals.
  - `--camelot-cyber-border`: `#1f2937` – subtle borders around panels and inputs.

- **Primary / technology**
  - `--camelot-cyber-primary`: `#22d3ee` – primary teal (links, key icons, accents).
  - `--camelot-cyber-primary-strong`: `#06b6d4` – hover/active on primary elements.
  - `--camelot-cyber-primary-soft`: `#0ea5e9` – subtle outlines, glows, borders.

- **Camelot energy accents**
  - `--camelot-cyber-accent`: `#f97316` – orange CTA buttons and highlights.
  - `--camelot-cyber-accent-soft`: `#fb923c` – hover, glow, gradients.

- **Semantic**
  - `--camelot-cyber-success`: `#4ade80`
  - `--camelot-cyber-warning`: `#facc15`
  - `--camelot-cyber-danger`: `#f43f5e`
  - `--camelot-cyber-info`: `#38bdf8`

- **Text**
  - `--camelot-cyber-text`: `#e5e7eb` – primary body text on dark surfaces.
  - `--camelot-cyber-text-soft`: `#9ca3af` – secondary text, labels.
  - `--camelot-cyber-heading`: `#f9fafb` – headings on dark backgrounds.
  - `--camelot-cyber-muted`: `#6b7280` – disabled / tertiary text.

- **Glows & special effects**
  - `--camelot-cyber-glow-teal`: `0 0 25px rgba(34, 211, 238, 0.35)`
  - `--camelot-cyber-glow-orange`: `0 0 25px rgba(249, 115, 22, 0.4)`
  - `--camelot-cyber-glow-soft`: `0 0 40px rgba(56, 189, 248, 0.25)`

---

### 2. Typography

- **Display / logo / major headings**
  - Variable: `--camelot-cyber-font-display`
  - Recommended stack: `"Cinzel", "MedievalSharp", "Times New Roman", serif`
  - Usage: product name, page titles like “NEW ASSESSMENT”, large hero headings.

- **UI / body**
  - Variable: `--camelot-cyber-font-ui`
  - Recommended stack: `"Inter", "System UI", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
  - Usage: navigation, table text, forms, buttons, helper copy.

- **Monospace (logs, code)**
  - Variable: `--camelot-cyber-font-mono`
  - Recommended stack: `"JetBrains Mono", "SF Mono", Menlo, monospace`

**Type scale (px)**

- `--camelot-cyber-text-xs`: 11
- `--camelot-cyber-text-sm`: 13
- `--camelot-cyber-text-base`: 15
- `--camelot-cyber-text-md`: 16
- `--camelot-cyber-text-lg`: 18
- `--camelot-cyber-text-xl`: 22
- `--camelot-cyber-text-2xl`: 28
- `--camelot-cyber-text-3xl`: 36
- `--camelot-cyber-text-4xl`: 46

Headings should use the display font with increased letter‑spacing and subtle neon glows for key screens (hero, assessment wizard).

---

### 3. Layout, Spacing, and Radius

- **Layout**
  - Dark full‑bleed background with a centered, max‑width content column.
  - Panels and cards float above the cityscape with soft neon glows.

- **Spacing scale**
  - `xs`: 4px – tight labels, small gaps.
  - `sm`: 8px – compact padding in dense UI.
  - `md`: 16px – default padding for panels and cards.
  - `lg`: 24px – section padding, wizard steps.
  - `xl`: 32px – hero content padding.
  - `xxl`: 48px – large hero / dashboard gutters.

- **Radius**
  - `--camelot-cyber-radius-xs`: 4px – tags, chips.
  - `--camelot-cyber-radius-sm`: 6px – inputs, buttons.
  - `--camelot-cyber-radius-md`: 10px – cards and panels.
  - `--camelot-cyber-radius-lg`: 16px – modals, hero containers.

---

### 4. Core Component Styling Rules

These are the visual rules the CSS theme file (`src/styles/camelot-cyberpunk-theme.css`) will implement.

- **App shell**
  - Gradient background from `--camelot-cyber-bg` to `--camelot-cyber-bg-soft`.
  - Top navigation in `--camelot-cyber-surface-alt` with thin teal bottom border.
  - Active nav item: neon teal underline + subtle outer glow.

- **Panels / cards**
  - Background: `--camelot-cyber-surface`.
  - Border: 1px solid `--camelot-cyber-border`.
  - Shadow: faint teal glow via `--camelot-cyber-glow-soft` on hover.
  - Corner radius: `--camelot-cyber-radius-md`.
  - Optional top accent line in `linear-gradient(90deg, #22d3ee, #f97316)`.

- **Buttons**
  - Primary:
    - Background: gradient from `--camelot-cyber-primary` to `--camelot-cyber-accent`.
    - Text: `--camelot-cyber-heading`.
    - Radius: `--camelot-cyber-radius-sm` with strong glow on hover.
  - Secondary:
    - Transparent background, 1px teal border.
    - Text: `--camelot-cyber-primary`.
    - Subtle glow + background fill on hover.
  - Destructive:
    - Background: `--camelot-cyber-danger`.
    - Hover: slightly darker plus inner glow.

- **Inputs / dropdowns**
  - Background: `--camelot-cyber-surface-alt`.
  - Border: 1px solid `#1e293b` with teal focus ring (drop shadow using `--camelot-cyber-glow-teal`).
  - Placeholder text: `--camelot-cyber-muted`.

- **Tags / badges**
  - Filled variants for success/warning/danger using semantic colors.
  - Thin neon outline badges for statuses (e.g., ACTIVE, QUEUED, FAILED).

- **Wizards and progress**
  - Step indicators as glowing circles with runic inner ring.
  - Active step: teal fill, orange ring; complete steps: teal outline; future: muted outline.

---

### 5. Accessibility Notes

- Minimum text contrast:
  - Body text on `--camelot-cyber-surface` uses `--camelot-cyber-text` (AA compliant).
  - Secondary text on dark backgrounds uses `--camelot-cyber-text-soft` only at larger sizes (≥ 16px).
- Avoid pure neon text on pure black; always place neon colors on slightly lighter dark surfaces.
- Focus states must always include a 3px visible outline or glow distinct from hover state.

---

### 6. Implementation Pointers

- The cyberpunk theme can initially be applied to new experiences (e.g., assessment wizard and marketing pages) by wrapping them in a `.camelot-cyber-app` container.
- Eventually, `src/index.css` can switch from importing `camelot-theme.css` to `camelot-cyberpunk-theme.css` when the full migration is ready.
- All colors and component styles should reference the tokens above rather than hard‑coding hex values, to keep the medieval and cyberpunk themes maintainable side by side.








