# xi-io.net Framework Sync Status

Date: 2026-05-30 (Pass 8 — CI compliance + PRH-01 plan mirror @ `fcaddc2`)  
Tags: `#xio:emulator/framework-sync` `#xio:framework/security/baseline` `#xar:controller-launch-proof/pass-b`

## Purpose

Track two-way sync between **xi-io-emulator** (product repo) and **xi-io.net** (management/hydration plane). This file records what is synced, what is pending, and what agents must update on each side.

## Latest mirror (Pass 8 — CI compliance)

| Field | Value |
|-------|--------|
| Product repo | `Vado42-chris/xi-io-emulator` |
| Product branch | `wip/pass-b-lifecycle-display-shell` |
| Product source commit | `8702185` |
| xi-io.net mirror commit | `fcaddc2` |
| Mirror date | 2026-05-30 |
| Mirror status | **Complete** (Pass 8) |

### Mirrored in Pass 8

```txt
projects/evidence/xi_io_emulator/github-compliance-checklist.md
projects/evidence/xi_io_emulator/prh-01-sqlite-migration-plan.md
projects/evidence/xi_io_emulator/security/supply-chain-security-baseline.md
projects/evidence/xi_io_emulator/security/security-application-plan-xi-io-emulator.md
projects/evidence/xi_io_emulator/security/pre-release-hardening-milestones.md
projects/manifests/xi_io_emulator.project-manifest.yaml
.github/workflows/ci.yml (product only — not mirrored)
```

## Prior mirror (Pass 7 — hydration)

| Field | Value |
|-------|--------|
| Product source commit | `a7c7305` |
| xi-io.net mirror commit | `888f4fa` |
| Mirror status | **Complete** (Pass 7 hydration + planning) |

### Mirrored in Pass 7 (this pass)

**Planning / hydration (stale since Pass 3):**

```txt
projects/hydration/xi_io_emulator.hydration-state.yaml
projects/manifests/xi_io_emulator.project-manifest.yaml
projects/evidence/xi_io_emulator/master-plan-2026-05.md
projects/evidence/xi_io_emulator/wip-branch-map-2026-05.md
projects/evidence/xi_io_emulator/repo-health-audit-2026-05.md
projects/evidence/xi_io_emulator/xi-io-net-sync-status.md
projects/evidence/xi_io_emulator/security/pre-release-hardening-milestones.md
projects/evidence/xi_io_emulator/security/xi_io_emulator.project-manifest.yaml
projects/evidence/xi_io_emulator/README.md
```

### Mirrored in Pass 3 (unchanged hub)

**Hub (`003_xi-io_net/security/`):**

```txt
framework-security-standard-v1.md
security-baseline.schema.yaml
security-exception-register.md
product-security-manifest-v1.md
incident-playbook.md
```

## Emulator repo → xi-io.net (outbound)

| Artifact | Local path | xi-io.net target | Status |
|----------|------------|------------------|--------|
| Security framework standard | `docs/security/framework-security-standard-v1.md` | `security/` | **mirrored @ f2c9230** |
| Hydration state | `projects/hydration/xi_io_emulator.hydration-state.yaml` | `projects/hydration/` | **Pass 7 @ a7c7305** |
| Project manifest | `projects/manifests/xi_io_emulator.project-manifest.yaml` | `projects/manifests/` + evidence | **Pass 7 @ a7c7305** |
| Master plan | `docs/project-tracking/master-plan-2026-05.md` | `projects/evidence/xi_io_emulator/` | **Pass 7 refresh** |
| Repo health audit | `docs/project-tracking/repo-health-audit-2026-05.md` | `projects/evidence/xi_io_emulator/` | **Pass 7 refresh** |
| WIP branch map | `docs/project-tracking/wip-branch-map-2026-05.md` | `projects/evidence/xi_io_emulator/` | **Pass 7 refresh** |
| Pre-release hardening | `docs/project-tracking/pre-release-hardening-milestones.md` | evidence/security/ | **Pass 7 refresh** |
| Pass B evidence report | `docs/reports/pass-b-final-evidence-report.md` | product only (not mirrored — user sign-off pending) | **product only** |
| Supply chain baseline | `docs/security/supply-chain-security-baseline.md` | evidence/security/ | **mirrored @ f2c9230** |

## xi-io.net → Emulator repo (inbound)

| Source | Expected use | Status |
|--------|--------------|--------|
| UI framework branch docs | `origin/docs/xibalba-ui-framework-001` | **merged 2026-05-29** |
| Security hub @ `f2c9230` | Product repos pin `framework_baseline_commit` | **available — pin in manifest** |
| Freshness standard | `docs/framework/freshness-two-way-update-standard-v1.md` | **reference — inbound only** |

## Sync commits (latest)

| Repo | Commit | Notes |
|------|--------|-------|
| xi-io-emulator | `8702185` | Pass 8 CI + PRH-01 plan |
| xi-io.net | `fcaddc2` | Pass 8 compliance mirror @ source `8702185` |
| xi-io-emulator | `a7c7305` | Pass 7 hydration SHA + sync prep |
| xi-io-emulator | `19d4a72` | Pass 6 manifest alignment (prior HEAD) |
| xi-io-emulator | `e7530b8` | PRH-04 evidence refresh |
| xi-io-emulator | `897a97d` | PRH-02 restore failure ledger |
| xi-io-emulator | `f2c9230` | xi-io.net Pass 3 security mirror |
| xi-io.net | `f2c9230` | Security hub mirror @ source `afa9349` |
| xi-io.net | `888f4fa` | Pass 7 hydration + planning @ source `a7c7305` |

## Blockers

```txt
PRH-04: user hardware sign-off table not filled — Pass B not closed.
WIP not merge-ready — review slice before main.
Bulk hydration blocked until PRH-01–04 complete.
VITE_* showcase roots are Pass B/WIP only — XARCADE-RUNTIME-CONFIG-001 before public beta.
```

## Freshness rule

Update this file whenever:

- A milestone completes in xi-io-emulator
- A security or hydration artifact changes
- xi-io.net receives a mirror update
- Launch proof passes or fails on user hardware

Per `freshness-two-way-update-standard-v1.md`: record what changed, which side is canonical, and what remains stale.
