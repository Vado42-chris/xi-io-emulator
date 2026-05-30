# xi-io Emulator

A Linux-first, controller-first arcade shell for running emulator engines through a unified Xibalba product experience.

The first target is Pop!_OS with SNES support through an installed emulator backend such as RetroArch and a proven SNES core. The long-term target is a lightweight universal emulator shell with a consistent UI across SNES, Nintendo systems, PlayStation, and PlayStation 2.

## Product thesis

Existing emulator engines are powerful. The user experience around Linux storage, controller setup, per-system configuration, launch flow, and return-to-shell behavior is still too fragmented.

This project should not begin by writing an emulator core from scratch. It should begin by building a polished arcade shell that wraps existing engines with strict adapter contracts, human-readable settings, visual controller mapping, storage awareness, and no-silent-failure logging.

## Initial product goals

1. Provide a modern arcade-style UI for Linux, starting with Pop!_OS.
2. Let users browse, launch, exit, and return to the shell with a controller.
3. Support ROM libraries on secondary drives and external mounted volumes.
4. Detect missing drives and failed launches clearly instead of showing empty or silent states.
5. Provide visual controller mapping, not text-only mapping.
6. Normalize emulator settings into user-facing outcomes.
7. Support multiple emulator engines through adapter manifests.
8. Expand system-by-system without breaking the central shell experience.

## Target expansion path

```txt
Phase 1: SNES
Phase 2: Nintendo systems, beginning with NES
Phase 3: PlayStation 1
Phase 4: PlayStation 2
Phase 5: broader universal emulator shell
```

## Recommended MVP architecture

```txt
React + TypeScript + Vite UI
Tauri desktop shell
Rust sidecar/system services
SQLite local catalog (planned — see PRH-01)
JSON adapter manifests
SDL controller mapping source
RetroArch/libretro backend for first SNES slice
FCEUX for NES proof path
```

## Xibalba framework alignment

This repo should follow the xi-io product pattern:

```txt
Ingress: ROM roots, mounted drives, controller devices, emulator binaries, cores, BIOS folders, metadata
Analysis: system detection, drive availability, controller confidence, core availability, launch readiness
Egress: launch commands, library views, controller profiles, save paths, visible errors, logs
Lexicon: controlled terms for systems, engines, cores, profiles, ROM roots, adapters, saves, firmware
Ledger: project and runtime events that prevent silent failures
```

## Repository status (2026-05-30)

| Item | Value |
|------|--------|
| **Milestone** | XARCADE-CONTROLLER-LAUNCH-PROOF-001 (Pass B partial) |
| **Active branch** | `wip/pass-b-lifecycle-display-shell` |
| **Repo health** | **YELLOW** — build/typecheck pass; HW proof + pre-release hardening open |
| **GitHub default** | `origin/main` |
| **Bulk hydration** | **Blocked** until [pre-release hardening](./docs/project-tracking/pre-release-hardening-milestones.md) PRH-01–04 complete |

Pass B progress (user hardware): NES launch and return-to-shell improved (2026-05-30). Full checklist (SNES, A/B in-game, peer review) still open — see [PRH-04](./docs/project-tracking/pre-release-hardening-milestones.md#prh-04--pass-b-closeout-and-peer-review).

## Documentation map (start here)

Agents and contributors must read in this order:

```txt
1. README.md (this file)
2. docs/INDEX.md
3. docs/project-tracking/master-plan-2026-05.md
4. docs/project-tracking/open-work-ledger.md
5. docs/project-tracking/pre-release-hardening-milestones.md
6. docs/security/supply-chain-security-baseline.md
7. .memory/security.md
```

**Canonical master plan:** [docs/project-tracking/master-plan-2026-05.md](docs/project-tracking/master-plan-2026-05.md) — if Cursor plans diverge, **the repo file wins**.

**Branch policy:** GitHub default is `origin/main`. Pass B lifecycle work lives on `wip/pass-b-lifecycle-display-shell` until reviewed and merged. Do not mix docs-only and source commits in one commit.

**Framework sync:** [docs/framework/xi-io-net-sync-status.md](docs/framework/xi-io-net-sync-status.md)

**Repo health audit:** [docs/project-tracking/repo-health-audit-2026-05.md](docs/project-tracking/repo-health-audit-2026-05.md)

## Pre-release hardening (blocks bulk hydration)

Plain-language tracker: [docs/project-tracking/pre-release-hardening-milestones.md](docs/project-tracking/pre-release-hardening-milestones.md)

| ID | Requirement | Status |
|----|-------------|--------|
| PRH-01 | SQLite for play/session data | Scaffold @ Pass 11 — migration invoke pending |
| PRH-02 | `shell_focus_restore_failed` ledger | Done |
| PRH-03 | Commit + push WIP; mirror xi-io.net | **Done** — WIP `fd623ab`; hub `f1cf7c7` |
| PRH-04 | Pass B evidence + peer review | **In progress** — user sign-off pending |

## Security and dependencies

- Baseline policy: [docs/security/supply-chain-security-baseline.md](docs/security/supply-chain-security-baseline.md)
- Framework standard: [docs/security/framework-security-standard-v1.md](docs/security/framework-security-standard-v1.md)
- Application plan (gap table, path audit): [docs/project-tracking/security-application-plan-xi-io-emulator.md](docs/project-tracking/security-application-plan-xi-io-emulator.md)
- Agent rules: [.memory/security.md](.memory/security.md)
- Local paths: copy [pass-b-local-paths.example.yaml](projects/evidence/xi_io_emulator/pass-b-local-paths.example.yaml) → `projects/local/xi_io_emulator.local.yaml` (gitignored); for showcase hydration also copy [.env.local.example](.env.local.example) → `.env.local`
- Verify before merge: `npm run verify:deps` — npm audit fail moderate+; `cargo-audit` **warn** on Pass B, **fail** pre-release
- Last npm audit (2026-05-30): **0 vulnerabilities**

xi-io.net is the intended **security policy hub** for sibling repos — see baseline doc for propagation pattern.

**WIP branch:** `wip/pass-b-lifecycle-display-shell` @ `6071a90` (substantive `754f258`) — preserved on GitHub, **not merge-ready** without review slicing. xi-io.net mirror @ `9c79e81` (Pass 11).

## Development

### Prerequisites

Linux Tauri dependencies (WebKitGTK, libsoup). See [controller launch proof report](docs/reports/controller-launch-proof-report.md) if `cargo check` fails.

### Commands

```bash
# Web UI only (no real launch)
npm run dev

# Desktop shell (required for Pass B)
export CARGO_TARGET_DIR=".tmp/cargo-target"
npm run tauri:dev

# Quality gates
npm run typecheck:app
npm run build
npm run verify:deps
npm run verify:engine-launch
npm run verify:shell-restore
npm run verify:session-idle
npm run verify:ui-toolbar
npm run verify:metadata-backup
```

### Launch troubleshooting

- [docs/operations/troubleshooting-pass-b.md](docs/operations/troubleshooting-pass-b.md)
- [docs/operations/launch-failure-codes.md](docs/operations/launch-failure-codes.md)

Real game launch requires the Tauri desktop app. Launch only from **Pass B Launch Proof** shelf tiles — not stale demo `/media/arcade-usb/` records.

## First shippable slice

```txt
XARCADE-SHELL-001

Build a Pop!_OS desktop arcade shell that:
  - opens as a modern controller-friendly UI
  - lets the user select a SNES ROM root from any mounted drive
  - indexes .sfc and .smc files
  - detects missing library roots
  - detects a connected controller
  - supports shell navigation with the controller
  - launches a SNES ROM through RetroArch and a SNES core
  - returns focus to the shell after emulator exit
  - logs every failure visibly
```

## Non-goals for the first slice

```txt
Do not write a SNES emulator core yet.
Do not support every console immediately.
Do not start with PS2.
Do not require users to edit RetroArch config files manually.
Do not make emulator internals the primary UI.
Do not silently fail when drives, cores, BIOS files, or controllers are missing.
Do not bulk-hydrate the full SNES library until Pass B/C and PRH gates pass.
```
