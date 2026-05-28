# Master Prompt: Standardization and Pathing Audit

Date: 2026-05-28

Use this prompt before the next implementation sprint if agents are paused after the image hydration gate integration.

## Prompt

```txt
You are working in:

Vado42-chris/xi-io-emulator

CURRENT TASK:
XARCADE-STANDARDIZATION-AUDIT-001

MISSION:
Before coding new features, audit and reconcile naming, directory layout, pathing, documentation index coverage, framework sync artifacts, and conversation-derived decisions.

This is a repo hygiene and planning lock pass.
Do not implement launch, storage scan, image hydration, Ibal, media, provider downloads, or bulk ingress in this pass.

FIRST READ:
README.md
docs/INDEX.md
docs/architecture/naming-and-pathing-standard.md
docs/architecture/conversation-decision-backlog.md
docs/project-tracking/open-work-ledger.md
docs/framework/repo-sync-contract.md
docs/framework/xi-io-net-sync-status.md
docs/framework/serialized-hashtags-standard.md
docs/decisions/library-image-hydration-before-bulk-ingress.md
docs/decisions/rosetta-stone-artwork-identity-resolution.md
docs/decisions/ibal-assistant-and-local-ai-strategy.md
docs/agent-master-prompt-image-hydration.md
docs/agent-handoff-image-hydration.md
projects/manifests/xi_io_emulator.project-manifest.yaml
projects/hydration/xi_io_emulator.hydration-state.yaml

ALSO INSPECT:
src/
src/components/
src/components/arcade/ if present
src/services/
src/data/
src/data/adapters/
src-tauri/
docs/
projects/
.gitignore
package.json

BEFORE EDITING, RUN:
git status
git branch --show-current
git log --oneline -20
npm run typecheck
npm run lint
npm run build

REPORT BEFORE EDITING:
- current branch
- latest commit
- uncommitted files
- whether local repo is ahead/behind origin/main if knowable
- current planned slice order from docs
- current milestone from manifest/hydration
- whether any source code contains private absolute ROM paths
- whether docs mention old slice order without image hydration gate
- whether Ibal/local AI docs are indexed
- quality gate results

AUDIT CHECKLIST:

1. Documentation index coverage
Confirm docs/INDEX.md lists:
- docs/architecture/naming-and-pathing-standard.md
- docs/architecture/conversation-decision-backlog.md
- docs/decisions/rosetta-stone-artwork-identity-resolution.md
- docs/decisions/ibal-assistant-and-local-ai-strategy.md
- docs/agent-master-prompt-image-hydration.md
- docs/agent-master-prompt-standardization-audit.md

2. Slice order consistency
Every major planning doc must preserve this order:

Pass B: hardware proof
Pass C: launch proof documentation close
XARCADE-IMAGE-HYDRATION-001
XARCADE-IBAL-SLOT-001, optional/reserved, not blocking image hydration
XARCADE-STORAGE-001

If a doc says bulk hydration or storage comes before image hydration, correct it.

3. Naming consistency
Use canonical names:
- xi-io Emulator for technical product
- xi-io Arcade for user-facing shell
- Xibalba Arcade for product family
- Ibal for optional assistant/conductor

4. Directory consistency
Do not move files broadly in this pass.
Only report drift unless a tiny doc-only correction is safe.

Expected dirs:
- docs/architecture/
- docs/contracts/
- docs/decisions/
- docs/framework/
- docs/future/
- docs/packaging/
- docs/project-tracking/
- docs/reports/
- docs/research/
- docs/reviews/
- projects/manifests/
- projects/hydration/

5. Pathing and privacy check
Search for private hardcoded paths in source and docs.
Flag any committed source constants that include user-private ROM paths.
Allowed:
- generic examples
- docs explaining discovered paths without indexing full libraries
- localStorage user-entered path support

Not allowed:
- hardcoded private ROM paths in source
- committed full local library catalog
- credentials or API keys

6. Serialized hashtag check
Confirm durable architecture comments and docs use tags from:
docs/framework/serialized-hashtags-standard.md

Add missing tags only where they help future search.
Do not spam tags into every line.

7. Framework sync check
Confirm manifest/hydration mention:
- current controller launch proof state
- image hydration gate
- bulk hydration blocked until image hydration
- xi-io.net mirror status
- Ibal optional/future, not required

8. Master prompts
Confirm these exist and are coherent:
- docs/agent-master-prompt-cursor-current.md
- docs/agent-master-prompt-image-hydration.md
- docs/agent-master-prompt-standardization-audit.md

Do not overwrite active implementation prompts unless correcting stale slice order.

OUTPUTS:

Add or update:
- docs/reports/standardization-audit-report.md
- docs/INDEX.md if needed
- docs/project-tracking/open-work-ledger.md if needed
- projects/hydration/xi_io_emulator.hydration-state.yaml if needed
- projects/manifests/xi_io_emulator.project-manifest.yaml if needed
- docs/framework/xi-io-net-sync-status.md if framework artifacts change

QUALITY GATES AFTER EDITING:
npm run typecheck
npm run lint
npm run build

FINAL RESPONSE FORMAT:
Summary
Files changed
Commands run
Pass/fail results
Naming audit result
Pathing/privacy audit result
Doc index audit result
Framework sync audit result
Remaining risks
Recommended next prompt
```

## Notes

This pass exists because several high-value decisions were made during planning:

```txt
image hydration before bulk ingress
Rosetta identity resolution for artwork matching
Ibal as optional conductor
Ollama/local AI as optional provider
screen keyboard before voice
standardized pathing before user hydration
```

Those decisions must remain durable outside chat history.
