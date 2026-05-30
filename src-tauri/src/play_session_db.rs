//! PRH-01 play/session SQLite store — game IDs and ISO timestamps only.
//!
//! ROM paths and home directories must never be stored here. Frontend migration from
//! localStorage is a separate slice; this module owns schema init on Tauri boot.
//!
//! Plan: docs/project-tracking/prh-01-sqlite-migration-plan.md

use rusqlite::{params, Connection};
use std::path::{Path, PathBuf};

pub const SCHEMA_VERSION: i32 = 1;

/// v1 schema — matches prh-01-sqlite-migration-plan.md
pub const INIT_SQL: &str = r#"
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY
);
CREATE TABLE IF NOT EXISTS play_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id TEXT NOT NULL,
  started_at TEXT NOT NULL,
  session_id TEXT
);
CREATE TABLE IF NOT EXISTS last_focused_game (
  game_id TEXT NOT NULL,
  focused_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS coplay_pairs (
  game_id_a TEXT NOT NULL,
  game_id_b TEXT NOT NULL,
  play_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (game_id_a, game_id_b)
);
"#;

pub fn db_path(app_data_dir: &Path) -> PathBuf {
    app_data_dir.join("play_session.db")
}

/// Open (or create) the play-session database and apply v1 schema migrations.
pub fn open_and_migrate(app_data_dir: &Path) -> Result<Connection, String> {
    let path = db_path(app_data_dir);
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| format!("play_session_db mkdir: {e}"))?;
    }

    let conn = Connection::open(&path).map_err(|e| format!("play_session_db open: {e}"))?;
    conn.execute_batch(INIT_SQL)
        .map_err(|e| format!("play_session_db schema: {e}"))?;
    conn.execute(
        "INSERT OR IGNORE INTO schema_migrations (version) VALUES (?1)",
        params![SCHEMA_VERSION],
    )
    .map_err(|e| format!("play_session_db migration row: {e}"))?;

    Ok(conn)
}

/// Initialize schema at app boot; logs errors to stderr (ledger wiring in PRH-01 pass 2).
pub fn init_on_startup(app_data_dir: &Path) {
    match open_and_migrate(app_data_dir) {
        Ok(_) => eprintln!("[xi-io] play_session.db schema v{SCHEMA_VERSION} ready"),
        Err(err) => eprintln!("[xi-io] play_session.db init failed: {err}"),
    }
}
