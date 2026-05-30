# Initial Backlog

> **Execution source of truth:** [docs/project-tracking/master-plan-2026-05.md](project-tracking/master-plan-2026-05.md)  
> Slice IDs below are reference; open items merged in [historical-plans-consolidation.md](project-tracking/historical-plans-consolidation.md).

This backlog is intentionally small and slice-based. Do not expand systems until the SNES shell slice is shippable.

## Current milestone

```txt
M0: Framework hydration and local bootstrap — complete
M1: XARCADE-CONTROLLER-LAUNCH-PROOF-001 — implemented, pending user Tauri verification (Pass B)
M1b: XARCADE-IMAGE-HYDRATION-001 — planned, required before bulk ingress
M1c: XARCADE-IBAL-SLOT-001 — optional/reserved; not blocking image hydration
M2: XARCADE-STORAGE-001 — deferred until Pass B/C + image hydration
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

Status: complete locally. Tauri Rust scaffold added; compile requires Linux WebKit/libsoup system packages.

Acceptance:

```txt
Vite + React + TypeScript app created
Tauri configured or explicitly staged with documented blocker
Basic lint/build scripts available
App opens locally
No emulator logic yet
```

## M1b, image hydration before bulk ingress

### XARCADE-IMAGE-HYDRATION-001, local artwork and fallback art

Status: **planned — decision and handoff committed (`0f738f5`, `86090b3`).**

Run after Pass B/C. Run before or alongside XARCADE-STORAGE-001 bulk scan.

Acceptance:

```txt
ArtworkMapping model extended (source, confidence, reviewStatus)
Local thumbnail scanner (xi-io media/ + RetroArch Named_* paths)
Generated fallback art for carousel tiles
Missing artwork visible as hydration/review state — does not block launch
Artwork Health summary in Admin Mode
Review queue staged (missing, low-confidence, duplicate candidates)
No automatic provider image downloads
```

Canonical docs:

```txt
docs/decisions/library-image-hydration-before-bulk-ingress.md
docs/agent-handoff-image-hydration.md
```

Tags:

```txt
#xar:image-hydration/planning
#xio:emulator/artwork/local-first
#xio:emulator/hydration/images
```

### XARCADE-IBAL-SLOT-001, optional assistant slot (reserved)

Status: **documented — do not implement during Pass B/C or image hydration MVP.**

Acceptance (future):

```txt
Optional Ibal assistant slot in shell layout
Command palette contract documented
No required dependency for launch, scan, or artwork matching
Screen keyboard before voice; push-to-talk voice later only
```

Canonical doc:

```txt
docs/decisions/ibal-assistant-and-local-ai-strategy.md
```

Tags:

```txt
#xio:emulator/ibal/optional
#xar:ibal-slot/future
```

## M2, SNES shell MVP (storage — gated)

### XARCADE-STORAGE-001, library root manager

**Gate:** Do not start until XARCADE-IMAGE-HYDRATION-001 is implemented or explicitly documented as in-progress alongside storage. Never bulk-scan as text-only records.

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
