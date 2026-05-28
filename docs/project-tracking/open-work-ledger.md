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

Status: **R1 approved — Pass B blocked on sudo/Tauri deps — pending user hardware verification in `npm run tauri:dev`.**

Pass B agent check (2026-05-28):

```txt
sudo apt install … failed (password required in agent shell)
cargo check still blocked until user installs webkit2gtk + libsoup
FCEUX found at /usr/games/fceux
RetroArch Flatpak found at ~/.local/share/flatpak/exports/bin/org.libretro.RetroArch
snes9x core not found on disk — install via RetroArch or configure core path in Engines UI
```

Report:

```txt
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

## Deferred until launch proof passes

```txt
bulk local library hydration (also gated by XARCADE-IMAGE-HYDRATION-001)
SQLite migration
full storage root scan
automatic artwork/provider downloads
cheat execution
patch execution
PS1/PS2
media/debrid features
```

## Known risks

```txt
Tauri compile requires Linux WebKit/libsoup packages (see controller-launch-proof-report.md).
Tauri process spawning not yet proven on user hardware.
Controller in-game verification requires explicit user action (Mark In-Game Verified).
Local master synced with origin/main (`86090b3` includes image hydration decision).
Bulk library ingress gated by XARCADE-IMAGE-HYDRATION-001 — no text-only GameRecord scan.
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
