# Xibalba UI Adoption Matrix v1

Date: 2026-05-29
Status: Planning standard
Parent item: XIBALBA-UI-FRAMEWORK-001

## Purpose

This matrix maps the shared Xibalba UI framework across current and future xi-io products. It is meant to prevent each app from reinventing buttons, badges, forms, status panels, evidence rails, timelines, filters, and page shells.

The goal is faster app creation, better compliance, more consistent UX, and easier agent implementation.

## Adoption model

Each product should adopt the framework in layers:

```txt
1. Tokens
2. Atomic components
3. Domain components
4. Recipes/page shells
5. Product-specific surfaces
```

Do not force every product to adopt every component at once. Start with the safest surface that reduces duplication without changing core behavior.

## Suite adoption summary

| Product | Role | First safe migration target | Priority |
|---|---|---|---|
| xi-io Emulator | Arcade/media shell and proof app | Admin -> Engines UI primitives | High |
| xi-io.net | Control plane / workbench | Project status and validation panels | High |
| xi-io.com | Public portfolio / structured-news site | Article/event/source components | High |
| RealityPools | Event/media intelligence app | Event stream + entity microsite recipes | Medium-high |
| AFG | Local-first field guide / journal | Field, Alert, PrivacyNotice, StateSnapshotCard | Medium |
| screen_scraper | Co-op AI word processor / ingestion processor | Document ingress, evidence, review queue UI | Medium |
| future xi-io apps | New product factory | App profile + recipe bootstrap | High |

## xi-io Emulator

### Surfaces

```txt
Arcade Home
Admin Library
Admin Storage
Admin Engines
Admin Controllers
Admin Settings
Admin Logs
Game Detail / future Game Microsite
Launch overlay
Display picker
Controller setup
```

### Needed atomic components

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

### Needed domain components

```txt
GameTile
GameHero
LaunchStatusPanel
ReadinessChecklist
ControllerStatusPanel
EngineStatusCard
LedgerEventRow
SourceBadge
```

### Needed recipes

```txt
ArcadeShell
AdminPageShell
GameMicrositePage
EvidenceReviewPage
```

### Current drift risk

```txt
large feature files
monolithic stylesheet
multiple badge systems
multiple modal systems
inline style sprawl
mock/demo data can look real
launch blockers not consistently standardized
```

### First safe migration target

```txt
Admin -> Engines
```

Reason: high repetition of buttons, inputs, labels, alerts, validation states, and proof-path copy. It can validate the UI primitive API without touching Arcade launch behavior.

### Adoption priority

High. Emulator is the first implementation consumer, but not the governance source of truth.

## xi-io.net

### Surfaces

```txt
Workbench dashboard
Project registry
Hydration state panels
Validation gates
Drift/status streams
Evidence timeline
Agent handoff console
Framework sync pages
```

### Needed atomic components

```txt
Button
Badge
Alert
Card
Tabs
Select
Input
Toast
Progress
Table/List primitives
```

### Needed domain components

```txt
ProjectStatusCard
ValidationGatePanel
LedgerEventRow
EvidencePanel
ReadinessChecklist
RepoDriftIndicator
FrameworkSyncStatus
AgentHandoffCard
```

### Needed recipes

```txt
WorkbenchShell
AdminPageShell
EventStreamLayout
EvidenceReviewPage
```

### Current drift risk

```txt
workbench patterns may diverge from emulator proof/ledger patterns
framework sync status may be documented but not visible enough
agents may lose milestone truth if dashboard and repo docs disagree
```

### First safe migration target

```txt
Project status / validation gate panel
```

Reason: control-plane consistency matters before more products are registered.

### Adoption priority

High. xi-io.net should eventually become the governance consumer and standard visibility layer.

## xi-io.com

### Surfaces

```txt
Public home
Product gateways
Articles/explainers
Topic microsites
Event/date pages
Source/evidence panels
Marketplace/software catalogue
About/public accountability branch
```

### Needed atomic components

```txt
Button
Badge
Card
Alert
Tabs
Input
Select
Tooltip
Toast
```

### Needed domain components

```txt
ArticleCard
EventCard
SourceBadge
EvidencePanel
TimelineRail
TopicHero
ProductGatewayCard
PublicAccountabilityPanel
```

### Needed recipes

```txt
ArticlePageShell
TopicMicrositePage
MarketplaceProductPage
EventStreamLayout
PublicAboutPageShell
```

### Current drift risk

```txt
public site could become visually disconnected from app/control-plane UI
source/evidence handling may be inconsistent with RealityPools and xi-io.net
marketplace/product cards may reinvent status/readiness patterns
```

### First safe migration target

```txt
Article/event card system
```

Reason: public trust depends on consistent evidence/source/provenance patterns.

### Adoption priority

High, after base framework tokens and source/evidence components exist.

## RealityPools

### Surfaces

```txt
Event feeds
Calendar/event rows
Hub-and-rail layout
Show/season/player/entity pages
Activity rail
Evidence/source panels
Commentary/context sidebars
```

### Needed atomic components

```txt
Button
Badge
Card
Tabs
Alert
Tooltip
Progress
```

### Needed domain components

```txt
EventCard
TimelineRail
EntityCard
EvidencePanel
SourceBadge
ActivityRail
CommentaryPanel
SeasonStatusPill
```

### Needed recipes

```txt
EventStreamLayout
EntityMicrositePage
TopicMicrositePage
WorkbenchShell variant
```

### Current drift risk

```txt
RealityPools has donor patterns that may stay trapped in one product
calendar/event components may diverge from xi-io.com structured-news needs
activity rail patterns may not be generalized
```

### First safe migration target

```txt
Event row / timeline rail extraction
```

Reason: RealityPools is a pattern donor for xi-io event-driven sites.

### Adoption priority

Medium-high. It should donate patterns after the base UI kit exists.

## AFG

### Surfaces

```txt
Neural Relay journal
State snapshot capture
Practice suggestions
Privacy/data-source disclosures
Export/backup panels
Historical pattern review
```

### Needed atomic components

```txt
Button
Input
Field
Textarea
Alert
Dialog
Card
Progress
Switch
```

### Needed domain components

```txt
StateSnapshotCard
PracticeCard
PrivacyNotice
DataConnectionNotice
TimelineRail
PatternOverlapPanel
ExportPanel
```

### Needed recipes

```txt
JournalPageShell
PrivacyFirstSetupShell
EvidenceReviewPage
TimelineReviewLayout
```

### Current drift risk

```txt
health/recovery-style data needs lower cognitive load than admin dashboards
privacy copy and user-controlled data source patterns must be consistent
journal UX should not inherit arcade/admin density
```

### First safe migration target

```txt
PrivacyNotice + Field/Alert pattern for data-source connection prompts
```

### Adoption priority

Medium. Do after framework accessibility and privacy notice primitives exist.

## screen_scraper

### Surfaces

```txt
Document ingestion
Evidence extraction
Review queue
Co-op editing
Source ledger
Export/publish workflow
```

### Needed atomic components

```txt
Button
Badge
Input
Field
Textarea
Alert
Dialog
Tabs
Toast
Progress
```

### Needed domain components

```txt
EvidencePanel
SourceBadge
ReviewQueueItem
LedgerEventRow
DocumentChunkCard
PublishGatePanel
```

### Needed recipes

```txt
DocumentWorkbenchShell
EvidenceReviewPage
PublishingWorkflowShell
```

### Current drift risk

```txt
review/publish gates may diverge from xi-io.com and xi-io.net
source provenance patterns may be duplicated
co-op editor controls may grow bespoke forms/buttons
```

### First safe migration target

```txt
Evidence review queue item + SourceBadge
```

### Adoption priority

Medium.

## Future xi-io apps

### Bootstrap expectation

New apps should start from:

```txt
app profile manifest
shared token profile
atomic components
one page-shell recipe
one evidence/ledger/status pattern if applicable
```

### New-app checklist

```txt
choose app profile
choose surface family: admin / public / arcade / workbench / journal / article
import/copy needed atoms
import/copy needed domain components
configure tokens
create docs/INDEX.md
create project ledger
create feature matrix
create no-silent-failure policy
```

## Cross-product components with highest reuse

| Component | Products | Priority |
|---|---|---|
| Button | all | P0 |
| Badge / StatusPill | all | P0 |
| Field / Input / Label | all | P0 |
| Alert | all | P0 |
| Dialog | most | P0 |
| Card | all | P1 |
| Tabs | most | P1 |
| Toast | most | P1 |
| ReadinessChecklist | emulator, xi-io.net, screen_scraper | P1 |
| EvidencePanel | xi-io.com, xi-io.net, RealityPools, screen_scraper | P1 |
| LedgerEventRow | emulator, xi-io.net, RealityPools, screen_scraper | P1 |
| TimelineRail | xi-io.com, RealityPools, AFG | P1 |
| SourceBadge | xi-io.com, RealityPools, screen_scraper | P1 |
| PrivacyNotice | AFG, xi-io.com, screen_scraper | P2 |
| GameTile/GameHero | emulator, future media apps | P2 |

## Adoption gates

A product has adopted the framework when:

```txt
it uses shared tokens
it uses P0 atoms for new UI
it does not add duplicate button/badge/modal systems
it labels demo/provider/fixture data visibly
it exposes failure states through shared Alert/ReadinessChecklist patterns
it documents app-specific components in its local catalog
```

## First implementation recommendation

```txt
Parent:
  XIBALBA-UI-FRAMEWORK-001

First child:
  XARCADE-UI-FRAMEWORK-001

First target:
  xi-io Emulator Admin -> Engines

Reason:
  proof-relevant, form-heavy, high duplication, low risk to Arcade launch if isolated
```
