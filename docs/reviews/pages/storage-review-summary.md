# UI Review: Storage Page

Date: 2026-05-28

## Screen reviewed

Storage Configuration page with a root field, scan/register action, active volumes area, and empty mapped-directory state.

## Studio assessment

The storage page is structurally correct, but still feels too much like an engineering panel. This screen is one of the product's biggest Linux differentiators, so it needs to become a trust-building storage cockpit.

## What works

```txt
Storage has its own primary navigation item.
The page does not pretend roots are configured.
The empty state is honest.
The right rail reinforces Storage: Not Configured.
```

## Main UX concern

The current screen asks the user to understand Linux paths too early. Production UX should lead with choosing or reconnecting a game folder, then expose raw path editing as advanced behavior.

## Recommended structure

```txt
Storage summary
Choose game folder
Registered library roots
Scan history
Access and permission help
Advanced path entry
```

## Priority fixes

```txt
Add a large Choose Folder action.
Add clear empty-state guidance.
Add visible non-destructive copy: scans do not move files.
Show status cards for connected, unavailable, permission issue, and scan complete.
Show last scan summary when available.
Add reconnect action placeholder.
Add Flatpak access help copy.
Increase text and button sizes for couch readability.
```

## No-silent-failure requirements

```txt
Do not show an empty library when a root is unavailable.
Distinguish unavailable path, permission issue, and not-yet-configured states.
Keep game records when a drive or folder is temporarily unavailable.
Show recovery actions instead of quiet failure.
```

## Acceptance criteria

```txt
User knows what to do when no storage is configured.
User knows scans are non-destructive.
User can see each library root and its status.
User can tell whether a problem is access, missing location, or not configured.
The screen remains readable in cabinet/couch mode.
```

## Verdict

Strong foundation. Needs friendlier action-oriented copy, folder-picker-first UX, and explicit recovery states before it can be considered production-grade.
