# PRH-01 SQLite Migration Plan

Date: 2026-05-30  
Status: **Scaffold started Pass 11** — Rust schema + verify script; migration invoke pass 2  
Tracker: [pre-release-hardening-milestones.md](./pre-release-hardening-milestones.md) § PRH-01

## Goal

Move durable play/session data from browser `localStorage` to SQLite behind Tauri, with a one-time migration and ledger visibility. ROM binaries are never stored — only game IDs, timestamps, and co-play pairs.

---

## Current state (localStorage)

| Key / module | Data | File |
|--------------|------|------|
| `xibalba_play_session_state` | last launched game + timestamp | `playSessionService.ts` |
| `xibalba_coplay_matrix` | co-play pair counts | `playSessionService.ts` |
| `xibalba_*` game/roots/ledger | catalog + audit | `db.ts` |

**Risk:** clearing site data or reinstalling shell loses play history and co-play stats.

---

## Target schema (v1)

```sql
-- play_sessions: append-only launch log (optional detail; can start with aggregates only)
CREATE TABLE play_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id TEXT NOT NULL,
  started_at TEXT NOT NULL,
  session_id TEXT
);

-- last_focused_game: single row for quick resume UI
CREATE TABLE last_focused_game (
  game_id TEXT NOT NULL,
  focused_at TEXT NOT NULL
);

-- coplay_pairs: undirected edge counts
CREATE TABLE coplay_pairs (
  game_id_a TEXT NOT NULL,
  game_id_b TEXT NOT NULL,
  play_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (game_id_a, game_id_b)
);
```

Store **game IDs only** — no ROM paths, no home directory strings.

---

## Migration steps (implementation pass)

1. Add Tauri SQLite plugin or `rusqlite` module under `src-tauri/src/db/`
2. On first Tauri boot: read localStorage keys via frontend invoke → write SQLite → set `migration_version` flag
3. Emit ledger event: `play_session_migration_succeeded` or `play_session_migration_failed`
4. Update `playSessionService.ts` to call Tauri when `isTauriRuntime()`, keep localStorage for `npm run dev` web-only mode
5. Add `scripts/verify-play-session-migration.sh` — checks migration scaffold exists
6. Update [storage-contract-v1.md](../contracts/storage-contract-v1.md) § play session

---

## Out of scope (separate milestones)

| Item | Milestone |
|------|-----------|
| In-engine save states (.sav) | XARCADE-SAVE-STATE-001 |
| Browse UI snapshot on exit | XARCADE-NAV-SNAPSHOT-001 |
| Full catalog in SQLite (games table) | Phase 6 / bulk hydration gate |
| Runtime ROM path config | XARCADE-RUNTIME-CONFIG-001 |

---

## Acceptance (PRH-01 done when)

Matches PRH-01 checklist in [pre-release-hardening-milestones.md](./pre-release-hardening-milestones.md):

- Schema + migration + service wiring + ledger + no secrets in DB

---

## Estimated effort

**1–2 agent passes** after PRH-04 closes (or parallel if user sign-off delayed and no launch-path conflict).
