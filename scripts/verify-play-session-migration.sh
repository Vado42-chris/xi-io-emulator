#!/usr/bin/env bash
# PRH-01 scaffold guardrails — schema module, migration service, and plan linkage.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

pass() {
  echo "OK: $1"
}

test -f src-tauri/src/play_session_db.rs || fail 'play_session_db.rs missing'
grep -q 'CREATE TABLE IF NOT EXISTS play_sessions' src-tauri/src/play_session_db.rs \
  || fail 'play_sessions table SQL missing'
grep -q 'coplay_pairs' src-tauri/src/play_session_db.rs || fail 'coplay_pairs table SQL missing'
pass 'Rust play_session_db schema present'

grep -q 'mod play_session_db' src-tauri/src/lib.rs || fail 'play_session_db not declared in lib.rs'
grep -q 'play_session_db::init_on_startup' src-tauri/src/lib.rs \
  || fail 'init_on_startup not called from Tauri setup'
pass 'play_session_db wired in lib.rs'

grep -q 'rusqlite' src-tauri/Cargo.toml || fail 'rusqlite dependency missing from Cargo.toml'
pass 'rusqlite dependency declared'

test -f src/services/playSessionMigrationService.ts || fail 'playSessionMigrationService.ts missing'
grep -q 'play_session_migration' src/services/playSessionMigrationService.ts \
  || fail 'migration ledger event names missing'
pass 'frontend migration service scaffold present'

grep -q 'verify:play-session-migration' package.json \
  || fail 'npm script verify:play-session-migration missing'
grep -q 'verify-play-session-migration' docs/project-tracking/prh-01-sqlite-migration-plan.md \
  || fail 'PRH-01 plan must reference verify-play-session-migration script'
pass 'npm script and plan linkage'

echo
echo 'All play-session migration scaffold checks passed.'
