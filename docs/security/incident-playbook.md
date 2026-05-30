# Security Incident Playbook

Date: 2026-05-30  
Audience: Maintainers and AI agents (plain language)

---

## When to use this

Use this playbook when you suspect:

- A dependency CVE affects shipped code
- Secrets were committed to a public repo
- User paths or PII were exposed in a public commit
- A malicious dependency or supply-chain issue
- Unexpected network egress from the desktop app

---

## Steps

### 1. Detect

- GitHub Dependabot / secret scanning alert
- `npm audit` or `cargo audit` failure
- User or peer review report
- Agent path privacy scan (`grep` for home directory patterns)

### 2. Classify severity

| Level | Examples |
|-------|----------|
| **Critical** | Live secret in public git, RCE in default path |
| **High** | CVE in production dependency with exploit in wild |
| **Medium** | Private paths in public manifest, missing audit gate |
| **Low** | Outdated devDependency, doc hygiene |

### 3. Contain

- Rotate leaked secrets immediately (assume compromised)
- Remove secrets from git history only with maintainer approval
- For path leaks: redact in new commit; plan history scrub if sensitive
- Do not force-push `main` without explicit approval

### 4. Patch

- Update dependency or apply vendor patch
- Run `npm run verify:deps` and full verify suite
- Record exception if fix deferred (see [security-exception-register.md](./security-exception-register.md))

### 5. Verify

```bash
npm run verify:deps
npm run verify:shell-restore
npm run typecheck:app
npm run build
# cargo test in src-tauri when Rust touched
```

### 6. Propagate (framework)

1. Update xi-io.net `security/baseline.yaml` minimum_safe_commits
2. Mirror playbook/evidence to product `projects/evidence/<product>/security/`
3. Notify sibling product repos to re-run verify and bump pinned baseline SHA
4. Update [open-work-ledger.md](../project-tracking/open-work-ledger.md)

### 7. Disclose if needed

- Public repo secret leak: assume public; rotate and document in private channel first
- User data: local-first app — clarify what was on disk vs transmitted

### 8. Record evidence

- Ledger event with reason code (no full user paths in public mirror)
- Row in exception register if temporary gap remains
- Post-incident note in `docs/reports/` for significant incidents

---

## Tags

```txt
#xio:framework/security/incident
```
