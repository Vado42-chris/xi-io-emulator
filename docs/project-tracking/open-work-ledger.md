# Open Work Ledger

Date: 2026-05-28

## Canonical planning (2026-05-28)

All phase execution is governed by:

```txt
docs/project-tracking/master-plan-2026-05.md          ← source of truth
docs/project-tracking/repo-health-audit-2026-05.md  ← repo health (RED)
docs/project-tracking/historical-plans-consolidation.md
docs/project-tracking/admin-feature-audit-index.md
docs/project-tracking/feature-matrix.md
```

Repo health must reach **YELLOW** before source implementation resumes. See master plan Phase -1.

**Phase -1 progress (2026-05-29):** UI framework docs merged; WIP branch map published; branch policy in README. Source isolation to named branches **pending peer review**.

**Phase 0 progress (2026-05-29):** XIO-LCH-014–016 + parity matrix in `launch-failure-codes.md`; runbook sections for startup timeout, Flatpak parse, preflight validation; `xi-io-net-sync-status.md` reconciled.

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
Operations runbooks: docs/operations/launch-failure-codes.md, docs/operations/troubleshooting-pass-b.md
```

**Pass B status:** partial — NES launch/return improved (user 2026-05-30); full checklist + SNES + A/B still open. **Pass C:** not safe until PRH-04. **Pre-release hardening:** see below.

### Pre-release hardening (XARCADE-PRE-RELEASE-HARDENING-001)

**Tracker (plain language, update every slice):** [pre-release-hardening-milestones.md](./pre-release-hardening-milestones.md)  
**Security baseline:** [../security/supply-chain-security-baseline.md](../security/supply-chain-security-baseline.md)

| ID | What | Status (2026-05-30) |
|----|------|---------------------|
| PRH-01 | SQLite play/session data | Not started |
| PRH-02 | `shell_focus_restore_failed` ledger | **Done** |
| PRH-03 | Commit + push WIP | Pushed `45d55ee` to GitHub; xi-io.net mirror pending |
| PRH-04 | Pass B closeout + peer review | In progress |

**Blocks bulk hydration until all four are Done or deferred with date in tracker.**

Verify: `npm run verify:deps` (npm audit; cargo-audit optional until installed).

### Pass B edge-case matrix (lifecycle / display / controller)

| Edge case | XIO code | Ledger today | Status |
|-----------|----------|--------------|--------|
| FCEUX ROM closed but emulator alive (black screen) | XIO-LCH-011 | none | Fix in progress; user retest pending |
| Stale demo/mock `/media/arcade-usb/` records | XIO-LCH-010 | `launch_blocked` | Mitigated — proof shelf + blocker copy |
| Duplicate xi-io instance | XIO-LCH-012 | none | `single_instance` flock; user verify pending |
| Shell focus restore failure | XIO-LCH-008 | `shell_focus_restore_failed` + `shell_focus_restored` | **Implemented** — user HW retest in PRH-04 |
| Display identify silent failure | XIO-LCH-009 | none | UI silent; runbook documents |
| A/B not mapped at launch | — | none | **Pass B blocker** |
| xdotool missing (window-title fallback) | XIO-LCH-011 | none | FD-only fallback; document in runbook |
| bsnes temporary smoke only (not Snes9x) | XIO-LCH-002 | — | SNES proof must use Snes9x + real `.smc` |
| Premature lifecycle kill at spawn | XIO-LCH-011 | none | Fixed (`content_ever_active`); retest pending |
| Display picker blocked launch UX | XIO-LCH-009 | none | Fixed (single-monitor skip, picker flow) |
| Demo mode simulated launch | XIO-LCH-013 | `launch_started` demo flag | Banner + runbook |

Runbook: `docs/operations/troubleshooting-pass-b.md`. Codes: `docs/operations/launch-failure-codes.md`.

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

Known user source root — configure in `projects/local/xi_io_emulator.local.yaml` or `.env.local` (gitignored), not in public git:

```txt
/path/to/your/snes/roms
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
