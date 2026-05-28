# Framework Alignment

xi-io Emulator should use the shared xi-io/Xibalba mental model from the start. The project should stay lightweight, but the naming and contracts should not drift.

## Framework spine

```txt
Ingress -> Analysis -> Egress -> Lexicon -> Ledger
```

## Ingress

Ingress covers every source the shell receives or observes.

```txt
ROM library roots
Mounted drives and volumes
Game files
Controller devices
Keyboard devices
Emulator binaries
Libretro cores
BIOS and firmware folders
Save folders
Artwork and metadata folders
User settings
Adapter manifests
```

## Analysis

Analysis converts raw source state into launchable, understandable product state.

```txt
Detect mounted and missing library roots
Infer system from path, extension, or file signature where possible
Detect duplicate ROM entries
Detect emulator binary availability
Detect core availability
Detect BIOS or firmware requirements
Detect connected controller devices
Match controller devices to known profiles
Evaluate launch readiness
Select adapter profile
Resolve per-game overrides
```

## Egress

Egress is every output, action, or user-visible projection.

```txt
Arcade library grid
System shelves
Game detail panels
Launch commands
Generated emulator config or remap files
Controller profiles
Storage warnings
BIOS warnings
Launch logs
Runtime ledger events
Settings exports
```

## Lexicon

The project should maintain controlled terms so code, docs, and UI do not fragment.

```txt
Arcade shell: the central xi-io Emulator UI
Engine: a standalone emulator backend such as RetroArch, DuckStation, PCSX2, or Mesen
Core: a libretro core used by RetroArch
Adapter: a contract that maps shell settings to an engine/core launch
System: a game platform such as SNES, NES, PS1, or PS2
Library root: a user-selected ROM folder
Mounted volume: a Linux storage volume that may contain one or more library roots
Game record: a cataloged item in the local library
Physical controller: the actual connected controller device
Virtual controller: the target console controller schema
Controller profile: saved mapping from physical controller to shell and system controls
Launch profile: resolved emulator command and runtime settings for a game
BIOS profile: detected firmware state for systems that need firmware
Save profile: save and save-state storage policy
```

## Ledger

The ledger prevents silent failure and gives the product operational memory.

Initial event names:

```txt
app_started
settings_loaded
library_root_added
library_root_removed
library_root_missing
library_scan_started
library_scan_completed
rom_detected
duplicate_rom_detected
engine_detected
engine_missing
core_detected
core_missing
bios_detected
bios_missing
controller_detected
controller_mapping_created
controller_mapping_failed
launch_requested
launch_ready
launch_blocked
launch_started
launch_failed
emulator_exited
shell_focus_restored
```

## Scope hierarchy

Settings should resolve through this hierarchy:

```txt
Global default
System default
Engine default
Controller profile
Game override
Runtime launch decision
```

A game should inherit almost everything by default. Overrides should be narrow and explicit.

## No-silent-failure rule

The shell must never fail quietly when a required runtime dependency is missing.

Examples:

```txt
Missing ROM root: show missing drive/path state.
Missing RetroArch binary: show engine setup state.
Missing SNES core: show core setup state.
Missing BIOS: show required firmware state, especially for PS1/PS2 later.
Controller mismatch: show mapping confidence and remap flow.
Launch crash: show last command, exit code, stdout/stderr if available.
```

## Privacy and data posture

The app should be local-first by default.

```txt
Do not upload ROM names, paths, saves, BIOS names, controller IDs, or play history by default.
Store catalog and settings locally.
Make all future metadata or cloud integrations explicit opt-in adapters.
Keep user-owned content outside app custody unless user chooses otherwise.
```
