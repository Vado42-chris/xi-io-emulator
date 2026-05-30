# Master Prompt: Pass B Hardware Proof and Pass C Close

Date: 2026-05-28

## Purpose

This is the full operational prompt for Cursor agents around the current checkpoint.

It tells agents how to stay paused during Pass B, how to interpret the user's hardware proof, how to record a generic wired USB controller, and how to close the controller launch proof milestone in Pass C.

Use this instead of piecemeal chat notes.

## Current state

```txt
Repo: Vado42-chris/xi-io-emulator
Current milestone: XARCADE-CONTROLLER-LAUNCH-PROOF-001
Current active work: Pass B hardware proof, agent-led (user-assisted)
Agent state: Pass B in progress until evidence-backed checklist exists; Pass C blocked until then
```

## First-read sequence

Read these before doing anything:

```txt
README.md
docs/INDEX.md
docs/agent-master-prompt-current-next.md
docs/agent-master-prompt-pass-b-pass-c.md
docs/project-tracking/open-work-ledger.md
docs/roadmap/remaining-work-pass-plan.md
docs/reports/controller-launch-proof-report.md
docs/reports/standardization-audit-report.md
docs/agent-handoff-controller-launch.md
docs/decisions/controller-launch-first-decision.md
docs/decisions/generic-usb-controller-proof-policy.md
docs/decisions/agent-led-pass-b-hardware-proof.md
docs/decisions/non-mutating-local-library-import.md
docs/decisions/library-image-hydration-before-bulk-ingress.md
docs/decisions/rosetta-stone-artwork-identity-resolution.md
docs/decisions/ibal-assistant-and-local-ai-strategy.md
docs/architecture/naming-and-pathing-standard.md
docs/architecture/conversation-decision-backlog.md
projects/manifests/xi_io_emulator.project-manifest.yaml
projects/hydration/xi_io_emulator.hydration-state.yaml
```

## Pass C gate during Pass B

Do not start Pass C until Pass B evidence is complete (evidence-backed checklist).

During Pass B, agents orchestrate local proof. Do not start image hydration, storage, Ibal, or full SNES library work.

If Pass B is blocked (for example missing Tauri deps or pending user sudo/GUI confirmation), report blockers and checklist state. Do not fake completion.

## Pass B is agent-led and user-assisted

Canonical operating model:

```txt
docs/decisions/agent-led-pass-b-hardware-proof.md
```

Agents:

```txt
run commands
capture logs
diagnose blockers
orchestrate proof steps
produce the evidence-backed checklist
```

User assists only with:

```txt
sudo password when prompted
physical controller input when requested
narrow visual confirmation when the agent cannot inspect the emulator GUI directly
```

Agents must not mark Pass B success without evidence. CLI emulator smoke tests alone do not complete Pass B.

## Pass B local commands

Agent runs these; user enters sudo password when prompted:

```bash
sudo apt update

sudo apt install libwebkit2gtk-4.1-dev libsoup-3.0-dev build-essential curl wget file libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev

cd "/path/to/your/015_emulator"
npm run tauri:dev
```

If Tauri needs additional Linux packages, report exact missing package output. Do not guess success.

## Controller hardware reality

The current controller is not a standard SNES controller.

Use this hardware state:

```txt
controller_type: generic USB gamepad
connection_mode: wired USB cable to computer USB port
bluetooth_dongle: present but not currently usable on Linux
proof_mode: wired only
```

This is valid for Pass B.

Do not require SNES-branded hardware.
Do not block Pass B on Bluetooth.
Do not assume known controller vendor/product IDs.
Do not assume RetroArch autoconfig success.

Canonical policy:

```txt
docs/decisions/generic-usb-controller-proof-policy.md
```

## Controller acceptance rule

Pass B controller proof may pass if in-game control works, even if browser/Gamepad API detection is incomplete.

Acceptable example:

```txt
browser_gamepad_api: not_detected
linux_input_device: detected or not_tested
fceux_in_game_input: passed
retroarch_in_game_input: passed
proof_result: acceptable_with_note
```

The product proof is real in-game input through FCEUX and RetroArch.

Browser/app detection is useful but not the sole proof.

## Pass B checklist (agent-produced)

The agent produces this filled checklist after orchestration. Label each GUI item as agent-observed or user-confirmed:

```txt
Pass B hardware proof result

Tauri app opened:
NES proof game registered:
NES launched through FCEUX:
NES controller worked in-game:
SNES proof game registered:
SNES launched through RetroArch:
SNES controller worked in-game:
Mark In-Game Verified clicked:
Any launch blockers shown:
Any terminal errors:
Any emulator config changed intentionally:

Controller used:
Bluetooth dongle status:
Browser/app controller detection:
Linux input device detection:
FCEUX in-game controller:
RetroArch in-game controller:
```

## How to interpret Pass B

### Case 1, full pass

Full pass means:

```txt
Tauri app opened: yes
NES proof game registered: yes
NES launched through FCEUX: yes
NES controller worked in-game: yes
SNES proof game registered: yes
SNES launched through RetroArch: yes
SNES controller worked in-game: yes
Mark In-Game Verified clicked: yes
```

Then Pass C may close XARCADE-CONTROLLER-LAUNCH-PROOF-001 as passed.

### Case 2, partial pass

Partial pass examples:

```txt
NES works, SNES blocked by missing snes9x core
Tauri opens, FCEUX path works, RetroArch Flatpak launch fails
controller works in RetroArch but not FCEUX
browser Gamepad API fails but emulator control works
```

Do not fake completion.

Close only what is proven. Keep the milestone open or create a targeted blocker/fix pass.

### Case 3, Tauri fail

If Tauri app does not open:

```txt
keep milestone pending
record exact terminal output
record missing package or compile/runtime blocker
recommend a targeted Tauri dependency fix pass
```

### Case 4, controller detection mismatch

If FCEUX/RetroArch input works but browser detection fails:

```txt
mark in-game controller proof acceptable with note
create follow-up for browser/app controller detection diagnostics
```

Do not block the entire milestone on browser detection if real emulator input works.

## Pass C task

Only after Pass B evidence-backed checklist exists, run Pass C.

Pass C goal:

```txt
Close or update XARCADE-CONTROLLER-LAUNCH-PROOF-001 honestly based on Pass B results.
```

## Pass C allowed edits

Update only relevant docs/artifacts:

```txt
docs/reports/controller-launch-proof-report.md
docs/project-tracking/open-work-ledger.md
projects/hydration/xi_io_emulator.hydration-state.yaml
projects/manifests/xi_io_emulator.project-manifest.yaml
docs/framework/xi-io-net-sync-status.md
docs/INDEX.md only if current state changes require it
```

If available and in scope, mirror to xi-io.net:

```txt
projects/hydration/xi_io_emulator.hydration-state.yaml
projects/manifests/xi_io_emulator.project-manifest.yaml
```

## Pass C forbidden work

Do not:

```txt
start XARCADE-IMAGE-HYDRATION-001 implementation
start XARCADE-STORAGE-001
scan the full SNES library
implement Ibal
call Ollama
add provider downloads
modify emulator launch behavior unless Pass B reveals a specific bug and user asks for a fix pass
rename or move ROM files
hardcode user source paths in source code
```

## Non-mutating SNES library invariant

The user's full SNES source root is:

```txt
/path/to/your/snes/roms
```

This is local ops context only.

Do not hardcode it into source.
Do not scan it during Pass C.
Do not move, rename, delete, rewrite, patch, or reorganize any ROM files.

Future import is by reference only:

```txt
sourcePath
rawFilename
rawStem
displayTitle
sortTitle
canonicalIdentityCandidate
aliases
tags
artworkMapping
reviewStatus
```

Canonical policy:

```txt
docs/decisions/non-mutating-local-library-import.md
```

## Image hydration gate

Bulk import remains blocked until image hydration exists.

Do not create text-only GameRecords from the full library.

Canonical docs:

```txt
docs/decisions/library-image-hydration-before-bulk-ingress.md
docs/decisions/rosetta-stone-artwork-identity-resolution.md
docs/agent-handoff-image-hydration.md
```

## Ibal gate

Ibal is optional and reserved for a later slice.

Do not implement Ibal in Pass C.
Do not make AI required for core emulator behavior.
Do not call Ollama unless a later Ibal slice explicitly scopes it.

Canonical doc:

```txt
docs/decisions/ibal-assistant-and-local-ai-strategy.md
```

## Quality gates for Pass C

After doc/artifact edits, run:

```bash
npm run typecheck
npm run lint
npm run build
```

If edits are docs-only and the gates were already green, still run them unless the local environment prevents it. Report exact results.

Do not run `cargo check` unless Tauri Linux dependencies are installed. If not run, say why.

## Required Pass C report format

Final response must include:

```txt
Summary
Pass B evidence received (agent-produced checklist)
Interpretation: full pass / partial pass / blocked
Files changed
Commands run
Pass/fail results
Controller proof result
NES proof result
SNES proof result
Tauri status
Milestone state
Hydration/manifest changes
Framework sync changes
Remaining blockers
Next recommended prompt
```

## Milestone close criteria

Mark XARCADE-CONTROLLER-LAUNCH-PROOF-001 complete only if:

```txt
Tauri app opened
NES proof game launched through FCEUX
SNES proof game launched through RetroArch
wired generic USB controller worked in-game, or exact acceptable in-game proof note is documented
Mark In-Game Verified was clicked manually
launch/focus/exit behavior is documented honestly
```

If not all true, do not close the milestone.

## Next slice after successful Pass C

If full pass:

```txt
next_slice: XARCADE-IMAGE-HYDRATION-001
prompt: docs/agent-master-prompt-image-hydration.md
supporting plan: docs/roadmap/remaining-work-pass-plan.md
```

If partial pass:

```txt
next_slice: targeted launch/controller/core-path fix pass
```

## Serialized tags

Use these where appropriate:

```txt
#xar:controller-launch-proof/current
#xio:emulator/controller/generic-usb
#xio:emulator/controller/wired-proof
#xio:emulator/pass-b/agent-led
#adapter:fceux/nes
#adapter:retroarch/snes
#ledger:launch_requested
#ledger:emulator_exited
#risk:bluetooth-driver-gap
#risk:controller-layout-ambiguity
#xio:emulator/storage/non-mutating
```
