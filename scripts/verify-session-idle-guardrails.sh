#!/usr/bin/env bash
# Ensures FCEUX sessions are not idle-killed before content was ever detected (XIO-LCH-011).
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

grep -q 'session_idle_kill_allowed' src-tauri/src/emulator_process.rs \
  || fail 'session_idle_kill_allowed helper missing'

if grep -q 'past_grace && fceux' src-tauri/src/emulator_process.rs; then
  fail 'premature FCEUX grace idle-kill still present (past_grace && fceux)'
fi
pass 'no premature FCEUX grace idle-kill'

grep -q 'idle_kill_requires_prior_content_signal' src-tauri/src/emulator_process.rs \
  || fail 'idle-kill unit test missing'

grep -q 'emulator_playable_signal' src-tauri/src/lib.rs \
  || fail 'playable signal gate missing before shell hibernate'

grep -q 'session_reached_game: true' src-tauri/src/lib.rs \
  || fail 'session_reached_game must be set at confirmed startup'

grep -q 'session.session_reached_game' src-tauri/src/lib.rs \
  || fail 'session finish must use launch-time session_reached_game'

grep -q 'session_pid_monitor_stop' src-tauri/src/lib.rs \
  || fail 'session PID monitor stop flag missing'

pass 'session_reached_game threshold wired'

echo ""
echo "All session-idle guardrail checks passed."
