# Decision: Generic USB Controller Proof Policy

Date: 2026-05-28

## Purpose

The current Pass B controller is a generic gamepad connected by USB cable. The available Bluetooth dongle is not currently usable on Linux, so wired USB is the reliable proof path.

## Decision

Pass B does not require a standard SNES-style controller.

Pass B should prove:

```txt
generic wired USB controller
Linux input and/or browser Gamepad API detection where available
FCEUX or RetroArch input mapping
in-game NES/SNES control
explicit Mark In-Game Verified
```

This is more representative of real user hardware than a single canonical controller model.

## Current hardware state

```txt
controller_type: generic USB gamepad
connection_mode: wired USB cable to computer USB port
bluetooth_dongle: present but not currently usable on Linux
proof_mode: wired only
```

## Product implication

The controller system must not assume:

```txt
SNES-branded controller
Nintendo layout labels only
Bluetooth availability
known vendor/product IDs
known Linux driver package
RetroArch auto-config success
```

The app should support generic input mapping and present controller state in user-facing language.

## Pass B acceptance

For Pass B, success means:

```txt
Linux/Tauri/browser detects a controller source, or emulator accepts the wired controller directly.
NES can be controlled in-game through FCEUX.
SNES can be controlled in-game through RetroArch.
The user explicitly clicks Mark In-Game Verified after testing in-game input.
```

If browser detection does not work but FCEUX or RetroArch accepts the controller, record that as acceptable with a note. The product proof is in-game control, not browser detection alone.

## Mapping notes

Generic gamepads may present different button names or axis layouts. The UI should eventually support:

```txt
visual input test
button press capture
axis capture
manual button mapping
profile save
profile per controller
profile per emulator/core
profile export/import
```

The MVP only needs honest detection, explicit test, and documented in-game proof.

## Bluetooth policy

Bluetooth is deferred for this proof.

Do not block Pass B because the Bluetooth dongle lacks Linux driver support.

Future controller work may include:

```txt
Bluetooth troubleshooting diagnostics
controller vendor/product ID display
input diagnostics
SDL mapping import
RetroArch autoconfig profile import
```

## Ledger policy

Record controller proof honestly:

```txt
controller_connection: wired_usb
controller_brand_model: unknown_or_user_supplied
browser_gamepad_api: detected / not_detected / not_tested
linux_input_device: detected / not_detected / not_tested
fceux_in_game_input: passed / failed / not_tested
retroarch_in_game_input: passed / failed / not_tested
bluetooth_dongle: unavailable_on_linux_currently
```

## Serialized tags

```txt
#xio:emulator/controller/generic-usb
#xio:emulator/controller/wired-proof
#risk:controller-layout-ambiguity
#risk:bluetooth-driver-gap
#todo:controller/profile-mapping
```

## Decision summary

A generic wired USB controller is valid for Pass B.

The milestone should test real in-game control through FCEUX and RetroArch, not require SNES-branded hardware or Bluetooth support.
