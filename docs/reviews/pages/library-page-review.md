# UI Review: Library Page

Date: 2026-05-28

## Screen reviewed

Game Library page with single-game ingress, batch-library ingress, search, filter chips, sort controls, metadata filter controls, one visible SNES game card, and right-side system/status rail.

## Product role

This is the most important page in the product. It is the user's arcade lobby, library manager, and first proof that xi-io Emulator manages ingressed games instead of merely launching loose files.

## What is working

```txt
The page clearly exposes both ingestion flows: single-game and batch-library.
The search/filter layer is visible early, which supports large-library intent.
The single game card shows useful status metadata: system, mode, path, tags, needs config.
Right-side status rail reinforces active system and integration readiness.
Reset Database gives an obvious dev/test affordance.
The visual tone feels dark, controlled, and close to the intended arcade cockpit direction.
```

## Main UX issue

The page currently feels like a staging/admin workspace, not yet like a premium game library.

The structure is useful, but the emotional hook is missing. A user should immediately feel:

```txt
My games live here.
I understand what to do next.
This is safe, organized, and arcade-ready.
```

Right now the user sees forms first, then a small card. For a polished gaming product, the game library itself should become the hero, while ingress tools should become guided actions.

## Information architecture notes

### Current order

```txt
Header
Single-game ingress form
Batch-library ingress form
Search/filter bar
Game card grid
```

### Recommended order for production

```txt
Header with library summary
Primary action strip: Add One Game / Add Library Folder / Rescan
Search and filters
Game shelves/grid
Review/diagnostic callouts
```

The ingress forms should not always occupy the top hero area once games exist. They should collapse into action cards or a modal/drawer.

## Usability notes

```txt
The two ingress panels are clear for development, but visually heavy for a normal user.
The single game card is too small relative to the available screen.
The card does not yet feel like something to play, inspect, or curate.
The filter labels are functional but technical.
The result count is useful, but it needs stronger placement.
The metadata filter label should avoid ambiguous language like “Metadata: All Mappings” if the user has not configured providers yet.
```

## Accessibility notes

```txt
Small text is too small for couch/cabinet distance.
Muted gray copy may be hard to read on a TV.
The game card action icons are too small for reliable pointer/controller targeting.
Status tags need text labels, which is good, but color contrast should be checked.
Focus states for cards, filters, and buttons need to be obvious for controller navigation.
```

## Controller and cabinet readiness

Current state:

```txt
Mouse/keyboard first.
Controller-ready visual affordances are not yet obvious.
```

Recommended:

```txt
Use a large focused card state.
Use controller hint footer: A Select, B Back, Y Filter, X Favorite.
Make Add One Game and Add Library Folder large action tiles.
Use shelves: Recently Added, Favorites, Needs Configuration.
Make the selected card readable from across the room.
```

## Engagement notes

The first game card should feel rewarding. Even without cover art, it can feel more game-like.

Recommended placeholders:

```txt
Large generated title tile
System badge
SNES controller icon
Launch readiness strip
Next action: Configure Engine
Secondary action: Inspect Game
```

The page should make the next step obvious:

```txt
Super Mario is ingressed.
To play it, configure RetroArch and the SNES core.
```

## No-silent-failure review

Good:

```txt
Need config state is visible.
Launch is not faked.
Integration states are visible.
```

Needs improvement:

```txt
The user needs a clear reason why the game is not launchable.
“Needs Config” should link to exact blockers.
The card should show: Missing RetroArch path, Missing SNES core, Controller not configured, as appropriate.
```

## Recommended fixes

### Priority 1

```txt
Make the game grid the visual hero once at least one game exists.
Convert ingress forms into action tiles or collapsible setup cards.
Increase game card size and text scale.
Add exact next-step CTA on the card: Configure Engine.
Add filtered-empty state distinct from no-library state.
```

### Priority 2

```txt
Add shelves: All Games, Needs Configuration, Favorites, Recently Added.
Add game detail drawer with preservation placeholder panels.
Add controller hint footer.
Add stronger selected/focused state.
```

### Priority 3

```txt
Add generated placeholder art.
Add cover-art slot with provider/confidence state.
Add duplicate advisory state directly in the grid when duplicates exist.
```

## Acceptance criteria for polish patch

```txt
User can identify the primary next action within 3 seconds.
Game cards are readable at TV distance.
Ingress options remain available but no longer dominate the page after games exist.
Needs configuration state explains why launch is blocked.
Search/filter controls are usable with mouse, keyboard, and future controller focus.
```

## Studio verdict

Strong structural foundation, not yet production-grade arcade UX. This page should be the next major polish target because it defines the product's first impression.
