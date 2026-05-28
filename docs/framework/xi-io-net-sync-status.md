# xi-io.net Framework Sync Status

Date: 2026-05-28 (standardization audit complete)  
Tags: `#xio:emulator/framework-sync` `#xar:controller-launch-proof/current` `#xio:emulator/pathing/standard`

## Purpose

Track two-way sync between **xi-io-emulator** (product repo) and **xi-io.net** (management/hydration plane). This file records what is synced, what is pending, and what agents must update on each side.

## Emulator repo → xi-io.net (outbound)

| Artifact | Local path | xi-io.net target | Status |
|----------|------------|------------------|--------|
| Project manifest | `projects/manifests/xi_io_emulator.project-manifest.yaml` | `003_xi-io_net/projects/manifests/` | **mirrored 2026-05-28 (`a04d8b6`)** |
| Hydration state | `projects/hydration/xi_io_emulator.hydration-state.yaml` | `003_xi-io_net/projects/hydration/` | **mirrored 2026-05-28 (`a04d8b6` → xi-io.net)** |
| Image hydration decision | `docs/decisions/library-image-hydration-before-bulk-ingress.md` | Workbench evidence | **local only — pending mirror** |
| Image hydration handoff | `docs/agent-handoff-image-hydration.md` | Workbench evidence | **local only — pending mirror** |
| Open work ledger | `docs/project-tracking/open-work-ledger.md` | Workbench events / project record | **pending Workbench event** |
| Slice report | `docs/reports/standardization-audit-report.md` | Project evidence | **pending Workbench event** |
| Milestone tags | serialized hashtags in code + docs | Workbench facet filters | **local only** |

## xi-io.net → Emulator repo (inbound)

| Source | Expected use | Status |
|--------|--------------|--------|
| Hydration template library | Validate `xi_io_emulator.hydration-state.yaml` schema | **not validated yet** |
| Workbench checklist patterns | Future registration pass | **not started** |
| Framework repo-sync contract | Cross-product agent rules | **local copy in** `docs/framework/repo-sync-contract.md` |

## Sync procedure (completed R1)

1. Copied `projects/manifests/xi_io_emulator.project-manifest.yaml` → `003_xi-io_net/projects/manifests/`
2. Copied `projects/hydration/xi_io_emulator.hydration-state.yaml` → `003_xi-io_net/projects/hydration/`
3. **Done:** Workbench manifest/hydration mirrored — xi-io.net commit `32fec7d`, product repo `37a71bb`
4. **Pending:** Add Workbench preview event in `public/data/workbench-events.preview.json` (optional UI surfacing)

## Sync commits (latest)

| Repo | Commit | Notes |
|------|--------|-------|
| xi-io-emulator | `5b221d3` | Standardization audit complete |
| xi-io-emulator | `b329913` | Standardization checkpoint (user) |
| xi-io.net | `9c33543` | Audit hydration re-mirror |

## Blockers

```txt
Workbench preview JSON event not yet added.
Tauri end-to-end launch proof not yet confirmed on user machine.
Bulk library ingress gated by XARCADE-IMAGE-HYDRATION-001 (decision 0f738f5, handoff 86090b3).
Hydration state re-mirror to xi-io.net complete (`93ab97c`).
```

## Freshness rule

Update this file whenever:

- A milestone completes in xi-io-emulator
- A hydration artifact changes
- xi-io.net Workbench receives a mirror update
- Launch proof passes or fails on user hardware
