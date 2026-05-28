# Arcade UI Product Pivot

Date: 2026-05-28

## Purpose

The current xi-io Emulator UI foundation is functional, but it is drifting toward a static web-admin app. This document corrects the product direction.

xi-io Emulator must feel like a modern game platform, media-center shell, and arcade carousel, not a web dashboard.

The admin/settings/control surfaces are still necessary, but they must sit behind a game-first experience.

## Product correction

Move from:

```txt
Static web app
Left nav as primary experience
Form panels
Small cards
Admin dashboard pages
```

Toward:

```txt
Modern game UI
Fullscreen arcade carousel
Controller-first navigation
Large game tiles
System shelves
Animated focus states
Couch-readable text
Quick actions overlay
Admin cockpit behind the experience
```

## Design references

The UI should study streaming and media-center interfaces, then translate their content model from movies/shows/videos into games.

Reference families:

```txt
Stremio-style aggregation and watch-state model
Kodi/XBMC 10-foot media-center model
Netflix-style hero and recommendation rows
Prime Video-style top-level navigation and subscription/source filtering
YouTube TV-style remote-friendly grouped controls
Apple TV / tvOS-style large focus states and controller/remote navigation
```

## Primary experience

The first screen should not feel like a settings dashboard. It should feel like an arcade library.

Recommended default shell:

```txt
Hero area
  Featured game / focused game / continue setup

Horizontal shelves
  Continue Playing
  Recently Added
  SNES
  Favorites
  Needs Configuration
  Hacks & Variants, later

Focused game detail preview
  Box art or generated title tile
  Title
  System
  Launch readiness
  Primary action
  Secondary actions

Bottom controller hint rail
  A Play / Select
  B Back
  X Details
  Y Filter
  Start Menu
```

## Navigation model

The current side rail can remain in Desktop Admin Mode, but the default experience should be carousel-first.

Default modes:

```txt
Arcade Mode:
  game-first, controller-first, carousel/shelves, large type, minimal chrome

Admin Mode:
  storage, engines, logs, providers, settings, diagnostics
```

The app should boot into Arcade Mode once at least one game exists.

If no games exist, the app should show an onboarding arcade start screen, not a dashboard.

## First-run experience

```txt
Welcome to xi-io Arcade

Choose how to begin:
  Add One Game
  Add Library Folder
  Configure Controller

Secondary:
  Engine Setup
  Storage Help
```

The user should not land on a technical page full of fields.

## Card model

Game cards should become large, focusable tiles.

Minimum production tile content:

```txt
large artwork/placeholder area
title
system badge
launch state
focus glow
primary action hint
```

Metadata chips should be available, but not dominate the tile.

## Game detail model

Selecting a game should open or focus a rich detail panel:

```txt
Title
Artwork / title screen / generated placeholder
System
Readiness state
Play / Configure / Details
Storage source
Tags
Preservation
Cheats
Patches
Hacks & Variants
Controller profile
```

If the game cannot launch, the detail panel should say exactly why and show the next step.

Example:

```txt
Not ready to play
RetroArch path is missing.
Configure Engine to continue.
```

## Search and filters

Search and filters are still required, but in Arcade Mode they should behave like a game-platform filter overlay, not like web-form filters.

Recommended Arcade Mode search:

```txt
Press Y to Filter
Search overlay
Large filter chips
System shelves update live
Clear filters action
Duplicate candidates shown as review shelf, not tiny warning only
```

Admin Mode may keep denser filter controls.

## Controller-first requirements

Every primary arcade UI element must have visible focus states.

Required cues:

```txt
focused tile scale/glow
clear selected state
controller hint rail
large hit targets
horizontal shelf navigation
vertical shelf switching
no tiny icon-only actions as primary controls
```

## Page model correction

### Arcade Home

Replaces Library as the primary default experience.

```txt
Hero shelf
System shelves
Large game tiles
Focused game preview
Filter overlay
```

### Storage

Moves to Admin Mode unless storage is blocking a selected game.

Arcade Mode only shows storage when relevant:

```txt
This game is unavailable because a library location is not accessible.
Reconnect folder.
```

### Engines

Moves to Admin Mode unless launch is blocked.

Arcade Mode shows:

```txt
Configure RetroArch to play SNES games.
```

### Controllers

Has both Arcade Mode setup and Admin Mode diagnostics.

Arcade Mode:

```txt
Set up controller
Test controls
Map SNES buttons
```

Admin Mode:

```txt
device details
GUID
driver state
Flatpak permissions
```

### Logs

Admin Mode by default.

Arcade Mode shows health summaries and recovery actions, not raw terminal logs.

## Required next patch

Before more backend work, create:

```txt
XARCADE-ARCADE-HOME-001
```

Goal:

```txt
Transform the current Library page into an arcade carousel home without removing existing underlying search, ingress, and game-management logic.
```

Visible requirements:

```txt
Arcade Home screen
Large game carousel or shelf layout
Hero/focused game area
Recently Added shelf
Needs Configuration shelf
Favorites shelf, if any
Large placeholder art tiles
Focused game state
Controller hint rail
Admin Mode entry point
```

Submerged requirements:

```txt
reuse existing GameRecord and search/filter logic
add view-mode state: arcade/admin
add shelf selectors
preserve current forms behind Add Game/Add Folder actions or Admin Mode
keep no-silent-failure status visible but not dominant
```

## Acceptance criteria

```txt
The app no longer feels like a static web dashboard on first impression.
A game tile is the visual hero, not a form.
The UI can be imagined on a TV or arcade cabinet.
Primary navigation can be mapped to a controller.
Admin functions remain available but are not the default emotional experience.
Search/filter remains available through an overlay or secondary control.
Launch readiness remains visible and honest.
```

## Do not lose

The previous architecture work remains valid:

```txt
game ingress
storage contracts
search/filter documents
duplicate detection
settings registry
ledger events
Flatpak strategy
cheats/hacks/patches strategy
```

The correction is presentation and interaction model, not a rejection of the data architecture.

The product needs both:

```txt
Arcade Mode for users
Admin Mode for setup, diagnostics, and power-user management
```
