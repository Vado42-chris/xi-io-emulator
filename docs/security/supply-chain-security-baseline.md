# Supply Chain and Security Baseline

Date: 2026-05-30  
Scope: **xi-io Emulator** + framework propagation via **xi-io.net**  
Related: [pre-release-hardening-milestones.md](../project-tracking/pre-release-hardening-milestones.md)

---

## Plain-language purpose

We are building our own stack instead of renting everything from a big cloud vendor. That is a **real advantage** only if we write down how we patch dependencies, share rules across repos, and avoid silent security debt. This document is the emulator’s local copy of that policy. The **framework master** should live on xi-io.net and propagate to sibling repos.

---

## Is a master security repo a good idea?

**Yes — with a narrow scope.** Use xi-io.net (or a dedicated `xi-io-security-baseline` repo) as the **policy hub**, not as a monolith that replaces product repos.

### Recommended pattern

```text
xi-io.net (framework hub)
  security/
    baseline.yaml          ← versions, audit cadence, banned patterns
    dependency-allowlist/  ← optional pinned majors per stack
    incident-playbook.md   ← plain steps if CVE or breach suspected
  propagation/
    agent-start-checklist.md
    ci-verify-security.sh

Each product repo (e.g. xi-io-emulator)
  docs/security/supply-chain-security-baseline.md  ← links to hub + local overrides
  projects/manifests/*.yaml                        ← declares compliance SHA
  scripts/verify-deps.sh                           ← runs local audits
```

**Propagate by:**

1. **Git mirror** — copy `security/baseline.yaml` into `projects/evidence/<product>/` on each release
2. **Manifest field** — `security_baseline_commit: <sha>` in project manifest
3. **Agent start** — read hub checklist before coding (same as INDEX first-read)
4. **CI gate** — `npm run verify:deps` (and Rust audit when installed) must pass before merge

**Do not propagate:**

- Secrets, API keys, or user paths
- Whole `node_modules` or vendored binaries
- Auto-apply patches without peer review on product repos

This gives you **one place to raise the bar** without Amazon/Google-style “millions of clients can’t migrate overnight” paralysis — because you have **no legacy client base yet**.

---

## Current dependency audit (emulator repo)

Last run: **2026-05-30**

| Stack | Command | Result |
|-------|---------|--------|
| npm (frontend) | `npm audit` | **0 vulnerabilities** (195 deps scanned) |
| Rust (Tauri) | `cargo audit` | **Not run** — install `cargo-audit` on dev machines + CI |
| Outdated (info) | `npm outdated` | `@types/node`, `eslint` patch bumps available; `lucide-react` major behind — review before upgrade |

**Local verify:**

```bash
npm run verify:deps
```

### `verify:deps` enforcement tiers

| Phase | npm audit | cargo-audit |
|-------|-----------|---------------|
| Pass B / WIP | Fail on moderate+ | **Warn** if not installed |
| Pre-release (PRH complete) | Fail on moderate+ | **Fail** if missing or vulnerable |
| Release / public beta | Fail on moderate+ | Required + SBOM step |

Future implementation: `VERIFY_DEPS_STRICT=1` or CI profile — not wired in this docs-only pass.

---

## Path and privacy policy (public repo)

This repo is **public on GitHub**. User machine paths must not appear in tracked manifests or shared reports.

| Location | Policy |
|----------|--------|
| `projects/manifests/*.yaml` | Public-safe: `proof_game_id`, `path_status`, placeholders only |
| `projects/local/*.local.yaml` | Gitignored — real paths live here |
| `projects/evidence/*/pass-b-local-paths.example.yaml` | Example shape only |
| Source catalogs (`nesShowcaseCatalog.ts`, etc.) | **WIP** — `VITE_*` via `.env.local`; move to Tauri runtime before beta (XARCADE-RUNTIME-CONFIG-001) |
| Shared evidence reports | Game IDs and reason codes, not full ROM paths |

See [product-security-manifest-v1.md](./product-security-manifest-v1.md) and [security-application-plan-xi-io-emulator.md](../project-tracking/security-application-plan-xi-io-emulator.md).

**VITE_* showcase roots (Pass B/WIP only):** `.env.local` variables are frontend build-time config and may appear in client bundles. Acceptable for local Tauri dev; before public beta, move ROM roots behind Tauri runtime config or SQLite/local overlay (`XARCADE-RUNTIME-CONFIG-001`).

---

## Security principles (non-negotiable)

These apply to emulator code and any xi-io sibling repo.

### 1. Secrets

- Never commit `.env`, tokens, private keys, or user home paths as credentials
- Tauri secrets use OS keychain / env at runtime, not git
- Ledger and logs must not include full ROM paths if shared publicly — use game IDs in shared reports

### 2. Process and shell isolation

- Emulator runs under **session supervisor** — never signal the xi-io shell process group
- Pre-launch cleanup kills **emulator binaries only**, with PID guards (`signal_pid_safe`)
- No global `pkill -x fceux` (removed — was a supply-chain-style footgun)

### 3. Input and WM tools

- All `xdotool` / `wmctrl` calls use **timeout** wrapper (max 2s) — no `--sync`
- Gamepad return monitor prefers `/dev/input/js*` over evdev grab conflicts

### 4. Data at rest

- Today: `localStorage` for catalog + play stats — acceptable for Pass B only
- Before beta: **PRH-01** SQLite with parameterized queries
- ROM files: **read-only by reference** — never mutate user libraries (decision doc locked)

### 5. Network

- Tauri app is local-first; no telemetry channel in Pass B
- Future provider downloads (artwork, metadata) require explicit opt-in + domain allowlist in manifest

### 6. Capabilities (Tauri v2)

- Review `src-tauri/capabilities` and `default.json` when adding commands
- New Rust commands that spawn processes or read `/proc` need explicit capability + doc line

---

## Framework-level patching workflow

When a CVE affects npm, Rust, or system packages:

| Step | Owner | Action |
|------|-------|--------|
| 1 | Framework hub | Record CVE id, severity, affected repos in `security/baseline.yaml` |
| 2 | Product repo | Run `npm audit fix` / `cargo update` within allowed semver band |
| 3 | Product repo | Run full verify suite (`verify:deps`, `verify:shell-restore`, `cargo test`) |
| 4 | Product repo | Commit with message `fix(security): CVE-XXXX — <package>` |
| 5 | Framework hub | Bump `minimum_safe_commit` for affected product manifest |
| 6 | All sites | Redeploy or tag release — static sites rebuild from pinned lockfile |

**Lockfiles:** Commit `package-lock.json`. Do not delete lockfiles to “fix” audit noise without review.

---

## Security maturity snapshot (2026-05-30)

| Area | Maturity | Notes |
|------|----------|-------|
| Process isolation (supervisor, no shell pgid kill) | **Strong** | Code + `verify:shell-restore` |
| WM tool safety (timeout, no `--sync`) | **Strong** | Guardrail script |
| Read-only ROM policy | **Strong** | Decision doc locked |
| Failure visibility | **Improved** | PRH-02 `shell_focus_restore_failed` |
| Data durability | **Weak** | PRH-01 |
| Supply chain automation | **Started** | `npm run verify:deps`; hub not on xi-io.net |
| Remote reproducibility | **Partial** | GitHub @ `95e2426`; xi-io.net mirror pending |
| Path privacy (public manifest) | **Improved** | Sanitized; showcase via `.env.local` (WIP); runtime config before beta |
| Framework security standard | **Mirrored** | xi-io.net @ `f2c9230` |

---

## What we have not built yet (honest gap list)

| Capability | Status | Milestone |
|------------|--------|-----------|
| Central `baseline.yaml` on xi-io.net | **Not created** | Hub mirror of [security-baseline.schema.yaml](./security-baseline.schema.yaml) |
| `cargo audit` in CI | **Not wired** | Fail pre-release per tier table above |
| Dependabot / Renovate config | **Not present** | Optional after push to GitHub |
| Signed releases / code signing | **Not present** | Phase 7 MVP hardening |
| Threat model doc (STRIDE-lite) | **Not present** | Phase 7 |
| `shell_focus_restore_failed` | **Implemented** | PRH-02 |

Building security **from scratch** does not mean writing crypto ourselves. It means:

- Owning the **patch cadence** and **visibility**
- Keeping attack surface small (local app, no blind cloud trust)
- Documenting failures instead of hiding them

---

## Agent start checklist (security)

Before implementation, confirm:

```txt
[ ] Read .memory/security.md
[ ] Read this file
[ ] Run npm run verify:deps
[ ] No new dependencies without note in PR + audit re-run
[ ] No secrets in diff
[ ] If adding spawn/exec/file read: update Tauri capabilities
```

---

## Related framework docs (this repo)

```txt
docs/security/framework-security-standard-v1.md
docs/security/security-baseline.schema.yaml
docs/security/security-exception-register.md
docs/security/product-security-manifest-v1.md
docs/security/incident-playbook.md
docs/project-tracking/security-application-plan-xi-io-emulator.md
```

---

## xi-io.net mirror action

When PRH-03 pushes to GitHub, mirror to xi-io.net:

```txt
docs/security/supply-chain-security-baseline.md
  → 003_xi-io_net/projects/evidence/xi_io_emulator/
docs/project-tracking/pre-release-hardening-milestones.md
  → 003_xi-io_net/projects/evidence/xi_io_emulator/
```

Update [xi-io-net-sync-status.md](../framework/xi-io-net-sync-status.md) with commit SHA.

---

## Tags

```txt
#xio:framework/security/baseline
#xio:emulator/supply-chain
#risk:dependency-cve
#todo:framework/security-baseline-yaml
```
