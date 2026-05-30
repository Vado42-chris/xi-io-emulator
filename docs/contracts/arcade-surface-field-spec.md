# Arcade Surface Field Spec

Date: 2026-05-28  
Contract version: 1.0  
Master plan: [master-plan-2026-05.md](../project-tracking/master-plan-2026-05.md)

## Purpose

Consistent fields across **game card**, **arcade microsite**, and **admin list card** — consumer vs management surfaces.

---

## Game card — `GameTile.tsx` (arcade browse)

| Field | Source | Required | Display rule |
|-------|--------|----------|--------------|
| Hero image | `mappings.artwork.boxart` | yes | Image or gradient + initials |
| Title | `title` | yes | Always visible |
| Platform | `systemId` | yes | Badge |
| Launch indicator | `launchStatus` | yes | Dot: ready / blocked / unknown |
| Actions (activated) | — | yes | Launch, Details |

**Not on tile today (decide before bulk hydration):** favorite badge, play count

**Honesty:** gradient fallback must not imply verified artwork unless `provenanceLabel` says so.

---

## Arcade microsite — `ArcadeGameDetail.tsx`

| Section | Fields | Required |
|---------|--------|----------|
| Hero | `mappings.artwork.boxart` or fallback | yes |
| Header | `title`, `platformLabel(systemId)`, `originalFileName` | yes |
| Stats | `ingressMode`, `playCount`, `lastPlayedAt`, `launchStatus` | yes |
| Tags | `tags[]` | yes |
| Path | `contentPath` | yes |
| Engine | `getSystemEngineStatus()` summary + admin hint | yes |
| Blockers | `checkLaunchReadiness()` list | yes |
| Notes | per-game notes (localStorage) | optional |
| Recommendations | up to 6 similar + reason + boxart | optional |
| Actions | Launch (gated), Favorite, Admin | yes |

**Not admin `GameDetailPanel`** — couch UX; mock tabs stay in admin modal only.

---

## Admin list card — `GameCard.tsx`

| Field | Source | Required |
|-------|--------|----------|
| Title | `title` | yes |
| System | `systemId` | yes |
| Launch badge | `launchStatus` | yes |
| Ingress status | `ingressChecklist.complete` or tags | yes |
| Favorite / hidden | flags | optional |
| Path snippet | `contentPath` truncated | yes |

Tuned for **management**, not 10-foot UX.

---

## Admin modal — `GameDetailPanel.tsx`

Real metadata + ingress checklist on overview; other tabs must score **Honesty/provenance** in [admin-feature-audit-index.md](../project-tracking/admin-feature-audit-index.md).

Mock tabs until implemented: Saves, Guides, Cheats, Patches, Hacks, Controller mapping.

---

## Cross-surface consistency rules

1. Same `title` and `systemId` everywhere
2. `launchStatus` must match `checkLaunchReadiness()` outcome
3. Fixture/demo records show `provenanceLabel` in microsite when `dataSource !== import_by_reference`
4. Blocked games show blocker title + desc — never silent empty launch

---

## Related

- [hydration-completeness-checklist.md](./hydration-completeness-checklist.md)
- [game-management-contract-v1.md](./game-management-contract-v1.md)
