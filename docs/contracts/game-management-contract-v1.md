# Game Management Contract v1

xi-io Emulator must manage the games a user ingresses. A game should not remain a loose file path after scan. It should become a structured, tagged, mapped, launchable record in the arcade shell.

## Purpose

The app is not only a ROM launcher. It is a local-first arcade library manager for user-owned games.

The shell should ingest user-selected game files, organize them, map them to preservation context, track readiness, and make them launchable from the UI with controller support.

## Product boundary

xi-io Emulator supports user-owned game libraries and preservation metadata.

It does not provide ROMs, BIOS files, or public copyrighted game download catalogs.

It does help users map their local games to artwork, metadata, guides, controller profiles, emulator adapters, save profiles, and launch profiles.

## Ingress modes

The app must support both single-game ingress and batch-library ingress. These are separate first-class user journeys.

```txt
Single-game ingress:
  For a user who wants to add and play one game quickly.

Batch-library ingress:
  For a user who already has a large organized or semi-organized library.
```

Neither mode is secondary. The product must work as a focused one-game arcade launcher and as a large-library arcade cabinet shell.

## Single-game ingress flow

```txt
User selects one game file
  -> validate supported extension
  -> create one game record
  -> infer system/platform
  -> normalize title from filename
  -> apply initial tags
  -> check storage path
  -> check launch readiness
  -> show game detail page
  -> allow play once engine/controller prerequisites are satisfied
```

Single-game ingress must not require the user to create or scan a full library root first.

## Batch-library ingress flow

```txt
User selects one or more library roots
  -> scan folders recursively if enabled
  -> discover supported game files
  -> create or update game records
  -> preserve existing user edits
  -> identify duplicates
  -> classify system/platform
  -> apply tags
  -> generate scan diagnostics
  -> show scan summary
  -> mark launch readiness per game
```

Batch ingress must support large existing libraries without deleting records when a mounted drive is temporarily missing.

## Game management pipeline

```txt
User ingresses game file or library root
  -> scan game files
  -> create raw game records
  -> normalize identity
  -> classify system/platform
  -> detect region/revision/version where possible
  -> apply tags
  -> map artwork and preservation context
  -> validate emulator/core/BIOS readiness
  -> map controller profile
  -> create launch profile
  -> show game as launchable, blocked, or needs review
```

## Game record model

```ts
type GameRecord = {
  id: string;
  libraryRootId?: string;
  ingressMode: "single_game" | "batch_library";
  systemId: string;
  title: string;
  sortTitle: string;
  originalFileName: string;
  contentPath: string;
  fileExtension: string;
  fileSizeBytes?: number;
  checksum?: string;
  identityStatus: GameIdentityStatus;
  launchStatus: GameLaunchStatus;
  tags: GameTag[];
  mappings: GameMappings;
  favorite: boolean;
  hidden: boolean;
  lastPlayedAt?: string;
  playCount: number;
  createdAt: string;
  updatedAt: string;
};

type GameIdentityStatus =
  | "raw"
  | "normalized"
  | "matched"
  | "needs_review"
  | "user_confirmed";

type GameLaunchStatus =
  | "not_configured"
  | "ready"
  | "blocked_missing_drive"
  | "blocked_missing_engine"
  | "blocked_missing_core"
  | "blocked_missing_bios"
  | "blocked_missing_controller"
  | "blocked_invalid_path"
  | "needs_review";
```

## Game mappings

```ts
type GameMappings = {
  artwork?: ArtworkMapping[];
  metadata?: MetadataMapping[];
  guides?: GuideMapping[];
  achievements?: AchievementMapping[];
  speedrun?: SpeedrunMapping[];
  adapter?: AdapterMapping;
  controller?: ControllerMappingRef;
  saves?: SaveProfileRef;
};
```

## Tags

Tags are first-class metadata. Preserve raw tags and allow controlled grouping later through the xi-io lexicon.

```ts
type GameTag = {
  id: string;
  label: string;
  kind:
    | "system"
    | "genre"
    | "series"
    | "region"
    | "release_status"
    | "play_status"
    | "source"
    | "user"
    | "preservation"
    | "technical";
  source: "system" | "scan" | "provider" | "user";
  confidence: "exact" | "inferred" | "manual";
};
```

Initial required tags:

```txt
system:snes
source:single_game or source:batch_library
identity:raw
launch:not_configured
```

Future examples:

```txt
region:usa
region:japan
revision:rev-a
series:metroid
genre:platformer
play_status:favorite
play_status:beaten
preservation:boxart_matched
preservation:guide_linked
technical:needs_bios
technical:enhancement_chip
```

## Artwork mapping

Artwork mapping should attach historical/preservation context to the user-owned local game record.

```ts
type ArtworkMapping = {
  id: string;
  providerId: string;
  kind: "boxart" | "logo" | "screenshot" | "title_screen" | "placeholder";
  sourceTitle: string;
  sourcePathOrUrl: string;
  localCachePath?: string;
  confidence: "exact" | "hash" | "normalized_title" | "region_match" | "fuzzy" | "manual";
  approvedByUser: boolean;
  attribution?: string;
};
```

## Guide mapping

Guides and walkthroughs should be linked or user-attached. The app should avoid bulk mirroring copyrighted guide content unless the provider permits it.

```ts
type GuideMapping = {
  id: string;
  providerId: string;
  title: string;
  kind: "manual" | "walkthrough" | "faq" | "strategy" | "user_note" | "local_file";
  sourceUrl?: string;
  localPath?: string;
  confidence: "exact" | "normalized_title" | "manual";
  approvedByUser: boolean;
};
```

## Launch readiness

A game is launchable only when its required path, engine, core, firmware, and input assumptions are satisfied.

```ts
type GameLaunchReadiness = {
  gameId: string;
  ready: boolean;
  status: GameLaunchStatus;
  blockers: LaunchBlocker[];
  warnings: LaunchWarning[];
  resolvedAdapterId?: string;
  resolvedControllerProfileId?: string;
  resolvedSaveProfileId?: string;
};
```

## UI requirements

The arcade UI must show game state clearly.

```txt
Game card:
  title
  system
  artwork or placeholder
  launch state
  favorite state
  needs review marker if applicable

Game detail:
  play / resume action
  file location
  storage root if applicable
  ingress mode
  tags
  artwork mappings
  guide links
  selected emulator adapter
  selected controller profile
  launch readiness blockers
  last played
```

## Required states

```txt
Single game added
Batch library added
Raw file detected
Identity normalized
Artwork matched
Needs artwork review
Launch ready
Launch blocked
Missing drive
Missing engine/core
Missing controller profile
```

## Ledger events

```txt
single_game_ingress_started
single_game_ingress_completed
single_game_ingress_failed
batch_library_ingress_started
batch_library_ingress_completed
batch_library_ingress_failed
game_record_created
game_identity_normalized
game_tag_added
game_tag_removed
game_artwork_matched
game_artwork_review_required
game_guide_linked
game_launch_profile_resolved
game_launch_ready
game_launch_blocked
game_favorited
game_hidden
game_play_started
game_play_finished
```

## No-silent-failure rules

1. A detected game file must become a visible record or a visible scan diagnostic.
2. A single selected game must be visible even if no library root exists.
3. A batch library must show scan counts and diagnostics.
4. A game with a missing drive must remain in the library as unavailable, not disappear.
5. A game that cannot launch must show the blocker category.
6. A game with uncertain artwork or identity must show needs-review state.
7. User edits to tags and mappings must be preserved across rescans.
8. Provider mappings must never overwrite user-confirmed mappings without review.

## MVP scope

For the first implementation, support only:

```txt
Single SNES game ingress
Batch SNES library ingress
.sfc and .smc files
raw title from filename
system tag
source tag
launch:not_configured state
favorite flag
hidden flag
basic game detail panel
```

Artwork, guides, speedrun context, achievements, and recording are future layers built on top of this game record contract.
