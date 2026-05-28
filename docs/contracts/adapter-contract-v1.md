# Adapter Contract v1

The adapter contract lets xi-io Emulator use different emulator engines without making the UI engine-specific.

## Purpose

An adapter converts xi-io shell state into a deterministic emulator launch.

```txt
Game record + settings + controller profile + storage state
        -> adapter resolution
        -> launch command / generated config / diagnostics
```

## Adapter responsibilities

```txt
Declare supported systems
Declare supported file extensions
Declare required engine binary
Declare required core or firmware dependencies
Validate launch readiness
Resolve launch command
Map shell settings to engine settings
Generate temporary or persistent config files when needed
Capture launch output and exit status
Return structured diagnostics
```

## Adapter non-responsibilities

```txt
Do not scan the whole library.
Do not own global settings.
Do not render UI.
Do not silently install emulator binaries.
Do not mutate user emulator configs without explicit policy.
```

## Adapter manifest shape

```json
{
  "adapter_id": "retroarch.snes.snes9x",
  "adapter_version": "1.0.0",
  "engine_id": "retroarch",
  "system_id": "snes",
  "display_name": "SNES via RetroArch Snes9x",
  "description": "Launches SNES games using RetroArch and the Snes9x libretro core.",
  "content_extensions": [".sfc", ".smc"],
  "requires_bios": false,
  "required_files": [
    {
      "kind": "engine_binary",
      "setting_id": "engine.retroarch.binary_path",
      "label": "RetroArch binary"
    },
    {
      "kind": "libretro_core",
      "setting_id": "engine.retroarch.snes_core_path",
      "label": "Snes9x libretro core"
    }
  ],
  "capabilities": {
    "fullscreen": true,
    "save_states": true,
    "rewind": true,
    "shaders": true,
    "per_game_remap": true,
    "command_line_launch": true
  },
  "launch_template": [
    "{engine_path}",
    "-f",
    "-L",
    "{core_path}",
    "{content_path}"
  ],
  "controller_profile": "snes.standard.v1",
  "exit_hotkey_profile": "xibalba.default_exit.v1"
}
```

## Runtime launch request

```ts
type LaunchRequest = {
  gameId: string;
  contentPath: string;
  systemId: string;
  adapterId: string;
  settingsProfileId?: string;
  controllerProfileId?: string;
  saveProfileId?: string;
};
```

## Launch readiness result

```ts
type LaunchReadiness = {
  ready: boolean;
  adapterId: string;
  blockers: LaunchBlocker[];
  warnings: LaunchWarning[];
  resolvedCommand?: string[];
};

type LaunchBlocker = {
  code:
    | "missing_engine"
    | "missing_core"
    | "missing_content"
    | "missing_bios"
    | "missing_drive"
    | "invalid_controller_profile";
  message: string;
  recoveryAction?: string;
};

type LaunchWarning = {
  code:
    | "unknown_controller"
    | "unverified_core"
    | "slow_storage"
    | "advanced_setting_override";
  message: string;
};
```

## Launch result

```ts
type LaunchResult = {
  launchId: string;
  adapterId: string;
  gameId: string;
  command: string[];
  startedAt: string;
  exitedAt?: string;
  exitCode?: number;
  stdoutPath?: string;
  stderrPath?: string;
  status: "started" | "failed_to_start" | "exited" | "crashed";
  diagnostics: DiagnosticMessage[];
};
```

## Diagnostic message

```ts
type DiagnosticMessage = {
  severity: "info" | "warning" | "error";
  code: string;
  message: string;
  detail?: string;
};
```

## First adapter target

```txt
adapter_id: retroarch.snes.snes9x
system_id: snes
engine_id: retroarch
content_extensions: .sfc, .smc
requires_bios: false
```

## Future adapter targets

```txt
retroarch.nes.default
mesen.nes.default
duckstation.ps1.default
pcsx2.ps2.default
```

## No-silent-failure requirements

An adapter must return blockers before launch if any required dependency is missing. It must never allow a failed process launch to appear as a successful game start.

Required visible failure categories:

```txt
missing engine binary
missing libretro core
missing content file
missing mounted drive
missing BIOS or firmware
invalid controller mapping
permission denied
process start failure
non-zero exit code
```
