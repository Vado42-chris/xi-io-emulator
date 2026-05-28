# Controller Launch Proof Report

Date: 2026-05-28  
Milestone: **XARCADE-CONTROLLER-LAUNCH-PROOF-001**  
Tags: `#xar:controller-launch-proof/current` `#adapter:fceux/nes` `#adapter:retroarch/snes`

## Summary

Implemented the controller + dual-engine launch proof foundation: Tauri Rust scaffold, adapter manifests (`fceux.nes`, `retroarch.snes.snes9x`), controller detection/visual test UI, real launch lifecycle in `launchService.ts`, proof-game registration (no bulk scan), and demo-mode gating for simulated launch.

## Files changed

```txt
src-tauri/                          # Rust scaffold (launch_emulator, path_exists, list_input_devices)
src/data/adapters/                  # JSON adapter manifests
src/services/tauriService.ts
src/services/adapterService.ts
src/services/controllerService.ts
src/services/launchService.ts       # Real launch + ledger lifecycle
src/services/db.ts                  # FCEUX path + proof game settings
src/services/ingressService.ts    # NES support
src/components/ControllersPanel.tsx
src/components/AppShell.tsx
src/components/ArcadeHome.tsx
src/components/GameDetailPanel.tsx
docs/INDEX.md                       # repo-sync-contract reference fix
package.json                        # tauri scripts + @tauri-apps/api
index.html                          # title fix
projects/manifests/                 # placeholder manifest
projects/hydration/                 # placeholder hydration state
```

## Branch and sync state

- Branch: `master` (merged `origin/main` agent docs)
- Local commits include merge + controller launch proof implementation
- Push to GitHub: pending user approval

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
- **Visual test:** enabled with ledger events (`controller_test_started`, `controller_mapping_created` / `controller_mapping_failed`)
- **In-game verification:** `Mark In-Game Verified` after FCEUX/RetroArch launch proof
- **Honest fallback:** browser dev mode documents Tauri requirement; does not fake Linux device scan

## NES / FCEUX proof result

- **UI:** Register one `.nes` path on Emulator Engines → Proof Games section
- **Runtime:** requires Tauri + valid FCEUX binary path + existing ROM file
- **User action:** configure paths and run `npm run tauri:dev`, then launch proof NES game from Arcade or Library detail

## SNES / RetroArch proof result

- **UI:** Register one `.sfc`/`.smc` path on Emulator Engines → Proof Games section
- **Runtime:** requires Tauri + RetroArch + SNES core paths + existing ROM file
- **User action:** same as NES proof via desktop shell

## Commands run

```bash
git merge origin/main
npm install @tauri-apps/api @tauri-apps/cli
npm run typecheck   # pass
npm run lint        # pass (1 warning in ArcadeHome exhaustive-deps)
npm run build       # pass
cargo check         # fail — missing libsoup-3.0
```

## Pass / fail results

| Gate | Result |
|------|--------|
| typecheck | pass |
| lint | pass |
| build | pass |
| Tauri compile | **blocked** (system deps) |
| End-to-end launch on user machine | **pending user test** in `tauri:dev` |

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
```

## Next recommended slice

**XARCADE-STORAGE-001** — after user confirms dual launch proof in Tauri:

1. Real folder picker + `.nes`/`.sfc`/`.smc` scan
2. Replace `mockFiles` demo ingress
3. Real gamepad shell navigation (replace keyboard-only arcade loop)
4. Expand hydration-state.yaml artifact coverage

Recommended prompt:

```txt
Launch proof passed in Tauri. Begin XARCADE-STORAGE-001: real library roots and scan.
Read docs/INDEX.md and docs/project-tracking/open-work-ledger.md first.
Do not enable artwork scraping or SQLite until storage ingress is stable.
```
