# XIBALBA-UI-FRAMEWORK-001 Ledger Note

Date: 2026-05-29
Status: docs-only planning pass
Branch: docs/xibalba-ui-framework-001

## Purpose

This ledger note records the cross-suite UI framework planning item without modifying application source code or current Pass B lifecycle work.

## Work item

```txt
XIBALBA-UI-FRAMEWORK-001 — cross-suite UI framework standard
```

## Canonical docs

```txt
docs/framework/xibalba-ui-framework-standard-v1.md
docs/framework/xibalba-ui-adoption-matrix-v1.md
docs/framework/xibalba-ui-component-registry-plan-v1.md
```

## Decision

Use the shadcn/ui model as a reference pattern for:

```txt
open-code components
copy-owned implementation
registry-style distribution
composable component APIs
shared tokens
AI-readable component documentation
```

Do not blindly install Tailwind or run shadcn init during this planning pass.

## Relationship to emulator work

```txt
XIBALBA-UI-FRAMEWORK-001
  parent suite-level framework standard

XARCADE-UI-FRAMEWORK-001
  first app-specific consumer in xi-io Emulator
```

The emulator implementation slice must remain isolated from dirty Pass B lifecycle/display/shell work.

## Target consumers

```txt
xi-io-emulator
xi-io.net
xi-io.com
realitypools.tv
AFG
screen_scraper
future xi-io apps/sites
```

## Guardrails

```txt
No source code changes in this planning pass.
No Pass B closure.
No Pass C.
No hydration or storage work.
No platform engine implementation.
No game microsite implementation.
No full library scan.
```

## Recommended next step

After this docs-only branch is reviewed, Cursor should implement `XARCADE-UI-FRAMEWORK-001` on a clean framework branch with:

```txt
P0 atoms: Button, Badge, Input, Label, Field, Alert, Dialog
first surface: Admin -> Engines
no Tailwind/shadcn init yet
no source mixing with Pass B lifecycle WIP
```
