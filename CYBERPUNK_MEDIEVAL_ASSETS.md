## Cyberpunk–Medieval Asset Inventory

This file lists the **visual assets** needed to support the new cyberpunk–medieval Camelot theme across:
- The **marketing site** (hero, landing sections)
- The **in‑app UI** (dashboards, assessment wizard, scanners, chat)

Use this as a checklist when generating images in Midjourney and exporting them into `/camelot-frontend/public/assets/cyberpunk/`.

---

### 1. Brand & Key Art

- **A1 – Logo / Wordmark Lockup Background**
  - **Usage**: App header behind existing Camelot logo text.
  - **Type**: Wide decorative panel (no text).
  - **Aspect ratio**: `21:9`
  - **Resolution target**: 2560 × 440
  - **Notes**: Geometric shield/crest frame, neon teal + orange edges, dark center for logo overlay.

- **A2 – Hero Background (Marketing)**
  - **Usage**: Landing page hero behind headline and CTA.
  - **Type**: Illustration – knight + futuristic Camelot skyline.
  - **Aspect ratio**: `16:9`
  - **Resolution target**: 2560 × 1440
  - **Notes**: Knight on right side, empty space on left for copy; no embedded UI or text.

- **A3 – Hero Background (In‑App Shell)**
  - **Usage**: Top section of main logged‑in layout.
  - **Type**: Low‑detail skyline + towers.
  - **Aspect ratio**: `21:9`
  - **Resolution target**: 2560 × 600
  - **Notes**: Very low contrast; designed to sit behind navigation and breadcrumbs.

---

### 2. Assessment & Workflow Backgrounds

- **B1 – New Assessment Wizard Background**
  - **Usage**: Full‑width background behind the “New Assessment” 3‑step wizard.
  - **Type**: City street leading to fortified “data keep”.
  - **Aspect ratio**: `16:9`
  - **Resolution target**: 1920 × 1080
  - **Notes**: Clear central area for the form panel.

- **B2 – Endpoints & Tools Step Background**
  - **Usage**: Second wizard step, more technical.
  - **Type**: Castle interior with holographic consoles and rune‑circuit walls.
  - **Aspect ratio**: `16:9`
  - **Resolution target**: 1920 × 1080
  - **Notes**: Slightly busier, but center should still be calm for UI.

- **B3 – Review & Launch Step Background**
  - **Usage**: Final confirmation step.
  - **Type**: Knight overlooking neon city from castle balcony.
  - **Aspect ratio**: `16:9`
  - **Resolution target**: 1920 × 1080
  - **Notes**: Emphasize readiness and vigilance; keep lower center calm.

---

### 3. Dashboard & Metrics Backgrounds

- **C1 – Global Dashboard Background (Low Detail)**
  - **Usage**: Logged‑in dashboard behind cards and charts.
  - **Type**: Silhouettes of futuristic towers + spires.
  - **Aspect ratio**: `16:9`
  - **Resolution target**: 2560 × 1440
  - **Notes**: Very low detail and desaturated; mostly gradients and shapes.

- **C2 – Metrics / Achievements Background**
  - **Usage**: Metrics/Reports overview.
  - **Type**: Hall of holographic banners and shields.
  - **Aspect ratio**: `16:9`
  - **Resolution target**: 1920 × 1080
  - **Notes**: Columns and banners framing central data grid area.

---

### 4. Character & Narrative Assets (Arthur)

- **D1 – Knight Full‑Body (Hero Pose)**
  - **Usage**: Marketing hero and splash screens.
  - **Type**: Full‑body illustration; transparent PNG if possible.
  - **Aspect ratio**: `3:4`
  - **Resolution target**: 1600 × 2133

- **D2 – Knight Full‑Body (Analyst Pose)**
  - **Usage**: Assessment wizard intro and empty states.
  - **Type**: Knight consulting a holographic map / dashboard.
  - **Aspect ratio**: `3:4`
  - **Resolution target**: 1600 × 2133

- **D3 – Knight Full‑Body (Defensive Pose)**
  - **Usage**: Error states, security alerts.
  - **Type**: Knight with shield raised blocking neon attack.
  - **Aspect ratio**: `3:4`
  - **Resolution target**: 1600 × 2133

- **D4 – Knight Portrait Avatar**
  - **Usage**: Chat assistant badge (“Arthur”) and user helper tooltips.
  - **Type**: Head‑and‑shoulders portrait.
  - **Aspect ratio**: `1:1`
  - **Resolution target**: 512 × 512
  - **Notes**: Works well when cropped to a circle.

---

### 5. Test Type Spot Illustrations

Individual illustrations used in cards and feature sections:

- **E1 – Web Application Security**
  - **Motif**: Holographic castle gate made of code, teal grid arch.
  - **Aspect ratio**: `4:3`
  - **Resolution**: 1200 × 900

- **E2 – Network Security**
  - **Motif**: Cyberpunk watchtower broadcasting neon beams across sky.
  - **Aspect ratio**: `4:3`
  - **Resolution**: 1200 × 900

- **E3 – Cloud Security**
  - **Motif**: Floating cyberpunk citadel above clouds with circuit‑etched walls.
  - **Aspect ratio**: `4:3`
  - **Resolution**: 1200 × 900

- **E4 – Social Engineering / Human Risk (optional)**
  - **Motif**: Shadowy figure approaching castle gate with holographic IDs.
  - **Aspect ratio**: `4:3`
  - **Resolution**: 1200 × 900

---

### 6. Iconography

- **F1 – Navigation Icon Set**
  - **Usage**: Main navigation (Dashboard, Scanners, Chat, Assessment, Metrics, Reports, Settings).
  - **Type**: Neon line icons, 1‑color SVGs.
  - **Aspect ratio**: `1:1`
  - **Resolution**: 256 × 256 (source) → exported as SVG.

- **F2 – Status Icons**
  - **Usage**: Card labels, tool tags (e.g., “Running”, “Queued”, “Failed”).
  - **Type**: Simple glyphs (shield, hourglass, warning rune, checkmark).
  - **Format**: SVG.

---

### 7. Decorative Chrome & Frames

- **G1 – Panel Frame Corners**
  - **Usage**: Optional 9‑slice decorative frame for hero and wizard panels.
  - **Type**: Four corner pieces + vertical/horizontal edges.
  - **Format**: Transparent PNG or SVG.

- **G2 – Section Dividers (Runic Lines)**
  - **Usage**: Horizontal separators on landing pages and long forms.
  - **Aspect ratio**: `21:9`
  - **Resolution**: 2400 × 400 (can be sliced).
  - **Notes**: Thin glowing teal runes with subtle orange accents.

- **G3 – Badge / Emblem Overlays**
  - **Usage**: Small crests on cards (e.g., recommended scanner, premium feature).
  - **Aspect ratio**: `1:1`
  - **Resolution**: 512 × 512
  - **Notes**: Minimal detail, strong silhouettes for small rendering.

---

### 8. Background Variants for Dark UI

Low‑detail scenes for use beneath dense data displays:

- **H1 – Generic City Silhouette Background**
  - **Usage**: Tables, scanner list pages.
  - **Aspect ratio**: `16:9`
  - **Resolution**: 1920 × 1080
  - **Notes**: Mostly gradients; towers as soft silhouettes only.

- **H2 – Interior Command Chamber Background**
  - **Usage**: Scanner configuration and admin pages.
  - **Aspect ratio**: `16:9`
  - **Resolution**: 1920 × 1080
  - **Notes**: Holographic map table in center, dark corners for UI.

---

### 9. File Organization (Proposed)

Place generated assets in:

- `public/assets/cyberpunk/backgrounds/` – A*, B*, C*, H* images.
- `public/assets/cyberpunk/characters/` – D* knight poses and avatars.
- `public/assets/cyberpunk/spot-illustrations/` – E* test type art.
- `public/assets/cyberpunk/icons/` – F* SVG icon sets.
- `public/assets/cyberpunk/decorative/` – G* frames, dividers, emblems.

Each asset should be exported at **2x resolution** where possible to support high‑DPI displays, then optimized (e.g., `imageoptim`, `squoosh.app`) to keep bundle size reasonable.








