# Cheats, Hacks, Patches, and Overlay Strategy

Research date: 2026-05-28

## Purpose

xi-io Emulator should support the cheat, hack, patch, and nostalgia-code community as a first-class audience while keeping user control, provenance, and safety clear.

This includes classic cheat-code culture, Game Genie-style codes, GameShark-style codes, ROM hacks, translation patches, quality-of-life patches, randomizers, and future in-game overlays for toggling approved options.

## Product stance

xi-io Emulator should support:

```txt
user-owned games
user-added cheat codes
provider-mapped cheat databases where allowed
ROM hack and patch organization
translation patches
quality-of-life patches
per-game cheat profiles
per-game patch profiles
in-game quick access overlay, later
```

xi-io Emulator should not provide:

```txt
ROM downloads
BIOS downloads
pirated patched ROMs
public ROM-hack download catalogs that distribute copyrighted base games
silent patching of user files
automatic cheat activation without user consent
online multiplayer cheating tools
anti-competitive cheat workflows for modern online games
```

This feature is about retro/local/offline emulation and preservation culture, not cheating in live commercial services.

## Why this matters

Retro gaming culture includes more than clean archival play. Users also care about:

```txt
nostalgia codes
unlock codes
practice tools
accessibility cheats
translation patches
bugfix patches
quality-of-life improvements
ROM hacks
randomizers
challenge modes
speedrun practice codes
```

The UI should make this visible without burying it in emulator-specific menus.

## Existing ecosystem reference points

### RetroArch cheats

RetroArch supports cheat files and has a cheat workflow through its Quick Menu. Its documentation describes loading cheat files, appending cheats, adding new cheats, applying changes, and saving cheat files. This proves that cheat management is a known emulator-layer function, but the workflow is still technical and menu-heavy.

Reference: https://docs.libretro.com/guides/cheat-codes/

### libretro-database cheats

The libretro database ecosystem includes cheat data that can be used as a reference/provider target where appropriate. Any provider integration should track source, license/terms posture, match confidence, and user approval.

Reference: https://github.com/libretro/libretro-database

### GameHacking.org

GameHacking.org is a long-running community for cheat codes and code formats across many systems. It can inform schema and provider strategy, but any integration should respect its current API/terms and avoid aggressive scraping.

Reference: https://gamehacking.org/

## Feature model

Treat cheats, hacks, and patches as related but distinct.

```txt
Cheat:
  Runtime memory/code modification or emulator-supported cheat entry.

Patch:
  A transformation applied to a base game file, usually creating a derived playable variant.

Hack:
  A game variant, often produced by applying one or more patches to a base game.

Code sequence:
  A gameplay input sequence, such as classic unlock codes, not necessarily emulator-level memory modification.
```

## Data model draft

```ts
type CheatCode = {
  id: string;
  gameId: string;
  providerId?: string;
  label: string;
  description?: string;
  codeType:
    | "game_genie"
    | "game_shark"
    | "pro_action_replay"
    | "raw_memory"
    | "retroarch_cht"
    | "input_sequence"
    | "unknown";
  codeValue: string;
  enabledByDefault: false;
  userEnabled: boolean;
  risk: "safe" | "can_break_progress" | "can_crash_game" | "unknown";
  source: "provider" | "user" | "imported_file";
  confidence: "exact" | "hash" | "normalized_title" | "manual";
  notes?: string;
};

type PatchProfile = {
  id: string;
  baseGameId: string;
  label: string;
  patchType: "ips" | "bps" | "ups" | "xdelta" | "unknown";
  patchPath?: string;
  providerId?: string;
  outputMode: "temporary_runtime" | "cached_derived_file" | "manual_external";
  status: "available" | "missing_patch" | "applied" | "failed" | "needs_review";
  source: "user" | "provider" | "local_folder";
  notes?: string;
};

type HackVariant = {
  id: string;
  parentGameId: string;
  label: string;
  variantKind:
    | "rom_hack"
    | "translation"
    | "randomizer"
    | "bugfix"
    | "quality_of_life"
    | "challenge"
    | "prototype"
    | "demo";
  derivedGameId?: string;
  patchProfileIds: string[];
  launchStatus: string;
  userConfirmed: boolean;
};
```

## UI model

### Game detail page

Add future panels:

```txt
Cheats
Patches
Hacks & Variants
Practice Tools
Run/Recording, later
```

### Cheat panel

```txt
Available cheats
Enabled cheats
User-added cheats
Import .cht file
Add code manually
Risk note
Apply for this session only
Save as profile
```

### Patch/hack panel

```txt
Base game
Available patches
Local patch files
Derived variants
Apply temporarily
Create cached variant
Show patch provenance
```

## In-game overlay concept

Modern console and handheld UIs train users to expect a system-level quick menu. xi-io Emulator should eventually provide a controller-accessible overlay that can appear while a game is running.

This overlay is not required for MVP, but the architecture should reserve space for it.

Potential overlay sections:

```txt
Resume game
Save state
Load state
Swap game
Controller profile
Display preset
Audio
Cheats
Patches/session mods
Recording
Exit to arcade shell
```

## Overlay constraints and concerns

The overlay is powerful but risky. It should come after launch and controller support are stable.

Concerns:

```txt
Focus capture between shell and emulator process
Different emulator engines expose different runtime controls
RetroArch has its own Quick Menu, DuckStation and PCSX2 have their own controls
Overlay injection over external windows may be unreliable on Linux/Wayland
Hotkeys may conflict with emulator hotkeys
Cheats may require reload/relaunch depending on engine
Patches usually require relaunch or a derived file
```

MVP rule:

```txt
Do not build the in-game overlay yet.
Reserve schema and UI placeholders only.
```

First practical implementation:

```txt
Exit game -> return to game detail -> edit settings/cheats/profile -> relaunch
```

Later implementation:

```txt
Guide-button quick overlay -> apply supported runtime changes -> return to game
```

## Safe patching posture

Patching must be non-destructive by default.

```txt
Never modify the user's original ROM by default.
Apply patches to a temporary or cached derived file.
Keep base game hash/path.
Keep patch file path/source.
Show derived variant as its own launchable record.
Allow user to delete generated cache.
```

## Search and filtering

Cheats and hacks should become facets in the search system.

```txt
has cheats
has enabled cheats
has patches
has hacks
has translation
has quality-of-life patch
has randomizer
has user-added codes
safe cheats only
needs cheat review
needs patch review
```

## Ledger events

```txt
cheat_provider_enabled
cheat_code_imported
cheat_code_added
cheat_code_enabled
cheat_code_disabled
cheat_profile_saved
patch_file_added
patch_profile_created
patch_applied_to_cache
patch_apply_failed
hack_variant_created
hack_variant_launch_ready
in_game_overlay_requested
in_game_overlay_failed
```

## Backlog slices

### XARCADE-CHEATS-001

```txt
Add cheat/hack/patch schema.
Add game detail UI placeholders.
Add search flags for hasCheats/hasPatches/hasHacks.
No runtime cheat execution yet.
```

### XARCADE-CHEATS-002

```txt
Support user-added cheat codes and imported .cht files.
Save per-game cheat profiles.
Still no provider downloads by default.
```

### XARCADE-PATCHES-001

```txt
Support local patch file registration.
Create non-destructive derived variant records.
Do not patch original files.
```

### XARCADE-OVERLAY-001

```txt
Design quick access overlay UI prototype.
Do not attempt engine-level runtime control until launch architecture is stable.
```

### XARCADE-OVERLAY-002

```txt
Add engine-specific quick actions where supported.
Start with return-to-shell edit/relaunch workflow before live runtime overlay control.
```

## Design recommendation

The immediate UI should represent this community through visible but honest states:

```txt
Cheats: not configured
Patches: not configured
Hacks & Variants: none added
```

Do not hide these concepts until late. They are part of the product identity. But do not pretend they work before contracts and safe execution paths exist.
