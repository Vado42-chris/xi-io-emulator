# Repo Sync Contract

Date: 2026-05-28

## Purpose

xi-io Emulator must remain trackable by the wider xi-io framework and workbench pattern.

This document defines the local sync contract that future agents should follow.

## Current state

The wider framework repository is not available through this assistant's current GitHub connector scope. This repo therefore stores the local tracking contract here first.

Future local or framework-side sync can copy these records into the wider workbench.

## Local source of truth

Agents should treat these files as canonical:

```txt
docs/INDEX.md
docs/project-tracking/open-work-ledger.md
docs/framework/serialized-hashtags-standard.md
docs/framework/repo-sync-contract.md
docs/agent-master-prompt-cursor-current.md
```

## Current milestone

```txt
XARCADE-CONTROLLER-LAUNCH-PROOF-001
```

Current goal:

```txt
Prove controller plus real launch loop before bulk local library hydration.
NES proof: FCEUX with one hand-picked NES game.
SNES proof: RetroArch with one hand-picked SNES game.
```

## Sync requirements

At the end of every implementation slice, update:

```txt
docs/project-tracking/open-work-ledger.md
docs/reports/<slice-report>.md
walkthrough.md, if present
task.md, if present
```

If the wider workbench is available, mirror the milestone state there as well.

## Future manifest placeholders

Added after launch proof code landing (expand when bulk hydration begins):

```txt
projects/manifests/xi_io_emulator.project-manifest.yaml
projects/hydration/xi_io_emulator.hydration-state.yaml
```

Mirror to xi-io.net per `docs/framework/xi-io-net-sync-status.md`.

## Agent start checklist

Before coding, agents must run:

```txt
git status
git branch --show-current
git log --oneline -15
npm run typecheck
npm run lint
npm run build
```

Then report:

```txt
current branch
uncommitted files
recent commits
quality gate results
current milestone
known blockers
```

## Hashtag requirement

For durable TODOs and architecture comments, use:

```txt
docs/framework/serialized-hashtags-standard.md
```

Current tags:

```txt
#xar:controller-launch-proof/current
#xio:emulator/controller/proof
#xio:emulator/launch/proof
#adapter:fceux/nes
#adapter:retroarch/snes
```

## Decision

This repo stores local project truth first. Wider framework sync is required when the framework workbench or local repo is available.
