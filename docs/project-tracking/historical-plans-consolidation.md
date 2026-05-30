# Historical Plans Consolidation

Date: 2026-05-28  
Purpose: Merge open items from prior planning docs into [master-plan-2026-05.md](./master-plan-2026-05.md).  
Rule: **Do not execute from this file** — use the master plan phases.

---

## Superseded planning entry points

These remain useful as reference but are **not** execution sources:

| Document | Role now |
|----------|----------|
| [remaining-work-pass-plan.md](../roadmap/remaining-work-pass-plan.md) | Pass B–L estimates — see master plan phases |
| [agent-master-prompt-current-next.md](../agent-master-prompt-current-next.md) | Pass B/C agent prompt — gated by master plan |
| [agent-master-prompt-pass-b-pass-c.md](../agent-master-prompt-pass-b-pass-c.md) | Pass B checklist detail |
| [backlog.md](../backlog.md) | Slice IDs XARCADE-* — indexed below |
| [iceberg-delivery-roadmap.md](../iceberg-delivery-roadmap.md) | M3+ UI patches — deferred post-Pass C |
| [conversation-decision-backlog.md](../architecture/conversation-decision-backlog.md) | Decisions 001–007 — absorbed into gates |
| Agent handoffs (`docs/agent-handoff-*.md`) | Per-slice instructions when phase reached |

---

## Open items merged from historical plans

### Pass B / launch (still active)

| ID | Item | Source | Master plan phase |
|----|------|--------|-------------------|
| H-PB-01 | SNES xi-io GUI launch (not demo path) | pass-b-final-evidence, ledger | Phase 1 |
| H-PB-02 | NES exit/return re-test after b34a60d | ledger, peer review | Phase 1 |
| H-PB-03 | Mark In-Game Verified | pass-b prompts | Phase 1 |
| H-PB-04 | XIO-LCH-011 FCEUX black screen retest | ledger | Phase 1 |
| H-PB-05 | XIO-LCH-012 single-instance verify | ledger | Phase 1 |
| H-PB-06 | bsnes smoke only; Snes9x = SNES proof core | platform-engine decision | Phase 1 |
| H-PB-07 | Document launch hardening in ledger/YAML | audit | Phase 0 |

### Controller (Pass B blocker)

| ID | Item | Source | Master plan phase |
|----|------|--------|-------------------|
| H-CT-01 | `#todo:controller/profile-mapping` — A/B at launch | peer review, generic-usb policy | **XARCADE-CONTROLLER-MAPPING-001** Phase 1 |
| H-CT-02 | XARCADE-CONTROLLER-002 visual SNES mapping MVP | backlog M2 | Phase 4 admin + post-Pass C |
| H-CT-03 | Bluetooth deferred | generic-usb policy | Deferred |

### Launch / lifecycle ops gaps

| ID | Item | Source | Master plan phase |
|----|------|--------|-------------------|
| H-OP-01 | XIO-LCH-008 shell focus failure ledger event | ledger | Phase 1 or 7 |
| H-OP-02 | XIO-LCH-009 display identify UI surfacing | ledger | Phase 1 or 7 |
| H-OP-03 | XIO-LCH-014–016 docs + parity matrix | audit | Phase 0 |
| H-OP-04 | Logs JSON detail expand | ui-page-review | Phase 4 |

### Docs / framework sync

| ID | Item | Source | Master plan phase |
|----|------|--------|-------------------|
| H-DO-01 | Mirror image-hydration decision to xi-io.net | sync-status | Pass C checkpoint |
| H-DO-02 | Workbench event reconcile vs ledger | ledger, sync-status | Pass C |
| H-DO-03 | Hydration template schema validation | sync-status | Phase 5 |
| H-DO-04 | Merge `origin/docs/xibalba-ui-framework-001` | audit §12 | Phase -1 |
| H-DO-05 | Supersede duplicate arcade handoffs | audit | Phase 0 INDEX |
| H-DO-06 | Move root reports to `docs/reports/` | audit | Phase 0 |

### Image hydration (Pass D–F)

| ID | Item | Source | Master plan phase |
|----|------|--------|-------------------|
| H-IM-01 | XARCADE-IMAGE-HYDRATION-001 full acceptance | backlog, handoff-image | Phase 5 |
| H-IM-02 | `#todo:storage/image-mapping-before-bulk` | decisions 001 | Phase 5 |
| H-IM-03 | `#todo:rosetta/local-alias-map` | rosetta decision | Phase 5 |
| H-IM-04 | Rosetta identityResolutionService | remaining-work Pass D | Phase 5 |
| H-IM-05 | artworkHydrationService + review queue | Pass E | Phase 5 |
| H-IM-06 | Artwork Health in Admin | Pass E | Phase 4 + 5 |
| H-IM-07 | `docs/reports/image-hydration-report.md` | Pass F | Phase 5 |

### Storage / library (Pass H–J, gated)

| ID | Item | Source | Master plan phase |
|----|------|--------|-------------------|
| H-ST-01 | `#todo:storage/read-only-source-root` | non-mutating import | Phase 6 |
| H-ST-02 | XARCADE-STORAGE-001 library root manager | backlog M2 | Phase 6 |
| H-ST-03 | Real filesystem scan (not mock batch) | AppShell, handoff-ingress | Phase 6 / 7 |
| H-ST-04 | XARCADE-BATCH-RESUME-001 | master plan | Phase 6 |
| H-ST-05 | 11,337 dry-run index | remaining-work Pass H | Phase 6 |
| H-ST-06 | Virtualization / pagination 11k library | Pass J | Phase 7 |

### Backlog M2 slices (partially done — verify in feature-matrix)

| ID | Slice | Status vs today | Phase |
|----|-------|-----------------|-------|
| H-M2-01 | XARCADE-LIBRARY-001 arcade grid | Partial (ArcadeHome + admin) | Phase 4 + 7 |
| H-M2-02 | XARCADE-ENGINE-001 RetroArch detection | Partial (EnginesPage) | Phase 1 verify |
| H-M2-03 | XARCADE-ADAPTER-001 SNES adapter | Partial | Phase 1 verify |
| H-M2-04 | XARCADE-LAUNCH-001 launch/return | Partial (hardening local) | Phase 1 |
| H-M2-05 | XARCADE-CONTROLLER-001 detection | Partial | Phase 1 |
| H-M2-06 | XARCADE-SETTINGS-001 settings registry | Partial (demo/showcase only) | Phase 4 |
| H-M2-07 | XARCADE-LEDGER-001 runtime ledger | Partial (list, no expand) | Phase 4 |

### Iceberg / search (post-Pass C)

| ID | Item | Source | Master plan phase |
|----|------|--------|-------------------|
| H-IC-01 | Patch 02 Search and Filters MVP (XARCADE-SEARCH-001) | iceberg, handoff-search | After LIBRARY-001 hardening |
| H-IC-02 | Patch 01 Library Cockpit polish | iceberg | Phase 4 admin audit |
| H-IC-03 | Patches 03+ storage, mapping, cheats placeholders | iceberg M4–M10 | Phase 7+ |

### Future / explicitly deferred

| ID | Item | Source |
|----|------|--------|
| H-FU-01 | XARCADE-IBAL-SLOT-001 | backlog, Pass G |
| H-FU-02 | `#todo:assistant/provider-contract` | ibal decision |
| H-FU-03 | Platform engine registry implementation | platform-engine decision |
| H-FU-04 | `#todo:architecture/path-helper-service` | naming standard |
| H-FU-05 | Media platform extension track | decision 007 |
| H-FU-06 | PS1/PS2, cloud, scraping | backlog future |
| H-FU-07 | NES expansion milestone | backlog M2 future |
| H-FU-08 | Flatpak storage/device strategy implementation | packaging doc |
| H-FU-09 | Cheats/hacks/patches execution | cheats strategy doc |
| H-FU-10 | `src/components/arcade/` migration | standardization audit |

### Admin UX reviews (open from ui-page-review-index)

| ID | Item | Phase |
|----|------|-------|
| H-UX-01 | Admin console → consumer copy pass | Phase 4 + 7 |
| H-UX-02 | Couch readability / empty states | Phase 4 |
| H-UX-03 | Native path browse (not text-only) | Phase 4 Storage |
| H-UX-04 | NES artwork parity with SNES | Phase 5 |
| H-UX-05 | GameDetailPanel mock tabs → hide or build | Phase 4 |
| H-UX-06 | Radix focus trap deferred | XARCADE-UI-FRAMEWORK-001 |

---

## UI framework branch (2026-05-28 fetch)

**Branch:** `origin/docs/xibalba-ui-framework-001`  
**Diff vs `origin/main`:** 5 files, +1335 lines, **no source files**

| File | Action |
|------|--------|
| `docs/framework/xibalba-ui-framework-standard-v1.md` | Merge |
| `docs/framework/xibalba-ui-adoption-matrix-v1.md` | Merge |
| `docs/framework/xibalba-ui-component-registry-plan-v1.md` | Merge |
| `docs/project-tracking/xibalba-ui-framework-001-ledger-note.md` | Merge |
| `docs/INDEX.md` | Merge with conflict review |

**Recommendation:** Docs-only merge in Phase -1 before XARCADE-UI-FRAMEWORK-001. Update ledger after merge.

---

## Update log

| Date | Change |
|------|--------|
| 2026-05-28 | Initial consolidation from backlog, roadmap, iceberg, handoffs, decisions, Pass B reports, audit |
