# Decision: Image Hydration Must Be Planned Before Bulk Library Ingress

Date: 2026-05-28

## Purpose

The UI has not yet been tested against the user's real local NES/SNES library, and the import flow has not yet proven that local games can map to hydrated images/artwork.

Before bulk library hydration, xi-io Emulator must define how game records connect to local and provider-backed image assets.

## Decision

Do not run bulk local library hydration as a plain ROM-record scan.

Bulk hydration must include an image/artwork hydration plan that can map each imported game to:

```txt
box art / cover art
screenshot / gameplay snap
title screen
fallback generated art
provider/source confidence
local cache path
manual override state
```

## Why this matters

The Arcade Home UI depends on large cards, shelves, and hero panels. Without images or strong generated placeholders, the app will regress into a data grid or static admin shell.

Hydration must support both:

```txt
playability
presentation
```

A playable game with no visual identity is not enough for the intended modern game UI.

## Source patterns

RetroArch/libretro has an established thumbnail model:

```txt
Named_Boxarts
Named_Snaps
Named_Titles
```

IGDB exposes game cover metadata and image IDs, but it requires Twitch/API authentication and backend-safe requests, not direct browser token exposure.

These patterns should inform xi-io Emulator, but xi-io should preserve user control and local-first cache behavior.

## Hydration order

### Before bulk hydration

Define:

```txt
ArtworkMapping model
ArtworkProvider contract
LocalThumbnailScanner contract
GeneratedFallbackArt contract
ImageCache policy
ManualOverride policy
ProviderConfidence model
```

### During bulk hydration

For each imported game:

```txt
normalize title
extract system
extract filename tags: region, revision, language, hack/translation markers
attempt local thumbnail match
attempt local media-folder match
assign fallback generated tile if no artwork found
record confidence and source
never block playability on missing artwork
```

### After bulk hydration

Show a review queue:

```txt
Missing artwork
Low-confidence artwork
Duplicate title candidates
Region/revision ambiguity
Manual image override candidates
```

## Required image source priority

Use this order by default:

```txt
1. User manual override
2. Existing local image next to game or in configured media folder
3. RetroArch/libretro-style local thumbnails
4. Local cached provider image
5. Optional user-configured provider lookup
6. Generated fallback art
```

Do not auto-download provider images without explicit user/provider configuration.

## Local image path patterns to support

```txt
<library root>/media/<system>/boxart/<game>.png
<library root>/media/<system>/snaps/<game>.png
<library root>/media/<system>/titles/<game>.png
<library root>/media/<system>/logos/<game>.png

RetroArch-style:
thumbnails/<playlist name>/Named_Boxarts/<game>.png
thumbnails/<playlist name>/Named_Snaps/<game>.png
thumbnails/<playlist name>/Named_Titles/<game>.png
```

## GameRecord mapping fields

Use or extend existing `GameRecord.mappings.artwork` into a richer shape:

```ts
type ArtworkMapping = {
  boxart?: ArtworkAsset;
  screenshot?: ArtworkAsset;
  titleScreen?: ArtworkAsset;
  logo?: ArtworkAsset;
  background?: ArtworkAsset;
  fallback?: GeneratedArtworkAsset;
  selectedHeroAsset?: 'boxart' | 'screenshot' | 'titleScreen' | 'background' | 'fallback';
  reviewStatus: 'matched' | 'missing' | 'low_confidence' | 'manual_override' | 'generated';
};

type ArtworkAsset = {
  source: 'manual' | 'local_media_folder' | 'retroarch_thumbnail' | 'provider_cache' | 'provider_remote';
  providerId?: string;
  path?: string;
  url?: string;
  titleMatched: string;
  confidence: 'exact' | 'strong' | 'possible' | 'manual';
  width?: number;
  height?: number;
  checksum?: string;
  createdAt: string;
};
```

## Provider posture

Provider integration must remain explicit and user-controlled.

Allowed:

```txt
local thumbnail folders
local media folders
manual image selection
optional provider API configured by user
local cache with source/confidence metadata
```

Not allowed by default:

```txt
auto-download all images without consent
hardcoded provider credentials
browser-side secret exposure
uncited/unknown image origins
provider matches with no confidence state
silent replacement of user overrides
```

## UI requirements

Arcade Home must show:

```txt
image if matched
strong generated fallback if not matched
missing-artwork review state in Admin Mode
low-confidence badges where applicable
manual override affordance later
```

Admin Mode should show:

```txt
Artwork Health
  matched count
  missing count
  low-confidence count
  manual overrides
  provider cache size
```

## Bulk hydration gate

Before XARCADE-STORAGE-001 bulk scan starts, agents must confirm:

```txt
An image hydration plan exists.
Artwork fields are preserved during import.
No bulk provider downloads happen automatically.
Missing art does not block launch readiness.
Generated fallback art exists for carousel UI.
A review queue exists or is explicitly deferred with a documented placeholder.
```

## Immediate instruction

Pass B hardware proof may proceed because it uses two hand-picked proof games.

Do not proceed from Pass B to full bulk hydration until this image hydration plan is turned into an implementation handoff.

## Next planned slice after Pass B/C

Before or as part of XARCADE-STORAGE-001, create:

```txt
XARCADE-IMAGE-HYDRATION-001
```

Goal:

```txt
Define and implement local artwork mapping, generated fallback art, and artwork health states for imported games before large library hydration.
```

## Serialized tags

```txt
#xar:image-hydration/planning
#xio:emulator/artwork/local-first
#xio:emulator/hydration/images
#risk:provider/image-rights
#todo:storage/image-mapping-before-bulk
```
