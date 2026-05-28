# Cursor Handoff: Arcade Home Recovery and Continuation

Date: 2026-05-28

## Purpose

This handoff is for continuing xi-io Emulator work in Cursor after Antigravity usage was exhausted.

Cursor agents must first reconcile local state, then continue the product pivot from a static web/admin shell toward a modern controller-friendly arcade/media-center UI.

## Current context

The project has progressed through these local milestones:

```txt
XARCADE-BOOT-001
XARCADE-GAME-INGRESS-001
XARCADE-LIBRARY-001
XARCADE-SEARCH-001
```

Some implementation reports and local changes may exist only in the working tree and may not yet be pushed to GitHub.

Do not assume GitHub has every local file.

## Product correction

The current UI is functional, but it feels too much like a static web app/admin console.

The product must feel like:

```txt
Stremio / Kodi / Netflix / Prime Video / YouTube TV / tvOS-style 10-foot interface
but with games instead of videos
```

The app needs:

```txt
Arcade Mode first
Admin Mode second
large game cards
horizontal shelves/carousels
hero/focused game area
controller hint rail
visible focus states
mouse, keyboard, and controller usability from the start
```

## Required reading

Read these committed repo docs first:

```txt
README.md
docs/arcade-ui-product-pivot.md
docs/agent-handoff-arcade-home.md
docs/iceberg-delivery-roadmap.md
docs/reviews/ui-page-review-index.md
docs/reviews/antigravity-search-001-peer-review.md
docs/reviews/pages/library-page-review.md
docs/reviews/pages/controllers-page-review.md
docs/reviews/pages/storage-review-summary.md
docs/reviews/pages/emulator-engines-page-review.md
docs/reviews/pages/settings-page-review.md
docs/reviews/pages/logs-page-review.md
docs/research/competitor-library-ux-and-schema-notes.md
docs/cheats-hacks-and-overlay-strategy.md
docs/packaging/flatpak-storage-and-device-strategy.md
```

Also read local files if present:

```txt
docs/game-ingress-implementation-report.md
docs/library-cockpit-report.md
docs/search-and-filters-report.md
docs/reports/search-and-filters-report.md
docs/reports/arcade-home-report.md
walkthrough.md
task.md
```

If any expected report is missing, document it. Do not stop unless the source code itself is missing.

## First action, reconcile state

Before editing files, run:

```txt
git status
git log --oneline -15
npm run typecheck
npm run lint
npm run build
```

Then inspect the current app structure:

```txt
src/components
src/data
src/services
src/styles.css
package.json
```

Report:

```txt
Current branch
Uncommitted files
Recent commits
Verification results
Whether XARCADE-SEARCH-001 appears implemented locally
Whether Arcade Home work has already started
```

## Safety rules

```txt
Do not overwrite local Antigravity work.
Do not delete implementation reports.
Do not remove search/filter or duplicate logic.
Do not remove game ingress logic.
Do not remove admin pages.
Do not fake emulator launch.
Do not implement RetroArch launch in this pass.
```

## Task

Complete or continue:

```txt
XARCADE-ARCADE-HOME-001
```

## Goal

Transform the current Library-first dashboard into a modern Arcade Home while preserving existing admin functionality.

Arcade Mode is the user-facing product.
Admin Mode is for setup, diagnostics, storage, engines, logs, and power-user workflows.

## Required visible changes

### 1. Arcade Home

Create an Arcade Home experience with:

```txt
hero/focused game area
large horizontal game shelves
Recently Added shelf
All Games shelf
Needs Configuration shelf
Favorites shelf when available
large placeholder art tiles
focused game state
bottom controller hint rail
```

### 2. Large game tiles

Each tile should show:

```txt
large artwork or generated placeholder area
game title
system badge
launch readiness badge
focus/selected state
```

No tiny icon-only primary actions.

### 3. Focus preview

When a game is focused or selected, show:

```txt
title
system
ingress mode
launch status
next action
reason blocked, if blocked
```

Example:

```txt
Not ready to play
RetroArch path is missing.
Configure Engine to continue.
```

### 4. Controller hint rail

Add visible hints:

```txt
A Select
B Back
X Details
Y Filter
Start Admin
```

These are visual scaffolding for future controller support. They must also make sense for keyboard and mouse users.

### 5. Admin Mode preservation

Keep existing pages available in Admin Mode:

```txt
Library Management
Controllers
Storage
Emulator Engines
Settings
Logs
```

The current left navigation may remain inside Admin Mode, but it should not dominate Arcade Mode.

### 6. Search/filter preservation

Keep existing search/filter logic.

In Arcade Mode, move search/filter toward a large overlay or secondary surface if practical.

Do not remove:

```txt
GameSearchDocument
search service
filters
duplicate candidate detection
filtered empty states
```

## Submerged implementation requirements

```txt
Reuse GameRecord models.
Reuse search/filter services.
Add shelf selectors/helpers if needed.
Add view mode state: arcade/admin.
Preserve ingress controls behind Add Game/Add Folder or Admin Mode.
Keep launch readiness honest.
Keep no-silent-failure status visible but not visually dominant.
```

## Do not implement in this pass

```txt
RetroArch launch
controller detection
controller mapping
artwork downloads
cheat execution
patch execution
provider sync
NES / PS1 / PS2
BIOS handling
true in-game overlay
Flatpak packaging implementation
```

## Design rules

```txt
Games are the hero.
Forms are not the hero.
Admin panels are behind the arcade experience.
Text must be readable from couch distance.
Every primary interactive item needs a visible focus state.
Mouse, keyboard, and controller intent must all be supported by the interaction model.
No hidden failure states.
```

## Suggested component direction

Prefer creating/refactoring toward:

```txt
src/components/arcade/
  ArcadeHome.tsx
  HeroGamePanel.tsx
  GameShelf.tsx
  ArcadeGameTile.tsx
  ControllerHintRail.tsx
  EmptyArcadeState.tsx
  FilterOverlay.tsx, optional
```

Keep admin components separate from arcade components.

## Documentation

Add or update:

```txt
docs/reports/arcade-home-report.md
walkthrough.md
task.md
```

Report must include:

```txt
Summary
Files changed
Visible UI changes
Arcade Mode behavior
Admin Mode preservation
Search/filter preservation
Commands run
Pass/fail results
Known blockers
Next recommended patch
```

## Quality gates

Run before final report:

```txt
npm run typecheck
npm run lint
npm run build
```

Fix simple issues. If failures are environmental, document clearly.

## Final response format

```txt
Summary
Files changed
Commands run
Pass/fail results
Arcade Mode changes
Admin Mode preservation
Search/filter preservation
Risks/blockers
Recommended next prompt
```
