# Future Track: Media Platform Extension

Date: 2026-05-28

## Purpose

xi-io Emulator is currently focused on games, arcade UI, controller support, local library ingress, emulator launch, and preservation context. However, the same shell pattern may later support a separate media-oriented product or mode.

This document preserves the future product idea without derailing the immediate controller + dual-engine launch proof.

## Product idea

Create a future media platform sibling or mode that uses the same xi-io shell architecture, search/filter system, event model, provider registry, and carousel UI, but swaps the domain skin and data model from games to media.

```txt
Games product:
  user-owned games
  emulator engines
  controller profiles
  launch readiness
  artwork/guides/cheats/hacks/preservation

Media product:
  user-owned/local media
  licensed/authorized media providers
  watch state
  debrid/provider integrations where lawful and user-configured
  subtitles
  collections
  event-based discovery
```

## Design references

The media track should study Stremio, Kodi, Netflix, Prime Video, YouTube TV, Apple TV/tvOS, and other 10-foot media interfaces.

Stremio is relevant because its open repositories expose a core/addon/shell split. Kodi is relevant because it is a mature open-source 10-foot media center with add-ons, local/network media libraries, metadata scraping, and remote-friendly UI patterns.

## Shared shell capabilities

The gaming and media products can share:

```txt
Arcade/Media Home shell
horizontal shelves/carousels
hero/focused item area
controller/remote hint rail
search overlay
filter/facet engine
provider registry
local-first settings
ledger/events
source confidence and provenance
Admin Mode
Flatpak packaging knowledge
```

## Domain split

The game product and media product should share framework contracts, not collapse into one confusing app too early.

Recommended product architecture:

```txt
xi-io Shell Kit
  shared 10-foot UI primitives
  search/facet model
  provider registry
  ledger/event model
  local-first settings

xi-io Emulator
  games domain
  emulator adapters
  controller/gamepad profiles
  ROM library roots
  preservation/cheat/hack/patch context

xi-io Media, future
  media domain
  media providers
  playback adapters
  subtitles
  watch state
  debrid/user-provider integrations, if lawful and user-configured
```

## Important boundary

Do not put media/debrid work into the current controller-launch proof.

The immediate milestone remains:

```txt
XARCADE-CONTROLLER-LAUNCH-PROOF-001
  NES via FCEUX
  SNES via RetroArch
  controller proof
  real launch and return
```

## Debrid/provider posture

Future media support must be carefully scoped.

Allowed product posture:

```txt
User-configured providers
User-owned/local media
Authorized accounts and services
Provider source tracking
Clear terms/legal copy
No bundled infringing catalogs
No default piracy-oriented provider lists
```

Do not hardcode or promote questionable sources. Treat provider integrations as user-controlled, explicit, and auditable.

## Search/filter advantage

xi-io's differentiator should be event-based search and filtering, not merely playback.

Potential future media filters:

```txt
watch state
series/season/episode
source/provider
quality
language
subtitles
release date
event timeline
franchise/universe
actor/director
user tags
collections
local/remote availability
```

The same pattern maps to games:

```txt
play state
system
engine
controller readiness
launch readiness
region
revision
hack/patch status
achievement/speedrun context
source/provider
user tags
```

## Event-based media model

Future media product should reuse the event spine:

```txt
media_ingressed
provider_enabled
metadata_matched
subtitle_matched
playback_started
playback_paused
playback_completed
provider_failed
source_unavailable
watch_state_updated
```

This mirrors the game ledger:

```txt
game_ingressed
controller_detected
launch_started
emulator_exited
artwork_matched
patch_applied
```

## UI reuse principle

Cards are domain-specific. Shell behavior is shared.

```txt
Game card:
  title, system, readiness, artwork, play/configure state

Media card:
  title, type, season/episode, watch state, provider/source, playback state
```

Both use:

```txt
hero area
shelves
focus state
details panel
action rail
filter overlay
Admin Mode
```

## Backlog placeholder

Do not schedule until emulator MVP has real launch proof.

Future milestones:

```txt
XSHELL-UI-KIT-001
  Extract shared 10-foot shell components.

XMEDIA-RESEARCH-001
  Study Stremio/Kodi provider and add-on patterns.

XMEDIA-PROVIDER-CONTRACT-001
  Define legal/user-configured provider registry for media.

XMEDIA-LOCAL-LIBRARY-001
  Local media file ingress and metadata matching.
```

## Decision

Preserve media platform ambition as a future sibling/extension track. Do not let it interrupt the emulator launch proof.

The immediate product correction still stands:

```txt
Arcade Mode first.
Admin Mode second.
Controller + launch proof before bulk hydration.
```
