# Controller Contract v1

Controller support is a primary product feature, not an afterthought.

The shell must support controller navigation in the UI and controller mapping inside launched games. These are related but separate layers.

## Controller layers

```txt
Physical controller
  -> canonical physical schema
  -> shell navigation profile
  -> virtual system controller profile
  -> engine-specific remap/config output
```

## Physical controller model

```ts
type PhysicalController = {
  id: string;
  name: string;
  guid?: string;
  vendorId?: string;
  productId?: string;
  source: "sdl" | "evdev" | "unknown";
  connected: boolean;
  detectedAt: string;
  lastSeenAt?: string;
};
```

## Controller confidence

```ts
type ControllerConfidence = {
  controllerId: string;
  status: "known" | "partial" | "unknown";
  source?: "bundled_db" | "user_mapping" | "runtime_detection";
  missingControls: string[];
};
```

## Canonical physical controls

```txt
dpad_up
dpad_down
dpad_left
dpad_right
south
east
west
north
left_shoulder
right_shoulder
left_trigger
right_trigger
left_stick_x
left_stick_y
right_stick_x
right_stick_y
left_stick_click
right_stick_click
start
select
guide
```

## Shell navigation controls

```txt
confirm
back
up
down
left
right
open_menu
open_search
favorite
launch
exit_game
quick_actions
```

## SNES virtual controls

```txt
snes_dpad_up
snes_dpad_down
snes_dpad_left
snes_dpad_right
snes_a
snes_b
snes_x
snes_y
snes_l
snes_r
snes_start
snes_select
```

## Controller profile model

```ts
type ControllerProfile = {
  id: string;
  label: string;
  controllerId: string;
  physicalMap: Record<string, string>;
  shellMap: Record<string, string>;
  systemMaps: Record<string, Record<string, string>>;
  createdAt: string;
  updatedAt: string;
};
```

## Mapping scope

```txt
global controller profile
shell navigation profile
system profile
game override
temporary test profile
```

## Visual mapping flow

```txt
1. Detect controller.
2. Show known / partial / unknown confidence.
3. Show visual controller diagram.
4. Ask user to press highlighted physical controls.
5. Build canonical physical map.
6. Show target virtual controller diagram.
7. Map canonical controls to SNES controls.
8. Test all required controls.
9. Save profile.
10. Use profile for shell and game launch.
```

## MVP required mappings

```txt
Shell:
  up, down, left, right, confirm, back, launch, exit_game

SNES:
  dpad, A, B, X, Y, L, R, Start, Select
```

## Engine output responsibilities

The controller contract does not require the UI to know how RetroArch, DuckStation, or PCSX2 store remaps.

Adapter layer responsibilities:

```txt
Generate engine-specific remap files.
Pass relevant launch flags if required.
Avoid mutating global emulator configs unless explicitly enabled.
Store generated files under xi-io Emulator controlled config/cache paths.
Report generated paths in diagnostics.
```

## Ledger events

```txt
controller_detected
controller_disconnected
controller_confidence_resolved
controller_mapping_started
controller_mapping_created
controller_mapping_failed
controller_profile_selected
controller_profile_applied_to_launch
```

## UX rules

1. A user should not need to edit text config to map a controller.
2. The shell and the game must not fight over the same input.
3. The UI must show whether the controller is known, partial, or unknown.
4. Required controls must be visually tested before first launch.
5. Per-system mappings must inherit from a global physical profile.
6. Advanced remapping can come later, but basic SNES mapping must be clean.
