# xi-io.net Framework Sync Status

Date: 2026-05-28 (R1 pass)  
Tags: `#xio:emulator/framework-sync` `#xar:controller-launch-proof/current`

## Purpose

Track two-way sync between **xi-io-emulator** (product repo) and **xi-io.net** (management/hydration plane). This file records what is synced, what is pending, and what agents must update on each side.

## Emulator repo → xi-io.net (outbound)

| Artifact | Local path | xi-io.net target | Status |
|----------|------------|------------------|--------|
| Project manifest | `projects/manifests/xi_io_emulator.project-manifest.yaml` | `003_xi-io_net/projects/manifests/` | **mirrored 2026-05-28 R1** |
| Hydration state | `projects/hydration/xi_io_emulator.hydration-state.yaml` | `003_xi-io_net/projects/hydration/` | **mirrored 2026-05-28 R1** |
| Open work ledger | `docs/project-tracking/open-work-ledger.md` | Workbench events / project record | **pending Workbench event** |
| Slice report | `docs/reports/controller-launch-proof-report.md` | Project evidence / validation | **pending Workbench event** |
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
3. **Pending:** Add Workbench preview event summarizing milestone `XARCADE-CONTROLLER-LAUNCH-PROOF-001-R1` and link to GitHub commit SHA after R1 push
4. Update commit SHAs on both repos after R1 push

## Blockers

```txt
Workbench preview JSON event not yet added (requires xi-io.net commit + optional preview data update).
Tauri end-to-end launch proof not yet confirmed on user machine.
Hydration state overall_state remains launch_proof_implemented_pending_user_test until verified.
Schema validation against xi-io.net engines/schemas/project-hydration-state.schema.json not run.
```

## Freshness rule

Update this file whenever:

- A milestone completes in xi-io-emulator
- A hydration artifact changes
- xi-io.net Workbench receives a mirror update
- Launch proof passes or fails on user hardware
