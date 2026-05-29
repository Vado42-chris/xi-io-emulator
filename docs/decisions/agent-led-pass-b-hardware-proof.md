# Decision: Agent-Led Pass B Hardware Proof

Date: 2026-05-29

## Purpose

Clarify how **Pass B** (local Tauri hardware proof for `XARCADE-CONTROLLER-LAUNCH-PROOF-001`) is executed when older docs described Pass B as fully "user-owned."

## Decision

Pass B is **agent-led and user-assisted**.

```txt
Cursor agents:
  run commands
  capture logs
  diagnose blockers
  orchestrate proof steps
  produce evidence-backed checklist

User supplies only:
  sudo password when prompted
  physical controller input when requested
  narrow visual confirmation when agent cannot inspect emulator GUI directly
```

## Evidence rules

```txt
Cursor must not mark Pass B success without evidence.
CLI emulator smoke tests alone do not complete Pass B.
Pass B requires xi-io Tauri app launch and proof games launched through the shell (not CLI only).
Mark In-Game Verified must be observed or user-confirmed.
If browser Gamepad API fails but FCEUX/RetroArch in-game input works, record acceptable_with_note per generic-usb-controller-proof-policy.
```

## Out of scope for Pass B

```txt
OpenAI API keys
Codex setup
MCP server implementation
XARCADE-IMAGE-HYDRATION-001
XARCADE-STORAGE-001
XARCADE-IBAL-SLOT-001
provider image downloads
full SNES library scan
bulk import
Pass C (until Pass B evidence is reviewed)
```

## Supersedes

Any doc that states Pass B is exclusively user-owned without agent orchestration. Those docs should be read in light of this decision.

## Canonical operational prompt

```txt
docs/agent-master-prompt-pass-b-pass-c.md
```

## Serialized tags

```txt
#xar:controller-launch-proof/pass-b
#xio:emulator/controller/generic-usb
#xio:emulator/controller/wired-proof
#xio:emulator/pass-b/agent-led
```
