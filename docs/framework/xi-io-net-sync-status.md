# xi-io.net Framework Sync Status

Date: 2026-05-30 (Pass 14 — shell unminimize + session finish race; mirror complete @ `7f03390`)  
Tags: `#xio:emulator/framework-sync` `#xio:framework/security/baseline` `#xar:controller-launch-proof/pass-b`

## Purpose

Track two-way sync between **xi-io-emulator** (product repo) and **xi-io.net** (management/hydration plane). This file records what is synced, what is pending, and what agents must update on each side.

## Latest mirror (Pass 14 — shell wake + restore banner)

| Field | Value |
|-------|--------|
| Product repo | `Vado42-chris/xi-io-emulator` |
| Product branch | `wip/pass-b-lifecycle-display-shell` |
| Product source commit | `e1910fc` / docs `4ca3e28` |
| xi-io.net mirror commit | `7f03390` |
| Mirror date | 2026-05-30 |
| Mirror status | **Complete** (Pass 14) |
| CI run (product) | `26692451590` **success** |

### Mirrored in Pass 14

```txt
docs/reports/pass-b-final-evidence-report.md (Pass 14 verify receipt)
docs/framework/xi-io-net-sync-status.md (this file)
docs/operations/troubleshooting-pass-b.md (XIO-LCH-008 shell hidden)
projects/manifests/xi_io_emulator.project-manifest.yaml (wip_head_sha)
projects/hydration/xi_io_emulator.hydration-state.yaml
projects/evidence/xi_io_emulator/xi-io-net-sync-status.md
projects/evidence/xi_io_emulator/pass-b-final-evidence-report.md
projects/evidence/xi_io_emulator/troubleshooting-pass-b.md
```

## Prior mirror (Pass 13 — launch exit restore)

| Field | Value |
|-------|--------|
| Product source commit | `41bd811` (source) / `2e03637` (head) |
| xi-io.net mirror commit | `b85cb8a` |
| Mirror status | **Complete** (Pass 13) |

### Mirrored in Pass 13

```txt
docs/reports/pass-b-final-evidence-report.md (Pass 13 verify receipt)
docs/framework/xi-io-net-sync-status.md
projects/manifests/xi_io_emulator.project-manifest.yaml (wip_head_sha)
projects/hydration/xi_io_emulator.hydration-state.yaml
projects/evidence/xi_io_emulator/xi-io-net-sync-status.md
projects/evidence/xi_io_emulator/pass-b-final-evidence-report.md
```

## Prior mirror (Pass 12 — session cleanup)

| Field | Value |
|-------|--------|
| Product source commit | `d8899e7` / CI fix `1f301a9` |
| xi-io.net mirror commit | `d1b9947` |
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
docs/project-tracking/prh-01-sqlite-migration-plan.md
src-tauri/src/play_session_db.rs (schema reference in evidence)
projects/manifests/xi_io_emulator.project-manifest.yaml
projects/hydration/xi_io_emulator.hydration-state.yaml
```

## Agent checklist (each pass)

1. Update product docs + verify receipts in `docs/reports/pass-b-final-evidence-report.md`
2. Run full verify suite; record exit codes (no silent skips)
3. Commit source and docs separately on WIP branch
4. Push WIP; confirm CI green; record run ID in evidence report
5. Copy evidence files to `003_xi-io_net/projects/evidence/xi_io_emulator/`
6. Update hub manifest + hydration SHAs
7. Commit and push xi-io.net `main`
8. Update this file with mirror commit SHA

## Related

- [repo-sync-contract.md](./repo-sync-contract.md)
- [supply-chain-security-baseline.md](../security/supply-chain-security-baseline.md)
- [open-work-ledger.md](../project-tracking/open-work-ledger.md)
