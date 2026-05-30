# Conversation Decision Backlog

Date: 2026-05-28

## Purpose

This document captures product and architecture decisions that originated in planning conversation and must not remain trapped in chat history.

Agents should consult this file before changing slice order, hydration behavior, assistant behavior, or pathing.

## Current locked sequence

```txt
Pass B: local hardware proof with two hand-picked games
Pass C: close controller launch proof milestone docs and framework sync
XARCADE-IMAGE-HYDRATION-001: Rosetta + local artwork + fallback + review state
XARCADE-IBAL-SLOT-001: optional assistant slot and command palette contract
XARCADE-STORAGE-001: bulk library ingress with visual identity support
```

## Decision 001, bulk hydration must include images

Bulk hydration must not import text-only game records.

It must include:

```txt
raw ROM path preservation
identity normalization
local artwork candidate matching
RetroArch thumbnail compatibility
generated fallback art
confidence/review state
manual override path
```

Canonical docs:

```txt
docs/decisions/library-image-hydration-before-bulk-ingress.md
docs/agent-handoff-image-hydration.md
```

Tags:

```txt
#xar:image-hydration/planning
#xio:emulator/hydration/images
#todo:storage/image-mapping-before-bulk
```

## Decision 002, Rosetta identity resolution is required

Exact ROM filename matching is not enough.

The app must preserve raw filenames and derive multiple identity keys for:

```txt
articles
punctuation
region
revision
language
hack/translation/prototype/demo markers
aliases
local manual corrections
```

Canonical doc:

```txt
docs/decisions/rosetta-stone-artwork-identity-resolution.md
```

Tags:

```txt
#xar:image-hydration/rosetta
#xio:emulator/identity-resolution
#risk:rom-name-chaos
#risk:artwork-mismatch
```

## Decision 003, Ibal belongs as optional conductor

Ibal should be included as a future optional assistant/conductor layer.

It must not be required for:

```txt
launching games
controller proof
storage scanning
local artwork matching
basic library cleanup
```

Ibal may help with:

```txt
explaining blockers
suggesting display-title cleanup
ranking artwork candidates
opening setup screens
preparing reviewable rename plans
controller-friendly command palette
```

Canonical doc:

```txt
docs/decisions/ibal-assistant-and-local-ai-strategy.md
```

Tags:

```txt
#xio:emulator/ibal/optional
#xio:emulator/local-ai/ollama
#risk:ai-silent-write
#risk:voice-privacy
```

## Decision 004, screen keyboard before voice

Controller-first text input is required before reliable voice input.

Recommended order:

```txt
controller command palette
on-screen keyboard
quick phrases / recent commands
optional local voice commands later
voice chat much later
```

Voice must be:

```txt
push-to-talk only
clearly indicated
never always-listening by default
local-first where practical
cloud speech only with explicit consent
```

Canonical doc:

```txt
docs/decisions/ibal-assistant-and-local-ai-strategy.md
```

## Decision 005, Ollama is preferred first local AI target

Ollama should be detected locally if enabled by the user.

Expected endpoint:

```txt
http://localhost:11434
```

The app may provide setup links/instructions, but must not auto-install Ollama or require it.

Canonical doc:

```txt
docs/decisions/ibal-assistant-and-local-ai-strategy.md
```

## Decision 006, pathing and naming must be standardized before more implementation

Before further large implementation slices, agents must audit:

```txt
directory naming
service naming
component placement
artifact placement
private path leakage
sample/demo paths
framework sync artifacts
```

Canonical doc:

```txt
docs/architecture/naming-and-pathing-standard.md
```

Tags:

```txt
#xio:emulator/pathing/standard
#risk:path-drift
#risk:private-path-leak
```

## Decision 007, media platform extension remains future sibling track

The Stremio/Kodi/media-provider pattern is valuable, but not part of current emulator implementation.

The emulator shell should preserve reusable 10-foot UI primitives and provider architecture that could later support media.

Canonical doc:

```txt
docs/future/media-platform-extension-track.md
```

Tags:

```txt
#xio:emulator/media-extension/future
```

## Decision 008, pre-release hardening gates bulk hydration

Before bulk library hydration or public beta, four milestones must complete or be explicitly deferred with date:

```txt
PRH-01 SQLite play/session data
PRH-02 shell_focus_restore_failed ledger
PRH-03 commit + push + xi-io.net mirror
PRH-04 Pass B closeout + peer review
```

Canonical tracker:

```txt
docs/project-tracking/pre-release-hardening-milestones.md
docs/project-tracking/master-plan-2026-05.md (Phase 1D)
```

Tags:

```txt
#xio:emulator/pre-release/hardening
#xio:emulator/milestone/XARCADE-PRE-RELEASE-HARDENING-001
```

## Decision 009, xi-io.net as security policy hub (not monolith)

Framework security rules live on xi-io.net and propagate to product repos by manifest SHA and evidence mirror — not by copying secrets or auto-patching without review.

Canonical doc:

```txt
docs/security/supply-chain-security-baseline.md
```

Product repos run `npm run verify:deps` before merge.

Tags:

```txt
#xio:framework/security/baseline
#xio:emulator/supply-chain
```

## Decision 010, shell resume vs in-game save state are separate milestones

Returning to the same game **tile** after exit is not the same as resuming **in-game progress**.

```txt
XARCADE-NAV-SNAPSHOT-001 — browse UI snapshot on exit
XARCADE-SAVE-STATE-001 — engine save files + Continue on card
XARCADE-QUICK-RESUME-001 — suspend without exit (deferred)
```

Do not fold these into PRH-01 SQLite work without updating the pre-release tracker.

Tags:

```txt
#xio:emulator/resume/navigation
#xio:emulator/resume/save-state
```

## Open risks

```txt
local user libraries may have inconsistent ROM names
artwork folders may use different title conventions than ROMs
RetroArch Flatpak paths may differ by system
SNES core availability may differ from expected snes9x core
user-selected paths must not be committed as source constants
Ibal suggestions must never silently write changes
```

## Agent rule

If a future agent discovers a new planning decision in conversation, it must add either:

```txt
docs/decisions/<decision-name>.md
```

or append here before coding.
