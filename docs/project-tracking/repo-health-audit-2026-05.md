# Repo File-Health Audit — May 2026

Date: 2026-05-28  
Auditor: Cursor agent (Phase -2)  
Master plan: [master-plan-2026-05.md](./master-plan-2026-05.md)

**Classification: RED** — WIP isolation and canonical docs required before implementation.

Re-run mechanical sections: `bash scripts/repo-health-audit.sh` → `.tmp/audit-*.txt`

---

## 1. Executive summary

Planning docs from Pass B (May 2026) are solid but **implementation outran documentation and branch hygiene**. Working tree on `master` is heavily dirty (~29 modified + ~21 untracked) mixing Pass B lifecycle, showcase hydration, arcade UX, UI framework, and uncommitted ops docs. Four local commits are ahead of `origin/main`.

Several expected canonical docs were missing until 2026-05-28 planning session created them under `docs/project-tracking/` and `docs/contracts/`.

**Do not start Phase 0+ implementation until:** peer review of this report, WIP isolation (Phase -1), and docs-only checkpoint commit approved.

---

## 2. Current branch/state

| Item | Value (2026-05-28 snapshot) |
|------|----------------------------|
| Current branch | `master` |
| Remote | `origin` → github.com/Vado42-chris/xi-io-emulator |
| Default remote branch | `origin/main` |
| Ahead/behind | **4 ahead**, 0 behind `origin/main` |
| Uncommitted modified | 29 files |
| Untracked | 21+ files/dirs |
| Local branches | `master`, `wip/pass-b-lifecycle-display-shell`, `feature/ui-framework-001` |
| Remote branches | `origin/main`, `origin/docs/xibalba-ui-framework-001` |

Commits on `master` not on `origin/main`:

- `8a8b041` Merge branch 'master' into wip/pass-b-lifecycle-display-shell
- `baf5fbd` feat(ui): add atomic UI kit and migrate Admin Engines page
- `8080016` WIP: preserve Pass B lifecycle display shell and showcase experiments
- `4618ee5` docs: add Pass B launch troubleshooting and failure codes

---

## 3. Dirty tree classification

### Modified — by category

| Category | Files |
|----------|-------|
| docs | `docs/operations/troubleshooting-pass-b.md` |
| Pass B lifecycle | `src-tauri/src/lib.rs`, `game_session.rs`, `emulator_process.rs`, `display_service.rs`, `window_registry.rs`, `tauri.conf.json` |
| showcase hydration | `showcaseHydrationService.ts`, `artworkProvider.ts`, `ingressService.ts`, `db.ts`, `gameModels.ts` |
| Arcade UX | `ArcadeHome.tsx`, `GameTile.tsx`, `TagPill.tsx`, `AppShell.tsx`, `GameDetailPanel.tsx` |
| UI framework | `index.html`, `package.json`, `vite.config.ts`, `main.tsx`, `styles*.css`, `EnginesPage.tsx` |
| launch services | `launchService.ts`, `adapterService.ts`, `tauriService.ts`, `launchDisplayService.ts`, `arcadeGamepadService.ts` |

### Untracked — by category

| Category | Files |
|----------|-------|
| Pass B Rust | `engine_launch.rs`, `session_startup.rs`, `shell_restore.rs` |
| launch pipeline TS | `engineLaunchService.ts`, `engineDiscoveryService.ts`, `engineReadinessService.ts` |
| showcase | `nesShowcaseCatalog.ts`, `ingressChecklistDefinition.ts`, `ingressChecklistService.ts` |
| Arcade UX | `ArcadeGameDetail.tsx`, `GameRecommendations.tsx`, `recommendationService.ts`, `playSessionService.ts`, etc. |
| scripts | `scripts/` (verify-engine-launch) |
| session | `useEmulatorSessionLifecycle.ts` |

**Risk:** six workstreams in one dirty tree — any undisciplined commit violates global commit rules.

---

## 4. Branch drift / local-vs-main

- GitHub `origin/main` lacks UI kit, WIP lifecycle bundle, and operations runbooks present locally
- Untracked launch-hardening modules exist **only on disk**
- `origin/docs/xibalba-ui-framework-001` on remote — **merge decision pending** (diff to capture on next fetch)
- `wip/pass-b-lifecycle-display-shell` and `feature/ui-framework-001` show no commits ahead of `master` — WIP is in working tree, not branch tips

---

## 5. Directory health summary

| Path | Files (approx) |
|------|----------------|
| docs/ | 62+ |
| docs/project-tracking/ | was 1 → now master plan + audit + indexes |
| docs/framework/ | 4 (xibalba-ui-* **missing** on master) |
| src/components/ | 26 |
| src/services/ | 26 |
| src-tauri/src/ | 12+ |

Observations:

- Reports at `docs/*.md` root should move to `docs/reports/` or be indexed explicitly
- `walkthrough.md` at repo root — index or relocate
- God files: `ArcadeHome.tsx` (~1700 lines), `AppShell.tsx` (~1300 lines)

---

## 6. Naming convention findings

| Finding | Action |
|---------|--------|
| `pass-b-final-evidence-report.md` in `docs/reports/` | Keep — milestone label |
| `.tmp/cargo-target` build hashes matching `new`/`wip` | Keep gitignored |
| `master` vs `origin/main` | Document policy; align branches |
| Duplicate handoffs (`agent-handoff-arcade-home` vs `cursor-arcade-home`) | Merge or mark superseded |

---

## 7. Duplicate / misfiled docs

| Concept | Canonical | Duplicate / misplaced | Action |
|---------|-----------|----------------------|--------|
| Controller proof | `docs/reports/controller-launch-proof-report.md` | handoff + pass-b reports | Cross-link; update on Pass C |
| Launch failures | `docs/operations/launch-failure-codes.md` | troubleshooting runbook | Parity matrix in codes doc |
| Search/filters | `docs/agent-handoff-search-and-filters.md` | `docs/search-and-filters-report.md` | Move report to `docs/reports/` |
| UI framework | Remote `xibalba-ui-*-v1.md` | local `ui-component-catalog.md` | Merge branch; parent/child relationship |
| Master plan | `docs/project-tracking/master-plan-2026-05.md` | `.cursor/plans/*.plan.md` | Repo wins |

---

## 8. Missing expected docs (snapshot before fix)

| Path | Status |
|------|--------|
| `docs/framework/xibalba-ui-framework-standard-v1.md` | Missing on master (remote branch) |
| `docs/project-tracking/master-plan-2026-05.md` | **Created 2026-05-28** |
| `docs/project-tracking/admin-feature-audit-index.md` | **Created 2026-05-28** |
| `docs/project-tracking/feature-matrix.md` | **Created 2026-05-28** |
| `docs/contracts/hydration-completeness-checklist.md` | **Created 2026-05-28** |
| `docs/contracts/arcade-surface-field-spec.md` | **Created 2026-05-28** |
| `docs/reports/search-and-filters-report.md` | Missing — report at docs root instead |

---

## 9. INDEX / ledger / README / hydration YAML drift

- **INDEX.md** dated 2026-05-28 — must add master plan, audit, contracts (Phase 0)
- **open-work-ledger.md** — missing launch hardening, showcase boundary, audit resilience
- **README.md** — missing verify:engine-launch, runbook link, branch policy
- **hydration-state.yaml** — missing launch_hardening in completed_in_repo; showcase vs image hydration not distinguished
- Workbench event: reconcile ledger vs `xi-io-net-sync-status.md`

---

## 10. Source structure concerns

| File | Lines | Treatment |
|------|-------|-----------|
| ArcadeHome.tsx | ~1699 | Split later |
| AppShell.tsx | ~1288 | Split admin tabs to pages |
| shell_exit_input.rs | ~874 | Leave for now |
| lib.rs | ~814 | Contain launch/session commands |

Duplicate surfaces: `GameDetailPanel` (admin) vs `ArcadeGameDetail` (arcade) — align via arcade-surface-field-spec.

---

## 11. Hardcoded path findings

| Location | Verdict |
|----------|---------|
| `snesShowcaseCatalog.ts`, `nesShowcaseCatalog.ts` | Fixture — needs provenance labels |
| `AppShell.tsx` `/media/arcade-usb/` | Demo mock — keep out of proof paths |
| `proofGameService.ts` STALE_DEMO prefix | Good labeling |
| `src-tauri/` | No user paths — clean |

---

## 12. Xibalba UI framework branch status

**Branch:** `origin/docs/xibalba-ui-framework-001`  
**Fetched:** 2026-05-28  
**Diff vs `origin/main`:** 5 files, +1335 lines — **docs only, no source changes**

| File | Lines (approx) |
|------|----------------|
| `docs/framework/xibalba-ui-framework-standard-v1.md` | +358 |
| `docs/framework/xibalba-ui-adoption-matrix-v1.md` | +539 |
| `docs/framework/xibalba-ui-component-registry-plan-v1.md` | +345 |
| `docs/project-tracking/xibalba-ui-framework-001-ledger-note.md` | +85 |
| `docs/INDEX.md` | +8 (conflict likely with local INDEX updates) |

**Source files changed:** none (`src/`, `src-tauri/` clean in diff)

**Merge recommendation:** **Merge in Phase -1** as docs-only PR before XARCADE-UI-FRAMEWORK-001. Resolve `docs/INDEX.md` by keeping master-plan-first read sequence from local master. Update ledger with XIBALBA-UI-FRAMEWORK-001 checkpoint after merge.

**Conflicts likely:** `docs/INDEX.md` only  
**Conflicts unlikely:** framework v1 docs (new files on master)

See also [historical-plans-consolidation.md](./historical-plans-consolidation.md).

---

## 13. Must-fix before implementation

1. Isolate dirty tree into WIP branches or stash with file map
2. Push or PR 4 commits ahead of origin/main
3. Peer-review docs created in this session; docs-only commit
4. Merge/defer UI framework docs branch with decision record
5. Reconcile ledger ↔ hydration YAML ↔ README ↔ sync-status
6. Commit ops runbook + XIO-LCH-014–016
7. Label showcase fixtures with provenance
8. Resolve master/main naming

---

## 14. Safe-to-defer

- Admin page scoring until audit index exists
- SQLite until dry-run proves need
- Full SNES scan until Pass B/C + image hydration
- God-file splits
- Moving root reports to docs/reports/ (batch with Phase 0)

---

## 15. Recommended branch strategy

1. Do not commit mixed WIP on master as-is
2. Docs-only branch from reviewed base → PR to main
3. Source WIP: `wip/pass-b-launch-hardening`, `wip/showcase-fixtures`, `wip/arcade-ux-session`
4. Align `master` with `origin/main` after review

---

## 16. Repo health classification history

| Date | Classification | Notes |
|------|----------------|-------|
| 2026-05-28 | **RED** | Initial audit; canonical plan docs created same session |

**YELLOW criteria:** clean/isolated tree, canonical docs committed, INDEX/ledger aligned, UI framework decision recorded.

**GREEN criteria:** above + ops docs + failure-code parity + peer review signed.

---

## 17. Next prompt (after peer review)

> Execute Phase -1 (git hygiene only): isolate WIP branches, fetch and diff UI framework branch, update section 12 of this audit, prepare docs-only PR. No source changes. No Pass B/C close. Return branch map and updated classification.
