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

Status: **implemented in repo — R1 peer-review fixes applied — pending user verification in `npm run tauri:dev`.**

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

## Deferred until launch proof passes

```txt
bulk local library hydration
SQLite migration
full storage root scan
artwork/provider downloads
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
Local master synced with origin/main after initial push; R1 pass pending commit/push.
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
