# Master Prompt: Current Next Work

Date: 2026-05-28

## Purpose

This is the current canonical next-work prompt for Cursor agents after the non-mutating SNES library import decision and remaining-work pass plan.

Agents must not rely on chat history. Start here.

## Current lock

```txt
Current active work: Pass B user hardware proof
Agents: paused until user returns Pass B checklist
Current repo state: post standardization audit + non-mutating local library import decision
```

## Prompt for Cursor

```txt
You are working in:

Vado42-chris/xi-io-emulator

CURRENT STATE:
Agents are paused. Do not implement new product features until the user returns Pass B hardware proof results.

CURRENT ACTIVE WORK:
Pass B, owned by user:
- Install Tauri Linux dependencies
- Run npm run tauri:dev
- Register one NES proof ROM
- Register one SNES proof ROM
- Launch NES through FCEUX
- Launch SNES through RetroArch
- Verify controller input in-game
- Click Mark In-Game Verified manually
- Return Pass B checklist

YOUR NEXT AGENT TASK AFTER PASS B:
Pass C — close XARCADE-CONTROLLER-LAUNCH-PROOF-001.

FIRST READ:
README.md
docs/INDEX.md
docs/project-tracking/open-work-ledger.md
docs/reports/controller-launch-proof-report.md
docs/reports/standardization-audit-report.md
docs/roadmap/remaining-work-pass-plan.md
docs/decisions/non-mutating-local-library-import.md
docs/decisions/library-image-hydration-before-bulk-ingress.md
docs/decisions/rosetta-stone-artwork-identity-resolution.md
docs/decisions/ibal-assistant-and-local-ai-strategy.md
docs/architecture/naming-and-pathing-standard.md
docs/architecture/conversation-decision-backlog.md
projects/manifests/xi_io_emulator.project-manifest.yaml
projects/hydration/xi_io_emulator.hydration-state.yaml

PASS C INPUT REQUIRED FROM USER:

```txt
Pass B hardware proof result

Tauri app opened:
NES proof game registered:
NES launched through FCEUX:
NES controller worked in-game:
SNES proof game registered:
SNES launched through RetroArch:
SNES controller worked in-game:
Mark In-Game Verified clicked:
Any launch blockers shown:
Any terminal errors:
Any emulator config changed intentionally:
```

IF PASS B RESULTS ARE NOT PRESENT:
Stop. Do not code. Remind the user that Pass B is required.

IF PASS B RESULTS ARE PRESENT:
Update:
- docs/reports/controller-launch-proof-report.md
- docs/project-tracking/open-work-ledger.md
- projects/hydration/xi_io_emulator.hydration-state.yaml
- projects/manifests/xi_io_emulator.project-manifest.yaml
- docs/framework/xi-io-net-sync-status.md
- xi-io.net mirror artifacts, if available

PASS C DECISION LOGIC:

If NES and SNES both launched and controller worked:
- mark XARCADE-CONTROLLER-LAUNCH-PROOF-001 complete
- set next slice to XARCADE-IMAGE-HYDRATION-001

If one proof path failed:
- do not fake completion
- document exact blocker
- keep next slice as a targeted launch-proof fix

If Tauri failed to open:
- keep milestone pending
- document install/compile/runtime blocker

NON-MUTATING IMPORT INVARIANT:
The local SNES source library is external and user-owned:

/media/chrishallberg/Storage 22/Games/emulators/ROMS/Super Nintendo for PC (Every SNES Rom N Emu EVER) (11337 roms)/ROMS

Do not hardcode this path into source.
Do not scan it yet.
Do not move, rename, delete, rewrite, patch, or reorganize ROM files.
Future import must be by reference, with internal metadata tags only.

BULK HYDRATION GATE:
Do not start XARCADE-STORAGE-001 until XARCADE-IMAGE-HYDRATION-001 is implemented enough to avoid text-only GameRecords.

IMAGE HYDRATION GATE:
Do not auto-download provider artwork.
Do not silently accept low-confidence artwork matches.
Use Rosetta identity resolution before artwork matching.

IBAL GATE:
Do not implement Ibal yet.
Ibal is optional/reserved and must not become a core dependency.

QUALITY GATES:
Run after any Pass C doc/artifact edits:

npm run typecheck
npm run lint
npm run build

FINAL RESPONSE FORMAT:
Summary
Files changed
Commands run
Pass/fail results
Pass B result interpretation
Milestone state
Hydration/manifest updates
Framework sync updates
Remaining blockers
Next recommended prompt
```

## After Pass C

Use:

```txt
docs/agent-master-prompt-image-hydration.md
```

but expand it if needed using:

```txt
docs/agent-handoff-image-hydration.md
docs/decisions/rosetta-stone-artwork-identity-resolution.md
docs/roadmap/remaining-work-pass-plan.md
```
