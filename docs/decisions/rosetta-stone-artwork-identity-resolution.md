# Decision: Use Rosetta Stone Identity Resolution for Artwork Hydration

Date: 2026-05-28

## Purpose

Game artwork hydration cannot rely on exact ROM filename matching alone. User libraries contain messy names, alternate titles, regions, revisions, translations, hacks, demos, prototypes, no-intro/redump-style names, scene names, playlist names, and personal folder conventions.

The xi-io Rosetta Stone / lexicon pattern should be used as the identity-resolution layer between raw file names, normalized game records, local image folders, RetroArch thumbnails, and future provider metadata.

## Decision

Before bulk library hydration, xi-io Emulator must implement a local-first identity resolution layer for artwork matching.

This layer should be treated as a Rosetta Stone bridge:

```txt
raw ROM filename
raw image filename
folder context
system context
region/revision/language/hack markers
known aliases
normalized title
canonical identity candidate
artwork match candidate
confidence score
review state
```

Do not match artwork by exact filename alone.

## Why exact matching will fail

Examples of likely mismatch:

```txt
The Legend of Zelda (USA).nes
Legend of Zelda, The (USA) (Rev 1).nes
Zelda no Densetsu (Japan).nes
Legend of Zelda, The.png
The Legend of Zelda - Boxart.png
Legend of Zelda, The (USA).png
Zelda.png
```

These may all refer to related identity candidates, but not necessarily the same release or revision.

## Rosetta Stone role

The Rosetta layer should preserve raw values while deriving normalized keys.

It should never erase source specificity.

```txt
raw input stays raw
normalized keys are derived
candidate identities are scored
low confidence goes to review
manual confirmation becomes a stronger mapping
```

## Identity resolution stages

### Stage 1, Raw capture

Capture exactly what was found:

```txt
rawRomFilename
rawRomStem
rawImageFilename
rawImageStem
rawFolderPath
systemId
libraryRootId
sourceKind
```

### Stage 2, Tokenization

Extract tokens without destroying the original string:

```txt
title tokens
system tokens
region tokens
revision tokens
language tokens
hack / translation / prototype / demo tokens
release group tokens, if obvious
file extension
```

### Stage 3, Normalization

Create multiple normalized keys:

```txt
strictTitleKey
looseTitleKey
sortTitleKey
articleFoldedTitleKey
punctuationFoldedTitleKey
regionAwareKey
releaseVariantKey
```

Examples:

```txt
The Legend of Zelda -> legend-of-zelda
Legend of Zelda, The -> legend-of-zelda
Super Mario World (USA) -> super-mario-world + region:usa
```

### Stage 4, Candidate generation

Generate artwork candidates from:

```txt
same folder media
configured media folders
RetroArch thumbnails
known local cache
manual override records
future provider cache
```

### Stage 5, Scoring

Score candidates with explicit reasons:

```txt
+ exact normalized title
+ same system
+ matching region
+ matching revision
+ same library root
+ known alias match
+ RetroArch playlist/system match
- different system
- conflicting region
- conflicting revision
- hack/translation mismatch
- title too generic
```

### Stage 6, Review state

Assign one:

```txt
matched_exact
matched_strong
matched_possible
missing
ambiguous
manual_required
manual_override
fallback_generated
```

## Confidence policy

```txt
exact: normalized title + system + region/revision agree, or manual override
strong: normalized title + system agree, no conflicting variant evidence
possible: title resembles but region/revision/source ambiguous
manual: user selected/confirmed
```

Only `exact`, `strong`, and `manual` should auto-display as matched artwork by default.

`possible` should be visible in review, not silently accepted as truth unless configured.

## Data shape

Suggested model:

```ts
type IdentityResolution = {
  raw: {
    romFilename?: string;
    imageFilename?: string;
    folderPath?: string;
  };
  tokens: {
    title: string[];
    system?: string;
    region?: string[];
    revision?: string[];
    language?: string[];
    variant?: string[];
  };
  keys: {
    strictTitleKey: string;
    looseTitleKey: string;
    articleFoldedTitleKey: string;
    regionAwareKey?: string;
    releaseVariantKey?: string;
  };
};

type ArtworkMatchCandidate = {
  assetPath: string;
  source: 'manual' | 'local_media_folder' | 'retroarch_thumbnail' | 'provider_cache' | 'generated_fallback';
  candidateTitle: string;
  candidateSystemId?: string;
  score: number;
  confidence: 'exact' | 'strong' | 'possible' | 'manual';
  reasons: string[];
  warnings: string[];
};
```

## Manual correction loop

Manual corrections are valuable training signals for the local Rosetta map.

When a user confirms or rejects an artwork match, store:

```txt
gameId
rawRomStem
selectedArtworkPath
confirmedCanonicalTitle
systemId
region/revision if known
decision: accepted / rejected / manual_override
createdAt
```

Future imports should use these local decisions first.

## Guardrails

```txt
Do not silently collapse hacks, translations, prototypes, and revisions into parent games.
Do not auto-select low-confidence art.
Do not overwrite manual overrides.
Do not discard raw filenames.
Do not require internet provider lookups.
Do not expose remote provider credentials.
Do not block playability when artwork is missing or ambiguous.
```

## Serialized tags

```txt
#xar:image-hydration/rosetta
#xio:emulator/identity-resolution
#xio:emulator/artwork/local-first
#risk:rom-name-chaos
#risk:artwork-mismatch
#todo:rosetta/local-alias-map
```

## Decision

Artwork hydration must begin with identity resolution. The Rosetta Stone layer is not optional if the product is expected to work against real user libraries.
