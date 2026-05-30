# Hydration Completeness Checklist

Date: 2026-05-28  
Contract version: 1.0 (operational + target)  
Master plan: [master-plan-2026-05.md](../project-tracking/master-plan-2026-05.md)

## Purpose

Define when a single game record is **hydration complete** for xi-io Emulator — distinct from bulk library import and distinct from **showcase fixture** seeding.

---

## Operational definition (implemented today)

A game is **fully ingressed** when `game.ingressChecklist.complete === true`.

All **required** steps in `src/data/ingressChecklistDefinition.ts` must be `passed`, `skipped`, or `warning` — none `failed` or `pending`.

| Step ID | Single | Batch | Pass condition |
|---------|--------|-------|----------------|
| path_recorded | yes | yes | `contentPath` + `originalFileName` |
| extension_valid | yes | yes | Extension matches adapter |
| file_verified | yes | yes | File exists (Tauri) |
| title_normalized | yes | yes | `title` + `sortTitle` |
| identity_resolved | yes | yes | `systemId` + `system:` tag |
| artwork_assigned | yes | yes | Box art URL or approved fallback |
| artwork_verified | yes | yes | HEAD OK or `warning` |
| library_root_linked | skip | yes | Mounted root linked |
| engine_ready | yes | yes | Binary + core paths valid |
| launch_ready | yes | yes | `checkLaunchReadiness()` clear |

**Derived tags:** `ingress:complete`, `identity:normalized`, `launch:ready` or `launch:blocked`

**Rule:** Missing artwork → review/warning state; **must not block play** once `launch_ready` passes.

---

## Showcase fixture boundary

Showcase catalogs (`nesShowcaseCatalog.ts`, `snesShowcaseCatalog.ts`) are **not** XARCADE-IMAGE-HYDRATION-001.

Fixture records must carry:

| Field | Example |
|-------|---------|
| `dataSource` | `showcase_fixture` |
| `provenanceLabel` | `Curated SNES showcase — not bulk import` |

---

## Target definition (before bulk import)

Extend `GameRecord` / artwork model per `docs/contracts/game-management-contract-v1.md`:

### Record-level provenance

| Field | Purpose |
|-------|---------|
| `dataSource` | `single_ingress` \| `batch_library` \| `showcase_fixture` \| `import_by_reference` |
| `provenanceLabel` | Human-readable origin string |
| `confidence` | Identity match confidence tier |
| `reviewStatus` | `approved` \| `needs_review` \| `rejected` |
| `lastVerifiedAt` | ISO timestamp |

### Artwork asset fields

| Field | Purpose |
|-------|---------|
| `artwork.source` | `libretro` \| `local` \| `generated_fallback` \| `manual` |
| `artwork.confidence` | Match confidence |
| `artwork.reviewStatus` | Review queue state |
| `artwork.localCachePath` | Optional cached file |
| `artwork.providerCandidate` | Optional provider id before approval |

### Identity extensions

- Rosetta identity key + region/revision/hack tags
- Optional checksum, fileSizeBytes
- Duplicate/variant link when detected

---

## Bulk import gate

Do not run full checklist hydrate at scale until:

- Pass B/C closed
- XARCADE-IMAGE-HYDRATION-001 pilot complete
- XARCADE-BATCH-RESUME-001 implemented
- SQLite if dry-run requires it

See [master-plan-2026-05.md](../project-tracking/master-plan-2026-05.md) Phase 6.
