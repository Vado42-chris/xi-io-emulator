# Pass B Module Map

Date: 2026-05-29  
Branch: `wip/pass-b-lifecycle-display-shell`  
Milestone: **XARCADE-CONTROLLER-LAUNCH-PROOF-001** (partial / blocked)

## Purpose

Maps Pass B launch/lifecycle **source modules → failure codes → runbook → verification**. Agents use this before changing launch or exit behavior.

**Does not close Pass B.** Hardware checklist in `docs/operations/troubleshooting-pass-b.md` still required.

---

## Rust (Tauri)

| Module | Responsibility | XIO codes | Verify |
|--------|----------------|-----------|--------|
| `engine_launch.rs` | Flatpak normalize, `prepare_launch`, path validation | 015, 016 | `npm run verify:engine-launch`; `cargo test engine_launch` |
| `session_startup.rs` | 12s startup poll before success | 014 | Launch proof shelf; `pgrep` during overlay |
| `shell_restore.rs` | Debounced restore, subprocess timeout | 008, freeze runbook | NES exit retest; no desktop lockup |
| `window_registry.rs` | Focus retries, xdotool caps | 008, 011 | Controller return chord only |
| `emulator_process.rs` | Spawn, session PIDs, terminate | 006, 007, 011 | `pgrep -af fceux\|retroarch` |
| `lib.rs` | `validate_launch_plan`, `launch_emulator_process` invoke | 016, 006 | Admin → Test Engine Paths |

---

## TypeScript (UI / services)

| Module | Responsibility | XIO codes | Verify |
|--------|----------------|-----------|--------|
| `launchService.ts` | Readiness blockers, preflight, invoke, ledger | 001–005, 010, 016 | Hero blockers clear on proof shelf |
| `engineLaunchService.ts` | TS Flatpak mirror of Rust normalize | 015 | Command preview shows `flatpak run org.libretro.RetroArch` |
| `engineReadinessService.ts` | Per-system proof readiness flags | 001–003 | Admin → Engines |
| `launchDisplayService.ts` | Display index on launch args | 009 | Identify screens picker |
| `useEmulatorSessionLifecycle.ts` | Session event wiring; no duplicate restore | 008 | Overlay clears on `emulator-session-finished` |
| `ArcadeHome.tsx` | Launch overlay, proof shelf, error surfacing | all launch UX | Pass B Launch Proof shelf only |

---

## Verification commands (WIP branch)

```bash
git checkout wip/pass-b-lifecycle-display-shell
export CARGO_TARGET_DIR=".tmp/cargo-target"
npm run typecheck
npm run verify:engine-launch
cd src-tauri && cargo test
npm run tauri:dev   # user hardware — not agent-only
```

---

## Pass B close checklist (user hardware)

| Row | Status |
|-----|--------|
| SNES launch via xi-io GUI (proof shelf) | **Open** |
| NES exit/return after hardening | **Open** |
| Controller A/B in-game | **Open** (XARCADE-CONTROLLER-MAPPING-001) |
| Mark In-Game Verified | **Open** |
| Desktop freeze on exit retest | **Open** |

When all rows pass: update ledger, hydration YAML, `xi-io-net-sync-status.md`, then Pass C (Phase 1C).

---

## Related docs

```txt
docs/operations/launch-failure-codes.md
docs/operations/troubleshooting-pass-b.md
docs/project-tracking/master-plan-2026-05.md  § Phase 1
docs/project-tracking/wip-branch-map-2026-05.md
```
