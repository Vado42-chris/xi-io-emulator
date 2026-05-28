# Serialized Hashtags Standard

Date: 2026-05-28

## Purpose

xi-io projects use serialized hashtags to make comments, TODOs, docs, ledger events, and agent work easier to search, group, and reconcile across repositories.

This document defines the xi-io Emulator local standard.

## Format

Use compact, structured hashtags in comments and docs:

```txt
#xio:<domain>/<topic>/<state>
#xar:<milestone>/<slice>/<state>
#ledger:<event-name>
#adapter:<engine>/<system>
#ux:<surface>/<concern>
#risk:<category>
#todo:<scope>/<action>
```

Examples:

```txt
#xio:emulator/controller/proof
#xar:controller-launch-proof/tauri/pending
#ledger:launch_started
#adapter:fceux/nes
#adapter:retroarch/snes
#ux:arcade-home/focus-state
#risk:flatpak/filesystem-access
#todo:storage/reconnect-flow
```

## Code comment examples

```ts
// #xar:controller-launch-proof/launch/active
// Build the launch command from adapter state. Do not hardcode private paths.
```

```ts
// #ledger:launch_blocked
// Emit when a proof game cannot launch because engine/core/content path is missing.
```

```ts
// #risk:flatpak/filesystem-access
// Folder access may fail in Flatpak until selected through a portal or granted by override.
```

## Documentation examples

```md
## Current blocker #xar:controller-launch-proof/tauri/blocked

Tauri process spawn is not wired yet, so launch remains simulated.
```

## Required milestone tags

Current milestone:

```txt
#xar:controller-launch-proof/current
#xio:emulator/controller/proof
#xio:emulator/launch/proof
```

Future relevant tags:

```txt
#xar:storage-ingress/future
#xar:arcade-home/pivot
#xar:image-hydration/planning
#xar:image-hydration/rosetta
#xar:ibal-slot/future
#xio:emulator/artwork/local-first
#xio:emulator/hydration/images
#xio:emulator/identity-resolution
#xio:emulator/ibal/optional
#xio:emulator/local-ai/ollama
#xio:emulator/pathing/standard
#xio:emulator/naming/standard
#xio:emulator/media-extension/future
#xio:emulator/flatpak/storage
#xio:emulator/cheats/future
#xio:emulator/patches/future
#risk:path-drift
#risk:private-path-leak
#risk:rom-name-chaos
#risk:artwork-mismatch
#todo:storage/image-mapping-before-bulk
```

## Ledger event tags

When code references ledger events, prefer matching hashtags:

```txt
#ledger:controller_detected
#ledger:controller_test_started
#ledger:controller_test_completed
#ledger:launch_requested
#ledger:launch_blocked
#ledger:launch_started
#ledger:launch_failed
#ledger:emulator_exited
#ledger:shell_focus_restored
#ledger:shell_focus_restore_failed
```

## Comment policy

Use serialized hashtags for:

```txt
non-obvious architecture choices
TODOs that future agents need to find
known risks
ledger event references
adapter-specific implementation notes
Flatpak/platform caveats
temporary demo/proof code
```

Do not over-tag every obvious line of code.

## Search policy

Agents should search these tags before changing related areas:

```txt
#xar:controller-launch-proof
#adapter:fceux/nes
#adapter:retroarch/snes
#risk:flatpak
#ledger:launch
#todo:
```

## Framework alignment

The serialized hashtag system is part of the xi-io lexicon/ledger strategy. It helps the framework repo, workbench, and future agents reconcile implementation state without relying on chat history.
