# UI Review: Logs Page

Date: 2026-05-28

## Screen reviewed

Event Ledger & Logs page showing a terminal-style list of recent events with status colors, timestamps, codes, and short messages.

## Product role

Logs are a core Xibalba differentiator. They prove the no-silent-failure rule and help users, agents, and future support workflows understand what happened.

## What is working

```txt
The terminal-style presentation fits the technical cockpit tone.
Events are timestamped.
Event codes are visible.
Success and error states are distinguishable.
Missing paths are explicitly logged.
Refresh Logs action is available.
The page reinforces local-first, auditable behavior.
```

## Main UX issue

The logs page is currently useful for developers but not yet helpful enough for regular users.

Users need two layers:

```txt
Human summary:
  What needs attention?
  What should I do next?

Technical details:
  Exact event codes, paths, adapter details, debug traces.
```

Right now the technical layer is visible, but the human layer is weak.

## Information architecture recommendation

```txt
Health Summary
  Storage issues
  Engine issues
  Controller issues
  Last launch result

Event Ledger
  Filterable technical events

Diagnostic Details
  Expanded selected event
```

## Usability notes

```txt
The log area is readable as a terminal, but not browsable as a product UI.
There are no filters by severity or subsystem.
There is no clear “what to fix first” summary.
The refresh action is useful but not enough.
```

Recommended filters:

```txt
All
Errors
Warnings
Storage
Games
Engines
Controllers
Launch
Settings
```

## Accessibility notes

```txt
Small monospaced text is hard to read at TV distance.
Color must not be the only indicator of severity.
Event codes should have readable labels or tooltips.
Keyboard/controller focus for log rows should be visible.
```

## Controller and cabinet readiness

In cabinet mode, logs should not look like a dense terminal by default.

Recommended cabinet view:

```txt
3 issues need attention
Storage not configured
RetroArch path missing
Controller not configured
```

Then allow an advanced details view.

## No-silent-failure review

Strong:

```txt
The page directly supports no-silent-failure.
Failed and missing configuration states are visible.
Events are recorded rather than swallowed.
```

Needs improvement:

```txt
Errors need recovery actions.
Log events need severity filtering.
Repeated events should be groupable.
User-facing explanations should accompany technical codes.
```

## Recommended fixes

### Priority 1

```txt
Add severity and subsystem filters.
Add Health Summary cards above logs.
Add recovery action text for common errors.
Increase log font size or provide compact/comfortable toggle.
```

### Priority 2

```txt
Add selected event detail panel.
Add copy diagnostic button.
Add export logs action.
Add grouping for repeated events.
```

### Priority 3

```txt
Add timeline view.
Add agent-readable structured export.
Add session grouping by app launch or game launch.
```

## Acceptance criteria

```txt
A non-technical user can identify what needs attention.
A technical user can still inspect exact event data.
Errors include recovery direction.
Logs are filterable by severity and subsystem.
No-silent-failure principle is visible and useful.
```

## Studio verdict

Strong foundation for the Xibalba ledger identity. Needs a human diagnostic layer above the raw event stream to become production quality.
