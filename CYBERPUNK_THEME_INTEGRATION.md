## Cyberpunk–Medieval Theme Integration Guide

This guide explains how to **apply the new cyberpunk–medieval theme** and assets to the existing Camelot frontend without breaking current behavior.  
The implementation can happen gradually, starting with the assessment flow and dashboards.

---

### 1. Wire Up the Cyberpunk Theme CSS

**File:** `src/index.css`

- Current setup imports the medieval theme:

```css
/* Import Camelot Medieval Theme */
@import './styles/camelot-theme.css';
```

- When you are ready to switch globally, replace the import with:

```css
/* Import Camelot Cyberpunk–Medieval Theme */
@import './styles/camelot-cyberpunk-theme.css';
```

- For a **phased rollout**, you can:
  - Keep the medieval theme as the global default.
  - Import `camelot-cyberpunk-theme.css` only in specific feature‑level entry CSS files (e.g., a new marketing page bundle) until you are ready to flip the root import.

---

### 2. Apply the Cyber Shell Around the App

**File:** `src/App.tsx`

- The main container is currently:

```tsx
<div className="App">
  <Routes>{/* ... */}</Routes>
</div>
```

- To use the new background and typography system, wrap the app in the `.camelot-cyber-app` class:

```tsx
<div className="App camelot-cyber-app">
  <Routes>{/* ... */}</Routes>
</div>
```

This will:
- Enable the neon gradient background defined in `camelot-cyberpunk-theme.css`.
- Apply the cyberpunk UI font stack for body copy while keeping your existing layout and routing logic intact.

---

### 3. Update the Header to Match the New Style

**File:** `src/components/Layout.tsx` and `src/components/Layout.css`

1. **Header container**
   - Add `camelot-cyber-app-header` to the header element:

   ```tsx
   <header className="layout-header camelot-cyber-app-header">
     {/* existing header content */}
   </header>
   ```

   - This applies the glassy, neon header treatment while preserving existing structure.

2. **Title**
   - Apply the display typography style to the product name:

   ```tsx
   <h1 className="camelot-cyber-app-title">Camelot Security Platform</h1>
   ```

3. **Navigation links**
   - Add `.camelot-cyber-app-nav` to the `<nav>` element and keep `nav-link` as is:

   ```tsx
   <nav className="main-nav camelot-cyber-app-nav">
     {/* links */}
   </nav>
   ```

4. **Primary buttons**
   - For high‑value CTAs (e.g., “New Assessment”), use the new button classes:

   ```tsx
   <button className="camelot-cyber-btn camelot-cyber-btn-primary">
     New Assessment
   </button>
   ```

   - For secondary actions, use `camelot-cyber-btn-secondary`; for destructive actions, use `camelot-cyber-btn-danger`.

---

### 4. Styling the New Assessment Flow

**File:** `src/components/Assessment.tsx` (and its CSS)

1. **Layout wrapper**
   - Wrap the main content in `camelot-cyber-section` and `camelot-cyber-panel`:

   ```tsx
   <Layout title="New Assessment">
     <section className="camelot-cyber-section">
       <div className="camelot-cyber-panel camelot-cyber-panel--glow">
         {/* wizard content */}
       </div>
     </section>
   </Layout>
   ```

2. **Form fields**
   - Add `camelot-cyber-input` to inputs and selects that make up the configuration wizard:

   ```tsx
   <input
     className="camelot-cyber-input"
     placeholder="https://example.com, example one, or 192.168.1.1"
     {/* ... */}
   />
   ```

3. **Step indicator**
   - Use the theme colors for active/completed steps via CSS variables rather than hard‑coded colors (e.g., using `var(--camelot-cyber-primary)` and `var(--camelot-cyber-accent)` in the wizard CSS).

4. **Background art**
   - When the `B1/B2/B3` backgrounds are generated, reference them in the assessment CSS:

   ```css
   .assessment-page {
     background-image: url('/assets/cyberpunk/backgrounds/new-assessment-b1.jpg');
     background-size: cover;
     background-position: center;
     background-attachment: fixed;
   }
   ```

   - Use a dark overlay (e.g., `background-color: rgba(15, 23, 42, 0.8)` on the panel) to keep text readable.

---

### 5. Using Backgrounds and Assets Safely

- **Backgrounds**
  - Prefer low‑detail backgrounds (`C1`, `H1`, `H2`) for data‑heavy screens (dashboards, tables).
  - Reserve detailed character scenes (`A2`, `D*`) for marketing pages, splash screens, or empty/zero states where text density is low.

- **File paths**
  - Use the folder structure from `CYBERPUNK_MEDIEVAL_ASSETS.md`:
    - Example: `/assets/cyberpunk/characters/arthur-hero-d1.png`
    - Example: `/assets/cyberpunk/backgrounds/dashboard-c1.jpg`

- **Performance**
  - Serve WebP or AVIF where possible, with JPEG fallbacks.
  - Keep large hero backgrounds under ~500–700 KB after optimization.

---

### 6. Accessibility & Contrast

- Always verify contrast between:
  - `--camelot-cyber-text` and `--camelot-cyber-surface` / `--camelot-cyber-surface-alt`.
  - Button text and their gradient backgrounds.
- Use the neon colors primarily for borders, outlines, and glows; avoid long paragraphs of text in pure neon.
- Maintain keyboard focus outlines: the `.camelot-cyber-input:focus` and button hover/focus styles already provide visible glows—do not remove them.

---

### 7. Rollout Strategy

1. **Phase 1 – Assessment and Dashboard**
   - Import the cyberpunk CSS.
   - Apply `.camelot-cyber-app` at the root.
   - Convert Assessment and Home/Dashboard to use `camelot-cyber-panel`, `camelot-cyber-btn-*`, and `camelot-cyber-input`.
2. **Phase 2 – Scanners and Chat**
   - Introduce relevant spot illustrations (E* assets) into cards and empty states.
   - Apply low‑detail backgrounds (`H1`, `H2`) to scanner and admin pages.
3. **Phase 3 – Full Navigation & Marketing**
   - Swap header/nav styling, integrate hero art on marketing pages, and update any remaining legacy colors to the new tokens.

By following this guide and the design tokens in `CYBERPUNK_MEDIEVAL_THEME.md`, you can progressively move the entire product to the cyberpunk–medieval look while keeping the codebase maintainable and accessible.








