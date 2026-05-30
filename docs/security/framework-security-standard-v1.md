# Framework Security Standard v1

Date: 2026-05-30  
Status: **Active — framework policy (xi-io.net hub target)**  
Scope: All xi-io products (Emulator, xi-io.net, xi-io.com, RealityPools, AFG, screen_scraper, future)

Product repos keep a **local copy** of this standard plus overrides in `docs/security/supply-chain-security-baseline.md`. The **canonical hub** should live on xi-io.net under `security/` and propagate by manifest SHA.

---

## Purpose (plain language)

We build local-first software without a large legacy client base. That lets us patch faster than big cloud vendors — **only if** we write down how we develop, audit, release, and respond to incidents. This standard is that written-down policy.

---

## Security principles

1. **No secrets in git** — keys, tokens, and credentials never committed.
2. **Read-only user libraries** — ROMs and user files are referenced, not mutated.
3. **Small attack surface** — local-first defaults; network only when explicitly declared.
4. **Visible failures** — security and restore failures must be logged, not hidden.
5. **Least privilege** — Tauri capabilities, process spawn, and file access minimized.
6. **Public/private boundary** — public repos must not contain user machine paths or PII.
7. **Inherited baseline** — products pin a framework `security_baseline_commit` in manifest.
8. **Incremental maturity** — Pass B allows warnings; pre-release and beta require stricter gates.

---

## Standards spine (what “best in class” means for us)

| Standard | Our use |
|----------|---------|
| [NIST SSDF SP 800-218](https://csrc.nist.gov/pubs/sp/800/218/final) | Secure SDLC practices: prepare, protect, produce, respond |
| [SLSA v1.1](https://slsa.dev/spec/v1.1/) | Incremental supply-chain levels; provenance for releases |
| [OWASP SCVS](https://owasp.org/www-project-software-component-verification-standard/) | Component verification controls checklist |
| CycloneDX or SPDX | SBOM format for npm + Rust dependencies at release |
| GitHub security features | Dependabot, secret scanning, CodeQL (when enabled) |
| Tauri capability model | Minimize shell permissions per command |

We do **not** claim full SLSA L3 or complete SSDF overnight. We map controls and raise levels per phase.

---

## NIST SSDF mapping (summary)

| SSDF practice group | xi-io control |
|---------------------|---------------|
| Prepare the organization | Framework standard docs, agent `.memory/security.md`, PRH gates |
| Protect the software | Branch protection (target), PR review, no force-push to main |
| Produce well-secured software | `verify:deps`, guardrail scripts, parameterized SQL (PRH-01) |
| Respond to vulnerabilities | [incident-playbook.md](./incident-playbook.md), CVE propagation in baseline |

Full control map: add `security/ssdf-control-map.md` on xi-io.net hub (planned).

---

## SLSA maturity roadmap

| Level | Target phase | Requirement |
|-------|--------------|-------------|
| L0 | Pass B / WIP | Manual builds, local verify scripts |
| L1 | Pre-release | Scripted build, documented provenance |
| L2 | Public beta | Hosted build, signed artifacts, SBOM attached |
| L3 | Stable release | Hardened build platform, non-falsifiable provenance |

Current emulator WIP: **L0–L1**.

---

## OWASP SCVS mapping (incremental)

Adopt SCVS controls in phases:

- **Phase 1 (now):** dependency inventory (`npm audit`, optional `cargo audit`), secret policy, path privacy
- **Phase 2 (pre-release):** mandatory `cargo-audit`, SBOM generation, exception register
- **Phase 3 (beta):** CodeQL, Dependabot/Renovate, signed releases

Checklist template: extend [security-exception-register.md](./security-exception-register.md).

---

## Local-first threat assumptions

- Primary asset: user ROM library (integrity via read-only import)
- Primary risk: local process escape, path leakage in public git, dependency CVEs
- Lower priority than SaaS: multi-tenant data breach, API abuse at scale
- Still required: secure updates, capability review, no silent exfiltration

---

## Public vs private repo boundary

| Content | Public repo | Local gitignored overlay |
|---------|-------------|---------------------------|
| Framework policy docs | Yes | — |
| Product manifest (generic) | Yes | — |
| Machine paths, usernames | **No** | `projects/local/*.local.yaml` |
| Proof ROM full paths | **No** in manifest | Local overlay + env |
| Demo `/media/arcade-usb/` in code | Replace over time | Documented as demo-only |

---

## Dependency and CVE workflow

See [supply-chain-security-baseline.md](./supply-chain-security-baseline.md).

**Verify tiers:**

| Phase | `npm audit` | `cargo audit` |
|-------|-------------|---------------|
| Pass B / WIP | fail on moderate+ | warn if missing |
| Pre-release (PRH) | fail on moderate+ | **fail if missing** |
| Release | fail on low+ | fail + SBOM |

---

## Adoption requirements (sibling products)

Each product repo must have:

```txt
docs/security/supply-chain-security-baseline.md
.memory/security.md
scripts/verify-deps.sh (or equivalent)
projects/manifests/<product>.project-manifest.yaml with security_baseline_commit
projects/evidence/<product>/security/ (audit artifacts)
```

Pin framework baseline:

```yaml
security:
  framework_baseline_commit: "<sha from xi-io.net security/baseline.yaml>"
  product_baseline_doc: docs/security/supply-chain-security-baseline.md
```

---

## Framework hub layout (xi-io.net — not yet built)

```txt
security/baseline.yaml
security/ssdf-control-map.md
security/slsa-roadmap.md
security/scvs-checklist.md
security/incident-playbook.md          ← mirror from product template
security/product-security-manifest.schema.yaml
security/security-exception-register.md
```

Propagation: mirror → product evidence folder → manifest field → agent start checklist.

---

## Tags

```txt
#xio:framework/security/standard-v1
#xio:framework/security/nist-ssdf
#xio:framework/security/slsa
```
