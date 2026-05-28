# xi-io Emulator Product Brief

## Working name

xi-io Emulator, also described internally as Xibalba Arcade Shell.

## Product intent

Create a lightweight Linux-first arcade shell that gives users one coherent experience for discovering games, configuring controllers, launching emulator engines, and returning to a polished controller-friendly UI.

The project starts with SNES on Pop!_OS, then expands to Nintendo systems, PlayStation, and PlayStation 2 through adapter contracts rather than one-off UI work.

## Primary user story

As a Linux user with ROMs stored across local and secondary drives, I want a controller-first arcade interface that lets me browse, configure, launch, exit, and return to my games without fighting disconnected emulator UIs, text-only controller mapping, missing mount points, or hidden config files.

## Core problem areas

1. Emulator engines are powerful but their frontends are often fragmented, nested, or technical.
2. Linux controller setup is inconsistent and intimidating for non-specialists.
3. ROM libraries often live on secondary drives, which can disappear from app state when unmounted.
4. Users have to learn multiple emulator UIs for multiple platforms.
5. Launch failures often fail silently or require log hunting.
6. Per-system and per-game settings are powerful but poorly translated into user outcomes.

## Product wedge

The wedge is not emulation accuracy. The wedge is a polished Linux arcade product layer:

```txt
Controller-first shell
Storage-aware library manager
Visual controller mapping
Engine adapter contracts
Human-readable settings registry
Visible launch diagnostics
One UI across many platforms
```

## First platform target

```txt
Operating system: Pop!_OS / Linux
First game system: SNES
First backend: locally installed RetroArch with an SNES core
First app shape: Tauri + React + TypeScript
```

## Long-term platform path

```txt
SNES first
Nintendo family next
PlayStation 1 next
PlayStation 2 after BIOS, graphics, and memory-card contracts are mature
Universal shell later
```

## Product principles

### 1. Engines are adapters, not the product

RetroArch, DuckStation, PCSX2, Mesen, and future engines should be treated as adapter targets. The user should feel like they are using xi-io Emulator.

### 2. Settings are user outcomes

Expose settings as outcomes first:

```txt
Make it look good on my TV
Fix my controller
Find my games on another drive
Resume where I left off
Use better accuracy
Use better performance
Show why launch failed
```

Raw emulator settings belong behind adapter mappings and advanced views.

### 3. Controller setup is onboarding, not a settings afterthought

The controller should work in the shell and in the game. The app must distinguish shell navigation, physical controller mapping, and virtual console mapping.

### 4. Storage state must be explicit

A missing mounted drive is not an empty library. The shell must tell the user what drive or path is missing and how to reconnect it.

### 5. No silent failure

Every failed launch, missing binary, missing core, missing BIOS, missing drive, or controller mismatch must produce a visible event and a useful log.

## MVP scope

```txt
XARCADE-SHELL-001

- App opens to a controller-friendly shell
- User adds a SNES ROM root
- App indexes .sfc and .smc files
- App detects mounted/missing library roots
- App detects controller input
- User can test and map controller basics
- App launches RetroArch with configured SNES core
- App returns to shell after game exit
- App writes visible launch diagnostics
```

## MVP non-goals

```txt
- Native SNES emulator core
- PS1 or PS2 support
- Metadata scraping at scale
- Full shader system
- Cloud sync
- Netplay
- Achievements
- Packaged public release
```

## Success criteria for first slice

1. A user can configure a SNES library on a secondary drive.
2. The shell correctly reports mounted and missing drive states.
3. A controller can navigate the shell.
4. A controller can be tested and mapped visually enough for SNES.
5. A SNES game launches through the configured backend.
6. Exiting the game returns the user to the shell.
7. Every failure state has a visible error and ledger entry.
