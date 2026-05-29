# xi-io.net Framework Sync Status

Date: 2026-05-29 (Pass B partial — agent pass 1)  
Tags: `#xio:emulator/framework-sync` `#xar:controller-launch-proof/pass-b` `#xio:emulator/pathing/standard`

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
| Slice report | `docs/reports/pass-b-final-evidence-report.md` | Project evidence | **local — pending mirror after commit** |
| Pass B peer review | `docs/reports/pass-b-peer-review-report.md` | Project evidence | **local — pending mirror** |
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
| xi-io-emulator | `d3cb2af` | Pass B proof-safety fixes + final evidence report |
| xi-io-emulator | `cf4fcdb` | Hydration sync_metadata product_repo_commit |
| xi-io.net | `d338880` | Pass B partial hydration/manifest re-mirror 2026-05-29 |

## Blockers

```txt
Pass B partial: SNES xi-io GUI launch + NES exit re-test + A/B + Mark Verified pending user.
Workbench preview JSON event not yet added.
Bulk library ingress gated by XARCADE-IMAGE-HYDRATION-001.
Stale /media/arcade-usb/ demo records mitigated — not a missing user ROM issue.
```

## Freshness rule

Update this file whenever:

- A milestone completes in xi-io-emulator
- A hydration artifact changes
- xi-io.net Workbench receives a mirror update
- Launch proof passes or fails on user hardware
