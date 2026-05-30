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
grep -q 'finish_shell_restore_success' src-tauri/src/lib.rs || fail 'finish_shell_restore_success not used in lib.rs'

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

# Short-session failure detection + single session-finish path
grep -q 'session_reached_game' src-tauri/src/lib.rs || fail 'session_reached_game logic missing'
grep -q 'try_finish_emulator_session' src-tauri/src/lib.rs || fail 'try_finish_emulator_session missing'
grep -q 'finish_shell_restore_success' src-tauri/src/shell_restore.rs || fail 'finish_shell_restore_success missing'
pass 'short-session failure detection wired'

# Restore failure signal (PRH-02 / XIO-LCH-008)
grep -q 'shell_focus_restore_failed' src/components/ArcadeHome.tsx src/components/AppShell.tsx 2>/dev/null \
  || fail 'shell_focus_restore_failed ledger wiring missing'
grep -q 'shellRestoreFailure' src/components/ArcadeHome.tsx || fail 'shell restore failure UI missing'
grep -q 'role="alert"' src/components/ArcadeHome.tsx || fail 'shell restore failure banner missing'
grep -q 'shell-focus-restore-failed' src-tauri/src/lib.rs || fail 'shell-focus-restore-failed event missing in lib.rs'
grep -q 'ShellRestoreResult' src-tauri/src/shell_restore.rs || fail 'ShellRestoreResult missing'
grep -q 'reason_code' src-tauri/src/shell_restore.rs || fail 'restore reason_code field missing'
grep -q 'unminimize' src-tauri/src/window_registry.rs || fail 'wake_shell must call unminimize after show'
grep -q 'tauri_window_missing' src-tauri/src/window_registry.rs || fail 'restore reason codes missing'
grep -q 'emit_shell_focus_restore_result' src-tauri/src/lib.rs || fail 'emit_shell_focus_restore_result missing'
grep -q 'emulator_exited' src/components/AppShell.tsx \
  || fail 'AppShell must emit emulator_exited ledger on session finish'

if grep -q "addLedgerEvent('shell_focus_restored'" src/components/ArcadeHome.tsx 2>/dev/null; then
  fail 'ArcadeHome must not duplicate shell_focus ledger (AppShell owns ledger)'
fi
pass 'shell_focus_restore_failed wired'

# No global emulator pkill reintroduced
if grep -rE 'pkill\s+-x\s+fceux|pkill\s+-f\s+fceux' src-tauri/src --include '*.rs' 2>/dev/null; then
  fail 'global fceux pkill reintroduced'
fi
pass 'no global fceux pkill'

# Safe operator cleanup script (Pass 12 — avoids pkill -f fceux on Cursor sandboxes)
test -x scripts/pass-b-cleanup-sessions.sh || fail 'pass-b-cleanup-sessions.sh missing or not executable'
grep -q 'cleanup:sessions' package.json || fail 'npm cleanup:sessions script missing'
bash scripts/pass-b-cleanup-sessions.sh status >/dev/null || fail 'pass-b-cleanup-sessions.sh status failed'
pass 'pass-b-cleanup-sessions operator script wired'

# WM tools use timeout wrapper
grep -q 'run_subprocess_with_timeout' src-tauri/src/window_registry.rs || fail 'timeout wrapper missing in window_registry'
grep -q 'run_subprocess_with_timeout' src-tauri/src/single_instance.rs || fail 'timeout wrapper missing in single_instance'
pass 'WM subprocess timeout wrappers in place'

echo ""
echo "All shell-restore guardrail checks passed."
