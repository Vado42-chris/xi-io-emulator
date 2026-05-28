# Current Cursor Master Prompt

Date: 2026-05-28

Use this prompt for Cursor agents now.

```txt
You are working in:

Vado42-chris/xi-io-emulator

CURRENT MILESTONE:
XARCADE-CONTROLLER-LAUNCH-PROOF-001

CURRENT PRIORITY:
Do not bulk hydrate the local game libraries yet.
First prove the play loop:
1. controller proof
2. real process launch
3. one NES proof game via FCEUX
4. one SNES proof game via RetroArch + SNES core
5. exit and return to shell
6. visible ledger events and no silent failures

FIRST READ:
README.md
docs/INDEX.md
docs/project-tracking/open-work-ledger.md
docs/framework/repo-sync-contract.md
docs/framework/serialized-hashtags-standard.md
docs/agent-handoff-controller-launch.md
docs/decisions/controller-launch-first-decision.md
docs/arcade-ui-product-pivot.md
docs/future/media-platform-extension-track.md
docs/contracts/adapter-contract-v1.md
docs/contracts/controller-contract-v1.md
docs/contracts/game-management-contract-v1.md
docs/contracts/storage-contract-v1.md
docs/packaging/flatpak-storage-and-device-strategy.md

ALSO READ IF PRESENT:
docs/reports/arcade-home-report.md
docs/reports/search-and-filters-report.md
docs/game-ingress-implementation-report.md
docs/library-cockpit-report.md
docs/search-and-filters-report.md
walkthrough.md
task.md

BEFORE EDITING, RUN:
git status
git branch --show-current
git log --oneline -15
npm run typecheck
npm run lint
npm run build

REPORT BEFORE CODING:
- current branch
- uncommitted files
- recent commits
- whether local work is ahead of GitHub
- whether launchService is simulated or partially real
- whether Tauri Rust scaffold exists
- whether controller work has started
- whether Arcade Home work has started
- quality gate results

SAFETY RULES:
- Do not overwrite local Antigravity or Cursor work.
- Do not rename branches or force-push without user approval.
- Do not bulk scan local libraries.
- Do not start SQLite migration.
- Do not add PS1/PS2.
- Do not add media/debrid features.
- Do not add artwork/provider sync.
- Do not add cheat or patch execution.
- Do not mutate FCEUX or RetroArch configs.
- Do not hardcode user-private ROM paths into committed source.
- Do not replace Arcade Mode with an admin page.
- Do not fake controller or launch success.

IMPLEMENTATION ORDER:

1. Minimal Tauri process foundation
- process spawn command
- exit status capture
- basic diagnostics
- safe command argument handling
- shell focus/return attempt where practical

2. Minimal adapter records
- fceux.nes
- retroarch.snes.snes9x

Required adapter fields:
- adapter id
- engine id
- system id
- binary path setting
- supported extensions
- launch command template
- readiness blockers

Use serialized comments where useful:
#adapter:fceux/nes
#adapter:retroarch/snes
#xar:controller-launch-proof/current

3. Controller proof state
- connected / not detected / not tested
- visual test if practical
- ledger event for controller test started/completed/failed
- status panel updates

If live Linux input detection is too large for this pass, document the blocker honestly and rely on in-game FCEUX proof as the current controller proof. Do not fake live detection.

4. Proof games only
- one .nes path for FCEUX
- one .sfc or .smc path for RetroArch
- use hand-picked paths or Add Test Game flow
- no folder scan
- no bulk hydration

5. Real launch proof
Required lifecycle:
- launch_requested
- launch_blocked if missing path/binary/core
- launch_started
- emulator_exited
- launch_failed if process fails
- shell_focus_restored or shell_focus_restore_failed

6. UI gating
- remove or gate simulateLaunchGame behind demoMode
- no fake success for real proof games
- only enable Play when readiness passes
- show exact blockers when readiness fails
- keep Arcade Mode first and Admin Mode for setup/diagnostics

DOCUMENTATION OUTPUT:
Add or update:
docs/reports/controller-launch-proof-report.md
walkthrough.md
task.md
docs/project-tracking/open-work-ledger.md

Use serialized hashtags in durable comments and TODOs per:
docs/framework/serialized-hashtags-standard.md

QUALITY GATES BEFORE FINAL REPORT:
npm run typecheck
npm run lint
npm run build

FINAL RESPONSE FORMAT:
Summary
Files changed
Commands run
Pass/fail results
Controller proof result
NES/FCEUX proof result
SNES/RetroArch proof result
Risks/blockers
Recommended next prompt
```

## Notes for future agents

This prompt supersedes older prompt fragments that suggested bulk hydration before launch proof.

Future media platform work is documented but out of scope for this pass:

```txt
docs/future/media-platform-extension-track.md
```
