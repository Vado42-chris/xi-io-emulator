# xi-io Emulator — Security Application Plan

Date: 2026-05-30  
Branch audited: `wip/pass-b-lifecycle-display-shell` @ `afa9349`  
xi-io.net mirror: `f2c9230` @ 2026-05-30  
Framework standard: [framework-security-standard-v1.md](../security/framework-security-standard-v1.md)  
Peer review: external audit 2026-05-30 (WIP preservation, not merge-ready)

---

## Branch and state summary

| Item | Value |
|------|--------|
| Branch | `wip/pass-b-lifecycle-display-shell` |
| Head SHA | `09a1375` (WIP head; sync docs record mirror @ `f2c9230`) |
| Base | `origin/main` @ `7740b36` |
| Ahead of main | **~22 commits** (WIP branch) |
| Working tree | Clean |
| Classification | **WIP preserved — not merge-ready** |
| Files changed vs main | 112 files (+17k / -733 lines) — docs, security, Rust lifecycle, UI framework, showcase |

**Merge recommendation:** **No.** Slice into reviewable PRs before `main`. Do not bulk-merge WIP.

---

## Security peer review verdict

| Area | Verdict |
|------|---------|
| PRH-01–04 as gates | **Approve** |
| xi-io.net as policy hub | **Approve** |
| Local `verify:deps` | **Approve** (tiered enforcement needed) |
| `.memory/security.md` | **Approve** |
| Public manifest path hygiene | **Fail** — fixed in this pass (public-safe manifest) |
| Framework-grade baseline | **Yellow** — schema + standard added; hub not mirrored yet |
| WIP branch merge-ready | **No** |
| Bulk hydration | **Blocked** |
| Pass B | **Partial / blocked** |
| Pass C | **Not safe** |

**Overall:** Security baseline **YELLOW**, promising, not framework-complete.

---

## PRH-03 SHA clarification (peer review fix)

| Label | SHA | Meaning |
|-------|-----|---------|
| **Launch + hardening code snapshot** | `45d55ee` | Commit with session supervisor, gamepad GUID, verify scripts |
| **Docs-only status update** | `95e2426` | Records GitHub push; no new launch code |
| **Current WIP branch head** | `95e2426` | Tip of branch — use this for clone/checkout |

PRH-03 **code push** is satisfied at `45d55ee` and included in head `95e2426`.  
PRH-03 **xi-io.net mirror** remains open.

---

## Gap table (framework security)

| Area | Current repo coverage | Best-practice target | Risk | Required doc | Required code/CI | Priority |
|------|----------------------|----------------------|------|--------------|------------------|----------|
| SSDF / SDLC | PRH tracker, agent rules | Full ssdf-control-map on hub | Medium | hub ssdf map | — | P2 |
| SLSA provenance | Manual local builds | L2 hosted build + SBOM | Medium | slsa-roadmap | CI pipeline | P3 |
| OWASP SCVS | Partial via verify scripts | Full checklist + exceptions | Medium | scvs-checklist | — | P2 |
| npm audit | `verify:deps` fail moderate+ | + Dependabot | Low | baseline.yaml | Dependabot config | P2 |
| cargo audit | Warn if missing | Fail pre-release | Medium | baseline.yaml | CI install cargo-audit | **P1** |
| SBOM | Not generated | CycloneDX at release | Medium | sbom_policy | release workflow | P3 |
| Secret scanning | Not configured | GitHub secret scan | High if leak | secret_policy | Enable on repo | **P1** |
| CodeQL | Not configured | On PR to main | Medium | baseline.yaml | GitHub Action | P2 |
| Path privacy | Leaks in manifest + source catalogs | Local overlay only | **High** (public repo) | product-manifest-v1 | Remove hardcoded paths (slice) | **P0** |
| Tauri capabilities | default.json exists | Capability matrix doc | Medium | tauri policy | Per-command review | P2 |
| Incident response | Playbook added | Hub mirror + drill | Low | incident-playbook | — | P2 |
| Exception register | Template added | Active rows when needed | Low | exception register | — | P3 |
| Branch protection | Documented | Enforce on main | Medium | baseline.yaml | GitHub settings | **P1** |
| Release signing | Not planned | Tauri updater signing | Medium | release policy | — | P3 |

---

## Path and privacy audit (Phase S2)

### Public repo — must fix (P0)

| Location | Issue | Action |
|----------|-------|--------|
| `projects/manifests/xi_io_emulator.project-manifest.yaml` | Full `/media/chrishallberg/...` paths | **Sanitized this pass** — use local overlay |
| `src/data/nesShowcaseCatalog.ts` | Hardcoded Aries ROM roots | **Fixed** — `showcaseRomRoots.ts` + `.env.local` |
| `src/data/snesShowcaseCatalog.ts` | Same | **Fixed** |
| `docs/reports/pass-b-final-evidence-report.md` | Full user paths | **Redacted** |
| `docs/decisions/non-mutating-local-library-import.md` | User path + hostname | **Redacted** |

### Acceptable (with context)

| Location | Classification |
|----------|----------------|
| `/media/arcade-usb/` in code/docs | Demo mock prefix — keep out of proof paths; document |
| `proofGameService.ts` stale prefix constant | Intentional blocker detection |
| Ops runbooks mentioning path **shape** | OK if no real username |

### Policy (locked)

```txt
Public manifests → proof_game_id + path_status only
Local paths → projects/local/*.local.yaml (gitignored)
Source code → no committed user-specific roots (showcase catalogs need refactor)
Shared reports → game IDs and reason codes, not full ROM paths
```

---

## Framework controls already in emulator

- Session supervisor (no shell pgid kill)
- `verify:shell-restore`, `verify:session-idle`, `verify:ui-toolbar`
- PRH tracker + Phase 1D in master plan
- `supply-chain-security-baseline.md`, `.memory/security.md`
- `framework-security-standard-v1.md` + schema + playbook (this pass)

---

## Controls required by gate

| Gate | Required |
|------|----------|
| **Pass B close (PRH-04)** | Path-safe public manifest; peer review; evidence report updated |
| **Pre-release (PRH-01–04)** | cargo-audit fail; PRH-02 implemented; SQLite migration |
| **Bulk hydration** | All PRH + path hygiene in source catalogs |
| **Public beta** | SBOM, CodeQL, branch protection, signed builds (framework P2–P3) |

---

## PRH tracker — changes from framework pass

| PRH | Change |
|-----|--------|
| PRH-01 | Unchanged — still not started |
| PRH-02 | Unchanged — still not started |
| PRH-03 | Clarify SHAs (see table above); mirror xi-io.net security docs when hub ready |
| PRH-04 | Add path-privacy sign-off to Pass B checklist |

**Do not merge PRH-01/02 implementation before path P0 source slice is scheduled.**

---

## `verify:deps` — recommended tiers

| Phase | Behavior |
|-------|----------|
| Pass B / WIP | npm audit fail moderate+; cargo-audit **warn** |
| Pre-release | cargo-audit **fail** if missing |
| Release | + SBOM generation step |

Implement tier flag in a future slice (`VERIFY_DEPS_STRICT=1`), not in this docs-only pass.

---

## Recommended next slices (ordered)

1. **P0 Path hygiene** — public manifest (done); showcase catalog refactor; redact evidence reports  
2. **P1 Framework hub mirror** — copy security docs to xi-io.net `security/`  
3. **P1 GitHub** — enable secret scanning; branch protection on `main`  
4. **PRH-02** — `shell_focus_restore_failed`  
5. **PRH-04** — Pass B evidence + peer review close  
6. **PRH-01** — SQLite play/session migration  
7. **PRH-03 complete** — xi-io.net evidence mirror @ `95e2426`  
8. **Review slicing** — split 18-commit WIP into mergeable PRs  

---

## Files created/updated (this pass)

**Created:**

```txt
docs/security/framework-security-standard-v1.md
docs/security/security-baseline.schema.yaml
docs/security/security-exception-register.md
docs/security/product-security-manifest-v1.md
docs/security/incident-playbook.md
docs/project-tracking/security-application-plan-xi-io-emulator.md
projects/evidence/xi_io_emulator/pass-b-local-paths.example.yaml
projects/local/README.md
```

**Updated:**

```txt
projects/manifests/xi_io_emulator.project-manifest.yaml  (public-safe)
docs/project-tracking/pre-release-hardening-milestones.md
docs/security/supply-chain-security-baseline.md
docs/INDEX.md
.gitignore
```

---

## Final classification

```txt
Repo WIP backup: successful (@ 95e2426)
Repo health: yellow
Security baseline: yellow (framework docs added; hub + CI pending)
WIP branch merge-ready: no
Pass B: partial / blocked
Pass C: not safe
Bulk hydration: blocked
Next move: P0 path source slice + hub mirror + PRH-02/04
```
