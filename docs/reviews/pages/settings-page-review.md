# UI Review: Settings Page

Date: 2026-05-28

## Screen reviewed

Settings page showing Start Fullscreen checkbox, Display Mode selector, and Privacy Mode local-first active state.

## Product role

Settings should translate emulator, display, privacy, storage, controller, and preservation complexity into safe user outcomes. It should not become a raw config dump.

## What is working

```txt
Settings are minimal and not overwhelming.
Local-first privacy posture is visible.
Display mode is framed as an outcome/style choice.
The page avoids exposing too many raw emulator settings too early.
```

## Main UX issue

The page is too sparse to communicate the product's settings model.

This is acceptable for a bootstrap UI, but production settings must make clear that xi-io Emulator has simple and advanced layers.

## Recommended information architecture

```txt
Quick Settings
  Start fullscreen
  Display style
  Sound profile
  Privacy mode

Library & Storage
  Library roots
  Cache locations
  Flatpak access help

Controllers
  Shell profile
  System mappings

Emulator Engines
  RetroArch paths
  Future engines

Preservation
  Artwork providers
  Guide/manual providers
  Cheats/hacks/patches providers

Advanced
  Logs
  Adapter manifests
  Generated files
```

## Usability notes

```txt
Start Fullscreen needs an explanatory subtitle for cabinet mode.
Display Mode should preview the visual result eventually.
Privacy Mode is good but should explain what data remains local.
Settings should show Simple / Advanced toggle later.
```

## Accessibility notes

```txt
Checkbox is small.
Rows need clearer focus/hover states.
Text scale should be increased for TV/cabinet use.
Selectors need large enough target areas.
```

## Controller and cabinet readiness

Settings should be navigable by controller, but deep setup should be desktop-friendly.

Recommended split:

```txt
Cabinet Quick Settings:
  fullscreen, display, audio, controller, exit behavior

Desktop Advanced Settings:
  paths, adapters, provider registries, generated files
```

## No-silent-failure review

Good:

```txt
Local-first state is explicit.
```

Needs improvement:

```txt
Settings do not yet show whether changes are saved.
No reset-to-defaults affordance.
No risk labels for settings that can break launch, input, or saves.
```

## Recommended fixes

### Priority 1

```txt
Add settings sections even if some are staged.
Add Simple / Advanced mode concept.
Add save-state feedback: Saved locally.
Add risk labels for dangerous settings later.
Increase row and control sizes.
```

### Priority 2

```txt
Add cabinet mode setting placeholder.
Add display preview tile.
Add privacy explanation card.
```

### Priority 3

```txt
Add export/import settings.
Add reset settings.
Add generated config preview for advanced users.
```

## Acceptance criteria

```txt
User understands settings are local-first.
User can distinguish simple outcome settings from advanced technical settings.
Controls are readable and reachable from couch distance.
Settings provide feedback when changed.
```

## Studio verdict

Clean but underdeveloped. The settings page should become the bridge between simple arcade use and expert configuration, while staying readable and safe.
