# xi-io Emulator

A Linux-first, controller-first arcade shell for running emulator engines through a unified Xibalba product experience.

The first target is Pop!_OS with SNES support through an installed emulator backend such as RetroArch and a proven SNES core. The long-term target is a lightweight universal emulator shell with a consistent UI across SNES, Nintendo systems, PlayStation, and PlayStation 2.

## Product thesis

Existing emulator engines are powerful. The user experience around Linux storage, controller setup, per-system configuration, launch flow, and return-to-shell behavior is still too fragmented.

This project should not begin by writing an emulator core from scratch. It should begin by building a polished arcade shell that wraps existing engines with strict adapter contracts, human-readable settings, visual controller mapping, storage awareness, and no-silent-failure logging.

## Initial product goals

1. Provide a modern arcade-style UI for Linux, starting with Pop!_OS.
2. Let users browse, launch, exit, and return to the shell with a controller.
3. Support ROM libraries on secondary drives and external mounted volumes.
4. Detect missing drives and failed launches clearly instead of showing empty or silent states.
5. Provide visual controller mapping, not text-only mapping.
6. Normalize emulator settings into user-facing outcomes.
7. Support multiple emulator engines through adapter manifests.
8. Expand system-by-system without breaking the central shell experience.

## Target expansion path

```txt
Phase 1: SNES
Phase 2: Nintendo systems, beginning with NES
Phase 3: PlayStation 1
Phase 4: PlayStation 2
Phase 5: broader universal emulator shell
```

## Recommended MVP architecture

```txt
React + TypeScript + Vite UI
Tauri desktop shell
Rust sidecar/system services
SQLite local catalog
JSON adapter manifests
SDL controller mapping source
RetroArch/libretro backend for first SNES slice
```

## Xibalba framework alignment

This repo should follow the xi-io product pattern:

```txt
Ingress: ROM roots, mounted drives, controller devices, emulator binaries, cores, BIOS folders, metadata
Analysis: system detection, drive availability, controller confidence, core availability, launch readiness
Egress: launch commands, library views, controller profiles, save paths, visible errors, logs
Lexicon: controlled terms for systems, engines, cores, profiles, ROM roots, adapters, saves, firmware
Ledger: project and runtime events that prevent silent failures
```

## First shippable slice

```txt
XARCADE-SHELL-001

Build a Pop!_OS desktop arcade shell that:
  - opens as a modern controller-friendly UI
  - lets the user select a SNES ROM root from any mounted drive
  - indexes .sfc and .smc files
  - detects missing library roots
  - detects a connected controller
  - supports shell navigation with the controller
  - launches a SNES ROM through RetroArch and a SNES core
  - returns focus to the shell after emulator exit
  - logs every failure visibly
```

## Non-goals for the first slice

```txt
Do not write a SNES emulator core yet.
Do not support every console immediately.
Do not start with PS2.
Do not require users to edit RetroArch config files manually.
Do not make emulator internals the primary UI.
Do not silently fail when drives, cores, BIOS files, or controllers are missing.
```

## Repository status

This repository is newly initialized and currently in framework hydration. See `docs/` for the product map, contracts, and working backlog.
