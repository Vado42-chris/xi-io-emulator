# Decision: Controller and Launch First Before Bulk Hydration

Date: 2026-05-28

## Context

A local controller is already connected and working with FCEUX for NES emulation. FCEUX is currently open and running the user's Nintendo library. The product plan still includes SNES through RetroArch as an early target, but controller and launch proof must be validated before large local library hydration.

## Decision

Choose the minimal dual proof path:

```txt
One NES game via FCEUX
One SNES game via RetroArch
```

This corresponds to Cursor planning option C:

```txt
Both minimally — one NES game via FCEUX and one SNES game via RetroArch before bulk library hydration.
```

## Rationale

The goal is not to fully support NES before SNES or to fully support SNES before NES. The goal is to prove the adapter boundary and the controller/launch loop before ingesting a large local library.

A minimal dual proof validates:

```txt
controller works in at least one known-good emulator path
controller assumptions can be represented in xi-io Emulator
launch command abstraction can support more than one engine
NES/FCEUX can be represented without derailing SNES/RetroArch
SNES/RetroArch remains on the original MVP path
bulk hydration does not happen before launch readiness is real
```

## Guardrails

```txt
Do not bulk hydrate the user's full game library yet.
Do not build complete NES support yet.
Do not build complete SNES support yet.
Do not start artwork/provider hydration yet.
Do not start PS1/PS2 work yet.
Do not fake controller success inside xi-io Emulator.
Do not mutate emulator configs unless explicitly approved.
```

## Required proof

### FCEUX NES proof

```txt
Register one NES test game.
Register FCEUX as a temporary/early engine adapter.
Launch the NES test game through xi-io Emulator or document the exact command needed.
Confirm controller works in-game using the existing local FCEUX setup.
Log launch attempt and result.
```

### RetroArch SNES proof

```txt
Register one SNES test game.
Register RetroArch binary path.
Register SNES core path.
Build readiness blockers if missing.
Launch the SNES test game only after engine/core readiness is satisfied.
Confirm controller works in-game or document exact blocker.
Log launch attempt and result.
```

## Acceptance criteria

```txt
At least one NES game can be represented as launchable through FCEUX or has exact blockers.
At least one SNES game can be represented as launchable through RetroArch or has exact blockers.
Controller behavior is verified, not assumed.
Both launch paths use adapter-style contracts rather than hardcoded UI hacks.
The UI keeps Arcade Mode first and Admin Mode for setup.
Bulk library hydration remains deferred.
Quality gates pass: typecheck, lint, build.
```

## Next recommended slice

```txt
XARCADE-LAUNCH-PROOF-001
  Minimal dual launch proof: NES via FCEUX and SNES via RetroArch.
```
