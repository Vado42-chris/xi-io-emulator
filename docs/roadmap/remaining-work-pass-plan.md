# Remaining Work Pass Plan

Date: 2026-05-28

> **Execution source of truth:** [docs/project-tracking/master-plan-2026-05.md](../project-tracking/master-plan-2026-05.md)  
> This document retains Pass B–L **estimates and acceptance detail**. Open items from all prior plans are merged in [historical-plans-consolidation.md](../project-tracking/historical-plans-consolidation.md).

## Purpose

This document estimates the remaining work for xi-io Emulator from the current checkpoint through a shippable MVP and later full product maturity.

It exists so Cursor agents and future xi-io agents can continue from a shared pass plan without relying on chat history.

## Current checkpoint

```txt
Current repo state: post XARCADE-STANDARDIZATION-AUDIT-001
Current active work: Pass B hardware proof, agent-led (user-assisted)
Current implementation state: controller + launch proof implemented, pending local Tauri verification
Current major gate: no bulk hydration until image hydration exists
```

## Locked immediate slice order

```txt
Pass B  → agent-led hardware proof with two hand-picked games (user-assisted sudo/controller/GUI)
Pass C  → close controller launch proof milestone docs/hydration/framework sync
Pass D  → XARCADE-IMAGE-HYDRATION-001 pass 1, Rosetta models + fallback + local candidate matching
Pass E  → XARCADE-IMAGE-HYDRATION-001 pass 2, review UI + artwork health + report polish
Pass F  → XARCADE-IMAGE-HYDRATION-001 hardening / peer-review fixes
Pass G  → XARCADE-IBAL-SLOT-001 optional assistant slot contract, no AI dependency
Pass H  → XARCADE-STORAGE-001 pass 1, read-only source root scan plan + dry run
Pass I  → XARCADE-STORAGE-001 pass 2, real non-mutating SNES import by reference
Pass J  → XARCADE-STORAGE-001 pass 3, performance + review queues for 11,337 ROMs
Pass K  → MVP packaging / persistence / diagnostics hardening
Pass L  → MVP peer review + public/private release readiness
```

## Non-negotiable import invariant

The local SNES source root is user-owned and must be treated as read-only source material:

```txt
/media/chrishallberg/Storage 22/Games/emulators/ROMS/Super Nintendo for PC (Every SNES Rom N Emu EVER) (11337 roms)/ROMS
```

Default import may index, tag, hydrate, and map metadata by reference.

Default import must not move, rename, delete, patch, rewrite, or reorganize physical ROM files.

Canonical doc:

```txt
docs/decisions/non-mutating-local-library-import.md
```

## Pass estimates

### Pass B, agent-led hardware proof

Owner: agent-led (user-assisted)

Goal:

```txt
Install Tauri Linux deps.
Run npm run tauri:dev.
Register one NES proof ROM.
Register one SNES proof ROM.
Launch NES via FCEUX.
Launch SNES via RetroArch.
Verify controller in-game.
Click Mark In-Game Verified manually.
Return checklist.
```

Estimated effort: one local session.

Blocking risks:

```txt
Tauri deps missing
RetroArch Flatpak path/core path mismatch
snes9x core missing
FCEUX launch args differ from adapter assumption
controller works in emulator but not browser Gamepad API
```

### Pass C, launch proof close

Owner: agent

Goal:

```txt
Update controller launch report from Pass B results.
Update open-work-ledger.
Update hydration state and manifest.
Update xi-io.net mirror artifacts if available.
Record exact blockers if one of NES/SNES fails.
Keep bulk hydration blocked.
```

Estimated effort: one agent pass.

Acceptance:

```txt
XARCADE-CONTROLLER-LAUNCH-PROOF-001 is either closed as passed or closed with exact documented blocker.
Next slice remains XARCADE-IMAGE-HYDRATION-001.
```

### Pass D, image hydration foundation

Owner: agent

Goal:

```txt
Implement Rosetta identity-resolution models.
Implement normalization/tokenization helpers.
Implement artwork asset/mapping/review models.
Implement deterministic generated fallback art metadata.
Implement pure candidate matching service with injectable image-path lists.
Do not scan full user library.
Do not download provider images.
```

Estimated effort: one agent pass.

Acceptance:

```txt
identityResolutionService exists
artworkHydrationService exists
GameRecord artwork shape supports source/confidence/review state
fallback mapping exists for missing artwork
typecheck/lint/build pass
```

### Pass E, image hydration UI and review health

Owner: agent

Goal:

```txt
Wire fallback/matched artwork into GameTile and ArcadeHome.
Expose artwork confidence/review state in GameDetailPanel/Admin Mode.
Add Artwork Health summary.
Add review queue placeholder/counts for missing/possible/ambiguous artwork.
```

Estimated effort: one agent pass.

Acceptance:

```txt
text-only cards are avoided
missing artwork visible as review state
playability not blocked by missing art
possible/ambiguous matches not silently accepted
```

### Pass F, image hydration peer-review fixes

Owner: agent

Goal:

```txt
Peer review D/E output.
Fix type/model inconsistencies.
Improve confidence scoring.
Improve fallback rendering.
Update docs/reports/image-hydration-report.md.
Mirror hydration state.
```

Estimated effort: zero to one pass if D/E are clean; one pass expected.

### Pass G, Ibal slot contract

Owner: agent

Goal:

```txt
Add optional Ibal assistant slot contract.
Add command palette placeholder.
Add on-screen keyboard design stub or component shell.
Add assistant provider status model with disabled/local_ollama/openai_compatible options.
Detect nothing automatically beyond safe disabled state unless explicitly scoped.
Do not add AI as dependency.
Do not call Ollama yet unless separately approved.
```

Estimated effort: one pass, optional and deferrable.

Acceptance:

```txt
core app works with Ibal disabled
Ibal appears as future optional layer
no silent writes
no provider credentials
no voice always-listening behavior
```

### Pass H, storage dry-run design

Owner: agent

Goal:

```txt
Implement read-only source root scan design.
Add dry-run import plan for the 11,337-ROM SNES root.
Estimate counts without committing records.
Validate extensions and path access.
Do not mutate files.
Do not import full library yet unless explicitly approved after dry-run summary.
```

Estimated effort: one pass.

Acceptance:

```txt
dry-run scan summary
read-only LibraryRoot behavior
non-mutating import policy enforced in code
large-folder performance risk documented
```

### Pass I, real SNES bulk import by reference

Owner: agent

Goal:

```txt
Import SNES library records by reference.
Preserve sourcePath/rawFilename/rawStem.
Apply Rosetta identity keys.
Attach tags.
Apply artwork mapping/fallback.
Create review queues.
Do not move/rename/delete files.
```

Estimated effort: one to two passes depending on performance.

Acceptance:

```txt
11,337 ROM folder can be indexed or batched safely
import can resume/retry
UI remains responsive or shows progress
missing/ambiguous artwork states are visible
```

### Pass J, large-library performance and review queues

Owner: agent

Goal:

```txt
Optimize rendering/search for thousands of records.
Add pagination/virtualization if needed.
Improve duplicate/variant review queues.
Improve filters for region/revision/hack/translation/prototype.
Add export/report for import results.
```

Estimated effort: one to two passes.

Acceptance:

```txt
11,337-record library remains usable
Arcade shelves do not lock up
Admin review queues are navigable
```

### Pass K, MVP hardening

Owner: agent

Goal:

```txt
Persistence hardening.
Import rollback metadata.
Error diagnostics.
Flatpak/storage warnings.
Controller navigation polish.
Tauri packaging smoke test.
Docs and walkthrough cleanup.
Redact personal paths where needed.
```

Estimated effort: two to three passes.

### Pass L, MVP release readiness

Owner: agent + user

Goal:

```txt
Full peer review.
User acceptance pass.
Smoke test launch + import + search + artwork.
Confirm no prohibited file mutation.
Confirm no provider downloads by default.
Finalize MVP docs and framework sync.
```

Estimated effort: one to two passes.

## Full project beyond MVP

### Phase 2, library intelligence

Estimated effort: four to eight passes.

```txt
advanced duplicate grouping
manual merge/split review
metadata sidecar export/import
optional provider lookup with user keys
manual artwork override UI
ROM hack/translation/prototype handling
save-state and save-file policy
```

### Phase 3, Ibal assistant

Estimated effort: four to eight passes.

```txt
local Ollama detection
model selection UI
structured suggestion adapter
review-only library cleanup suggestions
controller command palette
on-screen keyboard
optional push-to-talk voice commands
ledgered approvals/rejections
```

### Phase 4, multi-system expansion

Estimated effort: six to twelve passes.

```txt
NES hardening
SNES hardening
Genesis/Mega Drive
Game Boy / GBA
PlayStation
PS2
per-system BIOS/core readiness
system-specific controller profiles
```

### Phase 5, packaging and distribution

Estimated effort: four to eight passes.

```txt
Flatpak permissions strategy
AppImage/deb packaging review
installer docs
first-run setup wizard
portable backup/export
release validation
```

### Phase 6, media-platform sibling track

Estimated effort: future project, not part of emulator MVP.

```txt
shared 10-foot shell kit
media provider registry
watch-state ledger
user-configured provider/debrid adapters where lawful
separate product or mode decision
```

## Current total estimate

From current checkpoint to shippable SNES-focused MVP with read-only bulk import and carousel-ready cards:

```txt
Pass B: user session
Pass C-L: approximately 9 to 15 agent passes
```

From current checkpoint to broader polished multi-system product:

```txt
approximately 25 to 50 additional agent passes, depending on system count, packaging depth, provider integrations, and Ibal scope
```

## Guardrails that must remain true

```txt
No bulk hydration before image hydration.
No text-only bulk GameRecords.
No physical ROM rename/move/delete by default.
No automatic provider image downloads.
No Ibal dependency for core emulator functions.
No silent writes.
No hidden mutation of emulator configs.
No public copyrighted ROM distribution paths or catalogs.
```

## Serialized tags

```txt
#xio:emulator/roadmap/pass-plan
#xio:emulator/storage/non-mutating
#xar:image-hydration/planning
#xar:storage/bulk-import/future
#xar:ibal-slot/future
#risk:large-library-performance
#risk:accidental-file-mutation
```
