# Pre-Release Hardening Milestones

Date: 2026-05-30  
Status: **Active — must complete before bulk hydration or public beta**  
Milestone ID: **XARCADE-PRE-RELEASE-HARDENING-001**  
Parent plan: [master-plan-2026-05.md](./master-plan-2026-05.md) (Phase 1D)  
Security baseline: [../security/supply-chain-security-baseline.md](../security/supply-chain-security-baseline.md)

---

## Plain-language goal

Before we invite more users or import thousands of ROMs, we finish four small but critical jobs so the app does not lose work, hide failures, or live only on one laptop. Each item below has a **done when** checklist anyone (human or AI) can verify without reading chat history.

**Do not start Phase 6 bulk hydration until every row in the summary table shows `Done` or an explicit `Deferred (approved)` with a date and reason.**

---

## Summary table (update this first)

| ID | Plain name | Status | Blocks bulk hydration? |
|----|------------|--------|----------------------|
| PRH-01 | Move play/session data to SQLite | **Not started** | Yes |
| PRH-02 | Emit `shell_focus_restore_failed` when wake fails | **Not started** | Yes |
| PRH-03 | Commit + push WIP branch to GitHub | **In progress** — GitHub pushed; branch head `95e2426`; launch code @ `45d55ee`; xi-io.net mirror pending | Yes |
| PRH-04 | Pass B closeout + peer review | **In progress** (NES launch/return improved; full checklist open) | Yes |

**Last verified:** 2026-05-30 — framework security audit pass; public manifest path-sanitized; `npm audit` 0 vulnerabilities; launch/return UX user-confirmed improved.

---

## PRH-01 — Play and session data in SQLite (not localStorage)

### What this means (plain language)

Today, “last played game,” co-play stats, and some library metadata live in the browser’s `localStorage`. That is fine for a demo, but it is easy to lose, hard to query, and not suitable for a real catalog. We move durable play/session records into **SQLite** behind Tauri, with a clear migration path.

### Why it matters

- Avoids silent data loss when clearing site data or reinstalling the shell
- Supports future “Continue,” recommendations, and batch resume checkpoints
- Aligns with [storage-contract-v1.md](../contracts/storage-contract-v1.md) and master plan Phase 6 SQLite gate

### Done when

- [ ] SQLite schema exists for: `play_sessions`, `last_focused_game`, `coplay_pairs` (or equivalent)
- [ ] One-time migration reads existing `localStorage` keys and writes to SQLite without dropping data
- [ ] `playSessionService.ts` reads/writes SQLite in Tauri; localStorage remains fallback in web-only dev mode only
- [ ] Master plan Phase 6 dry-run gate updated if SQLite was triggered early
- [ ] Ledger event on migration success or failure (no silent migration)
- [ ] No secrets or absolute home paths stored in the DB

### Safe implementation notes

- Store **game IDs and timestamps**, not ROM file contents
- ROM paths stay reference-only (read-only import rule unchanged)
- Use parameterized queries only; no string-built SQL

### Primary files (expected touch)

```txt
src/services/playSessionService.ts
src/services/db.ts
src-tauri/ (new db module or existing persistence layer)
docs/contracts/storage-contract-v1.md
```

### Related deferred work (do not confuse with PRH-01)

- In-game save-state slots (FCEUX `.sav` / RetroArch states) — separate milestone **XARCADE-SAVE-STATE-001**
- Browse UI snapshot (filters, scroll) — **XARCADE-NAV-SNAPSHOT-001**

---

## PRH-02 — Real failure signal when shell wake fails

### What this means (plain language)

When a game closes, we try to show the xi-io window again. Today we always log success-ish events even when focus restore actually failed. We must emit a **real failure** ledger event and UI signal when wake does not work.

### Why it matters

- Stops “lobotomized” debugging where agents assume restore worked because code ran
- Matches [launch-failure-codes.md](../operations/launch-failure-codes.md) **XIO-LCH-008**
- Hashtag `#ledger:shell_focus_restore_failed` is documented but **not implemented**

### Done when

- [ ] `wake_shell` / `wake_shell_wm_once` return a boolean success (Tauri show + optional X11 activate)
- [ ] On failure: emit Tauri event + ledger `shell_focus_restore_failed` with reason (no PII)
- [ ] On success: keep existing `shell_focus_restored` / session-finished clean path
- [ ] Failure-code matrix row for XIO-LCH-008 marked **Implemented**
- [ ] `scripts/verify-shell-restore-guardrails.sh` checks that failure path exists in source

### Safe implementation notes

- Log **reason codes** (`xid_missing`, `xdotool_timeout`, `window_title_mismatch`) — not window titles with user paths
- Do not re-introduce focus-retry storms or blocking `xdotool --sync`

### Primary files

```txt
src-tauri/src/window_registry.rs
src-tauri/src/lib.rs
src/services/launchService.ts (ledger)
docs/operations/launch-failure-codes.md
```

---

## PRH-03 — Commit and push WIP branch (fixes not only on one machine)

### What this means (plain language)

Launch, session supervisor, controller GUID, shell restore, and verify scripts must live on **GitHub**, not only in local uncommitted files. One laptop dying should not erase Pass B.

### Why it matters

- Peer review requires a remote SHA
- xi-io.net mirror and Workbench events reference commit SHAs
- CI and other agents cannot reproduce your machine-only state

### Done when

- [x] Branch `wip/pass-b-lifecycle-display-shell` has **focused commits** (18 ahead of main — review slice before merge)
- [x] `git push -u origin wip/pass-b-lifecycle-display-shell` completed
- [ ] `projects/hydration/xi_io_emulator.hydration-state.yaml` `product_repo_commit` updated to current head
- [ ] xi-io.net evidence folder mirrored (see [xi-io-net-sync-status.md](../framework/xi-io-net-sync-status.md))
- [x] README and manifest list branch + SHAs for Pass B retest

### SHA reference (peer review — do not confuse)

| Label | SHA | Meaning |
|-------|-----|---------|
| **Launch + hardening code** | `45d55ee` | Session supervisor, gamepad GUID, shell restore, verify scripts |
| **Docs-only status update** | `95e2426` | Records GitHub push; no new launch code |
| **Current WIP branch head** | `95e2426` | Use this SHA for clone/checkout and retest |

PRH-03 **code push** is satisfied at `45d55ee` and included in head `95e2426`.  
PRH-03 **xi-io.net mirror** and hydration-state commit field remain open.

### Suggested commit split (plain language)

1. `fix(launch): session supervisor, FCEUX cleanup, gamepad GUID`
2. `fix(shell): eager restore, hide/show hibernate`
3. `chore(verify): ui-toolbar, session-idle, deps guardrails`
4. `docs: pre-release hardening + security baseline`
5. `docs: framework security standard + path-safe manifest` (this pass)

### Current gap (2026-05-30)

GitHub push complete. Remaining: xi-io.net mirror, hydration-state SHA update, WIP review slicing before any merge to `main`.

---

## PRH-04 — Pass B closeout and peer review

### What this means (plain language)

Pass B is “prove one NES and one SNES game launch, play, and return with a controller.” We close it with **written evidence** and an external peer review — not by assuming chat success counts.

### Why it matters

- Master plan **blocks bulk hydration** until Pass B/C gates pass
- Prevents repeating the same launch/regression cycle at scale

### Done when

- [ ] User checklist in [troubleshooting-pass-b.md](../operations/troubleshooting-pass-b.md) signed (NES + SNES proof shelf only)
- [ ] [pass-b-final-evidence-report.md](../reports/pass-b-final-evidence-report.md) updated with 2026-05-30 results (launch, return, controller, sound as applicable)
- [ ] Ledger milestone state: Pass B **complete**, Pass C **in progress**
- [ ] Peer review recorded (GitHub PR comment, review doc, or Workbench event)
- [ ] Path-privacy sign-off: public manifest + showcase catalogs + evidence docs redacted (see [security-application-plan-xi-io-emulator.md](./security-application-plan-xi-io-emulator.md))
- [ ] `master-plan-2026-05.md` Pass B table updated — no row stuck at “Partial” without explanation
- [ ] Only after the above: begin XARCADE-IMAGE-HYDRATION-001 planning execution

### Evidence already captured (update report, do not rely on chat)

- NES game loads and returns to shell (user confirmed 2026-05-30)
- Shell restore improved (eager wake, hide/show) — retest after PRH-02
- Controller + sound + in-game exit chord — verify per game and document in report

---

## Recommended execution order (reduces error)

Work in this order unless a peer review explicitly re-prioritizes:

1. **PRH-03** — commit + push WIP branch; mirror xi-io.net evidence
2. **PRH-04** — update Pass B evidence report + peer review sign-off
3. **PRH-02** — implement `shell_focus_restore_failed` (small, high visibility)
4. **PRH-01** — SQLite play/session migration before bulk catalog
5. **Framework** — create `security/baseline.yaml` on xi-io.net; point sibling repos at hub SHA

---

## Related future milestones (not PRH — do not merge scope)

These were discussed in planning but are **separate** from PRH-01–04. Track here so they are not lost in chat.

| Milestone ID | Plain name | Status | Blocks bulk hydration? |
|--------------|------------|--------|----------------------|
| XARCADE-NAV-SNAPSHOT-001 | Restore browse filters, shelf index, scroll on game exit | Not started | No |
| XARCADE-SAVE-STATE-001 | Engine save-state paths + Continue on game card | Not started | No |
| XARCADE-QUICK-RESUME-001 | Suspend-without-exit (engine-specific) | Deferred | No |

**Today on game exit:** `focusGameById()` restores the game tile; in-game progress relies on FCEUX/RetroArch native `.sav` files only.

---

## Conversation-to-repo map (2026-05-30)

| Topic | Locked in repo? | Location |
|-------|-----------------|----------|
| PRH-01–04 | Yes | This file |
| Security propagation / xi-io.net hub | Yes | [supply-chain-security-baseline.md](../security/supply-chain-security-baseline.md), [framework-security-standard-v1.md](../security/framework-security-standard-v1.md) |
| Path/privacy (public repo) | Mostly done | Manifest + catalogs + docs redacted; operator must configure `.env.local` |
| NES launch/return success | Partial | Update under PRH-04 → `pass-b-final-evidence-report.md` |
| Navigation snapshot | Planned | XARCADE-NAV-SNAPSHOT-001 above |
| In-game Continue | Planned | XARCADE-SAVE-STATE-001 above |
| xi-io.net `security/baseline.yaml` | Not yet | Hub mirror of [security-baseline.schema.yaml](../security/security-baseline.schema.yaml) |

---

## How humans and AI should update this file

At the **end of every slice** that touches pre-release hardening:

1. Change the **Status** column in the summary table
2. Check off **Done when** boxes only when verified (command output, user sign-off, or PR link)
3. Add one line under **Last verified** with date + what was run
4. Mirror milestone state to:
   - [open-work-ledger.md](./open-work-ledger.md) § Pre-release hardening
   - `projects/manifests/xi_io_emulator.project-manifest.yaml` → `pre_release_hardening`
   - xi-io.net hydration/evidence mirror when pushing (PRH-03)

**Never mark PRH-04 complete without user hardware sign-off.**

---

## Tags

```txt
#xio:emulator/pre-release/hardening
#xio:emulator/milestone/XARCADE-PRE-RELEASE-HARDENING-001
#risk:silent-failure
#todo:sqlite/play-session-migration
#todo:ledger/shell_focus_restore_failed
```
