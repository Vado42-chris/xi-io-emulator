# Launch Failure Codes

Date: 2026-05-29

## Purpose

Stable support taxonomy for xi-io Emulator Pass B launch, display, lifecycle, and controller failures.

These codes map **symptoms → subsystem → UI → ledger → verification**. They are governance/runbook identifiers. Implementation may lag; the **expected future ledger event** column documents what should be emitted after lifecycle retest.

**Related:**

```txt
docs/operations/troubleshooting-pass-b.md
docs/project-tracking/open-work-ledger.md
docs/framework/serialized-hashtags-standard.md
```

**Milestone status:** Pass B partial/blocked. Pass C not safe. This document does not close the milestone.

---

## Code index

| Code | Title | Subsystem |
|------|-------|-----------|
| [XIO-LCH-001](#xio-lch-001-missing-engine) | Missing engine | Readiness |
| [XIO-LCH-002](#xio-lch-002-missing-core) | Missing core | Readiness |
| [XIO-LCH-003](#xio-lch-003-missing-content) | Missing content | Readiness |
| [XIO-LCH-004](#xio-lch-004-permission-denied) | Permission denied | Readiness / storage |
| [XIO-LCH-005](#xio-lch-005-unsupported-system) | Unsupported system | Readiness |
| [XIO-LCH-006](#xio-lch-006-spawn-failed) | Spawn failed | Launch |
| [XIO-LCH-007](#xio-lch-007-emulator-exited-dirty) | Emulator exited dirty | Launch / lifecycle |
| [XIO-LCH-008](#xio-lch-008-shell-focus-restore-failed) | Shell focus restore failed | Lifecycle |
| [XIO-LCH-009](#xio-lch-009-display-identify-failed) | Display identify failed | Display |
| [XIO-LCH-010](#xio-lch-010-stale-demo-mock-record) | Stale demo/mock record | Readiness / proof |
| [XIO-LCH-011](#xio-lch-011-emulator-alive-rom-closed) | Emulator alive, ROM closed | Lifecycle |
| [XIO-LCH-012](#xio-lch-012-duplicate-xi-io-instance) | Duplicate xi-io instance | Shell |
| [XIO-LCH-013](#xio-lch-013-demo-mode-simulated) | Demo mode simulated launch | Launch |

---

## XIO-LCH-001: Missing engine

| Field | Value |
|-------|-------|
| **Symptom** | Launch blocked; hero/overlay shows **Missing Engine**; FCEUX or RetroArch path not set or not found |
| **Subsystem** | Readiness / engines |
| **Blocker code** | `missing_engine` |
| **UI surface** | Arcade Home hero blocker panel; launch overlay blockers |
| **Current ledger** | `launch_blocked` (`details.blockerCode: missing_engine`) |
| **Future ledger** | (none — adequate) |
| **Verify** | Admin → Engines → Test Engine Paths; `test -f /usr/games/fceux` or configured path |

---

## XIO-LCH-002: Missing core

| Field | Value |
|-------|-------|
| **Symptom** | SNES launch blocked; **Missing Core** (Snes9x libretro `.so` not found) |
| **Subsystem** | Readiness / engines |
| **Blocker code** | `missing_core` |
| **UI surface** | Arcade Home hero blocker; launch overlay |
| **Current ledger** | `launch_blocked` (`blockerCode: missing_core`) |
| **Future ledger** | (none — adequate) |
| **Verify** | Admin → Engines; confirm `engine.retroarch.snes_core_path` points to existing `snes9x_libretro.so` |

---

## XIO-LCH-003: Missing content

| Field | Value |
|-------|-------|
| **Symptom** | **Missing Game File**; ROM path does not exist on disk |
| **Subsystem** | Readiness / content |
| **Blocker code** | `missing_content` |
| **UI surface** | Arcade Home hero blocker; launch overlay |
| **Current ledger** | `launch_blocked` (`blockerCode: missing_content`) |
| **Verify** | Admin → Engines → proof ROM paths; `test -f "<contentPath>"` |

---

## XIO-LCH-004: Permission denied

| Field | Value |
|-------|-------|
| **Symptom** | **Access Permission Denied** for storage volume; or evdev `/dev/input` permission denied for controller return |
| **Subsystem** | Readiness / storage / controller |
| **Blocker code** | `permission_denied` (launch); no blocker for input-only case |
| **UI surface** | Hero blocker (volume); Controllers setup error string (input) |
| **Current ledger** | `launch_blocked` when volume-related |
| **Future ledger** | `controller_input_permission_denied` |
| **Verify** | `ls -la /dev/input/event*`; user in `input` group; volume mount permissions |

---

## XIO-LCH-005: Unsupported system

| Field | Value |
|-------|-------|
| **Symptom** | **Unsupported System** — no adapter for `systemId` |
| **Subsystem** | Readiness / adapters |
| **Blocker code** | `unsupported_system` |
| **UI surface** | Hero blocker; launch overlay |
| **Current ledger** | `launch_blocked` (`blockerCode: unsupported_system`) |
| **Verify** | Game record `systemId` is `nes` or `snes` for Pass B |

---

## XIO-LCH-006: Spawn failed

| Field | Value |
|-------|-------|
| **Symptom** | Launch overlay error; Tauri invoke returns error (binary not found, spawn failed) |
| **Subsystem** | Launch / Tauri |
| **Blocker code** | (post-readiness — no blocker code) |
| **UI surface** | Launch overlay error text; command preview may show |
| **Current ledger** | `launch_failed` (`details` may include `stderr`, message) |
| **Future ledger** | `launch_failed` with `failureCode: XIO-LCH-006` |
| **Verify** | Admin → Logs; run resolved command manually in terminal |

---

## XIO-LCH-007: Emulator exited dirty

| Field | Value |
|-------|-------|
| **Symptom** | Overlay shows non-zero exit or error after game ends; not clean return to shelf |
| **Subsystem** | Launch / lifecycle |
| **Blocker code** | — |
| **UI surface** | Launch overlay (`launchResult.error`, exit code) |
| **Current ledger** | `launch_failed` (`exitCode`, `stderr`) |
| **Future ledger** | `emulator_exited_dirty` with structured `exitCode` |
| **Verify** | Admin → Logs; `~/.local/share/com.xi-io.emulator/emulator_last_session.json` |

---

## XIO-LCH-008: Shell focus restore failed

| Field | Value |
|-------|-------|
| **Symptom** | Emulator closed but xi-io not visible/focused; user sees desktop or black fullscreen only |
| **Subsystem** | Lifecycle / window manager |
| **Blocker code** | — |
| **UI surface** | Often none (silent); may appear as stuck state |
| **Current ledger** | `shell_focus_restored` always emitted on exit attempt — **not** a failure signal |
| **Future ledger** | `shell_focus_restore_failed` (documented in hashtag standard, not implemented) |
| **Verify** | `xdotool search --name 'xi-io'`; `pgrep -af xi-io-emulator`; Alt-Tab / wmctrl |

---

## XIO-LCH-009: Display identify failed

| Field | Value |
|-------|-------|
| **Symptom** | **Identify screens** button does nothing visible; no numbers on monitors |
| **Subsystem** | Display / pre-launch picker |
| **Blocker code** | — |
| **UI surface** | Launch Display overlay button re-enables silently |
| **Current ledger** | **none** |
| **Future ledger** | `display_identify_failed`, `display_identify_shown` |
| **Verify** | `xrandr --query`; retry Identify; check Tauri multi-window permissions |

---

## XIO-LCH-010: Stale demo/mock record

| Field | Value |
|-------|-------|
| **Symptom** | Launch blocked for tile under `/media/arcade-usb/` or mock batch path |
| **Subsystem** | Readiness / proof shelf |
| **Blocker code** | `missing_content` (stale demo copy) |
| **UI surface** | Green Pass B banner; blocker desc mentions stale demo path |
| **Current ledger** | `launch_blocked` |
| **Verify** | Launch only from **Pass B Launch Proof** shelf; re-register proof ROM in Admin → Engines |

---

## XIO-LCH-011: Emulator alive, ROM closed

| Field | Value |
|-------|-------|
| **Symptom** | FCEUX fullscreen black window after File → Close Game; xi-io waits or user stuck |
| **Subsystem** | Lifecycle / emulator_process |
| **Blocker code** | — |
| **UI surface** | Often none until timeout; may show launching overlay stuck |
| **Current ledger** | **none** (session JSON may show `natural_exit` incorrectly) |
| **Future ledger** | `emulator_idle_detected`, `emulator_session_terminated` with `exitReason` |
| **Verify** | `pgrep -af fceux`; `ls -l /proc/<pid>/fd`; xdotool window title; use **Select+Start** return |

**Note:** `/proc/<pid>/cmdline` is launch-time only — do not use alone for ROM-closed detection.

---

## XIO-LCH-012: Duplicate xi-io instance

| Field | Value |
|-------|-------|
| **Symptom** | Two dock icons; second launch focuses existing window instead of new session |
| **Subsystem** | Shell / single_instance |
| **Blocker code** | — |
| **UI surface** | Second instance exits immediately (by design) |
| **Current ledger** | **none** |
| **Future ledger** | `single_instance_focused_existing` |
| **Verify** | `pgrep -af xi-io-emulator` — expect one main process |

---

## XIO-LCH-013: Demo mode simulated

| Field | Value |
|-------|-------|
| **Symptom** | Game appears to "launch" instantly without FCEUX; ledger shows `[DEMO]` |
| **Subsystem** | Launch / settings |
| **Blocker code** | — |
| **UI surface** | Demo mode banner on Arcade Home (if visible) |
| **Current ledger** | `launch_started` with `demoMode: true` |
| **Future ledger** | (none — adequate if banner visible) |
| **Verify** | Admin → Settings; `localStorage xibalba_demo_mode`; disable demo mode |

---

## Blocker code → XIO code mapping

| `LaunchBlocker.code` | XIO code |
|----------------------|----------|
| `missing_engine` | XIO-LCH-001 |
| `missing_core` | XIO-LCH-002 |
| `missing_content` | XIO-LCH-003 (or XIO-LCH-010 if stale demo path) |
| `permission_denied` | XIO-LCH-004 |
| `unsupported_system` | XIO-LCH-005 |
| `missing_tauri` | (browser dev — run `npm run tauri:dev`) |
| `missing_drive` | XIO-LCH-003 / storage (volume offline) |

---

## Ledger events (current vs planned)

| Ledger event | XIO codes | Status |
|--------------|-----------|--------|
| `launch_requested` | all launches | Implemented |
| `launch_blocked` | 001–005, 010 | Implemented |
| `launch_started` | — | Implemented |
| `launch_failed` | 006, 007 | Implemented |
| `emulator_exited` | clean exit | Implemented |
| `shell_focus_restored` | 008 (misleading on failure) | Implemented |
| `shell_focus_restore_failed` | 008 | **Not implemented** |
| `display_identify_failed` | 009 | **Not implemented** |
| `display_identify_shown` | 009 | **Not implemented** |
| `emulator_session_terminated` | 011 | **Not implemented** |
| `shell_hidden_for_game` | lifecycle | **Not implemented** |

---

## Session artifact (Rust app data)

Path: `~/.local/share/com.xi-io.emulator/emulator_last_session.json`

| Field | Use |
|-------|-----|
| `exitReason` | `natural_exit`, `shell_exit_button`, `shell_ui_exit` |
| `pids` | Last known emulator PIDs |
| `contentPath` | ROM path for scoped cleanup |

Tauri command: `get_last_emulator_session` — **not yet surfaced in Logs UI**.

---

## Agent rule

When fixing a Pass B launch/lifecycle bug:

1. Map the fix to an XIO-LCH code in this document.
2. Update `docs/operations/troubleshooting-pass-b.md` if verification steps change.
3. Add a row to `open-work-ledger.md` edge-case table if new.
4. Do **not** add ledger events until explicitly requested after lifecycle retest.
