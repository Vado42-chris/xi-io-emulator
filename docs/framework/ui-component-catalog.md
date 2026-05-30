# xi-io UI Component Catalog

Date: 2026-05-28  
Milestone: **XARCADE-UI-FRAMEWORK-001**

## Purpose

Callable atomic UI primitives for xi-io Emulator admin surfaces. Uses the existing dark arcade visual language and CSS variables — **not** Tailwind or shadcn as a runtime dependency.

[shadcn/ui](https://ui.shadcn.com/docs) is the **reference model** for component coverage, composable APIs, and variant patterns. Source lives in-repo under `src/components/ui/` (copy-owned, customizable).

## Import

```tsx
import { Button, Badge, Input, Label, Field, Alert, Dialog } from '../components/ui';
```

Styles: `main.tsx` imports `styles/tokens.css` and `styles/ui.css` before `styles.css`.

## Components

### Button

| Prop | Type | Default |
|------|------|---------|
| `variant` | `primary` \| `secondary` \| `ghost` \| `destructive` | `primary` |
| `size` | `sm` \| `md` \| `lg` | `md` |

Forwards native `<button>` props (`type`, `disabled`, `onClick`, etc.).

```tsx
<Button variant="secondary" size="sm" onClick={onSave}>
  Save
</Button>
```

### Badge

| Prop | Type | Default |
|------|------|---------|
| `variant` | `default` \| `success` \| `warning` \| `destructive` \| `muted` | `default` |

Use for status chips in **new** code. Legacy `.badge`, `ReadinessBadge`, and `TagPill` remain until migrated.

### Input

| Prop | Type | Default |
|------|------|---------|
| `error` | `boolean` | `false` |
| `fixedWidth` | `boolean` | `false` (320px when true) |

Forwards native `<input>` props.

### Label

| Prop | Type | Default |
|------|------|---------|
| `required` | `boolean` | `false` |

### Field

Wraps a control with optional `label`, `description`, and `error`.

```tsx
<Field label="RetroArch path" description="Absolute path on disk" error={pathError}>
  <Input id="ra-path" value={raPath} onChange={...} />
</Field>
```

### Alert

| Prop | Type | Default |
|------|------|---------|
| `variant` | `info` \| `warning` \| `success` \| `destructive` | `info` |

Subcomponents: `AlertTitle`, `AlertDescription`, `AlertContent`.

```tsx
<Alert variant="warning">
  <AlertContent>
    <AlertTitle>Engine not configured</AlertTitle>
    <AlertDescription>Set RetroArch path below.</AlertDescription>
  </AlertContent>
</Alert>
```

### Dialog

Controlled overlay with Escape and backdrop dismiss.

```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm</DialogTitle>
      <DialogDescription>Optional detail text.</DialogDescription>
    </DialogHeader>
    {/* body */}
  </DialogContent>
</Dialog>
```

Phase 1 limitation: no Radix focus trap yet — sufficient for simple admin dialogs.

## Utilities

### `cn()` — `src/lib/cn.ts`

Merges class name strings. Use with `ui-*` BEM classes.

## Migration rules

1. **New admin UI** must use `src/components/ui/` primitives.
2. **No new inline styles** in migrated pages or ui components.
3. **One Badge system** for new code (`Badge`); deprecate ad-hoc badge CSS over time.
4. **One Dialog system** for new modals; do not add new `.modal-*` or bespoke backdrop stacks.
5. **No `window.alert()`** for user-facing errors — use `Alert` or a future Toast (P2).
6. **Arcade / 10-foot UI** stays in domain components (`GameTile`, shelves, hero) — not forced into admin atoms.

## Anti-patterns

- Adding `.btn-primary` with inline `style={{ padding: ... }}` overrides
- Creating a third badge CSS system
- Copy-pasting modal backdrop markup
- Installing Tailwind/shadcn without an explicit framework milestone decision

## First migrated surface

**Admin → Engines** (`src/pages/EnginesPage.tsx`) — proof-path inputs, engine setup alerts, Save & Test.

Legacy browse preset popovers remain CSS-class based (not Dialog) until a dedicated browse UX slice.

## Pass B status

Pass B remains **partial / blocked**. This milestone does not close launch proof.
