# xi-io.net Framework Sync Status

Date: 2026-05-30 (Pass 12 — safe session cleanup; mirror pending push)  
Tags: `#xio:emulator/framework-sync` `#xio:framework/security/baseline` `#xar:controller-launch-proof/pass-b`

## Purpose

Track two-way sync between **xi-io-emulator** (product repo) and **xi-io.net** (management/hydration plane). This file records what is synced, what is pending, and what agents must update on each side.

## Latest mirror (Pass 12 — session cleanup)

| Field | Value |
|-------|--------|
| Product repo | `Vado42-chris/xi-io-emulator` |
| Product branch | `wip/pass-b-lifecycle-display-shell` |
| Product source commit | `d8899e7` |
| xi-io.net mirror commit | `d1b9947` |
| Mirror date | 2026-05-30 |
| Mirror status | **Complete** (Pass 12) |

### Mirrored in Pass 12

```txt
scripts/pass-b-cleanup-sessions.sh (copy to projects/evidence/xi_io_emulator/ops/)
docs/operations/troubleshooting-pass-b.md (session cleanup section)
projects/manifests/xi_io_emulator.project-manifest.yaml (wip_head_sha)
projects/hydration/xi_io_emulator.hydration-state.yaml
projects/evidence/xi_io_emulator/xi-io-net-sync-status.md
```

## Prior mirror (Pass 11 — PRH-01 scaffold)

| Field | Value |
|-------|--------|
| Product source commit | `6071a90` |
| xi-io.net mirror commit | `9c79e81` |
| Mirror status | **Complete** (Pass 11) |

### Mirrored in Pass 11

```txt
projects/evidence/xi_io_emulator/prh-01-sqlite-migration-plan.md
projects/evidence/xi_io_emulator/github-compliance-checklist.md
projects/manifests/xi_io_emulator.project-manifest.yaml
projects/hydration/xi_io_emulator.hydration-state.yaml
projects/evidence/xi_io_emulator/xi-io-net-sync-status.md
```

## Prior mirror (Pass 10 — Admin export UI)

| Field | Value |
|-------|--------|
| Product source commit | `bd1d088` |
| xi-io.net mirror commit | `f1cf7c7` |
| Mirror status | **Complete** (Pass 10) |

## Sync contract

When completing an agent pass on the product repo:

1. Update this file with product commit SHA and mirror commit SHA.
2. Copy changed evidence/docs to `003_xi-io_net/projects/evidence/xi_io_emulator/`.
3. Update `projects/manifests/xi_io_emulator.project-manifest.yaml` and `projects/hydration/xi_io_emulator.hydration-state.yaml`.
4. Commit and push both repos (WIP branch on product; `main` on xi-io.net unless otherwise noted).
5. Record verify script exit codes in `docs/reports/pass-b-final-evidence-report.md`.

## Operator actions still open

```txt
PRH-04 user hardware sign-off (Pass B Launch Proof shelf)
Metadata backup pilot: Settings → Export pilot (50)
GitHub branch protection on main (API 404 @ Pass 11 — operator enable)
```
