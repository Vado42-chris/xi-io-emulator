# Admin Feature Audit Index

Date: 2026-05-28  
Status: **Template — scores filled during Phase 4**  
Master plan: [master-plan-2026-05.md](./master-plan-2026-05.md)

## Scoring rubric (1–5 each)

| Dimension | Question |
|-----------|----------|
| **Built** | Does it work with real data end-to-end? |
| **UX** | Is copy human-facing and appropriate for desk/couch? |
| **Controller** | Navigable without mouse? (admin: partial OK if documented) |
| **No silent failure** | Errors visible in UI and ledger? |
| **Honesty / provenance** | If mock/disabled/demo, is that obvious — not disguised as real? |

**Status tags:** `functional` | `partial` | `mock` | `placeholder` | `disabled`

---

## Pages — preliminary inventory (unscored)

| Page | Route | Preliminary status | Built | UX | Ctrl | Silent | Honesty | Notes |
|------|-------|-------------------|-------|-----|------|--------|---------|-------|
| Library | AppShell → library | functional | — | — | — | — | — | batch ingress uses mock files |
| Controllers | ControllersPanel | functional | — | — | — | — | — | A/B launch mapping missing |
| Storage | AppShell → storage | partial | — | — | — | — | — | simulate mount; mock scan |
| Engines | EnginesPage | functional | — | — | — | — | — | |
| Settings | AppShell → settings | partial | — | — | — | — | — | fullscreen/display disabled |
| Logs | AppShell → logs | partial | — | — | — | — | — | JSON detail not expandable |
| Status sidebar | StatusPanel | functional | — | — | — | — | — | |
| GameDetailPanel | modal | partial | — | — | — | — | — | see tabs below |

---

## GameDetailPanel tabs

| Tab | Status | Built | UX | Ctrl | Silent | Honesty | Notes |
|-----|--------|-------|-----|------|--------|---------|-------|
| Overview / metadata | functional | — | — | — | — | — | |
| Artwork | partial | — | — | — | — | — | upload disabled |
| Saves | mock | — | — | — | — | — | |
| Guides | placeholder | — | — | — | — | — | |
| Cheats | placeholder | — | — | — | — | — | |
| Patches | placeholder | — | — | — | — | — | |
| Hacks | placeholder | — | — | — | — | — | |
| Controller | placeholder | — | — | — | — | — | remapper disabled |

---

## Arcade surfaces (Phase 4 extension)

| Surface | Component | Preliminary | Honesty notes |
|---------|-----------|-------------|---------------|
| Game card | GameTile | functional | gradient fallback OK if labeled |
| Microsite | ArcadeGameDetail | functional | separate from admin modal |
| Launch overlay | ArcadeHome | functional | errors must surface |
| Display picker | LaunchDisplayOverlay | partial | verify gamepad-only |
| Proof shelf | ArcadeHome | functional | must distinguish from demo tiles |

---

## Audit pass order

1. Engines → 2. Controllers → 3. Library → 4. Storage → 5. Settings → 6. Logs → 7. GameDetailPanel (each tab) → 8. Arcade surfaces

**Output:** prioritized fix list in open-work-ledger.md after scoring complete.
