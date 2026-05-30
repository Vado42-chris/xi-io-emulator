# Xibalba UI Component Registry Plan v1

Date: 2026-05-29
Status: Planning standard
Parent item: XIBALBA-UI-FRAMEWORK-001

## Purpose

This plan defines how Xibalba / xi-io can distribute reusable UI components, domain components, page recipes, hooks, token profiles, and agent rules across multiple apps without forcing every app to depend on a hidden black-box package.

The model is inspired by shadcn/ui's registry and project configuration ideas: copy-owned source, metadata-driven distribution, predictable paths, and components that agents can request by name.

## Goals

```txt
make new sites faster to create
make UI controls more consistent
make compliance patterns reusable
make agents less likely to invent duplicate primitives
make mock/provider/local provenance visible by default
support both admin/public and 10-foot arcade surfaces
```

## Non-goals

```txt
publishing an npm package immediately
installing Tailwind immediately
requiring all apps to look identical
replacing product-specific domain design
hiding component source from product repos
```

## Registry shape

Future registry root:

```txt
xibalba-ui-registry/
  registry.json
  tokens/
  components/ui/
  components/domain/
  recipes/
  hooks/
  rules/
  profiles/
  docs/
```

Initial repo-only planning can live under `docs/framework/` until a shared repository or xi-io.net-hosted registry exists.

## Registry item format

A registry item should be explicit enough that an agent can copy it safely.

```json
{
  "name": "button",
  "type": "component:ui",
  "version": "1.0.0",
  "status": "stable",
  "description": "Shared xi-io button primitive with variants and sizes.",
  "files": [
    {
      "path": "src/components/ui/Button.tsx",
      "target": "src/components/ui/Button.tsx"
    },
    {
      "path": "src/styles/ui/button.css",
      "target": "src/styles/ui/button.css"
    }
  ],
  "dependencies": [],
  "tokens": ["color", "radius", "motion"],
  "a11y": ["keyboard activation", "visible focus"],
  "provenanceRules": [],
  "examples": ["primary action", "secondary action", "destructive confirmation"],
  "ownerLayer": "xibalba-ui"
}
```

## Item types

```txt
component:ui        atomic controls
component:domain    reusable product/domain patterns
recipe              page shell or composed layout
hook                reusable state/interaction hook
style               token or stylesheet fragment
rule                agent/contributor instruction
profile             app/site adoption profile
```

## Component naming conventions

Atomic components use simple names:

```txt
Button
Badge
Input
Field
Alert
Dialog
Card
Tabs
Select
Toast
Tooltip
Progress
EmptyState
```

Domain components use descriptive framework names:

```txt
ReadinessChecklist
EvidencePanel
LedgerEventRow
SourceBadge
TimelineRail
ProjectStatusCard
GameTile
GameHero
LaunchStatusPanel
PrivacyNotice
```

Recipes use page/shell names:

```txt
AdminPageShell
WorkbenchShell
ArcadeShell
ArticlePageShell
EventStreamLayout
GameMicrositePage
TopicMicrositePage
MarketplaceProductPage
```

## App profile manifest concept

Each app should eventually declare a UI profile.

Example:

```yaml
app_id: xi_io_emulator
surface_family:
  - arcade
  - admin
ui_framework:
  token_profile: xibalba-dark-arcade
  atoms:
    - button
    - badge
    - input
    - field
    - alert
    - dialog
  domain:
    - game-tile
    - readiness-checklist
    - launch-status-panel
  recipes:
    - arcade-shell
    - admin-page-shell
rules:
  no_inline_styles_in_migrated_files: true
  provenance_badges_required: true
  no_silent_failure: true
```

Profile use cases:

```txt
bootstrap a new app
validate component availability
route agents to approved primitives
prevent duplicate systems
explain product-specific token overrides
```

## Agent request format

When an agent wants a UI component, it should say:

```txt
Need: Button
Registry item: component:ui/button
Product: xi-io Emulator
Surface: Admin -> Engines
Variant use: primary, secondary, destructive
Constraints: no new inline styles, current dark token profile
```

Agents should not create a new button/badge/modal pattern unless:

```txt
no registry item exists
or the existing item cannot satisfy the use case
and the gap is documented in the component catalog
```

## Migration rules

### Required

```txt
prefer existing components before creating new CSS classes
migrate one surface at a time
keep product behavior unchanged unless explicitly scoped
preserve local-first and provenance labels
run typecheck/lint/build before completion
update component catalog when adding components
```

### Forbidden by default

```txt
mixing unrelated product behavior changes into framework commits
adding fake/demo data without visible labels
adding a new modal stack when Dialog exists
adding a new badge system when Badge/StatusPill exists
adding inline styles in migrated files
running Tailwind/shadcn init without approval
```

## Acceptance gates for a registry item

A component is ready for registry adoption when:

```txt
source is readable and copy-owned
props/variants are documented
accessibility behavior is documented
usage examples exist
visual tokens are used instead of hardcoded one-offs
component passes local app typecheck/lint/build in first consumer
migration notes identify replaced legacy patterns
```

## Acceptance gates for app adoption

An app adoption slice must report:

```txt
which registry items were adopted
which files changed
which legacy patterns remain
which duplicate patterns were removed
whether behavior changed
whether provenance/no-silent-failure behavior improved
validation commands run
```

## Distribution options

### Phase 1: docs + copy-owned local components

First consumer creates local components under `src/components/ui/` and documents them. Other apps can copy manually from the first consumer until the registry exists.

### Phase 2: shared registry repository

Create a dedicated repository or xi-io.net-managed registry that contains registry metadata and source templates.

### Phase 3: internal CLI or agent command

A future helper can copy approved components into product repos, similar to a registry add command.

Possible command shape:

```bash
xio-ui add button alert field --profile xi_io_emulator
xio-ui recipe add admin-page-shell --profile xi_io_net
```

This is future work; do not implement it during XIBALBA-UI-FRAMEWORK-001 planning.

## Bootstrap pattern for new apps/sites

A new app should start with:

```txt
1. app profile manifest
2. docs/INDEX.md
3. project-tracking/open-work-ledger.md
4. token profile
5. P0 atoms
6. one recipe/page shell
7. no-silent-failure policy
8. provenance rules
9. validation commands
```

This should reduce new-app setup from bespoke UI decisions to a checklist.

## Relationship to shadcn/ui

Adopt:

```txt
copy-owned/open-code philosophy
component registry concept
small composable APIs
variant-based primitives
project config/profile idea
AI-readable component conventions
```

Do not blindly adopt:

```txt
visual defaults
Tailwind requirement
all dependencies
all component categories at once
```

## First implementation slice recommendation

```txt
XIBALBA-UI-FRAMEWORK-001
  docs/framework/xibalba-ui-framework-standard-v1.md
  docs/framework/xibalba-ui-adoption-matrix-v1.md
  docs/framework/xibalba-ui-component-registry-plan-v1.md

XARCADE-UI-FRAMEWORK-001
  first consumer
  clean branch
  Admin -> Engines migration
  Button/Badge/Input/Field/Alert/Dialog P0 atoms
```

## Open decisions

```txt
Will the registry live in xi-io.net, a dedicated xibalba-ui repo, or each app repo first?
Will Tailwind be adopted later, or will CSS variables/modules remain the foundation?
Should components be distributed by CLI, Git subtree, package workspace, or manual copy-owned import?
What is the minimum accessibility gate for v1 Dialog/Select/Toast?
Which product becomes second consumer after xi-io Emulator: xi-io.net or xi-io.com?
```
