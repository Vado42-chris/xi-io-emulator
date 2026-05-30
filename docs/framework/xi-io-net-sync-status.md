# xi-io.net Framework Sync Status

Date: 2026-05-30 (Pass 3 — security hub mirror @ `f2c9230`)  
Tags: `#xio:emulator/framework-sync` `#xio:framework/security/baseline` `#xar:controller-launch-proof/pass-b`

## Purpose

Track two-way sync between **xi-io-emulator** (product repo) and **xi-io.net** (management/hydration plane). This file records what is synced, what is pending, and what agents must update on each side.

## Latest mirror (Pass 3 — security)

| Field | Value |
|-------|--------|
| Product repo | `Vado42-chris/xi-io-emulator` |
| Product branch | `wip/pass-b-lifecycle-display-shell` |
| Product source commit | `afa9349` |
| xi-io.net mirror commit | `f2c9230` |
| Mirror date | 2026-05-30 |
| Mirror status | **Complete** (security/framework pass) |
| Remaining gaps | Hydration-state SHA update; full planning doc refresh; push xi-io.net to origin |

### Mirrored in Pass 3

**Hub (`003_xi-io_net/security/`):**

```txt
framework-security-standard-v1.md
security-baseline.schema.yaml
security-exception-register.md
product-security-manifest-v1.md
incident-playbook.md
```

**Product evidence (`projects/evidence/xi_io_emulator/security/`):**

```txt
supply-chain-security-baseline.md
security-application-plan-xi-io-emulator.md
pre-release-hardening-milestones.md
xi_io_emulator.project-manifest.yaml
pass-b-local-paths.example.yaml
memory-security.md
```

Also: `projects/evidence/xi_io_emulator/README.md`, `projects/manifests/xi_io_emulator.project-manifest.yaml`

## Emulator repo → xi-io.net (outbound)

| Artifact | Local path | xi-io.net target | Status |
|----------|------------|------------------|--------|
| Security framework standard | `docs/security/framework-security-standard-v1.md` | `security/` | **mirrored @ f2c9230** |
| Security baseline schema | `docs/security/security-baseline.schema.yaml` | `security/` | **mirrored @ f2c9230** |
| Security exception register | `docs/security/security-exception-register.md` | `security/` | **mirrored @ f2c9230** |
| Product security manifest spec | `docs/security/product-security-manifest-v1.md` | `security/` | **mirrored @ f2c9230** |
| Incident playbook | `docs/security/incident-playbook.md` | `security/` | **mirrored @ f2c9230** |
| Supply chain baseline | `docs/security/supply-chain-security-baseline.md` | `projects/evidence/xi_io_emulator/security/` | **mirrored @ f2c9230** |
| Security application plan | `docs/project-tracking/security-application-plan-xi-io-emulator.md` | `projects/evidence/xi_io_emulator/security/` | **mirrored @ f2c9230** |
| Pre-release hardening | `docs/project-tracking/pre-release-hardening-milestones.md` | `projects/evidence/xi_io_emulator/security/` | **mirrored @ f2c9230** |
| Agent security rules | `.memory/security.md` | `projects/evidence/xi_io_emulator/security/memory-security.md` | **mirrored @ f2c9230** |
| Project manifest | `projects/manifests/xi_io_emulator.project-manifest.yaml` | `projects/manifests/` + evidence | **mirrored @ f2c9230** |
| Local paths example | `projects/evidence/.../pass-b-local-paths.example.yaml` | evidence/security/ | **mirrored @ f2c9230** |
| Master plan | `docs/project-tracking/master-plan-2026-05.md` | `projects/evidence/xi_io_emulator/` | **stale — update pending** |
| Repo health audit | `docs/project-tracking/repo-health-audit-2026-05.md` | `projects/evidence/xi_io_emulator/` | **stale — update pending** |
| WIP branch map | `docs/project-tracking/wip-branch-map-2026-05.md` | `projects/evidence/xi_io_emulator/` | **stale — update pending** |
| Hydration state | `projects/hydration/xi_io_emulator.hydration-state.yaml` | `projects/hydration/` | **pending — file not in product repo yet** |

## xi-io.net → Emulator repo (inbound)

| Source | Expected use | Status |
|--------|--------------|--------|
| UI framework branch docs | `origin/docs/xibalba-ui-framework-001` | **merged 2026-05-29** |
| Security hub @ `f2c9230` | Product repos pin `framework_baseline_commit` | **available — pin in manifest** |

## Sync commits (latest)

| Repo | Commit | Notes |
|------|--------|-------|
| xi-io-emulator | `afa9349` | P0 path hygiene (WIP head) |
| xi-io-emulator | `ab4365c` | Framework security standard |
| xi-io.net | `f2c9230` | Security hub mirror @ source `afa9349` |

## Blockers

```txt
Pass B partial: SNES xi-io GUI launch + full checklist + user sign-off pending (PRH-04).
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
