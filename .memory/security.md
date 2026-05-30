# Security

Rules that must NEVER be broken. Always read this file before spawning processes, adding dependencies, or touching user data paths.

## Read first

```txt
docs/security/supply-chain-security-baseline.md
docs/project-tracking/pre-release-hardening-milestones.md
docs/decisions/non-mutating-local-library-import.md
```

## Non-negotiable rules

1. **No secrets in git** — no `.env`, tokens, keys, or credentials in commits or docs meant for public mirror.
2. **ROMs are read-only** — never move, rename, or patch user library files from xi-io code.
3. **Never kill the xi-io shell process group** — emulator teardown is PID-scoped only (`signal_pid_safe`).
4. **No blocking WM calls** — no `xdotool --sync`; use `run_subprocess_with_timeout` (2s max).
5. **No global emulator pkill** — no `pkill -x fceux` or equivalent broad kills.
6. **Parameterized SQL only** when SQLite lands (PRH-01).
7. **New dependencies** require `npm run verify:deps` and a one-line note in the PR/slice report.
8. **New Tauri commands** that exec, read `/proc`, or access filesystem require capability review.
9. **Logs and ledger** use game IDs and reason codes in shared reports — avoid dumping full user paths to public mirrors.
10. **Do not mark Pass B or pre-release milestones complete** without user hardware sign-off (PRH-04).

## Verify before merge

```bash
npm run verify:deps
npm run verify:shell-restore
npm run typecheck:app
```
