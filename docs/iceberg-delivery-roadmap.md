# Iceberg Delivery Roadmap

Date: 2026-05-28

## Purpose

This roadmap defines how xi-io Emulator should be built in iceberg patches: each slice should deliver a visible UI result while also completing the underlying contracts, models, diagnostics, and documentation required to avoid fragile prototype drift.

The goal is to get a working UI quickly without forgetting storage, game ingress, search, controller support, launch readiness, emulator adapters, preservation mapping, cheats/hacks/patches, or future overlay constraints.

## Delivery principle

Every patch must include both:

```txt
Visible tip:
  A user-facing UI improvement that can be seen and tested.

Submerged base:
  Typed models, service boundaries, persistence, diagnostics, ledger events, docs, and quality checks.
```

A patch is not complete if it only looks finished.

A patch is not complete if it only has models with no visible user journey.

## Current assumed state

```txt
XARCADE-BOOT-001: complete locally
XARCADE-GAME-INGRESS-001: complete locally
Quality gates: typecheck, lint, build passing locally
```

If the local work has not been pushed yet, push or merge it before beginning the next roadmap slice.

## Milestone order

```txt
M0: Framework hydration, complete
M1: App shell bootstrap, complete locally
M2: Game ingress foundation, complete locally
M3: Working library UI and search
M4: Storage hardening and pathing
M5: RetroArch detection and launch readiness
M6: SNES launch and return-to-shell
M7: Controller detection and shell navigation
M8: Visual SNES controller mapping
M9: Artwork/preservation provider registry
M10: Cheats, hacks, patches placeholders and schema
M11: Cabinet polish and MVP hardening
```

## Patch sequence

### Patch 01, Library Cockpit

Goal: Make the current ingressed game records feel real in the UI.

Visible tip:

```txt
Library page shows game cards.
Game detail panel opens.
Single-game and batch-library records are distinguishable.
Empty state explains Add One Game vs Add Library Folder.
```

Submerged base:

```txt
GameCard component
GameDetailPanel component
ReadinessBadge component
TagPill component
Game list selectors
No-silent-failure states
Docs updated
```

Acceptance:

```txt
User can see ingressed games.
User can distinguish single-game vs batch-library ingress.
User can see launch:not_configured.
User can see tags.
User can favorite/hide locally if already implemented safely.
No launch is attempted.
```

### Patch 02, Search and Filters MVP

Goal: Make the library searchable and filterable before it grows.

Visible tip:

```txt
Search box filters games by title, filename, tag, system.
Filter panel supports system, ingress mode, launch status, favorite, hidden.
Duplicate candidates can be surfaced as a filter or warning state.
```

Submerged base:

```txt
GameSearchDocument
Search index builder
Facet model
Filter state
DuplicateGroup model, MVP title-based only
Search tests or documented test cases
```

Acceptance:

```txt
Search works with 0, 1, and many game records.
Filters compose predictably.
Hidden games do not vanish permanently.
Duplicate candidates are advisory only.
No files are moved or deleted.
```

### Patch 03, Storage and Pathing Hardening

Goal: Make secondary-drive and missing-path behavior trustworthy.

Visible tip:

```txt
Storage page shows library roots, path status, last scan, game count, and missing-drive warnings.
Game detail shows root path and relative path.
```

Submerged base:

```txt
Path root + relative path model
Mounted/missing root checks
Storage diagnostics
Rescan summary
Non-destructive missing root behavior
```

Acceptance:

```txt
Missing drive does not delete game records.
Game records can become unavailable and recover.
Single-game records without libraryRootId remain valid.
Batch-library records retain root linkage.
```

### Patch 04, Engine Setup Cockpit

Goal: Prepare launch without launching.

Visible tip:

```txt
Emulator Engines page detects or accepts RetroArch path.
SNES core path can be configured.
Readiness status shows missing engine/core clearly.
```

Submerged base:

```txt
Engine model
Core model
RetroArch engine record
SNES core record
Adapter readiness check
Launch blockers
Diagnostics
```

Acceptance:

```txt
Ready/missing states are visible.
No launch occurs.
No emulator configs are mutated.
Last checked time is visible.
```

### Patch 05, SNES Launch Readiness Per Game

Goal: Connect game records to adapter readiness.

Visible tip:

```txt
Each SNES game detail shows Launch Ready or exact blockers.
Play button is disabled until blockers are resolved.
```

Submerged base:

```txt
retroarch.snes.snes9x adapter manifest wired to readiness only
LaunchReadiness service
Per-game blocker calculation
Ledger events: game_launch_ready, game_launch_blocked
```

Acceptance:

```txt
Ready games are distinguished from blocked games.
Missing drive, missing engine, missing core, and invalid path are separate blockers.
No launch occurs yet.
```

### Patch 06, SNES Launch and Return

Goal: Launch one SNES game through RetroArch and return to shell.

Visible tip:

```txt
Play launches configured SNES game.
Game exit returns user to shell.
Last launch result appears in Logs.
```

Submerged base:

```txt
Tauri command for process launch
Launch command builder
Process monitor
stdout/stderr capture if practical
Exit status capture
Shell focus restoration attempt
```

Acceptance:

```txt
Launch command is logged.
Failed launches show visible error.
Successful exits show status.
Original user files are not modified.
```

### Patch 07, Controller Shell Navigation

Goal: Let the user move through the shell with a controller.

Visible tip:

```txt
Controller page shows connected controller state or unsupported state.
Basic navigation focus works in shell.
```

Submerged base:

```txt
Controller device model
Input event abstraction
Focus/navigation map
Controller confidence state
Diagnostics for unknown controller
```

Acceptance:

```txt
Keyboard remains supported.
Controller navigation does not break mouse use.
Unknown controller does not crash the app.
```

### Patch 08, Visual SNES Mapping MVP

Goal: Build the first visual mapper.

Visible tip:

```txt
User sees SNES controller diagram and mapping prompts.
Mapped controls show as complete/incomplete.
```

Submerged base:

```txt
Physical controller schema
SNES virtual controller schema
ControllerProfile persistence
Mapping validation
Launch profile association, no runtime remap required yet if engine mapping is not safe
```

Acceptance:

```txt
User can create and save a SNES mapping profile.
Required controls are clear.
Invalid/incomplete mapping is visible.
```

### Patch 09, Artwork and Preservation Provider Registry

Goal: Prepare preservation enrichment without downloading everything.

Visible tip:

```txt
Providers page lists factory providers and disabled/enabled state.
Game detail has Artwork panel with placeholder and source state.
```

Submerged base:

```txt
Provider registry
ArtworkMapping model wired
Source/confidence fields
Cache path model
No bundled copyrighted art
```

Acceptance:

```txt
Local artwork can be represented.
libretro thumbnail provider can be listed but not required to sync yet.
Provider source and confidence are modeled.
```

### Patch 10, Cheats/Hacks/Patches UI Placeholders

Goal: Represent the cheat/hack community in the UI without unsafe execution.

Visible tip:

```txt
Game detail has Cheats, Patches, and Hacks & Variants panels.
Search facets can show hasCheats/hasPatches/hasHacks fields if present.
```

Submerged base:

```txt
CheatCode model
PatchProfile model
HackVariant model
Non-destructive patching policy in UI copy
Ledger event names
No execution yet
```

Acceptance:

```txt
Panels are honest: not configured or none added.
No cheats are auto-enabled.
No patch modifies original ROM.
No ROM-hack download catalogs are exposed.
```

### Patch 11, Cabinet MVP Polish

Goal: Make the shell feel like an arcade product.

Visible tip:

```txt
Fullscreen-friendly layout
Large cards
Controller-visible focus states
Recent/favorites shelves
Logs/diagnostics readable from couch distance
```

Submerged base:

```txt
Responsive layout tokens
Cabinet mode setting placeholder
Kiosk-safe copy
Accessibility/focus checks
Smoke-test checklist
```

Acceptance:

```txt
User can understand state from across the room.
UI does not rely on tiny controls for the primary path.
Failure states remain visible.
```

## Code organization rule

Move toward this modular shape gradually. Do not churn the repo just to match the shape in one patch.

```txt
src/
  components/
    shell/
    library/
    search/
    status/
    overlays/
  domains/
    games/
    storage/
    search/
    adapters/
    controllers/
    providers/
    cheats/
    patches/
    ledger/
  infrastructure/
    persistence/
    platform/
  styles/
```

## Required quality gate for every patch

```txt
npm run typecheck
npm run lint
npm run build
```

If a patch adds business logic, it must also add either tests or a documented manual test checklist.

## Required report for every patch

Each patch must update or add a report under `docs/reports/` or a milestone-specific implementation report.

Report format:

```txt
Summary
Files changed
Visible UI changes
Submerged model/service changes
Commands run
Pass/fail results
Known blockers
Next recommended patch
```

## Do-not-forget checklist

```txt
single-game ingress
batch-library ingress
secondary-drive and missing-root behavior
game records, not loose files
tags and lexicon-friendly metadata
search documents
filters and facets
duplicate groups
launch readiness before launch
RetroArch as adapter, not UI model
controller shell navigation
visual controller mapping
artwork and preservation providers
cheats, hacks, patches
non-destructive patching
future overlay constraints
cabinet mode
no public ROM or BIOS downloads
no silent failure
```
