# Antigravity Handoff: Search and Filters MVP

Use this handoff after `XARCADE-LIBRARY-001` is complete and pushed.

## Purpose

The Library Cockpit makes ingressed games visible. The next iceberg patch must make large libraries usable through search, filtering, duplicate surfacing, and schema-backed facets.

This pass should complete:

```txt
XARCADE-SEARCH-001
```

## Required reading

Read these files first, in this order:

```txt
README.md
docs/product-brief.md
docs/framework-alignment.md
docs/settings-map.md
docs/contracts/game-management-contract-v1.md
docs/contracts/storage-contract-v1.md
docs/research/competitor-library-ux-and-schema-notes.md
docs/cheats-hacks-and-overlay-strategy.md
docs/iceberg-delivery-roadmap.md
docs/library-cockpit-report.md
walkthrough.md
task.md
```

If `docs/library-cockpit-report.md`, `walkthrough.md`, or `task.md` are not present, report that before implementation and continue from the committed roadmap and contracts.

## Goal for this pass

Build the first local search and filtering layer for ingressed game records.

The goal is not perfect fuzzy search. The goal is a clean, typed, non-destructive search foundation that supports 0, 1, and many games.

## Before changes

Run:

```txt
git status
git log --oneline -10
npm run typecheck
npm run lint
npm run build
```

If there are uncommitted changes, report them before modifying files. Do not overwrite local work.

## Visible UI requirements

Add or update the Library UI with:

```txt
Search box
Filter panel or compact filter bar
Result count
Clear filters action
Empty filtered state
Duplicate candidate notice if duplicate candidates exist
```

Search should match:

```txt
title
sortTitle
originalFileName
systemId
ingressMode
launchStatus
identityStatus
tags
```

Filters should include:

```txt
system
Ingress mode: single_game / batch_library
Launch status
Identity status
Favorite
Hidden
Needs configuration
Duplicate candidates
Has cheats, has patches, has hacks, if fields exist or can be safely defaulted
```

Sort options should include at least:

```txt
title
recently added, if createdAt exists
recently played, if lastPlayedAt exists
play count
launch status
```

## Submerged model/service requirements

Add a typed search document model:

```ts
type GameSearchDocument = {
  gameId: string;
  title: string;
  sortTitle: string;
  normalizedTitle: string;
  originalFileName: string;
  systemId: string;
  tags: string[];
  ingressMode: "single_game" | "batch_library";
  launchStatus: string;
  identityStatus: string;
  favorite: boolean;
  hidden: boolean;
  hasCheats: boolean;
  hasPatches: boolean;
  hasHacks: boolean;
  lastPlayedAt?: string;
  playCount: number;
  createdAt?: string;
  searchText: string;
};
```

Add helpers/services for:

```txt
buildGameSearchDocument
buildGameSearchIndex
filterGameSearchDocuments
sortGameSearchDocuments
detectDuplicateCandidates, MVP by normalizedTitle + systemId only
```

Add a duplicate group model:

```ts
type DuplicateGroup = {
  id: string;
  reason: "same_normalized_title" | "same_checksum" | "same_provider_match" | "same_parent_clone_group";
  canonicalGameId?: string;
  gameIds: string[];
  confidence: "exact" | "strong" | "possible";
  recommendation?: string;
  resolved: boolean;
};
```

MVP duplicate detection rules:

```txt
Use normalizedTitle + systemId only.
Do not auto-hide, auto-delete, move, rename, or mutate records.
Surface duplicate candidates as advisory.
```

## No-silent-failure rules

```txt
0 games should show a normal empty state.
0 search results should show a filtered empty state, not a broken UI.
Invalid/missing fields should not crash the search index.
Hidden games should be filterable, not permanently lost.
Duplicate groups are advisory only.
```

## Do not implement

```txt
RetroArch launch
engine detection
controller detection
controller mapping
artwork download
cheat execution
patch execution
provider sync
NES / PS1 / PS2
BIOS handling
file moving / renaming / deleting
1G1R automation
DAT/checksum matching unless already present and trivial
```

## Documentation

Add or update:

```txt
docs/reports/search-and-filters-report.md
```

Report must include:

```txt
Summary
Files changed
Visible UI changes
Search fields supported
Filters supported
Duplicate detection behavior
Commands run
Pass/fail results
Known blockers
Next recommended patch
```

## Quality gates

Run before final report:

```txt
npm run typecheck
npm run lint
npm run build
```

Fix simple issues. If failures are environmental, document them clearly.

## Final response format

```txt
Summary
Files changed
Commands run
Pass/fail results
Visible UI changes
Search/filter behavior
Duplicate behavior
Risks/blockers
Recommended next prompt
```

Keep this pass small and schema-first. Search must be reliable before provider artwork, cheats, patches, or launch readiness expand the game model.
