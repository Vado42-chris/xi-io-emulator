# WIP Branch Map

Date: 2026-05-29  
Phase: **-1** (WIP isolation — classification only; source stays in working tree until peer review)  
Repo health target: **RED → YELLOW** after named branches + docs-only commit land

## Purpose

Every dirty file in the working tree is assigned to a **named branch intent** so Phase 1 source commits do not mix Pass B lifecycle, UI framework, showcase hydration, or docs-only work.

**Rule:** Do not commit source from `master` until each bucket is on its branch and reviewed.

## Branch policy

| Branch | Tracks | Action |
|--------|--------|--------|
| `origin/main` | GitHub default; release-facing | Push docs-only commits here after local `master` merge |
| `master` (local) | Active integration; **4 commits ahead** of `origin/main` at audit time | Align naming: treat as pre-push integration branch |
| `origin/docs/xibalba-ui-framework-001` | UI framework docs only | **Merged into working tree** 2026-05-29 (Phase -1) |
| `wip/pass-b-lifecycle-display-shell` | Pass B launch/exit/display hardening | Stage all Rust lifecycle + launch service files below |
| `feature/ui-framework-001` | Shared UI tokens/components | Stage `src/components/ui/`, styles, EnginesPage shell |
| `feature/showcase-hydration-arcade-ux` | Showcase catalog + arcade detail UX | Stage hydration + ArcadeGameDetail + recommendations |

## File classification

### A — Pass B lifecycle / launch hardening → `wip/pass-b-lifecycle-display-shell`

```txt
src-tauri/src/engine_launch.rs          (untracked)
src-tauri/src/session_startup.rs        (untracked)
src-tauri/src/shell_restore.rs          (untracked)
src-tauri/src/lib.rs
src-tauri/src/emulator_process.rs
src-tauri/src/game_session.rs
src-tauri/src/window_registry.rs
src-tauri/src/display_service.rs
src-tauri/tauri.conf.json
src/services/launchService.ts
src/services/engineLaunchService.ts      (untracked)
src/services/engineReadinessService.ts   (untracked)
src/services/launchDisplayService.ts
src/services/tauriService.ts
src/hooks/useEmulatorSessionLifecycle.ts (untracked)
src/components/ArcadeHome.tsx
src/components/AppShell.tsx
src/data/adapters/retroarch.snes.snes9x.json
package.json                             (verify:engine-launch script — move with branch)
```

### B — UI framework adoption → `feature/ui-framework-001`

```txt
src/pages/EnginesPage.tsx
src/styles.css
src/styles/tokens.css
src/styles/ui.css
src/components/TagPill.tsx
src/components/UiErrorBoundary.tsx       (untracked)
src/main.tsx
index.html
vite.config.ts
docs/framework/xibalba-ui-framework-standard-v1.md      (merged)
docs/framework/xibalba-ui-adoption-matrix-v1.md           (merged)
docs/framework/xibalba-ui-component-registry-plan-v1.md   (merged)
docs/project-tracking/xibalba-ui-framework-001-ledger-note.md (merged)
```

### C — Showcase hydration + arcade UX → `feature/showcase-hydration-arcade-ux`

```txt
src/services/showcaseHydrationService.ts
src/services/arcadeCatalogService.ts     (untracked)
src/services/batchIngressProgress.ts     (untracked)
src/services/engineDiscoveryService.ts   (untracked)
src/services/gameIdentityService.ts      (untracked)
src/services/gameNotesService.ts         (untracked)
src/services/ingressChecklistService.ts  (untracked)
src/services/playSessionService.ts       (untracked)
src/services/recommendationService.ts    (untracked)
src/services/ingressService.ts
src/services/adapterService.ts
src/services/arcadeGamepadService.ts
src/services/artworkProvider.ts
src/services/db.ts
src/components/ArcadeGameDetail.tsx      (untracked)
src/components/GameRecommendations.tsx   (untracked)
src/components/IngressChecklistPanel.tsx (untracked)
src/components/GameDetailPanel.tsx
src/components/GameTile.tsx
src/data/ingressChecklistDefinition.ts     (untracked)
src/data/nesShowcaseCatalog.ts           (untracked)
src/data/gameModels.ts
```

### D — Docs / planning / ops (Phase -2, 0) → `master` / `origin/main` (docs-only commits)

```txt
README.md
docs/INDEX.md
docs/agent-master-prompt-current-next.md
docs/backlog.md
docs/roadmap/remaining-work-pass-plan.md
docs/operations/launch-failure-codes.md
docs/operations/troubleshooting-pass-b.md
docs/project-tracking/*  (master plan, audit, consolidation, admin index, feature matrix, ledger, this file)
docs/contracts/*
docs/framework/xi-io-net-sync-status.md
scripts/repo-health-audit.sh
```

## Isolation procedure (next agent / peer review)

1. **Docs commit first** (Phase 0) — bucket D only; no source files.
2. `git stash push -m "wip-all" -- <all A+B+C paths>` or checkout branches and cherry-pick.
3. Create/update branches from clean `master` after docs land.
4. Re-run `bash scripts/repo-health-audit.sh` — expect YELLOW when source is stashed or on branches.

## Verification

```bash
bash scripts/repo-health-audit.sh
npm run typecheck          # after Pass B branch restored
npm run verify:engine-launch
cargo test --manifest-path src-tauri/Cargo.toml
```

## Status

| Item | Status |
|------|--------|
| UI framework docs merged from `origin/docs/xibalba-ui-framework-001` | **Done** 2026-05-29 |
| WIP map written | **Done** |
| Source isolated to named branches | **Pending peer review** |
| `master` / `origin/main` aligned | **Pending push after docs commit** |
