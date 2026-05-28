# Agent Handoff: Controller + Dual Engine Launch Proof

Date: 2026-05-28

## Purpose

This handoff defines the immediate implementation slice after the Arcade Home pivot and local Cursor/Antigravity work. The user has a physical controller connected on Pop!_OS, and that controller already works in FCEUX with NES games. Before bulk library hydration, xi-io Emulator must prove the real play loop.

## Milestone

```txt
XARCADE-CONTROLLER-LAUNCH-PROOF-001
```

## Decision

Use a minimal dual-engine proof path:

```txt
NES: FCEUX with one hand-picked .nes game
SNES: RetroArch + SNES core with one hand-picked .sfc/.smc game
```

This does not mean NES replaces the SNES MVP. It proves the adapter boundary and controller/launch loop using the user's known-good current setup while preserving the original SNES/RetroArch path.

## Do not proceed to bulk hydration yet

Explicitly deferred until this proof passes:

```txt
Full local game-library scan
Bulk ROM root hydration
xi-io hydration YAML for every local game
SQLite migration
Artwork/provider hydration
Cheats/hacks/patch execution
PS1/PS2
```

## Required reading

```txt
README.md
docs/framework-alignment.md
docs/contracts/controller-contract-v1.md
docs/contracts/adapter-contract-v1.md
docs/contracts/game-management-contract-v1.md
docs/decisions/controller-launch-first-decision.md
docs/arcade-ui-product-pivot.md
docs/agent-handoff-cursor-arcade-home.md
docs/iceberg-delivery-roadmap.md
docs/backlog.md
walkthrough.md
```

Also inspect if present:

```txt
src/services/launchService.ts
src/components/AppShell.tsx
src/components/arcade/
src/data/
src/services/
src-tauri/
package.json
task.md
```

## First action: reconcile local truth

Before editing code, run:

```txt
git status
git branch --show-current
git log --oneline -15
npm run typecheck
npm run lint
npm run build
```

Then report:

```txt
current branch
uncommitted files
unpushed commits if knowable
whether master/main are both present
whether launchService is simulated or partially real
whether Tauri Rust scaffold exists
whether controller work has started
whether Arcade Home work has started
```

Do not rename branches or force-push until the working tree is clean and the user approves.

## Implementation order

### Step 1, Tauri process foundation

Implement the smallest Tauri/Rust backend needed for launch proof:

```txt
process spawn command
exit status capture
basic stdout/stderr capture or diagnostics
shell focus/return attempt where practical
safe command argument handling
```

If Tauri is not yet scaffolded, add the minimal scaffold required.

### Step 2, engine adapter records

Add minimal adapter records for:

```txt
fceux.nes
retroarch.snes.snes9x
```

These may be TypeScript constants or JSON manifests depending on current project shape, but they must follow the adapter-contract intent.

Required fields:

```txt
adapter id
engine id
system id
binary path setting
supported extensions
launch command template
readiness blockers
```

### Step 3, controller proof state

The controller is known to work in FCEUX, but xi-io Emulator must not assume that.

Implement only the minimum proof state:

```txt
controller connected / not detected / not tested
visual test placeholder or minimal live test if practical
ledger event for controller test started/completed/failed
status panel updates
```

If live Linux input detection is too large for this pass, document the blocker and make the FCEUX in-game controller proof explicit. Do not fake live detection.

### Step 4, proof games only

Add a minimal way to register/select exactly two proof games:

```txt
one .nes path for FCEUX
one .sfc/.smc path for RetroArch
```

Use hand-picked file paths or an Add Test Game flow. Do not scan full folders.

### Step 5, launch proof

Implement real launch for the proof games only.

Required launch lifecycle:

```txt
launch_requested
launch_blocked if missing path/binary/core
launch_started
emulator_exited
launch_failed if process fails
shell_focus_restored or shell_focus_restore_failed
```

### Step 6, UI gating

```txt
Remove or gate simulateLaunchGame behind demoMode.
Do not show fake success for real proof games.
Only enable Play when readiness passes.
Show exact blockers when readiness fails.
```

## Acceptance criteria

```txt
One NES proof game can launch through FCEUX, or exact blockers are shown.
One SNES proof game can launch through RetroArch, or exact blockers are shown.
The connected controller is tested or its detection blocker is documented honestly.
The user can verify controller input in-game for the launched emulator.
Exit returns to the shell or logs exact focus/exit blocker.
All launch attempts write visible ledger/log events.
No full library hydration occurs.
No emulator configs are mutated without explicit approval.
Quality gates pass: typecheck, lint, build.
```

## Guardrails

```txt
Do not bulk scan local libraries.
Do not start SQLite migration.
Do not add PS1 or PS2.
Do not add artwork/provider sync.
Do not add cheats/patch execution.
Do not mutate FCEUX/RetroArch configs.
Do not hardcode user-private ROM paths into committed source.
Do not replace Arcade Mode with an admin page.
```

## Documentation output

Add or update:

```txt
docs/reports/controller-launch-proof-report.md
walkthrough.md
task.md
```

The report must include:

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

## Final response format

```txt
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

---

## Pass B — user hardware proof (current)

R1 peer review: **approved for local hardware proof.** Milestone remains **implemented, pending Pass B.**

### 1. Install Tauri deps (user terminal — requires sudo password)

```bash
sudo apt install libwebkit2gtk-4.1-dev libsoup-3.0-dev build-essential curl wget file libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
```

### 2. Start desktop shell

```bash
cd "/media/chrishallberg/Storage 22/999_Work/003_Projects/015_emulator"
npm run tauri:dev
```

### 3. Configure in Admin → Emulator Engines

| Field | This machine |
|-------|----------------|
| FCEUX | `/usr/games/fceux` |
| RetroArch | `~/.local/share/flatpak/exports/bin/org.libretro.RetroArch` |
| SNES core | Install Snes9x in RetroArch, then paste core `.so` path |

### 4. Register proof ROMs (Engines → Proof Games)

- NES: one `.nes` from your library (e.g. Zelda ROM on Storage 22)
- SNES: one `.smc`/`.sfc` (e.g. Super Mario World)

### 5. Launch, verify controller, click Mark In-Game Verified

Do **not** bulk-scan libraries. Do **not** start XARCADE-STORAGE-001 until Pass B checklist is returned **and** XARCADE-IMAGE-HYDRATION-001 is implemented (see `docs/agent-handoff-image-hydration.md`).

### Pass B result template

Copy back to Cursor when done — see `docs/reports/controller-launch-proof-report.md` Pass B section.
