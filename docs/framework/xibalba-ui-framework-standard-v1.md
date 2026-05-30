# Xibalba UI Framework Standard v1

Date: 2026-05-29
Status: Planning standard
Owner layer: Xibalba / xi-io framework
Initial consumer: xi-io Emulator

## Purpose

This document defines a cross-suite UI framework standard for Xibalba and xi-io products. It is not an emulator-local component cleanup plan. It is the shared standard that should let future agents and developers create new apps, new sites, and new product surfaces with consistent components, tokens, accessibility, provenance, and no-silent-failure behavior.

The standard is informed by the shadcn/ui model: open code, copy-owned components, composable APIs, project configuration, registry/distribution concepts, and documentation that agents can read before generating UI. xi-io should adopt the pattern, not blindly adopt every dependency or visual default.

## Scope

In scope:

```txt
shared design tokens
atomic UI components
domain components
page/application recipes
app adoption profiles
component registry plan
agent-readable component documentation
migration and acceptance gates
```

Out of scope for this document:

```txt
installing Tailwind
running shadcn init
modifying source code
rewriting existing app screens
closing Pass B
starting hydration/storage/bulk scan work
```

## Principles

### 1. Open-code / copy-owned components

xi-io components should be code the project owns, audits, and adapts. Agents should not treat a component package as a black box. A component can be copied from a registry or generated from a template, but once it enters a product, xi-io owns the source.

### 2. Atomic controls before feature screens

Before building another large product surface, create callable primitives:

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
ReadinessChecklist
```

Feature screens should compose these primitives instead of inventing new button, badge, modal, or alert patterns.

### 3. Domain components are explicit

Generic UI components are not enough. Xibalba products need domain components that encode recurring framework patterns:

```txt
EvidencePanel
SourceBadge
LedgerEventRow
TimelineRail
ReadinessChecklist
ProjectStatusCard
GameTile
GameHero
LaunchStatusPanel
EventCard
PrivacyNotice
```

These should sit above atoms and below page recipes.

### 4. Recipes accelerate app/site creation

New products should not start from blank pages. They should start from recipes:

```txt
AdminPageShell
WorkbenchShell
ArticlePageShell
ArcadeShell
EventStreamLayout
GameMicrositePage
TopicMicrositePage
MarketplaceProductPage
EvidenceReviewPage
```

Recipes are not rigid templates. They are tested arrangements of atoms and domain components with known accessibility, layout, and ledger behavior.

### 5. No silent failure

Every user-facing failure state should have:

```txt
plain-language symptom
stable code when possible
subsystem/source
next action
ledger event when relevant
support/runbook link when relevant
```

This is now a suite-wide UI requirement, not an emulator-specific preference.

### 6. Provenance is visible

Any data that is not directly user-authored or locally verified must show provenance. This includes fixture data, mock data, provider candidates, generated fallbacks, imported metadata, and inferred identity.

Allowed labels:

```txt
Local file
User confirmed
Fixture · not live
Demo data
Provider candidate
Generated fallback
Needs review
```

Do not present believable fake data as if it were live product data.

### 7. Local-first and data-sovereignty disclosures are UI-level concerns

If a feature touches user files, personal data, provider APIs, cloud sync, or external metadata, the UI must make the control boundary visible.

Required patterns:

```txt
user-controlled connection prompts
local-only status badges
provider opt-in alerts
export/backup affordances
no-retention copy where applicable
review-before-mutation confirmation
```

### 8. Accessibility is part of the component contract

Components should not require every product screen to reinvent keyboard navigation, focus states, labels, dialog semantics, or ARIA descriptions.

Minimum requirements:

```txt
visible focus state
labelled form controls
keyboard activation for buttons/links
Escape behavior for dialogs/overlays
aria-modal/role dialog where applicable
error text connected to fields where applicable
reduced-motion-compatible transitions
```

### 9. 10-foot / living-room surfaces are first-class

Arcade and media-style apps need larger targets, controller hints, readable density, and focus retention. The framework must support desktop publishing/admin surfaces and 10-foot/gamepad surfaces without forcing one style onto the other.

## Layer model

```txt
Layer 0: tokens
  color, typography, spacing, radius, motion, elevation, state colors

Layer 1: atomic UI
  Button, Badge, Input, Dialog, Alert, Card, Tabs, Select, Toast

Layer 2: domain components
  EvidencePanel, LedgerEventRow, ReadinessChecklist, GameTile, SourceBadge

Layer 3: recipes
  AdminPageShell, ArcadeShell, ArticlePageShell, EventStreamLayout, GameMicrositePage

Layer 4: product pages
  Emulator Engines, xi-io.net Workbench, xi-io.com Topic Page, RealityPools Event Page
```

## Token strategy

Tokens should be shared at the framework layer and adapted per product profile.

Core token groups:

```txt
--xui-color-bg
--xui-color-surface
--xui-color-surface-raised
--xui-color-text
--xui-color-text-muted
--xui-color-accent
--xui-color-success
--xui-color-warning
--xui-color-danger
--xui-radius-sm/md/lg/xl
--xui-space-1..12
--xui-font-body
--xui-font-display
--xui-motion-fast/normal/slow
```

Product profiles may override tokens, but should not fork component APIs.

## Atomic component strategy

P0 components for first implementation:

```txt
Button
Badge
Input
Label
Field
Alert
Dialog
```

P1 components:

```txt
Card
Select
Tabs
Toast
Tooltip
Switch
Checkbox
Progress
EmptyState
```

Each component must document:

```txt
purpose
props
variants
sizes if applicable
accessibility behavior
examples
anti-patterns
migration notes
```

## Domain component strategy

Domain components should be built only when at least two products or two surfaces need the same pattern.

Initial high-value domain components:

```txt
ReadinessChecklist
EvidencePanel
LedgerEventRow
SourceBadge
StatusPill
TimelineRail
GameTile
GameHero
LaunchStatusPanel
ProjectStatusCard
PrivacyNotice
```

## Recipe / page-shell strategy

Recipes should make app creation easier by providing known-good layouts.

Initial recipe targets:

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

Each recipe should specify:

```txt
intended product families
required atoms/domain components
required ledger/source/provenance affordances
keyboard/focus expectations
responsive behavior
known anti-patterns
```

## Agent usage rules

Agents must:

```txt
read docs/framework/xibalba-ui-component-registry-plan-v1.md before creating new UI primitives
prefer existing UI components before adding CSS classes
avoid new inline styles in migrated files
avoid duplicate modal/badge/button systems
label fixtures and provider candidates visibly
add or update catalog docs when a component is added
run typecheck/lint/build before marking implementation complete
```

Agents must not:

```txt
run shadcn init without explicit approval
install Tailwind without explicit approval
turn a product framework pass into a visual redesign
mix unrelated product behavior changes into a UI framework commit
hide mock/demo data as real product content
```

## Relationship to active Pass B work

The xi-io Emulator is currently blocked on Pass B launch/controller proof. This framework standard does not close Pass B, does not authorize Pass C, and does not authorize hydration/storage/bulk ingress.

The first emulator implementation slice should be a child of this standard:

```txt
XIBALBA-UI-FRAMEWORK-001
  └── XARCADE-UI-FRAMEWORK-001
```

## Acceptance gates for framework implementation slices

Every implementation slice must report:

```txt
files changed
components added/migrated
screens migrated
new inline style count
legacy pattern removed or retained
accessibility notes
typecheck/lint/build results
product behavior changes, if any
```

A framework slice is not complete unless it improves reuse without obscuring product state or milestone status.
