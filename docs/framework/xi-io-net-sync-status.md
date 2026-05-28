# xi-io.net Framework Sync Status

Date: 2026-05-28  
Tags: `#xio:emulator/framework-sync` `#xar:controller-launch-proof/current`

## Purpose

Track two-way sync between **xi-io-emulator** (product repo) and **xi-io.net** (management/hydration plane). This file records what is synced, what is pending, and what agents must update on each side.

## Emulator repo → xi-io.net (outbound)

| Artifact | Local path | xi-io.net target | Status |
|----------|------------|------------------|--------|
| Project manifest | `projects/manifests/xi_io_emulator.project-manifest.yaml` | Workbench project registry | **pending mirror** |
| Hydration state | `projects/hydration/xi_io_emulator.hydration-state.yaml` | `projects/hydration/` in xi-io.net | **pending mirror** |
| Open work ledger | `docs/project-tracking/open-work-ledger.md` | Workbench events / project record | **pending mirror** |
| Slice report | `docs/reports/controller-launch-proof-report.md` | Project evidence / validation | **pending mirror** |
| Milestone tags | serialized hashtags in code + docs | Workbench facet filters | **local only** |

## xi-io.net → Emulator repo (inbound)

| Source | Expected use | Status |
|--------|--------------|--------|
| Hydration template library | Validate `xi_io_emulator.hydration-state.yaml` schema | **not validated yet** |
| Workbench checklist patterns | Future registration pass | **not started** |
| Framework repo-sync contract | Cross-product agent rules | **local copy in** `docs/framework/repo-sync-contract.md` |

## Sync procedure (when xi-io.net repo is available)

1. Copy or register `projects/manifests/xi_io_emulator.project-manifest.yaml` in xi-io.net Workbench.
2. Copy `projects/hydration/xi_io_emulator.hydration-state.yaml` to `003_xi-io_net/projects/hydration/xi_io_emulator.hydration-state.yaml`.
3. Add Workbench preview event summarizing milestone `XARCADE-CONTROLLER-LAUNCH-PROOF-001` and link to GitHub commit SHA.
4. Update this file with sync date, commit SHAs on both repos, and validation state.

## Blockers

```txt
xi-io.net repo not writable from current agent session without explicit user handoff.
Tauri end-to-end launch proof not yet confirmed on user machine.
Hydration state overall_state remains launch_proof_implemented_pending_user_test until verified.
```

## Freshness rule

Update this file whenever:

- A milestone completes in xi-io-emulator
- A hydration artifact changes
- xi-io.net Workbench receives a mirror update
- Launch proof passes or fails on user hardware
