# Agent Handoff: Image Hydration Before Bulk Ingress

Date: 2026-05-28

## Purpose

This handoff exists because the Arcade Home UI depends on large visual game cards. Bulk library hydration must not produce only text records. It must also plan for image/artwork mapping, local thumbnails, fallback art, and review states.

## Milestone

```txt
XARCADE-IMAGE-HYDRATION-001
```

## When to run

Run after:

```txt
Pass B: local Tauri controller + dual launch proof
Pass C: milestone documentation close
```

Run before or as part of:

```txt
XARCADE-STORAGE-001 bulk local library hydration
```

## Required reading

```txt
docs/decisions/library-image-hydration-before-bulk-ingress.md
docs/arcade-ui-product-pivot.md
docs/contracts/game-management-contract-v1.md
docs/contracts/storage-contract-v1.md
docs/research/competitor-library-ux-and-schema-notes.md
docs/project-tracking/open-work-ledger.md
docs/framework/serialized-hashtags-standard.md
```

## Goal

Define and implement the first local-first image hydration layer so imported games can appear as modern arcade/media cards, not text-only records.

## Scope

Implement only local-first artwork support and generated fallback art.

Do not add remote provider downloads in this pass.

## Required outputs

### Models

Add or extend artwork models to support:

```txt
box art
screenshot / snap
title screen
logo
background
fallback generated tile
source
confidence
review status
manual override marker
```

### Local scanner

Support local patterns:

```txt
<library root>/media/<system>/boxart/<game>.png
<library root>/media/<system>/snaps/<game>.png
<library root>/media/<system>/titles/<game>.png
<library root>/media/<system>/logos/<game>.png

thumbnails/<playlist name>/Named_Boxarts/<game>.png
thumbnails/<playlist name>/Named_Snaps/<game>.png
thumbnails/<playlist name>/Named_Titles/<game>.png
```

### Matching

MVP matching rules:

```txt
exact normalized title + system
filename stem match
case-insensitive match
punctuation-insensitive match
region/revision suffix tolerant match
```

### Fallback art

Generate stable visual fallback tiles when no artwork exists.

Fallback should include:

```txt
game title
system badge
simple generated gradient/pattern/class name
optional first-letter monogram
```

### UI

Arcade Home and game tiles must show:

```txt
matched artwork when available
fallback art when missing
review state for missing/low-confidence artwork
```

Admin Mode should expose an Artwork Health summary:

```txt
matched
missing
low confidence
generated fallback
manual override
```

### Review queue

Create or stage a review queue for:

```txt
missing artwork
low-confidence artwork
duplicate artwork candidates
manual override needed
```

## Guardrails

```txt
Do not bulk download provider images.
Do not hardcode API keys.
Do not expose provider secrets in browser code.
Do not block launch readiness on missing artwork.
Do not overwrite user manual artwork selections.
Do not change proof-game launch logic.
Do not start PS1/PS2.
Do not start media/debrid features.
```

## Serialized hashtags

Use durable comments where helpful:

```txt
#xar:image-hydration/planning
#xio:emulator/artwork/local-first
#xio:emulator/hydration/images
#risk:provider/image-rights
#todo:storage/image-mapping-before-bulk
```

## Documentation

Add or update:

```txt
docs/reports/image-hydration-report.md
docs/project-tracking/open-work-ledger.md
projects/hydration/xi_io_emulator.hydration-state.yaml
```

## Quality gates

Run:

```txt
npm run typecheck
npm run lint
npm run build
```

## Final response format

```txt
Summary
Files changed
Commands run
Pass/fail results
Artwork model changes
Local image matching behavior
Fallback art behavior
UI changes
Known blockers
Recommended next prompt
```
