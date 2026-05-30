# xi-io.net Framework Sync Status

Date: 2026-05-30 (integration pass — three-bucket merge on WIP)  
Tags: `#xio:emulator/framework-sync` `#xar:controller-launch-proof/pass-b` `#xio:emulator/pathing/standard` `#xibalba:ui-framework/001`

## Purpose

Track two-way sync between **xi-io-emulator** (product repo) and **xi-io.net** (management/hydration plane). This file records what is synced, what is pending, and what agents must update on each side.

## Emulator repo → xi-io.net (outbound)

| Artifact | Local path | xi-io.net target | Status |
|----------|------------|------------------|--------|
| Project manifest | `projects/manifests/xi_io_emulator.project-manifest.yaml` | `003_xi-io_net/projects/manifests/` | **mirrored 2026-05-28** |
| Hydration state | `projects/hydration/xi_io_emulator.hydration-state.yaml` | `003_xi-io_net/projects/hydration/` | **mirrored — pending SHA update this pass** |
| Master plan | `docs/project-tracking/master-plan-2026-05.md` | `projects/evidence/xi_io_emulator/` | **mirrored 2026-05-29; update pending** |
| Repo health audit | `docs/project-tracking/repo-health-audit-2026-05.md` | `projects/evidence/xi_io_emulator/` | **mirrored 2026-05-29** |
| WIP branch map | `docs/project-tracking/wip-branch-map-2026-05.md` | `projects/evidence/xi_io_emulator/` | **mirrored; update pending** |
| Pass B module map | `docs/project-tracking/pass-b-module-map-2026-05.md` | `projects/evidence/xi_io_emulator/` | **mirrored; update pending** |
| Controller mapping plan | `docs/project-tracking/controller-mapping-001-plan-2026-05.md` | `projects/evidence/xi_io_emulator/` | **mirrored** |
| UI framework trio | `docs/framework/xibalba-*.md` | `003_xi-io_net/docs/framework/xibalba/` | **mirrored 2026-05-29** |
| Launch failure codes 014–016 | `docs/operations/launch-failure-codes.md` | Ops runbook mirror | **local only** |
| Pre-release hardening tracker | `docs/project-tracking/pre-release-hardening-milestones.md` | `projects/evidence/xi_io_emulator/` | **pending mirror (PRH-03)** |
| Supply chain security baseline | `docs/security/supply-chain-security-baseline.md` | `003_xi-io_net/security/` (proposed hub) | **pending mirror (PRH-03)** |
| Workbench preview event | `evt-xi-io-emulator-phase-0-docs-001` | `public/data/workbench-events.preview.json` | **mirrored 2026-05-29** |

## xi-io.net → Emulator repo (inbound)

| Source | Expected use | Status |
|--------|--------------|--------|
| UI framework branch docs | `origin/docs/xibalba-ui-framework-001` | **merged 2026-05-29** |
| UI framework CSS (bucket B) | `feature/ui-framework-001` styles | **merged into WIP 2026-05-30** |
| Showcase UX (bucket C) | `feature/showcase-hydration-arcade-ux` | **merged into WIP 2026-05-30** |

## Integration pass 2026-05-30 (this session)

**Problem:** WIP committed ArcadeHome browse UX (bucket A) without CSS (bucket B) or GameTile/gamepad APIs (bucket C).

**Resolved on WIP:**

- Merged `styles.css`, `ui.css`, `tokens.css` from `feature/ui-framework-001`
- Merged `GameTile.tsx`, `arcadeGamepadService.ts` (L1/R1 shoulders) from showcase branch
- Committed bucket C services (catalog, recommendations, ingress, play sessions)
- Shell restore guardrails + `verify:shell-restore` script
- `typecheck:app` gate; FCEUX mapping warns instead of hard-blocking when no pad
- `vite.config.ts` `base: './'` + `scripts/tauri-build-watch.mjs`

**Repo health:** RED → **YELLOW** (build + typecheck pass; HW proof still open)

## Sync commits (latest)

| Repo | Commit | Notes |
|------|--------|-------|
| xi-io-emulator | `45d55ee` | Launch hardening + pre-release/security docs (WIP branch pushed) |
| xi-io-emulator | `f4a0924` | PRH tracker + supply-chain baseline |
| xi-io-emulator | `db0d5c1` | Browse toolbar WebKit fix |
| xi-io.net | `6749225` | Workbench preview event Pass B partial |

## Blockers

```txt
Pass B partial: SNES xi-io GUI launch + NES exit re-test + A/B HW verify + Mark Verified pending user.
Three-bucket split-brain resolved on WIP — peer review + push still pending.
Bulk library ingress gated by XARCADE-IMAGE-HYDRATION-001.
SNES controller mapping slice 3 (RetroArch) not started.
```

## Freshness rule

Update this file whenever:

- A milestone completes in xi-io-emulator
- A hydration artifact changes
- xi-io.net Workbench receives a mirror update
- Launch proof passes or fails on user hardware
- Planning docs (master plan, audit, framework standard) change
