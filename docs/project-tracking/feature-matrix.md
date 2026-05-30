# Feature Matrix — xi-io Emulator

Date: 2026-05-28  
Status: **Initial inventory — expand during Phase 4 admin audit**  
Master plan: [master-plan-2026-05.md](./master-plan-2026-05.md)

Legend: **Y** built | **P** partial | **M** mock/placeholder | **N** not started | **—** deferred

---

## Arcade shell (consumer)

| Feature | Status | Surface | Notes |
|---------|--------|---------|-------|
| Shelf browse + gamepad nav | P | ArcadeHome | large file; verify controller-only |
| Search overlay | P | ArcadeHome | |
| Platform tabs / facets | P | ArcadeHome | |
| Game card (tile) | Y | GameTile | gradient fallback |
| Game microsite | Y | ArcadeGameDetail | not admin GameDetailPanel |
| Launch + display picker | P | LaunchDisplayOverlay | |
| Launch error overlay | P | ArcadeHome | hardening local-only |
| Session lifecycle events | P | useEmulatorSessionLifecycle | |
| Recommendations shelf | P | recommendationService | |
| Continue playing / most played | P | playSessionService | |
| Pass B proof shelf | Y | ArcadeHome | pinned first |
| Demo mode banner | Y | ArcadeHome | |
| Shell exit gamepad chord | P | shell exit services | |
| Favorites | Y | ArcadeHome | |

---

## Admin console

| Feature | Status | Page | Honesty flag |
|---------|--------|------|--------------|
| Library CRUD + filters | Y | Library | |
| Single-game ingress | Y | Library | |
| Batch ingress | M | Library / Storage | mock file list only |
| Reconcile ingress | Y | Library | |
| CSV export | Y | Library | |
| Controller detection | Y | Controllers | |
| Input test | Y | Controllers | |
| Shell exit mapping | Y | Controllers | |
| In-game verify flag | Y | Controllers | manual |
| Engine path config | Y | Engines | |
| Proof ROM registration | Y | Engines | |
| Storage root simulate | M | Storage | not real mount |
| Storage scan | M | Storage | mock batch |
| Demo mode toggle | Y | Settings | |
| Showcase re-hydrate | Y | Settings | fixture |
| Fullscreen / display prefs | M | Settings | disabled controls |
| Event ledger list | P | Logs | no JSON expand |
| Status sidebar | Y | StatusPanel | |
| Game detail modal | P | GameDetailPanel | mock tabs |

---

## Backend / launch (Tauri)

| Feature | Status | Module | Notes |
|---------|--------|--------|-------|
| launch_emulator | P | lib.rs | local WIP |
| prepare_launch / validate | P | engine_launch.rs | untracked |
| Startup poll | P | session_startup.rs | untracked |
| Shell restore guardrails | P | shell_restore.rs | untracked |
| Flatpak normalize | P | engine_launch + TS | |
| terminate session | P | lib.rs | |
| single instance flock | P | single_instance | verify |
| path_exists / command_on_path | P | lib.rs | local |
| display identify | P | display_service | silent failure gap |

---

## Hydration / library

| Feature | Status | Notes |
|---------|--------|-------|
| Showcase SNES (~19) | P | fixture; needs provenance |
| Showcase NES (~23) | P | fixture; needs provenance |
| Ingress checklist | P | ingressChecklistService |
| Artwork libretro URLs | Y | artworkProvider |
| Bulk filesystem scan | N | gated |
| Rosetta identity | N | Pass D |
| SQLite catalog | N | gate after dry-run |
| Batch resume | N | XARCADE-BATCH-RESUME-001 |

---

## Milestone gates

| Milestone | Status |
|-----------|--------|
| XARCADE-CONTROLLER-LAUNCH-PROOF-001 | Pass B partial |
| XARCADE-CONTROLLER-MAPPING-001 | Not started (blocker) |
| XIBALBA-UI-FRAMEWORK-001 | Remote branch only |
| XARCADE-UI-FRAMEWORK-001 | Blocked on framework merge |
| XARCADE-IMAGE-HYDRATION-001 | Planned |
| XARCADE-STORAGE-001 | Deferred |
| XARCADE-BATCH-RESUME-001 | Not started |

---

## Update log

| Date | Change |
|------|--------|
| 2026-05-28 | Initial matrix from Phase -2 audit |
