# xi-io.net Framework Sync Status

Date: 2026-05-29 (Phase -1 / 0 — planning + ops docs)  
Tags: `#xio:emulator/framework-sync` `#xar:controller-launch-proof/pass-b` `#xio:emulator/pathing/standard` `#xibalba:ui-framework/001`

## Purpose

Track two-way sync between **xi-io-emulator** (product repo) and **xi-io.net** (management/hydration plane). This file records what is synced, what is pending, and what agents must update on each side.

## Emulator repo → xi-io.net (outbound)

| Artifact | Local path | xi-io.net target | Status |
|----------|------------|------------------|--------|
| Project manifest | `projects/manifests/xi_io_emulator.project-manifest.yaml` | `003_xi-io_net/projects/manifests/` | **mirrored 2026-05-28 (`a04d8b6`)** |
| Hydration state | `projects/hydration/xi_io_emulator.hydration-state.yaml` | `003_xi-io_net/projects/hydration/` | **mirrored 2026-05-28** |
| Master plan | `docs/project-tracking/master-plan-2026-05.md` | Workbench project record / evidence | **local only — pending mirror (Phase 0+)** |
| Repo health audit | `docs/project-tracking/repo-health-audit-2026-05.md` | Workbench evidence | **local only — pending mirror** |
| Historical consolidation | `docs/project-tracking/historical-plans-consolidation.md` | Workbench backlog facet | **local only — pending mirror** |
| WIP branch map | `docs/project-tracking/wip-branch-map-2026-05.md` | Internal ops note | **local only** |
| UI framework standard | `docs/framework/xibalba-ui-framework-standard-v1.md` | Framework docs plane | **local only — pending mirror** |
| UI adoption matrix | `docs/framework/xibalba-ui-adoption-matrix-v1.md` | Framework docs plane | **local only — pending mirror** |
| UI component registry plan | `docs/framework/xibalba-ui-component-registry-plan-v1.md` | Framework docs plane | **local only — pending mirror** |
| Launch failure codes 014–016 | `docs/operations/launch-failure-codes.md` | Ops runbook mirror | **local only — pending mirror** |
| Image hydration decision | `docs/decisions/library-image-hydration-before-bulk-ingress.md` | Workbench evidence | **local only — pending mirror** |
| Image hydration handoff | `docs/agent-handoff-image-hydration.md` | Workbench evidence | **local only — pending mirror** |
| Open work ledger | `docs/project-tracking/open-work-ledger.md` | Workbench events / project record | **partial — ledger text local; Workbench event exists** |
| Slice report | `docs/reports/pass-b-final-evidence-report.md` | Project evidence | **mirrored via workbench event 2026-05-29** |
| Pass B peer review | `docs/reports/pass-b-peer-review-report.md` | Project evidence | **local — workbench event references** |
| Workbench preview event | `evt-xi-io-emulator-pass-b-partial-001` | `public/data/workbench-events.preview.json` | **added 2026-05-29 (xi-io.net `6749225`)** |
| Milestone tags | serialized hashtags in code + docs | Workbench facet filters | **local only** |

## xi-io.net → Emulator repo (inbound)

| Source | Expected use | Status |
|--------|--------------|--------|
| Hydration template library | Validate `xi_io_emulator.hydration-state.yaml` schema | **not validated yet** |
| Workbench checklist patterns | Future registration pass | **not started** |
| Framework repo-sync contract | Cross-product agent rules | **local copy in** `docs/framework/repo-sync-contract.md` |
| UI framework branch docs | `origin/docs/xibalba-ui-framework-001` | **merged into emulator repo 2026-05-29** |

## Sync procedure (completed R1)

1. Copied `projects/manifests/xi_io_emulator.project-manifest.yaml` → `003_xi-io_net/projects/manifests/`
2. Copied `projects/hydration/xi_io_emulator.hydration-state.yaml` → `003_xi-io_net/projects/hydration/`
3. **Done:** Workbench manifest/hydration mirrored — xi-io.net commit `32fec7d`, product repo `37a71bb`
4. **Done:** Workbench preview event `evt-xi-io-emulator-pass-b-partial-001` @ xi-io.net `6749225`

## Next outbound mirror (Phase 0+)

After docs-only commit on emulator repo:

1. Copy master plan + audit + consolidation → xi-io.net project evidence folder
2. Copy UI framework v1 trio + ledger note → xi-io.net framework docs
3. Add Workbench preview event for Phase 0 docs refresh (optional)
4. Update hydration `sync_metadata.product_repo_commit` to new HEAD

## Sync commits (latest)

| Repo | Commit | Notes |
|------|--------|-------|
| xi-io-emulator | `d3cb2af` | Pass B proof-safety fixes + final evidence report |
| xi-io-emulator | `cf4fcdb` | Hydration sync_metadata product_repo_commit |
| xi-io.net | `d338880` | Pass B partial hydration/manifest re-mirror 2026-05-29 |
| xi-io-emulator | `bf20219` | Proof-mode UX + sync docs pass 3 |
| xi-io.net | `6749225` | Workbench preview event Pass B partial |
| xi-io-emulator | *(pending)* | Phase 0 docs-only: master plan, audit, XIO-LCH-014–016, UI framework merge |

## Blockers

```txt
Pass B partial: SNES xi-io GUI launch + NES exit re-test + A/B + Mark Verified pending user.
Source WIP not yet on named branches — repo health RED until isolation (see wip-branch-map).
Bulk library ingress gated by XARCADE-IMAGE-HYDRATION-001.
Stale /media/arcade-usb/ demo records mitigated — not a missing user ROM issue.
```

## Freshness rule

Update this file whenever:

- A milestone completes in xi-io-emulator
- A hydration artifact changes
- xi-io.net Workbench receives a mirror update
- Launch proof passes or fails on user hardware
- Planning docs (master plan, audit, framework standard) change
