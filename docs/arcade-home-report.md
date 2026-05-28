# Arcade Home UI Pivot Implementation Report: Premium 10-Foot Couch UI (XARCADE-ARCADE-HOME-001)

This report documents the design, architecture, and verification of the Arcade Home UI system for the **xi-io Emulator / Xibalba Arcade Shell**.

---

## 1. Milestone Overview

The goal of **XARCADE-ARCADE-HOME-001** was to transform the xi-io Emulator interface from a technical admin dashboard into a premium, 10-foot, controller-friendly Arcade Home Couch UI. We implemented:
- **Dual-Mode System Layout (`AppShell.tsx` & `NavigationRail.tsx`)**: Support for branching between the standard Admin console and the new immersive Arcade Shell. Switches seamlessly with a dedicated navigation toggle button in the sidebar or via the `Esc` key.
- **Carousel-Based Horizontal Shelves (`ArcadeHome.tsx`)**: Replaced grid panels with scrollable carousel shelves:
  - *Recently Added*: Staged in reverse-chronological order.
  - *Favorites*: Quick list of starred games.
  - *Needs Configuration*: Non-ready games highlighting configure blockers.
  - *All Games*: Complete list sorted alphabetically.
  - *Duplicate Candidates*: Grouped titles detected by the duplicate detector layer.
- **Simulated Controller Keyboard Navigation**: Fully keyboard-focusable interface matching standard gamepad mappings:
  - Arrow Keys: D-pad movement across rows/tiles.
  - Enter: Select / Play.
  - Space / X: Toggle Favorite.
  - Y: Toggle fullscreen Search.
  - Esc: Menu button to return to Admin Mode.
- **Onboarding Welcome Screen**: Implements a media-center onboarding screen when the database is empty, featuring direct buttons to trigger single-game ingress, batch folder scanning, or open the admin panel.
- **Glassmorphic Search Overlay**: Fullscreen search portal with input focus and horizontal keyboard results listing.
- **Launcher Simulation Overlay**: Immersive black screen loader indicating system and engine targets.
- **Diagnostics Blocker Panel**: Displays detailed diagnostic banner cards for blocked games in the Hero preview area.

---

## 2. Core Components & Architecture

### A. ArcadeHome Component (`src/components/ArcadeHome.tsx`)
- **State Selectors & useMemo**: Combines filters, sort lists, and duplicate detection helpers into a single memoized calculation reactively bound to the `games` database.
- **D-pad Event Loop**: Captures standard keyboard actions globally:
  - `ArrowUp` / `ArrowDown` transitions between shelves and resets horizontal scroll.
  - `ArrowLeft` / `ArrowRight` cycles through cards on the active shelf.
  - Triggers state overlays for search and launching.
- **Onboarding Interface**: Provides quick start staging triggers calling `ingressSingleGame` and `ingressBatchFolder` directly, offering a frictionless testing path from zero to game carousel.

### B. GameTile Component (`src/components/GameTile.tsx`)
- Renders cards styled as custom game cartridges.
- Implements a deterministic hash selector to generate a unique glassmorphic background gradient based on system ID and game name, ensuring visual diversity.
- Focus-aware visual scaling and box-shadow glow effects triggered on hover or active D-pad index focus.
- Displays indicators for favorite status and launch readiness warnings.

### C. AppShell Refactoring (`src/components/AppShell.tsx`)
- Introduces `appMode` state (`'arcade' | 'admin'`). Defaults to `'arcade'`.
- Plugs in `handleQuickSingleIngress` and `handleQuickBatchIngress` wrappers to pass down to onboarding triggers.
- Injects conditional branch rendering:
  - `admin` renders standard sidebar rail, main view dashboard, and status sidebar.
  - `arcade` renders fullscreen ArcadeHome.

---

## 3. CSS Styling System (`src/styles.css`)

We added dedicated responsive, hardware-accelerated animations and variables:
1. **Glassmorphism**: Leverages subtle dark translucencies, deep shadows, and thin borders (`rgba(255, 255, 255, 0.03)`).
2. **Carousel Shelving**: Uses `.arcade-shelf-carousel` with flex-nowrap layout, hidden scrollbars, and gap spacing to support side-scrolling cards.
3. **Hero Preview Banner**: Glassmorphic backdrops featuring high-contrast text, play buttons, and large system badges.
4. **Controller Hints Footer**: Bar at the bottom of the screen displaying classic controller button labels (`[A]`, `[X]`, `[Y]`, `[Esc]`) matching arcade style.
5. **Launcher Overlay**: Absolute centered loader with keyframe spinning animation.

---

## 4. Verification & Testing

### Automated Checks
- `npm run typecheck`: Passed successfully without errors.
- `npm run lint`: Passed successfully without warnings.
- `npm run build`: Passed successfully, outputting optimized static bundles to the `dist` directory.

### Manual Verification Flow
Using the simulated browser agent, we verified:
1. **Initial Boot (Onboarding)**: App loads into the custom onboarding dashboard when no games exist.
2. **Scan/Ingress Trigger**: Clicking "Stage Single Game" or "Scan Batch Folder" successfully populates the SQLite/local database.
3. **Carousel Display**: Carousel shelves render immediately, with the hero preview updated dynamically on focused game tiles.
4. **Keyboard Control Loop**: Verified D-pad simulated navigation, search key overrides, and favorite toggles.
5. **Admin Escape**: Verified toggle link correctly redirects back to the detailed admin dashboard and back.
