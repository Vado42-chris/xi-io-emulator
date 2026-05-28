# UI Review: Emulator Engines Page

Date: 2026-05-28

## Screen reviewed

Emulator Engines page showing missing backend warning, RetroArch binary path, SNES core path, and a visible adapter manifest block.

## Product role

This page translates emulator-engine complexity into user-facing launch readiness. It must make backend setup feel safe and understandable without forcing users to learn raw emulator internals too early.

## What is working

```txt
Missing backend state is visible.
RetroArch and SNES core configuration are separated.
Adapter manifest visibility reinforces the contract-driven architecture.
The page does not pretend launch is ready.
The right rail keeps Launch Readiness marked as not configured.
```

## Main UX issue

This page is currently too developer-facing. It exposes the adapter manifest before it fully explains the user outcome.

The user needs to know:

```txt
What is missing?
Why does it matter?
How do I fix it?
What will become possible after I fix it?
```

## Information architecture recommendation

```txt
Engine Readiness Summary
Required Setup Checklist
RetroArch Path
SNES Core Path
Test Configuration
Advanced Adapter Manifest
Diagnostics
```

The adapter manifest should move behind an Advanced disclosure panel.

## Usability notes

```txt
“Missing Backend Program” is clear but could be friendlier.
“RetroArch Binary Path” and “SNES Core Path” need browse/test actions.
The page should show separate status for installed, configured, tested, and ready.
The user should not have to infer that both paths are required for launch.
```

Better copy:

```txt
RetroArch is not configured yet.
Choose the RetroArch app and SNES core so xi-io Emulator can launch SNES games.
```

## Accessibility notes

```txt
Path fields are small.
The manifest block is very small and should not be primary content.
Error state should use icon plus text, not red alone.
Buttons for Browse and Test should be large enough for couch/admin use.
```

## Controller and cabinet readiness

Engine setup is likely an admin task, but it must still be readable in cabinet mode.

Recommended:

```txt
Use large checklist rows.
Show ready/missing badges.
Provide a controller-friendly “Test Setup” action.
Keep raw manifest behind advanced mode.
```

## No-silent-failure review

Good:

```txt
Missing backend is visible.
Paths show not set.
Adapter contract is visible.
```

Needs improvement:

```txt
No exact recovery action is visible.
No test result timestamp is visible.
No distinction between missing app and missing core is emphasized enough.
No Flatpak/native launch strategy warning is shown.
```

## Recommended fixes

### Priority 1

```txt
Add readiness checklist with three rows: RetroArch, SNES Core, Launch Test.
Add Browse buttons for each path.
Add Test Setup action.
Move adapter manifest into Advanced.
Add friendly explanatory copy.
```

### Priority 2

```txt
Show last checked timestamp.
Show detected version if available later.
Show launch strategy: Native dev mode / Flatpak mode / bundled mode.
```

### Priority 3

```txt
Add multiple engine cards for future DuckStation, PCSX2, Mesen.
Add per-system engine selector.
```

## Acceptance criteria

```txt
User can tell exactly what is missing.
User can tell how to fix each missing item.
Adapter details are available but not visually dominant.
Launch readiness is not implied until tested.
```

## Studio verdict

Architecturally strong, user-facing explanation still too thin. This page should become a setup checklist, not a manifest viewer.
