# Flatpak Storage and Device Strategy

Research date: 2026-05-28

## Purpose

xi-io Emulator is currently being built as a web/Tauri-style shell, but the Linux release target should include Flatpak packaging for ease of installation on Pop!_OS and other desktop Linux systems.

This document captures the storage, secondary-drive, controller, emulator-engine, and packaging implications for Flatpak.

## Summary

Flatpak can work for xi-io Emulator, including libraries on secondary hard drives, but secondary-drive support must be designed explicitly.

The app must not assume unrestricted filesystem access.

The correct model is:

```txt
User chooses file/folder through portal or native dialog
  -> app receives access to selected path
  -> app stores library root record
  -> app checks path availability
  -> app preserves records if path is missing
  -> app shows recovery UI
```

## Flatpak reality

By default, Flatpak apps are sandboxed and have extremely limited access to host files. They can access their own app data/config/cache areas, but not arbitrary host folders unless access is granted through portals or filesystem permissions.

Flatpak portals allow the user to select files or folders outside the sandbox. The user's selection grants access to those selected resources.

## Secondary hard drives on Pop!_OS

Secondary drives commonly appear under paths such as:

```txt
/media/<user>/<drive-name>/...
/run/media/<user>/<drive-name>/...
/mnt/<mount-name>/...
```

Flatpak will not automatically see all of these paths unless permissions or portal grants allow it.

Therefore, xi-io Emulator must treat secondary-drive access as a managed library-source flow.

## Recommended approach

### MVP packaging posture

```txt
Use Flatpak as the target install package.
Use portal/native dialog folder selection for adding game files or library roots.
Use app-local storage for catalog, settings, cache, logs, and generated profiles.
Do not request broad host filesystem access by default if a narrower portal flow works.
```

### Storage flow

```txt
Add One Game:
  User selects one file through file picker.
  App creates single_game record.
  App stores selected file path/URI and status.

Add Library Folder:
  User selects folder through folder picker.
  App creates library root record.
  App scans supported files.
  App stores root path, relative paths, and mounted/missing status.
```

### Power-user override flow

For users with large libraries on external/secondary drives, provide documentation for Flatpak filesystem overrides if portal access is insufficient.

Examples to document later, not hardcode as app behavior:

```txt
flatpak override --user --filesystem=/media/$USER:ro <APP_ID>
flatpak override --user --filesystem=/run/media/$USER:ro <APP_ID>
flatpak override --user --filesystem=/mnt:ro <APP_ID>
```

Use read-only access for ROM/library roots wherever possible.

## App data locations

Flatpak app-private data should hold:

```txt
catalog database or JSON store
settings
search index
artwork cache
provider cache
logs
controller profiles
generated launch profiles
generated non-destructive patch cache
```

The user-owned ROM library should remain outside the app by default.

## Tauri implications

Tauri can be used as the desktop shell, but the app must separate:

```txt
Frontend UI state
Tauri commands for native file/folder selection
Rust-side filesystem scanning
Flatpak permissions/portals
```

The Tauri filesystem plugin supports scoped filesystem access, and Rust-side file APIs can be used for filesystem work once the app has the appropriate path access.

## Emulator engine implications

Flatpak packaging complicates launching external host applications such as host-installed RetroArch.

Potential strategies:

```txt
1. External host engine mode, development/advanced:
   Launch host-installed RetroArch from outside Flatpak if allowed by portals/permissions.
   This may need careful sandbox escape strategy and may not be acceptable for Flathub-style packaging.

2. Bundled/extension engine mode, later:
   Ship or depend on packaged emulator engines/cores in a controlled way.
   Larger packaging burden but more predictable runtime.

3. Split package strategy:
   Flatpak UI shell plus documented native/dev mode for engine launching during early development.
```

For early development, do not let Flatpak packaging block the product UI. Keep adapter contracts clean so runtime launch strategy can change.

## Controller/device implications

Game controllers may require device permissions or portal support depending on how input is read.

Flatpak documents device permissions for Direct Rendering Infrastructure, input devices, USB devices, and broader device access. Controller support should be tested under Flatpak separately from normal dev mode.

MVP posture:

```txt
Keyboard/mouse UI works in Flatpak first.
Controller support is tested in native dev mode and Flatpak mode separately.
Do not assume /dev/input access exists.
Use SDL/gamepad APIs where practical.
Document required Flatpak permissions once proven.
```

## Packaging backlog

### XARCADE-FLATPAK-001, package skeleton

```txt
Create Flatpak manifest skeleton.
Build app shell inside Flatpak locally.
Confirm app launches on Pop!_OS.
Confirm app data/config/cache paths.
No emulator launch required.
```

### XARCADE-FLATPAK-002, portal storage test

```txt
Add One Game through file chooser.
Add Library Folder through folder chooser.
Test secondary drive under /media or /run/media.
Confirm selected files/folders can be scanned.
Confirm missing drive state after unmount/remount.
```

### XARCADE-FLATPAK-003, controller/device test

```txt
Test controller detection inside Flatpak.
Document required permissions.
Avoid broad --device=all unless no practical narrower path exists.
```

### XARCADE-FLATPAK-004, engine launch strategy

```txt
Test whether Flatpak shell can launch host RetroArch safely.
If not, document alternatives: bundled engine, native package, extension, or non-Flatpak dev mode.
```

## Acceptance criteria for Flatpak readiness

```txt
App installs as Flatpak on Pop!_OS.
App launches without terminal.
App data persists across runs.
User can select a game file outside sandbox.
User can select a library folder outside sandbox.
Secondary-drive missing/remount behavior is tested.
Controller access behavior is tested and documented.
Engine launch strategy is explicit.
No broad filesystem/device permissions are requested without documented need.
```

## Product rule

Flatpak must not weaken the core storage UX.

If a secondary drive is missing or inaccessible because of sandbox permissions, the UI must say so directly:

```txt
This library root is not accessible.
Possible reasons:
  - the drive is not mounted
  - Flatpak permission has not been granted
  - the folder was moved or renamed

Choose Reconnect Folder or adjust Flatpak permissions.
```
