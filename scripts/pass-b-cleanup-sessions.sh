#!/usr/bin/env bash
# Safe Pass B session cleanup — user-scoped, executable/name precise.
# Avoids `pkill -f fceux` which matches Cursor agent sandboxes on dev machines
# (Permission denied storm; does not kill real emulators).
set -euo pipefail

USER="${USER:-$(whoami)}"
MODE="${1:-run}"

collect_exact() {
  local name="$1"
  pgrep -u "$USER" -x "$name" 2>/dev/null || true
}

collect_by_exe_suffix() {
  local suffix="$1"
  local pid exe
  for pid in $(pgrep -u "$USER" 2>/dev/null || true); do
    exe=$(readlink -f "/proc/$pid/exe" 2>/dev/null || continue)
    case "$exe" in
      *"/$suffix") echo "$pid" ;;
    esac
  done
}

collect_session_supervisors() {
  pgrep -u "$USER" -f '--xi-io-session-run' 2>/dev/null || true
}

describe_pid() {
  local pid="$1"
  ps -o pid=,stat=,cmd= -p "$pid" 2>/dev/null | sed 's/^[[:space:]]*//' | cut -c1-140
}

kill_pids() {
  local sig="$1"
  shift
  local pid
  for pid in "$@"; do
    [[ -n "$pid" ]] || continue
    if [[ "$MODE" == "dry-run" ]]; then
      echo "would kill -$sig $pid: $(describe_pid "$pid")"
    else
      kill "-$sig" "$pid" 2>/dev/null || true
    fi
  done
}

declare -a PIDS=()
mapfile -t _fceux < <(collect_exact fceux)
mapfile -t _retro < <(collect_exact retroarch)
mapfile -t _xiio < <(collect_by_exe_suffix xi-io-emulator)
mapfile -t _super < <(collect_session_supervisors)

for pid in "${_fceux[@]}" "${_retro[@]}" "${_xiio[@]}" "${_super[@]}"; do
  [[ -n "$pid" ]] && PIDS+=("$pid")
done

# Dedupe PIDs
if [[ ${#PIDS[@]} -gt 0 ]]; then
  mapfile -t PIDS < <(printf '%s\n' "${PIDS[@]}" | sort -u)
fi

status_line() {
  local label="$1"
  shift
  local pid
  local -a items=("$@")
  if [[ ${#items[@]} -eq 0 || -z "${items[0]:-}" ]]; then
    echo "$label: (none)"
    return
  fi
  echo "$label:"
  for pid in "${items[@]}"; do
    [[ -n "$pid" ]] || continue
    echo "  $(describe_pid "$pid")"
  done
}

case "$MODE" in
  status|--status)
    status_line "fceux (-x)" "${_fceux[@]}"
    status_line "retroarch (-x)" "${_retro[@]}"
    status_line "xi-io-emulator (exe)" "${_xiio[@]}"
    status_line "xi-io-session-run" "${_super[@]}"
    if [[ ${#PIDS[@]} -eq 0 ]]; then
      echo "clean — no Pass B session processes for user $USER"
    fi
    ;;
  dry-run|--dry-run)
    if [[ ${#PIDS[@]} -eq 0 ]]; then
      echo "clean — nothing to kill for user $USER"
      exit 0
    fi
    kill_pids TERM "${PIDS[@]}"
    ;;
  run|--run|"")
    if [[ ${#PIDS[@]} -eq 0 ]]; then
      echo "clean — no Pass B session processes for user $USER"
      exit 0
    fi
    echo "Stopping ${#PIDS[@]} Pass B session process(es) for user $USER…"
    kill_pids TERM "${PIDS[@]}"
    sleep 0.5
    for pid in "${PIDS[@]}"; do
      kill -0 "$pid" 2>/dev/null && kill_pids KILL "$pid"
    done
    echo "done"
    ;;
  *)
    echo "Usage: $0 [status|dry-run|run]" >&2
    exit 2
    ;;
esac
