# xi-io Emulator Documentation Index

Date: 2026-05-28

## Purpose

This is the canonical documentation map for xi-io Emulator. Future agents should start here before changing code.

The goal is to keep product intent, technical contracts, future tracks, framework alignment, and agent handoffs outside chat history.

## Required first-read sequence for agents

```txt
README.md
docs/INDEX.md
docs/project-tracking/open-work-ledger.md
docs/framework/repo-sync-contract.md
docs/framework/serialized-hashtags-standard.md
docs/arcade-ui-product-pivot.md
docs/agent-handoff-controller-launch.md
docs/future/media-platform-extension-track.md
```

## Core product docs

```txt
docs/product-brief.md
docs/framework-alignment.md
docs/settings-map.md
docs/iceberg-delivery-roadmap.md
docs/arcade-ui-product-pivot.md
```

## Contracts

```txt
docs/contracts/adapter-contract-v1.md
docs/contracts/controller-contract-v1.md
docs/contracts/game-management-contract-v1.md
docs/contracts/storage-contract-v1.md
```

## Packaging

```txt
docs/packaging/flatpak-storage-and-device-strategy.md
```

## Research and strategy

```txt
docs/research/competitor-library-ux-and-schema-notes.md
docs/cheats-hacks-and-overlay-strategy.md
docs/future/media-platform-extension-track.md
```

## Decisions

```txt
docs/decisions/controller-launch-first-decision.md
```

## Reviews

```txt
docs/reviews/ui-page-review-index.md
docs/reviews/antigravity-search-001-peer-review.md
docs/reviews/pages/library-page-review.md
docs/reviews/pages/controllers-page-review.md
docs/reviews/pages/storage-review-summary.md
docs/reviews/pages/emulator-engines-page-review.md
docs/reviews/pages/settings-page-review.md
docs/reviews/pages/logs-page-review.md
```

## Agent handoffs

```txt
docs/agent-handoff-antigravity.md
docs/agent-handoff-game-ingress.md
docs/agent-handoff-search-and-filters.md
docs/agent-handoff-arcade-home.md
docs/agent-handoff-cursor-arcade-home.md
docs/agent-handoff-controller-launch.md
docs/agent-master-prompt-cursor-current.md
```

## Framework and tracking docs

```txt
docs/framework/repo-sync-contract.md
docs/framework/xi-io-net-sync-status.md
docs/framework/serialized-hashtags-standard.md
docs/project-tracking/open-work-ledger.md
```

## Reports

```txt
docs/reports/controller-launch-proof-report.md
```

## Current milestone

```txt
XARCADE-CONTROLLER-LAUNCH-PROOF-001
```

Current focus:

```txt
Prove controller + real launch loop before bulk local library hydration.
NES proof: FCEUX + one hand-picked .nes game.
SNES proof: RetroArch + SNES core + one hand-picked .sfc/.smc game.
```

## Current guardrail

Do not bulk scan or hydrate the full local library until the controller + dual launch proof passes.

## Documentation rule

If an agent creates a new implementation slice, it must add or update a report under:

```txt
docs/reports/
```

If an agent changes project direction, it must add or update:

```txt
docs/decisions/
docs/project-tracking/open-work-ledger.md
```

If an agent adds new comments, TODOs, or ledger references in code, it should use the serialized hashtag format from:

```txt
docs/framework/serialized-hashtags-standard.md
```
