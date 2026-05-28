# Decision: Ibal Assistant and Local AI Strategy

Date: 2026-05-28

## Purpose

xi-io Emulator will eventually benefit from Ibal as an assistant/conductor layer for library cleanup, artwork matching, launch help, accessibility, voice/text input, and user-guided automation.

This document defines how to add Ibal without making the emulator dependent on AI.

## Decision

Add Ibal as an optional assistant/conductor layer, not as a required runtime dependency.

The core emulator shell must work without Ibal:

```txt
launch games
configure engines
detect controllers
scan libraries
match local artwork
show review queues
rename user-facing titles
```

Ibal may enhance these workflows, but must not be required for them.

## Product role

Ibal should act as:

```txt
library conductor
metadata cleanup assistant
artwork match reviewer
settings helper
launch troubleshooting guide
controller-friendly command layer
accessibility helper
optional local AI bridge
```

Ibal should not act as:

```txt
silent bulk editor
unreviewed renamer
remote-data dependency
provider credential holder by default
a reason to block offline/local-first use
```

## Recommended timing

Do not implement full Ibal during Pass B, Pass C, or the first image hydration implementation.

Instead, reserve contracts and UI slots now:

```txt
XARCADE-IBAL-SLOT-001
  Add assistant slot, command palette contract, and local AI readiness detection.

XARCADE-IMAGE-HYDRATION-001
  Implement deterministic identity/artwork matching first.

XARCADE-IBAL-LIBRARY-CLEANUP-001
  Add Ibal-assisted review suggestions after deterministic matching exists.
```

## Why not first

Artwork matching needs deterministic Rosetta identity resolution first. AI should explain, suggest, and rank candidates, not invent truth.

The correct order is:

```txt
1. Deterministic identity resolution
2. Local artwork candidate scoring
3. Generated fallback art
4. Review queue
5. Ibal suggestions over the review queue
6. User-confirmed cleanup actions
```

## Allowed Ibal actions

Ibal may suggest or help execute reviewed actions:

```txt
launch selected game
open engine setup for blocker
explain why launch is blocked
suggest cleaned display title
suggest sort title
suggest artwork candidate
explain confidence score
find duplicate candidates
prepare rename plan
apply user-approved display-title cleanup
apply user-approved artwork override
open controller test
open storage reconnect screen
```

## Actions requiring explicit user confirmation

```txt
rename file on disk
move file
delete file
write sidecar metadata
overwrite artwork
change emulator config
download provider images
run bulk cleanup
```

## Naming policy

Ibal should distinguish:

```txt
file name on disk
user-facing display title
sort title
canonical identity candidate
alias list
manual override
```

Default cleanup should change display metadata, not physical filenames.

Physical file rename must be a separate explicit action with preview and rollback notes.

## Local AI strategy

Support a local AI adapter, with Ollama as the first practical target.

Use local AI only when the user explicitly enables it.

Expected local endpoint:

```txt
http://localhost:11434
```

The app should detect availability, list models if possible, and allow a user-selected model.

If Ollama is not installed, show setup guidance and official links/instructions, but do not install automatically without explicit user action.

## AI provider contract

Create a provider-agnostic assistant adapter contract:

```ts
type AssistantProvider = {
  id: string;
  displayName: string;
  kind: 'local_ollama' | 'openai_compatible' | 'disabled';
  endpoint?: string;
  model?: string;
  status: 'disabled' | 'available' | 'unavailable' | 'misconfigured';
};
```

Assistant requests should be structured and bounded:

```txt
input: raw filename, normalized tokens, candidate artwork list, current game record
output: JSON suggestions only
no direct writes
no unbounded filesystem access
```

## Suggested Ibal tasks for image hydration

```txt
Suggest title cleanup
Suggest sort title
Explain mismatch risk
Rank artwork candidates
Identify likely duplicate variants
Flag hack/translation/prototype ambiguity
Generate human-readable review notes
```

Ibal must return suggestions with confidence and reasons.

## Screen keyboard and voice input

A controller-friendly text input layer is valuable and should be designed early.

### Screen keyboard

Recommended for MVP assistant input:

```txt
controller-navigable on-screen keyboard
search/command palette mode
recent commands
quick phrases
edit display title
edit sort title
confirm/cancel flow
```

This is more reliable than voice and should come first.

### Microphone / voice

Voice input should be optional and explicit.

Use cases:

```txt
ask Ibal to find a game
ask why launch is blocked
ask for cleanup suggestions
voice search in library
```

Guardrails:

```txt
push-to-talk only
clear recording indicator
no always-listening mode by default
local speech path preferred
cloud speech requires explicit provider consent
```

Voice chat is a later feature and should not be confused with voice commands.

## Input modes

Ibal should support:

```txt
controller command palette
on-screen keyboard
physical keyboard
mouse
optional push-to-talk mic
future companion/mobile input
```

## UI placement

Arcade Mode:

```txt
Start / Menu opens command layer
Ibal appears as bottom or side assistant panel
controller hints include Ask Ibal / Search / Explain blocker
```

Admin Mode:

```txt
Ibal review panel beside artwork/metadata/storage issues
batch suggestions shown as reviewable queue
```

## No-silent-write rule

Ibal may generate suggestions, but all writes must go through explicit user approval and ledger events.

Required ledger examples:

```txt
#ledger:ibal_suggestion_generated
#ledger:ibal_action_approved
#ledger:ibal_action_rejected
#ledger:display_title_updated
#ledger:artwork_override_selected
#ledger:file_rename_requested
#ledger:file_rename_completed
#ledger:file_rename_failed
```

## Serialized tags

```txt
#xio:emulator/ibal/optional
#xio:emulator/local-ai/ollama
#xio:emulator/assistant/conductor
#xar:ibal-slot/future
#risk:ai-silent-write
#risk:voice-privacy
#todo:assistant/provider-contract
```

## Decision summary

Yes, add Ibal.

Do it as a reserved assistant/conductor layer with local-first AI support and strict user-approval gates.

Do not make Ibal a prerequisite for launch proof, image hydration, or storage hydration.

The safest path is deterministic Rosetta matching first, Ibal-assisted review second.
