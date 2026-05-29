# Decision: Platform Engine Registry and Library Facets (Post–Pass B)

Date: 2026-05-29

## Status

**Future work.** Approved as product direction after peer review. **Not** active during Pass B or Pass C. Do not implement until launch-proof milestone is closed and bulk import/metadata passes are scheduled.

## Engine model

Engines are **platform-scoped by default**, not per-game.

```txt
Platform default engine
  → platform alternative engines (vetted, ranked)
    → optional per-game override (advanced)
```

Standard-user mental model:

```txt
My SNES games use this SNES engine.
My NES games use this NES engine.
I can change a whole platform if something works better.
```

Broken engines must produce clear recovery paths (not silent failure or jargon-only blockers).

## Baseline host policy (candidate — not locked)

```txt
RetroArch-first for libretro-supported platforms
Standalone exceptions where clearly better (e.g. DuckStation PS1, PCSX2 PS2)
```

Record engine choices as **candidate default / candidate alternative** until local benchmark and user hardware proof on Aries (and other targets) complete.

Pass B note: **bsnes = temporary SNES smoke only.** **Snes9x = candidate SNES default** after core install.

## Engine scorecard (v1 — future)

Weighted dimensions (not scientific benchmarks on day one):

```txt
Compatibility
Performance
Input latency
Features
Setup friction
User confidence (auto-detect, explain failure, recover without jargon)
```

## Multi-platform scope

Ingress and library UI must treat platform as primary facet. Target systems (phased):

```txt
NES, SNES, Genesis/Mega Drive, TurboGrafx-16, PS1, PS2, later systems
```

SNES batch shelf today is one platform section, not the whole library model.

## Metadata and filters (before bulk import)

Design structured metadata **before** bulk SNES import (~11k ROMs). Distinguish:

**Facets** (filter UI): platform, genre, release year/date, players, region, language, readiness, developer/publisher/series, content type, BIOS/engine requirements, controller profile.

**Tags** (cross-cutting): hack, translation, prototype, homebrew, favorite, needs review.

## Data sovereignty

```txt
No provider downloads by default.
No external metadata calls without user approval.
Local / hash / DAT / libretro databases first.
Remote providers (ScreenScraper, LaunchBox, SteamGridDB, etc.) optional, user-controlled adapters only.
```

## Related follow-ups (separate milestones)

```txt
Native path browse (Tauri file/folder picker) — post-Pass B UX
Platform engine registry implementation — after Pass C
Metadata schema + Rosetta identity — before bulk import
Arcade/Library filter parity — with metadata pass
```

## Serialized tags

```txt
#xio:emulator/platform-engine-registry
#xio:emulator/library/facets
#xio:emulator/metadata/sovereignty
```
