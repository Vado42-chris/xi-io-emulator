# Personal Library Metadata Backup (Peace of Mind)

Date: 2026-05-30  
Status: **Active blocker — schema v1 + export service @ Pass 9; pilot export on operator machine pending**  
Milestone: **XARCADE-LIBRARY-METADATA-BACKUP-001**  
Related: **XARCADE-IBAL-METADATA-001** (assistant — deferred design slot)

Tags: `#xio:emulator/library/metadata-backup` `#xio:emulator/legal/no-rom-distribution`

---

## User story (plain language)

A user (or an AI assistant helping them) spends hours curating titles, tags, artwork, notes, and **mappings** from catalog entries to ROM files on disk. If they reinstall, move USB roots, or swap machines, they must not lose that work. xi-io provides **peace of mind** by backing up **metadata only** — never ROM binaries — to a user-controlled Git remote (for example a private GitHub repo) or export bundle.

---

## What goes in the backup (allowed)

| Category | Examples | Notes |
|----------|----------|-------|
| Game identity | `gameId`, `title`, `sortTitle`, `systemId`, Rosetta key | No ROM bytes |
| Path binding | `libraryRootId`, `relativePath`, `volumeHint`, checksum optional | Pointers only |
| Artwork | Local cache paths, provider URLs, manual assets | Prefer Git LFS or separate artifact store for large binaries |
| User curation | tags, notes, favorites, co-play stats (post PRH-01) | SQLite export slice |
| Library roots | root labels, mount hints, read-only flags | No secrets |
| Provenance | `dataSource`, `provenanceLabel`, `reviewStatus` | Required for trust |

---

## What never goes in the backup repo

```txt
ROM files (.nes, .sfc, .smc, .zip, etc.)
BIOS binaries
User home paths in committed YAML (use relative + root id)
API tokens or Git credentials (Admin UI stores via OS secret store / Tauri)
```

Enforce with `.gitignore`, pre-commit hooks, and CI secret/ROM extension scan on export.

---

## Reference implementation repo (operator)

Private example: `Vado42-chris/personal_game_library` on GitHub.

```txt
personal_game_library/          ← metadata + artwork only
  manifest.yaml                 ← schema version, export date, xi-io app version
  library-roots/
  games/
    by-system/nes/...
    by-system/snes/...
  artwork/                      ← optional; LFS if large
  rosetta/                      ← canonical identity map (future)
```

Product repo **must not** depend on this repo at runtime — it is an optional backup target configured in Admin.

---

## Admin UI (future)

| Setting | Purpose |
|---------|---------|
| Backup remote URL | `git@github.com:user/personal_game_library.git` or HTTPS |
| Branch | default `main` |
| Auto-push interval | manual / daily / on catalog change (debounced) |
| Restore from remote | clone + validate schema + rebind roots |

Credentials: Tauri stronghold / keyring — never `localStorage`, never public manifest.

---

## Ibal + Ollama + MCP (vision — not implemented)

**Ibal** (assistant slot) can use **local Ollama** plus **MCP tools** to:

```txt
Reconcile duplicate titles across roots
Suggest Rosetta keys and region tags
Organize artwork into backup layout
Validate export before git push
Propose root rebinding when user picks a new ROM folder
```

This is **local-first**: models and tools operate on metadata on disk; backup push is explicit or scheduled — not silent cloud upload.

Does it work? **Yes, as an architecture** — same pattern as other local AI catalog tools, provided:

1. MCP tools are scoped (read/write metadata paths only, no arbitrary shell)
2. Human or ledger confirms destructive merges
3. ROM paths stay read-only references

Ibal is **not required** for backup v1 — manual export/import + Git is enough for MVP.

---

## Per-item pass gate (metadata mapping import)

Before a title counts as **passed** and merged into the live catalog from backup or batch mapping:

| # | Check | Pass condition |
|---|-------|----------------|
| 1 | Schema | Record validates against [metadata-backup-v1.schema.yaml](../contracts/metadata-backup-v1.schema.yaml) |
| 2 | System | `systemId` + adapter exists |
| 3 | Root binding | `libraryRootId` resolves OR user assigns new root in UI |
| 4 | Relative path | `relativePath` present; no absolute home path in committed JSON |
| 5 | ROM verify (local) | Optional at import: file exists at resolved path — **warning** if missing, not hard fail |
| 6 | Identity | `title` + `sortTitle` normalized |
| 7 | Artwork | Asset present OR approved fallback with `provenanceLabel` |
| 8 | No ROM in bundle | Exporter grep / size check clean |
| 9 | Ledger | `metadata_import_item_passed` or `metadata_import_item_warning` emitted |
| 10 | Review | `reviewStatus: approved` OR user bulk-approves slice |

**Showcase hydration** uses a subset (see [hydration-completeness-checklist.md](../contracts/hydration-completeness-checklist.md)). Full library mapping adds root rebinding and backup provenance.

---

## Pass sizing (discovery estimates)

Counts are for **metadata mapping**, not ROM copying. Agent pass = plan + export/import slice + ledger + user spot-check.

| Library slice | Titles (approx.) | Suggested titles/pass | Passes est. |
|---------------|------------------|------------------------|-------------|
| Showcase (curated UI) | ~44 (24 NES + 20 SNES) | all in one pass | **1** |
| Pass B proof shelf | 2 | 2 | **1** (done separately) |
| Pilot personal slice | 50 | 50 | **1** |
| SNES full local | ~11,337 | 50–100 (review-heavy) | **115–227** |
| NES full local | operator-dependent | 50–100 | TBD after inventory |
| Steady state (automated + Ibal) | 100–200 | with spot-check | lower |

**Recommendation:** First real backup pilot = **50 titles** one system, manual approve each warning, then raise batch size.

---

## Restore story

```txt
1. User clones personal_game_library (or picks folder)
2. xi-io Admin → Restore metadata backup
3. User maps library roots (old volume hint → new mount path)
4. App resolves relativePath → absolute at runtime (XARCADE-RUNTIME-CONFIG-001)
5. Missing ROMs show pathStatus=missing — records preserved, not deleted
```

---

## Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Artwork repo bloat | LFS quotas; optional “URLs only” export mode |
| Absolute paths in export | Schema rejects; exporter uses relativePath only |
| Accidental ROM commit | Extension denylist + CI on backup repo |
| Token leak | Keyring only; never in git |
| Merge conflicts on push | Export is snapshot + optional CRDT later; v1 = last-write-wins per gameId with ledger |
| Legal | Align with [content-and-user-library-boundary.md](../legal/content-and-user-library-boundary.md) |

---

## Better alternatives?

| Approach | Pros | Cons |
|----------|------|------|
| **Private Git repo (your plan)** | Version history, familiar, off-site | LFS cost; merge UX |
| **Encrypted local zip export** | Simple, no Git skills | No incremental history unless user manages |
| **Syncthing / cloud folder** | Easy | Less schema validation |
| **SQLite file copy only** | Fast | Artwork paths break; no multi-machine merge story |

**Recommended v1:** Git-backed **or** signed export bundle — same JSON schema, user chooses transport. Git is excellent for metadata **text** + small assets; use LFS or external artwork CDN for huge libraries.

---

## Blocker status (2026-05-30)

Until this milestone has schema + export path + blocker sign-off:

```txt
Bulk library metadata import — BLOCKED
XARCADE-IMAGE-HYDRATION-001 execution — BLOCKED
Pass C / bulk hydration — remains gated on PRH-04 + this design
```

**Unblocked after:** pilot 50-title export on operator machine with `verify:metadata-backup` pass + ledger events + legal sign-off row in PRH tracker.

---

## Related docs

- [content-and-user-library-boundary.md](../legal/content-and-user-library-boundary.md)
- [storage-contract-v1.md](../contracts/storage-contract-v1.md)
- [hydration-completeness-checklist.md](../contracts/hydration-completeness-checklist.md)
- [prh-01-sqlite-migration-plan.md](../project-tracking/prh-01-sqlite-migration-plan.md)
