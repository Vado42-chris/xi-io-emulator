#!/usr/bin/env bash
# Validates shell focus-restore guardrails (XIO-LCH-008 / desktop freeze mitigation).
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

# Must exist and be wired
grep -q 'mod shell_restore' src-tauri/src/lib.rs || fail 'shell_restore module not declared in lib.rs'
grep -q 'try_begin_shell_restore' src-tauri/src/lib.rs || fail 'try_begin_shell_restore not used in lib.rs'
grep -q 'finish_shell_restore' src-tauri/src/lib.rs || fail 'finish_shell_restore not used in lib.rs'

# No focus-retry storm
if grep -q 'spawn_shell_focus_retries' src-tauri/src/window_registry.rs; then
  fail 'spawn_shell_focus_retries still present in window_registry.rs'
fi
pass 'no spawn_shell_focus_retries'

# No blocking xdotool --sync in Rust sources (comments excluded)
if grep -rE 'windowactivate.*--sync|args\(\[.*--sync' src-tauri/src --include '*.rs' 2>/dev/null; then
  fail 'xdotool --sync still present in src-tauri/src'
fi
pass 'no xdotool --sync in Rust sources'

# UI must not call restore on session-finished
if grep -r 'restoreArcadeWindow' src/components src/hooks 2>/dev/null; then
  fail 'UI still calls restoreArcadeWindow (duplicate restore)'
fi
pass 'UI does not call restoreArcadeWindow'

# Lifecycle hook documents Rust-owned restore
grep -q 'Rust owns restore' src/hooks/useEmulatorSessionLifecycle.ts || fail 'lifecycle hook missing Rust-owned restore note'
pass 'useEmulatorSessionLifecycle present'

# Short-session failure detection
grep -q 'session_reached_game' src-tauri/src/lib.rs || fail 'session_reached_game logic missing'
grep -q 'session_window_xids' src-tauri/src/lib.rs || fail 'session_window_xids check missing'
pass 'short-session failure detection wired'

# Restore failure signal (PRH-02 / XIO-LCH-008)
grep -q 'shell_focus_restore_failed' src/components/ArcadeHome.tsx src/components/AppShell.tsx 2>/dev/null \
  || fail 'shell_focus_restore_failed ledger wiring missing'
grep -q 'shell-focus-restore-failed' src-tauri/src/lib.rs || fail 'shell-focus-restore-failed event missing in lib.rs'
grep -q 'ShellRestoreResult' src-tauri/src/shell_restore.rs || fail 'ShellRestoreResult missing'
grep -q 'reason_code' src-tauri/src/shell_restore.rs || fail 'restore reason_code field missing'
grep -q 'tauri_window_missing' src-tauri/src/window_registry.rs || fail 'restore reason codes missing'
grep -q 'emit_shell_focus_restore_result' src-tauri/src/lib.rs || fail 'emit_shell_focus_restore_result missing'
pass 'shell_focus_restore_failed wired'

# No global emulator pkill reintroduced
if grep -rE 'pkill\s+-x\s+fceux|pkill\s+-f\s+fceux' src-tauri/src --include '*.rs' 2>/dev/null; then
  fail 'global fceux pkill reintroduced'
fi
pass 'no global fceux pkill'

# WM tools use timeout wrapper
grep -q 'run_subprocess_with_timeout' src-tauri/src/window_registry.rs || fail 'timeout wrapper missing in window_registry'
grep -q 'run_subprocess_with_timeout' src-tauri/src/single_instance.rs || fail 'timeout wrapper missing in single_instance'
pass 'WM subprocess timeout wrappers in place'

echo ""
echo "All shell-restore guardrail checks passed."
