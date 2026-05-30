# XARCADE-CONTROLLER-MAPPING-001 — Implementation Plan

Date: 2026-05-29  
Branch: `wip/pass-b-lifecycle-display-shell`  
Status: **Slice 1–2 implemented (FCEUX) — pending user HW verify**  
Tags: `#todo:controller/profile-mapping` `#xar:controller-launch-proof/pass-b`

## Problem

Pass B peer review (2026-05-29): D-pad, Start, Select work in xi-io and partially in FCEUX; **A/B dead in-game**.

**Root cause:** `controller_profile` in adapter JSON (`fceux.nes.json`, `retroarch.snes.snes9x.json`) is metadata only. `launchGame` / `buildLaunchPlan` do not emit engine remap configs at launch.

## Scope (Pass B minimum)

| Engine | Controls required at launch | Defer |
|--------|----------------------------|-------|
| FCEUX (NES) | D-pad, Start, Select, **A, B** | Turbo |
| RetroArch (SNES) | D-pad, Start, Select, **A, B** | Analog, turbo |

## Contract layers (from `controller-contract-v1.md`)

```txt
Physical controller → canonical physical schema → virtual system profile → engine remap output
```

Pass B only needs the last hop for proof ROMs:

```txt
nes.standard.v1  → FCEUX input config (or CLI flags if supported)
snes.standard.v1 → RetroArch core remap / autoconfig
```

## Proposed implementation slices

### Slice 1 — Discovery + profile resolution

**Done (2026-05-29):** `controllerMappingService.ts` + `nes.standard.v1.json` + controller poll before launch.

### Slice 2 — FCEUX remap at launch

**Done (2026-05-29):** Isolated `$APP_DATA/fceux-isolated-home/.fceux/` via `HOME` env; `--input1 gamepad`; ledger `controller_profile_applied_to_launch`.

### Slice 3 — RetroArch remap at launch

- Option A: `--appendconfig` with generated remap for SNES core
- Option B: autoconfig overlay in RetroArch user dir (document manual fallback in runbook)
- Verify: A/B in Super Mario World proof ROM

### Slice 4 — Ledger + UI honesty

- Emit `controller_mapping_created` or `controller_mapping_failed` at launch time
- Controllers page: show **Applied at launch** vs **Shell only** state
- Do not auto-check **Mark In-Game Verified**

## Files likely touched

```txt
src/services/adapterService.ts       buildLaunchPlan — inject mapping args
src/services/controllerService.ts    profile resolution
src/services/launchService.ts        call mapping before invoke
src/data/controllerProfiles/         nes.standard.v1, snes.standard.v1 (new)
src-tauri/src/                       optional: write cfg to app data dir
docs/operations/troubleshooting-pass-b.md  A/B verification steps
```

## Verification (user hardware)

```bash
git checkout wip/pass-b-lifecycle-display-shell
npm run tauri:dev
# Pass B Launch Proof shelf only
# NES: in-game A/B test → Mark In-Game Verified
# SNES: same after SNES GUI launch passes
```

## Out of scope (Pass C+)

- Visual mapping UI (XARCADE-CONTROLLER-002)
- Turbo, analog, multi-controller
- Bluetooth-specific profiles

## Related

```txt
docs/contracts/controller-contract-v1.md
docs/decisions/generic-usb-controller-proof-policy.md
docs/project-tracking/pass-b-module-map-2026-05.md
docs/reports/pass-b-peer-review-report.md
```
