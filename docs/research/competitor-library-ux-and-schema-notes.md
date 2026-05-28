# Competitor Library UX and Schema Notes

Research date: 2026-05-28

## Purpose

This note captures competitor and adjacent-product lessons for xi-io Emulator, with emphasis on game ingress, organization, duplicate control, search, filtering, pathing, directory structure, and modular schema.

The product goal is not to imitate ROM packs or public ROM download sites. The goal is to support user-owned game libraries with preservation-grade organization and a polished Linux arcade UI.

## Product stance

xi-io Emulator should support:

```txt
single-game ingress
batch-library ingress
local and external drive paths
game identity normalization
duplicate detection
search and filtering
provider-mapped artwork and metadata
launch readiness
controller-first arcade navigation
cheat, hack, and patch management as user-controlled overlays
```

xi-io Emulator should not provide:

```txt
public ROM download catalogs
BIOS downloads
bundled copyrighted ROM packs
unverified mega-pack content
```

## Competitor and adjacent product lessons

### ES-DE

ES-DE demonstrates that modern emulator users expect controller navigation, system shelves, game artwork, themes, scraping, manuals, videos, and a strong couch-mode browsing experience.

Lessons:

```txt
Good:
  - controller navigation is table stakes
  - system browsing and game browsing must be obvious
  - built-in scraping is expected by users
  - theme support matters for arcade/cabinet audiences

Opportunity for xi-io:
  - go deeper on storage state and missing-drive diagnostics
  - make settings outcome-based instead of emulator-centric
  - build an explicit game-management schema, not only gamelist display
  - make ingress and duplicate resolution reviewable
```

### Batocera and appliance-style systems

Batocera-style systems prove demand for an appliance-like arcade environment with known folders, gamelist updates, network shares, external storage, scraper providers, RetroAchievements, shaders, kiosk/kid modes, and file-management workflows.

Lessons:

```txt
Good:
  - appliance-style arcade UX has real user demand
  - SHARE / roms / bios separation is familiar
  - kiosk and kid modes are useful cabinet features
  - external storage and NAS workflows matter
  - scraper provider choice matters

Opportunity for xi-io:
  - do not require OS-level appliance install
  - make secondary drives first-class on Pop!_OS/Linux
  - build integrated duplicate analysis rather than sending users to external tools first
  - preserve user edits across rescans
```

### Pegasus

Pegasus-style metadata proves that collection and game are separate concepts. A game may belong to multiple collections. Launch commands may be inherited from a collection or overridden per game. Metadata should include title, sort title, files, developer, publisher, genre, tags, release dates, ratings, and extensible custom fields.

Lessons:

```txt
Good:
  - collection and game are separate concepts
  - one game can belong to multiple collections
  - launch can be inherited from collection or overridden per game
  - metadata should be human-readable and extensible
  - include/exclude rules matter
  - multi-disc or multi-file games must be modeled

Opportunity for xi-io:
  - preserve a typed schema internally rather than relying only on text metadata files
  - support import/export later
  - make tags and collections first-class search facets
```

### RomM

RomM demonstrates strong library organization patterns: platform folders, BIOS folders, media folders, special folders for manuals, patches, hacks, demos, translations, prototypes, updates, and metadata providers. It also proves that large-library users need provider priority, filename tag parsing, region/language/revision handling, hash matching, and search by tags.

Lessons:

```txt
Good:
  - recommended plus fallback folder structures reduce friction
  - tag parsing from filenames is valuable
  - region/language/revision priority is essential
  - provider priority should be configurable
  - hash-based matching is valuable for artwork/metadata confidence
  - manuals, screenshots, title screens, videos, and box art are separate media types
  - hacks, patches, translations, demos, and prototypes deserve explicit schema support

Opportunity for xi-io:
  - build local-first desktop UX instead of web-server-first library management
  - keep provider integrations optional and explicit
  - use provider confidence, source, and user approval states
```

### LaunchBox / Big Box

LaunchBox and Big Box demonstrate the premium value of beauty, organization, crowd-sourced metadata, fullscreen/cabinet mode, and saved filters.

Lessons:

```txt
Good:
  - users value beauty and organization as much as launch
  - crowd-sourced metadata is a major advantage
  - saved filters and custom fields matter for large collections
  - cabinet mode is a real premium feature

Opportunity for xi-io:
  - build Linux-first instead of Windows-first
  - make controller mapping and storage diagnostics deeper
  - use xi-io lexicon/tagging for search, filtering, and thought-cloud style grouping
```

### Igir, Retool, DAT, and 1G1R tooling

Serious library users care about DAT files, checksums, archive scanning, duplicate filtering, region/language preferences, naming consistency, generated reports, playlists, patch handling, and 1G1R selection.

Lessons:

```txt
Good:
  - duplicate control requires explicit policy, not naive filename matching
  - region and language preference are user settings
  - DAT/checksum support is the long-term path to high-confidence identity
  - dry-run/report modes matter before changing files
  - symlink/link/copy/move choices matter

Opportunity for xi-io:
  - start read-only and non-destructive
  - provide duplicate groups and recommended canonical choices
  - do not move or delete user files without explicit review
  - support future integration with external tools rather than reimplement everything first
```

## Lessons from shady mega-pack UIs

The value to study is UX, not content distribution.

What users like:

```txt
instant boot-to-arcade feel
large cover grid
system shelves
favorites
recently played
attract-mode visuals
pre-scraped media
simple categories
controller-only operation
big visible play button
cheat/hack discovery as part of nostalgia
```

What xi-io should do better:

```txt
clear provenance for every game record
no bundled copyrighted game content
no unclear duplicate sets
no broken/mislabeled games silently shown as valid
no hidden pathing assumptions
no mystery emulator configs
no all-or-nothing mega-library indexing
no irreversible changes to user files
no automatic cheat or patch activation without user review
```

## Proposed xi-io differentiators

```txt
1. Single-game and batch-library ingress are equal first-class flows.
2. Every ingressed game becomes a structured GameRecord.
3. Game identity has confidence states: raw, normalized, matched, needs_review, user_confirmed.
4. Duplicate groups are visible and reviewable.
5. User edits survive rescans.
6. Search uses normalized fields, raw tags, controlled tags, provider tags, and launch-readiness states.
7. Library pathing is storage-aware, missing drives do not erase records.
8. Launch readiness is explicit per game.
9. Metadata/artwork/cheat/hack providers are optional, source-tracked, and confidence-scored.
10. The UI is arcade-first, but the admin layer is schema-first.
```

## Recommended internal directory structure

```txt
src/
  app/
    App.tsx
    routes.ts
  components/
    shell/
      AppShell.tsx
      NavigationRail.tsx
      StatusPanel.tsx
    library/
      LibraryView.tsx
      GameCard.tsx
      GameDetailPanel.tsx
      EmptyLibraryState.tsx
    search/
      SearchBox.tsx
      FilterPanel.tsx
      FacetGroup.tsx
    status/
      ReadinessBadge.tsx
      DiagnosticList.tsx
    overlays/
      QuickAccessOverlay.tsx
      InGameSettingsPanel.tsx
      CheatTogglePanel.tsx
  data/
    projectStatus.ts
  domains/
    games/
      game.types.ts
      game.service.ts
      game.normalization.ts
      game.tags.ts
      game.search.ts
      game.dedupe.ts
    storage/
      storage.types.ts
      storage.service.ts
      storage.pathing.ts
      storage.scan.ts
    cheats/
      cheat.types.ts
      cheat.service.ts
      cheat.provider.ts
    patches/
      patch.types.ts
      patch.service.ts
    providers/
      provider.types.ts
      provider.registry.ts
    adapters/
      adapter.types.ts
      adapter.registry.ts
    controllers/
      controller.types.ts
      controller.service.ts
    ledger/
      ledger.types.ts
      ledger.service.ts
  infrastructure/
    persistence/
      localStorageAdapter.ts
      repository.types.ts
    platform/
      tauriBridge.ts
      filePicker.ts
  styles/
    tokens.css
    layout.css
    components.css
```

## Data schema priorities

### Game identity

```txt
rawTitle
normalizedTitle
sortTitle
systemId
regionTags
languageTags
revisionTags
versionTags
sourceTags
checksum fields, later
identityConfidence
identitySource
```

### Search document

Each GameRecord should generate a compact search document.

```ts
type GameSearchDocument = {
  gameId: string;
  title: string;
  sortTitle: string;
  normalizedTitle: string;
  systemId: string;
  tags: string[];
  regions: string[];
  languages: string[];
  genres: string[];
  series: string[];
  ingressMode: "single_game" | "batch_library";
  launchStatus: string;
  identityStatus: string;
  favorite: boolean;
  hidden: boolean;
  hasCheats: boolean;
  hasPatches: boolean;
  hasHacks: boolean;
  hiddenByDefault?: boolean;
  lastPlayedAt?: string;
  playCount: number;
  searchText: string;
};
```

### Duplicate group

```ts
type DuplicateGroup = {
  id: string;
  reason: "same_checksum" | "same_normalized_title" | "same_provider_match" | "same_parent_clone_group";
  canonicalGameId?: string;
  gameIds: string[];
  confidence: "exact" | "strong" | "possible";
  recommendation?: string;
  resolved: boolean;
};
```

## Search and filtering requirements

The search engine should support:

```txt
text search by title, alias, filename, tag, provider match
facets for system, region, language, genre, series, ingress mode
filters for launch readiness, identity confidence, artwork status, favorite, hidden, duplicate status
filters for cheats available, hacks available, patches available, translations available
sort by title, recently played, added date, system, identity confidence, play count
large-library performance through precomputed search documents
```

## Duplicate-management policy

MVP:

```txt
detect possible duplicates by normalizedTitle + systemId
show duplicate groups
never auto-delete
allow hide/non-canonical later
```

Later:

```txt
checksum-based identity
DAT-based identity
1G1R recommendation profiles
region/language preference settings
parent/clone grouping
symlink/copy/move export profiles
```

## Pathing policy

```txt
Never require users to move files into our preferred structure.
Support existing libraries first.
Recommend clean structures without forcing them.
Track root path, relative path, and file identity separately.
Do not use absolute path as the only identity.
Missing root means unavailable, not deleted.
```

Recommended managed structure for users who want order:

```txt
ArcadeLibrary/
  roms/
    snes/
    nes/
    ps1/
    ps2/
  hacks/
    snes/
    nes/
    ps1/
    ps2/
  patches/
    snes/
    nes/
    ps1/
    ps2/
  cheats/
    snes/
    nes/
    ps1/
    ps2/
  bios/
    ps1/
    ps2/
  media/
    boxart/
    screenshots/
    title-screens/
    manuals/
    videos/
  saves/
    snes/
    nes/
    ps1/
    ps2/
  states/
    snes/
    nes/
    ps1/
    ps2/
  profiles/
    controllers/
    launch/
    display/
```

## Backlog recommendation

After `XARCADE-GAME-INGRESS-001`, add:

```txt
XARCADE-SEARCH-001
  Build local search documents, filters, and duplicate group detection for SNES records.

XARCADE-PATHING-001
  Add path root + relative path model and managed-library recommendations.

XARCADE-CHEATS-001
  Add cheat/hack/patch schema and UI placeholders, no execution yet.

XARCADE-PRESERVATION-001
  Add provider registry and source/confidence model, no provider downloads yet.
```
