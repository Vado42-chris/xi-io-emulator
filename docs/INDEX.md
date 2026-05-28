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
docs/roadmap/remaining-work-pass-plan.md
docs/agent-master-prompt-current-next.md
docs/framework/repo-sync-contract.md
docs/framework/serialized-hashtags-standard.md
docs/arcade-ui-product-pivot.md
docs/agent-handoff-controller-launch.md
docs/future/media-platform-extension-track.md
docs/decisions/library-image-hydration-before-bulk-ingress.md
docs/decisions/non-mutating-local-library-import.md
docs/agent-handoff-image-hydration.md
docs/architecture/conversation-decision-backlog.md
docs/architecture/naming-and-pathing-standard.md
```

## Architecture

```txt
docs/architecture/naming-and-pathing-standard.md
docs/architecture/conversation-decision-backlog.md
```

## Core product docs

```txt
docs/product-brief.md
docs/framework-alignment.md
docs/settings-map.md
docs/iceberg-delivery-roadmap.md
docs/arcade-ui-product-pivot.md
```

## Roadmap

```txt
docs/roadmap/remaining-work-pass-plan.md
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
docs/decisions/library-image-hydration-before-bulk-ingress.md
docs/decisions/rosetta-stone-artwork-identity-resolution.md
docs/decisions/ibal-assistant-and-local-ai-strategy.md
docs/decisions/non-mutating-local-library-import.md
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

## Agent handoffs and master prompts

```txt
docs/agent-handoff-antigravity.md
docs/agent-handoff-game-ingress.md
docs/agent-handoff-search-and-filters.md
docs/agent-handoff-arcade-home.md
docs/agent-handoff-cursor-arcade-home.md
docs/agent-handoff-controller-launch.md
docs/agent-handoff-image-hydration.md
docs/agent-master-prompt-current-next.md
docs/agent-master-prompt-cursor-current.md
docs/agent-master-prompt-image-hydration.md
docs/agent-master-prompt-standardization-audit.md
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
docs/reports/standardization-audit-report.md
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

Do not bulk scan or hydrate the full local library until:

```txt
Pass B: controller + dual launch proof passes
Pass C: launch proof milestone documentation closes
XARCADE-IMAGE-HYDRATION-001: image/artwork hydration plan is implemented
```

Bulk hydration must not produce text-only `GameRecord` rows. See:

```txt
docs/decisions/library-image-hydration-before-bulk-ingress.md
docs/agent-handoff-image-hydration.md
docs/decisions/non-mutating-local-library-import.md
```

Pass B may proceed with two hand-picked proof games only.

## Planned slice order (after Pass B/C)

```txt
Pass B  — local hardware proof (two hand-picked games)
Pass C  — close launch proof milestone docs + framework sync
XARCADE-IMAGE-HYDRATION-001  — Rosetta + local artwork + fallback + review queue
XARCADE-IBAL-SLOT-001        — optional assistant slot (not blocking image hydration)
XARCADE-STORAGE-001          — bulk library ingress (gated; never text-only GameRecords)
```

For full remaining-work estimates, see:

```txt
docs/roadmap/remaining-work-pass-plan.md
```

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
