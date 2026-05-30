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

grep -q 'session_duration_secs >= 3' src-tauri/src/lib.rs \
  || fail 'session_reached_game threshold should be 3s after confirmed startup'

pass 'session_reached_game threshold wired'

echo ""
echo "All session-idle guardrail checks passed."
