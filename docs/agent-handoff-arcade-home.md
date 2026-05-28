# Antigravity Handoff: Arcade Home Pivot

Date: 2026-05-28

## Purpose

The current UI works, but it feels like a static web app/admin console. This pass pivots the default experience toward a modern controller-friendly arcade/media-center UI inspired by Stremio, Kodi, Netflix, Prime Video, YouTube TV, and tvOS-style 10-foot interfaces.

## Required reading

```txt
README.md
docs/arcade-ui-product-pivot.md
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
```

## Task

Complete:

```txt
XARCADE-ARCADE-HOME-001
```

## Goal

Transform the current Library-first web dashboard into an Arcade Home experience without deleting the admin/debug functionality.

The app should feel like a game/media platform first, admin tool second.

## UX target

Use a 10-foot interface model:

```txt
large readable type
large horizontal game tiles
shelf/carousel navigation
focused tile scale/glow
hero/focused game area
bottom controller hint rail
minimal form chrome in Arcade Mode
admin tools behind Admin Mode
```

## Required visible changes

### Arcade Home

Create or refactor the current Library view into an Arcade Home with:

```txt
Hero/focused game area
Recently Added shelf
All Games shelf
Needs Configuration shelf
Favorites shelf, if any
Large game tiles with placeholder artwork
Focused game state
Controller hint rail
```

### Game tiles

Each tile should show:

```txt
large placeholder art/title tile
game title
system badge
launch readiness badge
focus state
```

Avoid tiny icon-only primary actions.

### Focus preview

When a game is focused/selected, show a preview area with:

```txt
title
system
ingress mode
launch status
next action
reason blocked, if blocked
```

Example copy:

```txt
Not ready to play
RetroArch path is missing.
Configure Engine to continue.
```

### Navigation

Add clear navigation hints:

```txt
A Select
B Back
X Details
Y Filter
Start Admin
```

These may be visual placeholders for now, but should shape future controller implementation.

### Admin Mode

Keep current pages available in Admin Mode:

```txt
Library Management
Controllers
Storage
Emulator Engines
Settings
Logs
```

The existing left rail may remain for Admin Mode. It should not dominate Arcade Mode.

### Search/filter

Keep existing search/filter logic, but move Arcade Mode search into a large overlay or secondary control surface if practical.

Do not remove the search service or duplicate logic.

## Submerged requirements

```txt
Reuse existing GameRecord models.
Reuse existing search/filter services.
Add shelf selectors.
Add view mode state: arcade/admin.
Preserve existing ingress logic.
Preserve current management controls in Admin Mode or an Add Game flow.
Keep launch readiness honest.
Do not fake emulator launch.
```

## Do not implement

```txt
RetroArch launch
controller detection
controller mapping
artwork download
cheat execution
patch execution
provider sync
NES / PS1 / PS2
BIOS handling
true in-game overlay
```

## Design rules

```txt
Games are the hero.
Forms are not the hero.
Admin panels are behind the arcade experience.
Text must be readable from couch distance.
Every primary interactive item needs a visible focus state.
No tiny icon-only controls as primary actions.
No hidden failure states.
```

## Documentation

Add:

```txt
docs/reports/arcade-home-report.md
```

Include:

```txt
Summary
Files changed
Visible UI changes
Arcade Mode behavior
Admin Mode behavior
Search/filter preservation
Commands run
Pass/fail results
Known blockers
Next recommended patch
```

## Quality gates

Run:

```txt
npm run typecheck
npm run lint
npm run build
```

## Final response format

```txt
Summary
Files changed
Commands run
Pass/fail results
Arcade Mode changes
Admin Mode preservation
Risks/blockers
Recommended next prompt
```
