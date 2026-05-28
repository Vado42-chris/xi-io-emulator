# Antigravity Handoff: Game Ingress and Library Management

Use this handoff after `XARCADE-BOOT-001` is complete and before implementing emulator launch.

## Product intent to lock in

xi-io Emulator is a Linux-first arcade shell for user-owned game libraries. It should manage ingressed games, not merely launch loose files.

The app must support both:

```txt
Single-game ingress
Batch-library ingress
```

The product must work for a user who wants to add one game and play, and for a user with a large existing library who wants an arcade-cabinet experience.

## Required reading

Read these files first, in this order:

```txt
README.md
docs/product-brief.md
docs/framework-alignment.md
docs/settings-map.md
docs/contracts/storage-contract-v1.md
docs/contracts/game-management-contract-v1.md
docs/contracts/adapter-contract-v1.md
docs/contracts/controller-contract-v1.md
docs/backlog.md
docs/local-bootstrap-report.md
walkthrough.md
```

If `docs/local-bootstrap-report.md` or `walkthrough.md` are not present in the repo yet, document that and continue using the committed framework docs.

## Goal for this pass

Lock in the game-management and ingress model locally, then implement the smallest safe foundation for game records.

This pass should complete or prepare:

```txt
XARCADE-GAME-INGRESS-001
```

Do not implement emulator launch yet.

## Required verification before changes

Run:

```txt
git status
git log --oneline -5
npm run typecheck
npm run lint
npm run build
```

If there are uncommitted changes, report them before modifying files. Do not overwrite local work.

## Required implementation scope

Implement a typed game-management foundation based on `docs/contracts/game-management-contract-v1.md`.

### Models

Add or update TypeScript models for:

```txt
GameRecord
GameIdentityStatus
GameLaunchStatus
GameTag
GameMappings
ArtworkMapping
GuideMapping
GameLaunchReadiness
IngressMode
```

### Ingress modes

Support both first-class ingress modes at the data/service level:

```txt
single_game
batch_library
```

Single-game ingress must allow one supported file to become a visible game record without requiring a full library root.

Batch-library ingress must allow many supported files from a selected folder/library root to become visible game records.

### MVP file support

Support only SNES file extensions for now:

```txt
.sfc
.smc
```

Do not add NES, PS1, PS2, archive formats, or disc formats yet.

### Required game-record defaults

For each ingressed SNES game, create a record with:

```txt
systemId: snes
ingressMode: single_game or batch_library
title from filename
sortTitle from normalized title
originalFileName
contentPath
fileExtension
identityStatus: raw or normalized
launchStatus: not_configured
favorite: false
hidden: false
playCount: 0
initial tags:
  system:snes
  source:single_game or source:batch_library
  identity:raw
  launch:not_configured
```

### UI updates

Update the existing shell UI without overbuilding.

The Library view should make the two ingress options clear:

```txt
Add One Game
Add Library Folder
```

If native file/folder pickers are not ready, stage safe disabled controls or local mock inputs, but label them honestly as not yet wired.

The Library view should show:

```txt
No games ingressed yet
Single game records
Batch library records
Game title
System
Ingress mode
Launch status
Tags
Favorite/hidden state
Needs configuration state
```

### Storage interaction

Do not break the existing storage contract.

Single-game records may have no `libraryRootId`.

Batch-library records should retain `libraryRootId` when available.

A missing drive/path must not delete game records.

### Persistence

Use the simplest existing persistence approach in the repo. If no persistence exists yet, use a replaceable localStorage abstraction for now.

Do not add SQLite yet unless already implemented cleanly.

### Ledger/log events

Add lightweight local event records or status messages for:

```txt
single_game_ingress_started
single_game_ingress_completed
single_game_ingress_failed
batch_library_ingress_started
batch_library_ingress_completed
batch_library_ingress_failed
game_record_created
game_tag_added
game_launch_blocked
```

## Do not implement

```txt
RetroArch launch
SNES adapter execution
controller detection
controller mapping
artwork download
metadata scraping
guides/walkthrough providers
RetroAchievements
speedrun APIs
recording
NES / PS1 / PS2
BIOS handling
cloud sync
public ROM download links
```

## Documentation updates

Add or update:

```txt
docs/game-ingress-implementation-report.md
```

The report must include:

```txt
What was implemented
Files changed
Single-game ingress behavior
Batch-library ingress behavior
Persistence decision
Commands run
Pass/fail results
Known blockers
Recommended next slice
```

## Quality gates

Run before final report:

```txt
npm run typecheck
npm run lint
npm run build
```

Fix simple issues. If failures are environmental, document them clearly.

## Final response format

```txt
Summary
Files changed
Commands run
Pass/fail results
Single-game ingress behavior
Batch-library ingress behavior
Risks/blockers
Recommended next prompt
```

Keep this pass small. The goal is durable game-management structure, not emulator launch.
