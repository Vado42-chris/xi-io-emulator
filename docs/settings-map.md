# Settings Map

The key product question is not which emulator settings exist. The key question is which settings users need surfaced and how those settings map to engine-specific details.

## Settings principle

Surface settings as user outcomes first. Keep raw engine configuration in adapter mappings and advanced views.

```txt
User outcome -> xi-io setting -> adapter mapping -> engine config / command / generated profile
```

## Top-level settings IA

```txt
Settings
  Library
  Controllers
  Display
  Audio
  Saves
  Emulator Engines
  BIOS & Firmware
  Systems
  Advanced
  Logs
```

## MVP settings only

The first slice should expose only what is required to launch and control SNES reliably.

```txt
Library
  - Add ROM folder
  - Remove ROM folder
  - Rescan folder
  - Mounted / missing status
  - Include subfolders
  - Supported extensions: .sfc, .smc, .zip later

Controllers
  - Connected controller list
  - Controller test
  - Shell navigation map
  - SNES virtual controller map
  - Save controller profile
  - Mapping confidence

Display
  - Fullscreen
  - Aspect ratio
  - Integer scale
  - Shader preset: none, clean pixels, soft CRT

Emulator Engines
  - RetroArch binary path
  - SNES core path
  - Launch test
  - Last launch command

Saves
  - Save folder
  - Auto-resume on launch
  - Auto-save state on exit

Logs
  - Last launch status
  - Last launch command
  - Last error
  - Open logs folder
```

## Global settings

```txt
app.start_fullscreen
app.preferred_input_device
app.show_advanced_settings
app.last_selected_system
app.return_to_shell_after_exit
app.write_runtime_logs
```

## Library settings

```txt
library.roots
library.scan_on_launch
library.include_subfolders
library.include_zip_files
library.duplicate_policy
library.region_preference
library.prefer_local_metadata
library.artwork_roots
```

## Controller settings

```txt
controller.devices
controller.active_device_id
controller.shell_profile_id
controller.global_game_profile_id
controller.mapping_confidence
controller.exit_hotkey_profile
controller.per_system_profiles
controller.per_game_overrides
```

## Display settings

```txt
display.mode
display.aspect_ratio
display.integer_scale
display.shader_preset
display.latency_profile
display.vsync_profile
display.per_system_profiles
```

## Audio settings

```txt
audio.output_device
audio.volume
audio.latency_profile
audio.sync_profile
audio.per_system_profiles
```

## Save settings

```txt
saves.root
saves.policy
saves.states_enabled
saves.auto_save_state_on_exit
saves.auto_load_state_on_launch
saves.state_slot_policy
saves.backup_policy
```

## Emulator engine settings

```txt
engine.retroarch.binary_path
engine.retroarch.core_dir
engine.retroarch.config_dir
engine.duckstation.binary_path
engine.pcsx2.binary_path
engine.mesen.binary_path
engine.default_by_system
```

## BIOS and firmware settings

```txt
firmware.root
firmware.system_status
firmware.required_files
firmware.optional_files
firmware.hash_validation
firmware.region
```

## System-specific settings

### SNES

```txt
system.snes.default_engine
system.snes.default_core
system.snes.controller_type
system.snes.display_profile
system.snes.save_profile
system.snes.advanced_core_options
```

### NES, later

```txt
system.nes.default_engine
system.nes.region
system.nes.controller_type
system.nes.zapper_enabled
system.nes.display_profile
```

### PlayStation 1, later

```txt
system.ps1.default_engine
system.ps1.bios_profile
system.ps1.controller_type
system.ps1.dualshock_enabled
system.ps1.memory_card_policy
system.ps1.disc_grouping_policy
system.ps1.graphics_profile
```

### PlayStation 2, later

```txt
system.ps2.default_engine
system.ps2.bios_profile
system.ps2.controller_type
system.ps2.memory_card_policy
system.ps2.graphics_profile
system.ps2.compatibility_profile
```

## Setting metadata model

```ts
type SettingScope =
  | "global"
  | "library"
  | "system"
  | "engine"
  | "controller"
  | "game";

type SettingVisibility =
  | "simple"
  | "advanced"
  | "developer";

type SettingRisk =
  | "safe"
  | "can_break_launch"
  | "can_break_input"
  | "can_break_saves";

type ArcadeSetting = {
  id: string;
  label: string;
  description: string;
  scope: SettingScope;
  visibility: SettingVisibility;
  risk: SettingRisk;
  defaultValue: unknown;
  adapterMappings: AdapterSettingMapping[];
};
```

## Adapter mapping model

```ts
type AdapterSettingMapping = {
  engine: "retroarch" | "duckstation" | "pcsx2" | "mesen";
  target: "command_arg" | "config_file" | "generated_file" | "runtime_profile";
  key: string;
  transform?: string;
};
```

## UX translation examples

```txt
"Make it look like an old TV"
  -> display.shader_preset = soft_crt
  -> RetroArch shader preset mapping

"My controller buttons are wrong"
  -> controller mapping flow
  -> physical controller profile
  -> SNES virtual controller remap

"My games are on another drive"
  -> library root
  -> mounted volume check
  -> missing-drive state if absent

"Resume where I left off"
  -> saves.auto_load_state_on_launch
  -> saves.auto_save_state_on_exit
```

## Advanced mode rule

Advanced mode may expose raw paths, engine names, command arguments, generated files, core options, and launch logs. Simple mode should not make users read emulator config jargon unless a failure requires it.
