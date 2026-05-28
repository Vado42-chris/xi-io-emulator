# Controller Launch Proof Report

Date: 2026-05-28  
Milestone: **XARCADE-CONTROLLER-LAUNCH-PROOF-001** (R1 peer-review fix pass)  
Tags: `#xar:controller-launch-proof/current` `#adapter:fceux/nes` `#adapter:retroarch/snes`

## Summary

Implemented the controller + dual-engine launch proof foundation: Tauri Rust scaffold, adapter manifests (`fceux.nes`, `retroarch.snes.snes9x`), controller detection/input test UI, real launch lifecycle in `launchService.ts`, proof-game registration (no bulk scan), and demo-mode gating for simulated launch.

**R1 peer-review fixes (2026-05-28):**

- Removed auto `markInGameControllerVerified()` on emulator exit — user must click explicitly
- Renamed Visual Test → **Run Input Test** (requires Gamepad API button press within 5s)
- Split proof readiness: `nesProofReady`, `snesProofReady`, `overallProofState` (`partial` when only one system ready)
- Fixed Arcade launch overlay copy — Escape closes overlay only, does not kill emulator
- Added visible **DEMO MODE** banner on Arcade Home
- Milestone remains **implemented, pending local hardware proof** — not marked complete

## Files changed

```txt
src-tauri/                          # Rust scaffold (launch_emulator, path_exists, list_input_devices)
src/data/adapters/                  # JSON adapter manifests
src/services/tauriService.ts
src/services/adapterService.ts
src/services/controllerService.ts   # runInputControllerTest, runDetectionTest
src/services/proofReadinessService.ts  # per-system proof readiness (R1)
src/services/launchService.ts       # Real launch + ledger lifecycle
src/services/db.ts                  # FCEUX path + proof game settings
src/services/ingressService.ts      # NES support
src/components/ControllersPanel.tsx
src/components/AppShell.tsx
src/components/ArcadeHome.tsx
src/components/GameDetailPanel.tsx
src/components/StatusPanel.tsx      # NES/SNES/overall proof rows (R1)
src/data/projectStatus.ts           # partial + per-system fields (R1)
docs/INDEX.md
projects/manifests/
projects/hydration/
```

## Branch and sync state

- Branch: `master` (tracks `origin/main`)
- Latest commits: `37a71bb` (R1 peer-review fixes), `db3ddca` (docs), `c6108ab` (implementation)
- Push to GitHub: **synced** (`master` → `origin/main`, commit `37a71bb`)

## Tauri backend status

- **Scaffold:** `src-tauri/Cargo.toml`, `lib.rs`, `main.rs`, capabilities, icons
- **Commands:** `path_exists`, `launch_emulator`, `list_input_devices`
- **Compile blocker:** system dependency `libsoup-3.0` not installed on build host (`cargo check` fails). Install GTK/WebKit deps per [Tauri Linux prerequisites](https://v2.tauri.app/start/prerequisites/) then run `npm run tauri:dev`.

## FCEUX adapter status

- Manifest: `src/data/adapters/fceux.nes.json`
- Engine path setting: `engine.fceux.binary_path` in Emulator Engines page
- Launch template: `{engine_path} {content_path}`

## RetroArch adapter status

- Manifest: `src/data/adapters/retroarch.snes.snes9x.json`
- Settings: RetroArch binary + SNES core path
- Launch template: RetroArch fullscreen + libretro core + content path

## Controller proof result

- **Controllers page:** live detection via browser Gamepad API + Tauri `/proc/bus/input/devices` when in desktop shell
- **Input test:** requires button press within 5s window (`controller_test_started`, `controller_mapping_created` / `controller_mapping_failed`)
- **In-game verification:** explicit **Mark In-Game Verified** only — not auto-set on launch exit (R1)
- **Honest fallback:** browser dev mode documents Tauri requirement; does not fake Linux device scan

## NES / FCEUX proof result

- **UI:** Register one `.nes` path on Emulator Engines → Proof Games section
- **Readiness:** `nesProofReady` in status panel (R1)
- **Runtime:** requires Tauri + valid FCEUX binary path + existing ROM file
- **User action:** configure paths and run `npm run tauri:dev`, then launch proof NES game from Arcade or Library detail

## SNES / RetroArch proof result

- **UI:** Register one `.sfc`/`.smc` path on Emulator Engines → Proof Games section
- **Readiness:** `snesProofReady` in status panel (R1)
- **Runtime:** requires Tauri + RetroArch + SNES core paths + existing ROM file
- **User action:** same as NES proof via desktop shell

## Commands run

```bash
npm run typecheck   # R1 pass — see gate table
npm run lint        # R1 pass — see gate table
npm run build       # R1 pass — see gate table
cargo check         # fail — missing libsoup-3.0 (expected until deps installed)
```

## Pass / fail results

| Gate | Result | Verified |
|------|--------|----------|
| typecheck | pass | 2026-05-28 R1 |
| lint | pass (0 errors, 0 warnings) | 2026-05-28 R1 |
| build | pass | 2026-05-28 R1 |
| git commit (R1) | pass (`37a71bb`, docs `7606c71`) | 2026-05-28 |
| Tauri compile (`cargo check`) | **fail** — `webkit2gtk-4.1` / `libsoup-3.0-dev` not installed | 2026-05-28 |
| End-to-end launch on user machine | **pending** — Pass B | not verified |
| GitHub push (R1) | pass (`7606c71` → origin/main) | 2026-05-28 |
| xi-io.net Workbench mirror | **mirrored** (`32fec7d`) | 2026-05-28 |

## R1 peer-review compliance

| Finding | Status |
|---------|--------|
| Remove auto in-game controller verify on launch exit | **fixed** |
| Milestone = implemented, pending user proof | **documented** |
| Input test requires button press | **fixed** |
| Split NES/SNES/overall proof readiness | **fixed** |
| Arcade overlay Escape copy | **fixed** |
| Demo mode visibility on Arcade Home | **fixed** |
| Report reflects GitHub sync + R1 | **fixed** |

## Known blockers

1. Install Linux Tauri prerequisites (`libsoup-3.0`, WebKitGTK) before `npm run tauri:dev`
2. User must configure FCEUX / RetroArch / core paths and register proof ROM paths (not committed)
3. Real launch blocked in Vite-only browser mode by design (`missing_tauri` blocker)

## Deferred (unchanged)

```txt
bulk local library hydration
SQLite migration
full storage root scan
artwork/provider downloads
cheat/patch execution
PS1/PS2
media/debrid features
launch-as-session PID polling
narrow Tauri permissions
CI workflow
```

## Next recommended slice

**User verification pass (Pass B):** install Tauri deps, run `npm run tauri:dev`, prove NES + SNES launch, mark in-game controller verified manually.

Then **Pass C** milestone close, then **XARCADE-IMAGE-HYDRATION-001**, then **XARCADE-IBAL-SLOT-001** (optional), then **XARCADE-STORAGE-001** — bulk ingress is gated; never text-only `GameRecord` scan.

---

## Pass B — local hardware proof (in progress)

**Agent attempt (2026-05-28):** `sudo apt install …` failed — password required in non-interactive shell. User must run the install command locally, then `npm run tauri:dev`.

**Machine discovery (not committed to source — configure in UI):**

| Setting | Suggested path on this machine |
|---------|-------------------------------|
| FCEUX binary | `/usr/games/fceux` |
| RetroArch binary (Flatpak) | `/home/chrishallberg/.local/share/flatpak/exports/bin/org.libretro.RetroArch` |
| SNES core | Install **Snes9x** via RetroArch Online Updater, or point to an existing libretro core under `~/.var/app/org.libretro.RetroArch/config/retroarch/cores/` (bsnes cores present; snes9x not found at scan time) |
| NES proof ROM | `/media/chrishallberg/Storage 22/Games/emulators/Legend of Zelda, The (USA) (Rev 1).nes` |
| SNES proof ROM | e.g. `…/ROMS/Super Mario World (E) (V1.1) [!].smc` under your SNES ROM folder |

**Pass B checklist (user fills in after test):**

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

**Pass C (agent, after Pass B):** close milestone docs, set hydration `overall_state`, refresh xi-io.net mirror + Workbench preview event.
