# Initial Backlog

This backlog is intentionally small and slice-based. Do not expand systems until the SNES shell slice is shippable.

## Current milestone

```txt
M0: Framework hydration and local bootstrap
M1: XARCADE-SHELL-001, SNES shell MVP
```

## M0, framework hydration

### XARCADE-DOCS-001, initialize project docs

Status: complete in first hydration pass.

Acceptance:

```txt
README exists
Product brief exists
Framework alignment exists
Settings map exists
Adapter contract exists
Storage contract exists
Controller contract exists
Initial backlog exists
Agent handoff exists
```

### XARCADE-BOOT-001, create local app skeleton

Status: pending local agent.

Acceptance:

```txt
Vite + React + TypeScript app created
Tauri configured or explicitly staged with documented blocker
Basic lint/build scripts available
App opens locally
No emulator logic yet
```

## M1, SNES shell MVP

### XARCADE-STORAGE-001, library root manager

Acceptance:

```txt
User can add a folder as a library root
Library root is persisted locally
App detects whether path exists
App shows mounted / missing state
App indexes .sfc and .smc files
App does not delete records when root is missing
```

### XARCADE-LIBRARY-001, arcade library grid

Acceptance:

```txt
SNES games appear in a controller-friendly grid
Game cards show title and status
Missing games or roots are visibly marked
User can open a game detail panel
```

### XARCADE-ENGINE-001, RetroArch detection

Acceptance:

```txt
App can store RetroArch binary path
App can test whether binary exists
App can store SNES core path
App can test whether core exists
Missing binary/core states are visible
```

### XARCADE-ADAPTER-001, RetroArch SNES adapter

Acceptance:

```txt
Adapter manifest exists for retroarch.snes.snes9x
Adapter validates content path
Adapter validates engine path
Adapter validates core path
Adapter builds launch command
Adapter returns blockers before launch
```

### XARCADE-LAUNCH-001, launch and return flow

Acceptance:

```txt
User can launch a selected SNES game
Launch command is logged
Process start failure is visible
Process exit is detected
Shell regains focus after game exits
```

### XARCADE-CONTROLLER-001, controller detection and test

Acceptance:

```txt
App detects at least one connected controller source or records unsupported state
User can test directional and button input
Input state is visible in UI
Unknown controller does not crash app
```

### XARCADE-CONTROLLER-002, SNES visual mapping MVP

Acceptance:

```txt
User can map shell navigation basics
User can map SNES A/B/X/Y/L/R/Start/Select/D-pad
Mapping is persisted locally
Mapping confidence is shown
Mapping can be selected for launch
```

### XARCADE-SETTINGS-001, settings registry MVP

Acceptance:

```txt
Typed settings registry exists
Settings include library, engine, controller, display, saves, logs
Settings have scope, visibility, and risk metadata
Settings can be persisted locally
```

### XARCADE-LEDGER-001, runtime event ledger

Acceptance:

```txt
App records key runtime events locally
Failure events are visible in logs UI
No silent failure categories from docs are ignored
```

## Future milestones

### M2, NES expansion

```txt
NES adapter
NES virtual controller profile
NES file scanner
NES display profile
```

### M3, PlayStation 1 expansion

```txt
DuckStation adapter
PS1 BIOS validator
Disc grouping
DualShock visual mapping
Memory card profile
```

### M4, PlayStation 2 expansion

```txt
PCSX2 adapter
PS2 BIOS validator
DualShock 2 profile
Graphics/performance presets
Per-game compatibility profile
```

## Do not do yet

```txt
Do not add PS1/PS2 before SNES launch flow works.
Do not build a native SNES core.
Do not add metadata scraping before storage and launch are stable.
Do not mutate user RetroArch configs without a generated-file policy.
Do not add cloud features.
```
