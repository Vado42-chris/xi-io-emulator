# UI Review: Controllers Page

Date: 2026-05-28

## Screen reviewed

Controllers page showing centered empty state: no controller connected, explanatory copy, and two actions, Start Visual Test and Define Shell Profile. Right-side system/status rail remains visible.

## Product role

This page is one of the core differentiators for xi-io Emulator. Linux controller support is a known pain point, so this page must become trustworthy, friendly, and visually guided.

## What is working

```txt
The empty state is honest and does not pretend a controller exists.
The page explains controller mapping is for shell and virtual console inputs.
The two primary actions point toward the correct future workflows.
The centered layout keeps attention on the missing hardware state.
```

## Main UX issue

The page is too empty for such an important product feature.

A user who lands here should understand:

```txt
What controller support means.
What to plug in.
What will happen after detection.
How shell navigation differs from in-game mapping.
What the next step is if the controller is already plugged in but not detected.
```

Currently the page says no controller is connected but does not give enough recovery paths.

## Information architecture notes

Recommended page structure:

```txt
Header
Detected Controllers section
Setup Journey section
Troubleshooting section
Profiles section
Future Visual Mapper preview
```

The current centered empty state can stay, but it should be surrounded by more guidance.

## Usability notes

```txt
“Start Visual Test” sounds active but may confuse users if no controller is connected.
“Define Shell Profile” is technical and should be reframed for users.
The page should distinguish controller detection from controller mapping.
There should be a “Refresh devices” action.
There should be a “What if my controller is not detected?” link or panel.
```

Better button labels:

```txt
Test Connected Controller
Set Up Shell Controls
Refresh Devices
Troubleshoot Linux Controller Access
```

## Accessibility notes

```txt
Centered small text may be difficult at TV distance.
Buttons need larger target sizes for couch and controller use.
The no-controller icon is small and low-emphasis.
The page needs clear keyboard focus and future controller focus states.
```

## Controller and cabinet readiness

This page should eventually be fully controller-navigable, but the first-run paradox is that the controller may not work yet.

Therefore it needs dual-mode setup:

```txt
Keyboard/mouse setup path
Controller detected path
Fallback troubleshooting path
```

Cabinet users may have arcade controls wired through encoders. The UI should avoid assuming only Xbox/PlayStation-style controllers.

Future supported device labels:

```txt
Gamepad
Arcade stick
Keyboard encoder
Bluetooth controller
Unknown input device
```

## Engagement notes

Controller mapping can be a delightful product moment if visualized well.

Recommended future visual preview:

```txt
Your Controller -> SNES Controller
Press the highlighted button
Mapping confidence: Known / Partial / Unknown
```

Even before implementation, show a small preview card explaining that this is coming.

## No-silent-failure review

Good:

```txt
No controller is clearly stated.
Controller integration is shown as not configured in the right rail.
```

Needs improvement:

```txt
No diagnostic reason is shown.
No permission/sandbox warning is shown.
No Linux/Flatpak controller access guidance is shown.
No refresh/rescan action is present.
```

## Recommended fixes

### Priority 1

```txt
Add Refresh Devices action.
Add troubleshooting panel for Bluetooth, USB, Flatpak permissions, and /dev/input access.
Rename Define Shell Profile to Set Up Shell Controls.
Disable or explain Start Visual Test when no controller is detected.
Increase empty-state text size.
```

### Priority 2

```txt
Add profile cards: Shell Navigation, SNES Controller, Future PS1/PS2.
Add visual mapper preview area.
Add mapping confidence legend.
Add supported device type copy.
```

### Priority 3

```txt
Add controller setup wizard.
Add device test visualization.
Add controller glyphs and animated button prompts.
```

## Acceptance criteria for polish patch

```txt
User understands what to do if no controller is detected.
User understands shell controls versus in-game controls.
Troubleshooting path exists for Linux/Flatpak/device access.
Primary actions are not misleading when no controller exists.
Page remains useful before controller detection is implemented.
```

## Studio verdict

The empty state is honest, but this page needs to become more educational, reassuring, and diagnostic. It is a major product differentiator and should feel more guided than a blank placeholder.
