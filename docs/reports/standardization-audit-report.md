# Standardization Audit Report

Date: 2026-05-28  
Slice: **XARCADE-STANDARDIZATION-AUDIT-001**  
Tags: `#xio:emulator/pathing/standard` `#xio:emulator/naming/standard` `#risk:path-drift`

## Summary

Repo hygiene and planning lock pass completed before Pass B/C and image hydration implementation. Pulled user standardization checkpoint commits (`bd181ea`, `a88f413`, `b329913`). Audited documentation index coverage, slice order, naming, path/privacy leakage, framework sync artifacts, and master prompts. Applied doc-only corrections and one source fix for committed private path leakage.

**Verdict:** **approve to proceed with Pass B** — no blocking doc drift; remaining risks documented below.

## Pre-audit state

| Item | Value |
|------|-------|
| Branch | `master` (tracks `origin/main`) |
| Latest commit (pre-audit) | `b329913` |
| Local vs origin/main | **in sync** |
| Uncommitted files | none |

## Commands run

```bash
git fetch origin && git pull origin main
npm run typecheck   # pass
npm run lint        # pass
npm run build       # pass
rg private-path patterns (chrishallberg, Storage 22, /home/user/retro)
```

## Pass / fail results

| Gate | Result | Verified |
|------|--------|----------|
| typecheck (pre) | pass | 2026-05-28 |
| lint (pre) | pass | 2026-05-28 |
| build (pre) | pass | 2026-05-28 |
| typecheck (post) | pass | 2026-05-28 |
| lint (post) | pass | 2026-05-28 |
| build (post) | pass | 2026-05-28 |
| git commit (audit) | pending this commit | — |

`cargo check` not re-run — unchanged blocker (WebKitGTK/libsoup; Pass B user install).

## 1. Documentation index audit

### Required entries (audit checklist)

| Doc | Pre-audit INDEX | Post-audit |
|-----|-----------------|------------|
| `docs/architecture/naming-and-pathing-standard.md` | **missing** | added |
| `docs/architecture/conversation-decision-backlog.md` | **missing** | added |
| `docs/decisions/rosetta-stone-artwork-identity-resolution.md` | **missing** | added |
| `docs/decisions/ibal-assistant-and-local-ai-strategy.md` | **missing** | added |
| `docs/agent-master-prompt-image-hydration.md` | **missing** | **created** (thin master prompt → handoff) |
| `docs/agent-master-prompt-standardization-audit.md` | **missing** | added |

**Result:** corrected in this pass.

## 2. Slice order consistency audit

Canonical order (locked):

```txt
Pass B: hardware proof
Pass C: launch proof documentation close
XARCADE-IMAGE-HYDRATION-001
XARCADE-IBAL-SLOT-001 (optional/reserved — not blocking image hydration)
XARCADE-STORAGE-001
```

| Doc | IBAL-SLOT before audit | Post-audit |
|-----|------------------------|------------|
| `conversation-decision-backlog.md` | present | unchanged |
| `naming-and-pathing-standard.md` | present | unchanged |
| `agent-master-prompt-standardization-audit.md` | present | unchanged |
| `docs/INDEX.md` | **missing** | corrected |
| `open-work-ledger.md` | **missing** | corrected |
| `backlog.md` | **missing** | corrected |
| `hydration-state.yaml` | **missing** | corrected |
| `agent-master-prompt-cursor-current.md` | **missing** | corrected |
| `controller-launch-proof-report.md` | **missing** | corrected |

No doc found placing bulk `XARCADE-STORAGE-001` before image hydration.

**Result:** corrected in this pass.

## 3. Naming consistency audit

| Canonical name | Usage in repo | Status |
|----------------|---------------|--------|
| xi-io Emulator (technical) | README, contracts, reports | consistent |
| xi-io Arcade (user shell) | ArcadeHome, arcade docs | consistent |
| Xibalba Arcade (family) | README, product-brief, localStorage keys | consistent |
| Ibal (optional assistant) | decision doc, backlog slot | documented as optional |

**Result:** pass — no conflicting product rename found.

## 4. Directory structure audit

Expected dirs present: `docs/architecture/`, `docs/decisions/`, `projects/manifests/`, `projects/hydration/`, etc.

| Drift | Status |
|-------|--------|
| `src/components/arcade/` not created | **acceptable transitional** per naming standard |
| Arcade components under `src/components/` | documented; no broad move in this pass |

**Result:** pass with noted transitional state.

## 5. Pathing and privacy audit

### Source code

| Location | Issue | Severity | Action |
|----------|-------|----------|--------|
| `AppShell.tsx` storage preset | Hardcoded `/media/chrishallberg/Storage 22/...` | **high** | **fixed** → generic example path |
| `AppShell.tsx` demo defaults | `/home/user/retro/games/...`, `/media/arcade-usb/...` | low | acceptable generic demo placeholders; used in staging UI |
| `manifest.yaml` `local_path` | User dev machine path | low | acceptable in framework manifest (not ROM catalog) |

### Documentation

| Location | Issue | Severity | Action |
|----------|-------|----------|--------|
| `controller-launch-proof-report.md` Pass B table | User-specific discovered paths | low | **allowed** per naming standard for local reports; flagged for redaction if repo goes public |
| `agent-handoff-controller-launch.md` | Absolute project `cd` path | low | corrected to generic note |
| `walkthrough.md` | Antigravity cache path with username | low | **flagged** — remove or replace in future doc cleanup |

**Result:** one source fix applied; remaining items documented as risks.

## 6. Serialized hashtag audit

Core launch proof tags present in code (`#xar:controller-launch-proof/current`, `#adapter:fceux/nes`, etc.).

New architecture tags documented in decision/backlog docs but not yet all listed in `serialized-hashtags-standard.md`:

```txt
#xar:image-hydration/rosetta
#xio:emulator/ibal/optional
#xio:emulator/pathing/standard
#risk:private-path-leak
```

**Action:** extended `serialized-hashtags-standard.md` in this pass.

## 7. Framework sync audit

| Artifact | Status |
|----------|--------|
| `projects/manifests/xi_io_emulator.project-manifest.yaml` | present; updated slice order |
| `projects/hydration/xi_io_emulator.hydration-state.yaml` | present; **sync_metadata was stale** — updated |
| xi-io.net mirror | last `93ab97c`; **re-mirror pending** this audit commit |
| Workbench preview event | still pending |

Hydration mentions: controller proof pending, image gate, bulk blocked, Ibal optional — updated.

## 8. Master prompts audit

| Prompt | Status |
|--------|--------|
| `agent-master-prompt-cursor-current.md` | present; slice order corrected |
| `agent-master-prompt-image-hydration.md` | **created** this pass |
| `agent-master-prompt-standardization-audit.md` | present (user commit) |

## Conversation decisions indexed

| Decision | Durable doc | Indexed |
|----------|-------------|---------|
| Image hydration before bulk ingress | `library-image-hydration-before-bulk-ingress.md` | yes |
| Rosetta identity resolution | `rosetta-stone-artwork-identity-resolution.md` | yes (post-audit) |
| Ibal optional / Ollama optional | `ibal-assistant-and-local-ai-strategy.md` | yes (post-audit) |
| Screen keyboard before voice | ibal decision doc | yes |
| Media platform future track | `media-platform-extension-track.md` | yes |
| Naming/pathing standard | `naming-and-pathing-standard.md` | yes (post-audit) |
| Decision backlog | `conversation-decision-backlog.md` | yes (post-audit) |

## Remaining risks (not blocking Pass B)

```txt
Demo/staging UI still uses /home/user/retro and /media/arcade-usb example paths — gate behind demo mode in a future slice.
walkthrough.md contains a personal Antigravity screenshot path — redact when editing walkthrough.
Pass B machine discovery paths in launch proof report — OK for local ops; avoid copying into source.
SNES snes9x core may be missing on user machine (bsnes cores present) — Pass B blocker, not audit blocker.
Tauri compile still requires user sudo apt install.
Workbench preview JSON event not yet added on xi-io.net.
src/components/arcade/ migration deferred — track in future refactor slice.
```

## Recommended next prompt

Pass B (user):

```txt
Install Tauri Linux deps, run npm run tauri:dev, complete dual launch proof checklist, return Pass B results.
```

Then Pass C (agent):

```txt
Close XARCADE-CONTROLLER-LAUNCH-PROOF-001 docs/hydration/framework sync from Pass B results.
```

Then:

```txt
XARCADE-IMAGE-HYDRATION-001 via docs/agent-master-prompt-image-hydration.md
```

Do **not** start bulk hydration or Ibal implementation until image hydration slice completes.

## Pass estimate (post-audit)

| Pass | Focus | Owner |
|------|--------|-------|
| B | Hardware proof | User |
| C | Launch proof milestone close | Agent (~1 pass) |
| D | IMAGE-HYDRATION-001 | Agent (~2–3 passes) |
| E | IBAL-SLOT-001 optional contract | Agent (~1 pass, can defer) |
| F | STORAGE-001 with visual identity | Agent (~2+ passes) |
| G | xi-io.net Workbench preview + schema validation | Agent (~0–1 pass) |

**~5–7 agent passes** after Pass B to full compliance + two-way framework freshness including image hydration.
