# Security Exception Register

Date: 2026-05-30  
Owner: Framework security (xi-io.net hub) / product maintainers

## Purpose

When we cannot meet a security control on schedule, we record an **exception** here — not in chat. Exceptions expire and require review. This prevents “lobotomized” compliance where everyone forgets why a gap exists.

---

## Register (template — add rows as needed)

| Exception ID | Product | Control skipped | Risk | Reason | Mitigation | Owner | Opened | Expires | Review status |
|--------------|---------|-----------------|------|--------|------------|-------|--------|---------|---------------|
| *(none open)* | — | — | — | — | — | — | — | — | — |

---

## Example row (do not copy as active unless true)

| Exception ID | Product | Control skipped | Risk | Reason | Mitigation | Owner | Opened | Expires | Review status |
|--------------|---------|-----------------|------|--------|------------|-------|--------|---------|---------------|
| EX-2026-001-EXAMPLE | xi_io_emulator | cargo-audit mandatory | Medium CVE visibility gap | cargo-audit not in CI yet | npm audit + manual cargo audit on release candidates | maintainer | 2026-05-30 | 2026-08-30 | open |

---

## How to add an exception

1. Assign ID: `EX-YYYY-NNN-short-name`
2. State control, risk, and mitigation in plain language
3. Set expiry (default 90 days)
4. Link PR or issue
5. Mirror to xi-io.net hub register on merge
6. Remove or renew before expiry — never leave expired rows silently

---

## Tags

```txt
#xio:framework/security/exceptions
```
