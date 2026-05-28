# Naming and Pathing Standard

Date: 2026-05-28

## Purpose

This document standardizes xi-io Emulator naming, directory layout, path handling, and artifact placement before more agents continue implementation.

The immediate goal is to prevent drift between:

```txt
Arcade UI
Tauri backend
local storage paths
proof game paths
artwork/media hydration paths
framework/workbench artifacts
agent reports
```

## Canonical product names

```txt
Product family: Xibalba Arcade
Product repo: xi-io-emulator
User-facing shell name: xi-io Arcade
Technical product name: xi-io Emulator
Assistant/conductor: Ibal
```

Use `xi-io Emulator` in technical docs and contracts.
Use `xi-io Arcade` in the user-facing game shell.
Use `Xibalba Arcade` for broader product family language.

## Canonical milestones

```txt
XARCADE-CONTROLLER-LAUNCH-PROOF-001
XARCADE-IMAGE-HYDRATION-001
XARCADE-IBAL-SLOT-001
XARCADE-STORAGE-001
```

Do not introduce alternate names for the same milestone without adding a decision record.

## Canonical repo directories

```txt
src/
  components/
  components/arcade/        # preferred future home for Arcade Mode components
  data/
  data/adapters/
  services/
  styles/

src-tauri/
  src/
  capabilities/

docs/
  architecture/
  contracts/
  decisions/
  framework/
  future/
  packaging/
  project-tracking/
  reports/
  research/
  reviews/

projects/
  manifests/
  hydration/
```

## Current accepted transitional state

The repo may currently contain some Arcade components directly under:

```txt
src/components/
```

That is acceptable during active development.

Future cleanup should migrate strongly arcade-specific components toward:

```txt
src/components/arcade/
```

but agents must not do a broad file move unless the task is explicitly a refactor slice.

## Source code naming

Use these service names:

```txt
adapterService.ts
artworkHydrationService.ts
controllerService.ts
db.ts
identityResolutionService.ts
ingressService.ts
launchService.ts
proofReadinessService.ts
searchService.ts
tauriService.ts
```

Use these component names:

```txt
ArcadeHome.tsx
GameTile.tsx
GameDetailPanel.tsx
ControllersPanel.tsx
StatusPanel.tsx
LibraryGrid.tsx
```

Future Ibal components should use:

```txt
IbalCommandPanel.tsx
IbalAssistantSlot.tsx
OnScreenKeyboard.tsx
AssistantProviderSettings.tsx
```

## Data artifact naming

Adapter manifests:

```txt
src/data/adapters/<engine>.<system>[.<core>].json
```

Current examples:

```txt
src/data/adapters/fceux.nes.json
src/data/adapters/retroarch.snes.snes9x.json
```

Framework artifacts:

```txt
projects/manifests/xi_io_emulator.project-manifest.yaml
projects/hydration/xi_io_emulator.hydration-state.yaml
```

Reports:

```txt
docs/reports/<slice-name>-report.md
```

Examples:

```txt
docs/reports/controller-launch-proof-report.md
docs/reports/image-hydration-report.md
```

## Local user path policy

Do not commit user-private absolute ROM paths as source constants.

Allowed:

```txt
documenting discovered paths in local reports when needed
storing user-selected paths in localStorage or future local database
showing examples using clearly fake paths
```

Not allowed:

```txt
hardcoding private ROM paths into source code
committing full user library indexes before user approval
committing provider credentials
committing personal emulator config files
```

## Example path convention

Use generic examples in source/docs:

```txt
/media/<user>/<drive>/Games/roms/snes
/media/<user>/<drive>/Games/roms/nes
/home/<user>/Games/roms/snes
```

Avoid source defaults like:

```txt
/home/user/retro/games/Specific Game.sfc
```

unless they are clearly marked as demo/sample data and gated behind demo mode.

## Local library root pattern

Future bulk ingress should support multiple roots:

```txt
LibraryRoot
  id
  label
  path
  systems
  mounted
  permissionDenied
  lastSeenAt
  lastScanAt
```

System folders may be user-defined. Do not require a single fixed structure.

Recommended clean structure for xi-io-managed libraries:

```txt
ArcadeLibrary/
  roms/
    nes/
    snes/
  media/
    nes/
      boxart/
      snaps/
      titles/
      logos/
    snes/
      boxart/
      snaps/
      titles/
      logos/
  saves/
  states/
  patches/
  cheats/
  manuals/
```

## Artwork path convention

Preferred xi-io local media folders:

```txt
<library root>/media/<system>/boxart/<game>.png
<library root>/media/<system>/snaps/<game>.png
<library root>/media/<system>/titles/<game>.png
<library root>/media/<system>/logos/<game>.png
```

RetroArch/libretro-style thumbnails:

```txt
thumbnails/<playlist name>/Named_Boxarts/<game>.png
thumbnails/<playlist name>/Named_Snaps/<game>.png
thumbnails/<playlist name>/Named_Titles/<game>.png
```

## Raw vs display naming

Always distinguish:

```txt
raw filename on disk
display title
sort title
canonical identity candidate
alias list
manual override
```

The app may clean display metadata without renaming the physical ROM file.

Physical file rename requires explicit user approval, preview, rollback notes, and ledger events.

## Path separator and platform policy

The first target is Pop!_OS/Linux.

Represent paths internally as strings but keep path operations isolated in services so future Windows/macOS support is possible.

Never join paths with ad hoc string concatenation in many components. Prefer centralized path helper services when introduced.

## Tauri and Flatpak policy

Tauri desktop mode is required for real process launch and filesystem checks.

Flatpak packaging later must handle:

```txt
portal-selected paths
read-only ROM roots
explicit filesystem permissions
input/controller device access
launcher command compatibility
```

Do not assume unrestricted filesystem access.

## Framework sync policy

Framework/workbench-facing artifacts live in:

```txt
projects/manifests/
projects/hydration/
docs/framework/xi-io-net-sync-status.md
```

When these change, mirror to xi-io.net/workbench when available and update sync status.

## Serialized tags

Use these for naming/pathing work:

```txt
#xio:emulator/pathing/standard
#xio:emulator/naming/standard
#risk:path-drift
#risk:private-path-leak
#todo:architecture/path-helper-service
```
