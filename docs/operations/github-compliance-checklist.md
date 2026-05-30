# GitHub Compliance Checklist (Pre-Beta)

Date: 2026-05-30  
Milestone: **XARCADE-PRE-RELEASE-HARDENING-001** (compliance slice)  
Parent: [supply-chain-security-baseline.md](../security/supply-chain-security-baseline.md)

## Purpose

Track GitHub-side controls that cannot live only in local docs. Agents update checkboxes when verified with command output or GitHub UI confirmation — never assume silent success.

---

## Repository automation (in-repo)

| Item | Status | Verify |
|------|--------|--------|
| CI workflow (typecheck + verify + cargo check + deps) | **Added** @ Pass 8 | `.github/workflows/ci.yml` green on push |
| Dependabot (npm + cargo) | **Added** @ Pass 8 | `.github/dependabot.yml` present |
| `npm run verify:deps` in CI | **Wired** | CI step passes; cargo-audit installed in runner |
| Secret scanning (GitHub Advanced Security) | **Manual** | Repo Settings → Code security → enable if available |
| Branch protection on `main` | **Manual** | Require CI status check; no force push |
| Signed releases / artifacts | **Not started** | Phase 7 MVP hardening |

---

## Manual GitHub settings (operator)

Complete in GitHub UI — agents document status only:

```txt
1. Settings → Code security and analysis
   - Secret scanning: enable (if plan allows)
   - Dependabot alerts: enable
   - Dependabot security updates: enable

2. Settings → Branches → Branch protection rules → main
   - Require status checks: CI / verify
   - Require pull request before merge
   - Do not allow force pushes

3. Settings → Actions → General
   - Allow GitHub Actions for this repository
```

---

## WIP branch policy

| Rule | Reason |
|------|--------|
| Do not merge `wip/pass-b-lifecycle-display-shell` to `main` without review slicing | ~30 commits mixed scope |
| CI must pass on WIP PRs before human merge | Catches guardrail regressions |
| No secrets in commits | Use `.env.local` + `projects/local/` only |

---

## Done when (Pass 8 compliance slice)

- [x] CI workflow committed and pushed
- [x] Dependabot config committed
- [x] This checklist documents manual steps
- [x] First green CI run on WIP branch @ `2bab4a6` (run `26688165897`, 2026-05-30)
- [ ] Branch protection enabled on `main` (operator)
- [ ] Secret scanning enabled (operator, if available)

---

## Related

- [pre-release-hardening-milestones.md](../project-tracking/pre-release-hardening-milestones.md)
- [prh-01-sqlite-migration-plan.md](../project-tracking/prh-01-sqlite-migration-plan.md)
- [xi-io-net-sync-status.md](../framework/xi-io-net-sync-status.md)
