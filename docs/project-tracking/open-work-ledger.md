# Open Work Ledger

Date: 2026-05-28

## Purpose

This ledger tracks work that must not be lost across chat sessions, Antigravity, Cursor, local agents, and the wider xi-io framework/workbench.

## Current milestone

```txt
XARCADE-CONTROLLER-LAUNCH-PROOF-001
```

## Current decision

Before bulk library hydration, prove the play loop:

```txt
controller proof
real process launch
NES via FCEUX
SNES via RetroArch
exit/return to shell
visible ledger events
```

## Active work

### 001, Cursor controller launch proof

Status: **Pass B partial / blocked — agent-led, user-assisted. Tauri running; proof-only localStorage seeded; stale demo ingress mitigated.**

Operating model:

```txt
docs/decisions/agent-led-pass-b-hardware-proof.md
docs/agent-master-prompt-pass-b-pass-c.md
```

Pass B agent status (2026-05-29, pass 3):

```txt
GitHub: origin/main synced through f1b257e (emulator) and d338880 (xi-io.net)
Workbench: evt-xi-io-emulator-pass-b-partial-001 added
UX: proof-only library hides duplicate shelves; Storage shows configured when proof paths set
Hardware proof rows: still pending user (SNES launch, NES exit, A/B, Mark Verified)
```

Reports:

```txt
docs/reports/pass-b-peer-review-report.md
docs/reports/pass-b-final-evidence-report.md
docs/reports/controller-launch-proof-report.md
```

R1 fixes (2026-05-28):

```txt
Removed auto in-game controller verify on launch exit
Input test requires button press (not detection-only pass)
Split nesProofReady / snesProofReady / overallProofState
Arcade overlay Escape copy corrected
Demo mode banner on Arcade Home
```

Canonical handoff:

```txt
docs/agent-handoff-controller-launch.md
docs/agent-master-prompt-cursor-current.md
```

Tags:

```txt
#xar:controller-launch-proof/current
#adapter:fceux/nes
#adapter:retroarch/snes
#ledger:launch_requested
#ledger:emulator_exited
```

### 002, Arcade Home pivot

Status: product direction locked, implementation may be partially local.

Canonical docs:

```txt
docs/arcade-ui-product-pivot.md
docs/agent-handoff-arcade-home.md
docs/agent-handoff-cursor-arcade-home.md
```

Tags:

```txt
#xar:arcade-home/pivot
#ux:arcade-home/focus-state
```

### 003, Media platform extension track

Status: future track, do not implement in current pass.

Canonical doc:

```txt
docs/future/media-platform-extension-track.md
```

Tags:

```txt
#xio:emulator/media-extension/future
```

### 004, Flatpak storage and device strategy

Status: documented, implementation deferred.

Canonical doc:

```txt
docs/packaging/flatpak-storage-and-device-strategy.md
```

Tags:

```txt
#risk:flatpak/filesystem-access
#xio:emulator/flatpak/storage
```

### 005, Cheats, hacks, patches

Status: documented, execution deferred.

Canonical doc:

```txt
docs/cheats-hacks-and-overlay-strategy.md
```

Tags:

```txt
#xio:emulator/cheats/future
#xio:emulator/patches/future
```

### 006, Image hydration before bulk ingress

Status: **decision + handoff committed (`0f738f5`, `86090b3`) — implementation deferred until after Pass B/C.**

Canonical docs:

```txt
docs/decisions/library-image-hydration-before-bulk-ingress.md
docs/agent-handoff-image-hydration.md
```

Decision:

```txt
Bulk hydration must not be scan ROMs -> GameRecord rows only.
Hydration includes visual identity: artwork, thumbnails, fallback art, source/confidence, review queue.
Missing artwork must not block playability but must be visible as hydration/review state.
Remote/provider downloads stay explicit and user-controlled.
```

Slice order after Pass C:

```txt
XARCADE-IMAGE-HYDRATION-001
XARCADE-IBAL-SLOT-001 (optional/reserved)
XARCADE-STORAGE-001 (gated — no text-only bulk scan)
```

Tags:

```txt
#xar:image-hydration/planning
#xio:emulator/artwork/local-first
#xio:emulator/hydration/images
#risk:provider/image-rights
#todo:storage/image-mapping-before-bulk
```

### 007, Standardization audit

Status: **complete — XARCADE-STANDARDIZATION-AUDIT-001 (`docs/reports/standardization-audit-report.md`).**

Report:

```txt
docs/reports/standardization-audit-report.md
```

Canonical prompts:

```txt
docs/agent-master-prompt-standardization-audit.md
docs/architecture/naming-and-pathing-standard.md
docs/architecture/conversation-decision-backlog.md
```

Tags:

```txt
#xio:emulator/pathing/standard
#xio:emulator/naming/standard
#risk:path-drift
#risk:private-path-leak
```

### 008, Non-mutating local SNES library import

Status: **decision committed (`9aa2c97`) — implementation deferred until after Pass B/C and image hydration.**

Canonical doc:

```txt
docs/decisions/non-mutating-local-library-import.md
```

Known user source root, documented for local ops only and not to be hardcoded in source:

```txt
/media/chrishallberg/Storage 22/Games/emulators/ROMS/Super Nintendo for PC (Every SNES Rom N Emu EVER) (11337 roms)/ROMS
```

Decision:

```txt
The SNES library is an external, user-owned source library.
xi-io Emulator may index, tag, hydrate, map artwork, create display titles, and store Rosetta metadata internally.
xi-io Emulator must not move, rename, delete, rewrite, patch, or reorganize the physical ROM files during default import/hydration.
```

Default cleanup is metadata-only:

```txt
preserve sourcePath
preserve rawFilename
create displayTitle
create sortTitle
create canonicalIdentityCandidate
create aliases
attach tags
attach artworkMapping
assign reviewStatus
```

Tags:

```txt
#xio:emulator/storage/non-mutating
#xio:emulator/library/source-root
#xio:emulator/metadata/tagging
#xio:emulator/rosetta/tags
#risk:accidental-file-mutation
#todo:storage/read-only-source-root
```

## Deferred until launch proof passes

```txt
bulk local library hydration (also gated by XARCADE-IMAGE-HYDRATION-001 and non-mutating import rules)
SQLite migration
full storage root scan
automatic artwork/provider downloads
cheat execution
patch execution
PS1/PS2
media/debrid features
physical ROM renames/moves/deletes
```

## Known risks

```txt
Tauri compile requires Linux WebKit/libsoup packages (see controller-launch-proof-report.md).
Tauri process spawning not yet proven on user hardware.
Controller in-game verification requires explicit user action (Mark In-Game Verified).
Local master synced with origin/main (`86090b3` includes image hydration decision).
Bulk library ingress gated by XARCADE-IMAGE-HYDRATION-001 — no text-only GameRecord scan.
Full SNES source root contains 11,337 ROMs and must be imported read-only by reference.
Flatpak may complicate filesystem and device access.
FCEUX path and launch arguments need validation on user machine.
RetroArch SNES core path needs validation on user machine.
xi-io.net manifest/hydration mirrored locally (see docs/framework/xi-io-net-sync-status.md); Workbench preview event pending.
```

## Framework sync reminders

```txt
Update this ledger after every slice.
Use serialized hashtags for durable comments.
Add docs/reports/<slice>.md for completed implementation passes.
Add project manifest and hydration state only after launch proof passes.
Mirror milestone state to xi-io workbench when framework repo/workbench is available.
```

## Next expected report

```txt
docs/reports/controller-launch-proof-report.md
```

Required sections:

```txt
Summary
Files changed
Current branch and sync state
Tauri backend status
FCEUX adapter status
RetroArch adapter status
Controller proof result
NES proof game result
SNES proof game result
Commands run
Pass/fail results
Known blockers
Next recommended slice
```
