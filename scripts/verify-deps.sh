#!/usr/bin/env bash
# Dependency supply-chain gate — run before merge and on agent start for security slices.
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

echo "[verify-deps] npm audit..."
if ! npm audit --audit-level=moderate; then
  fail "npm audit reported moderate or higher vulnerabilities"
fi
pass "npm audit clean (moderate+)"

if command -v cargo-audit >/dev/null 2>&1; then
  echo "[verify-deps] cargo audit..."
  (cd src-tauri && CARGO_TARGET_DIR="${CARGO_TARGET_DIR:-../.tmp/cargo-target}" cargo audit)
  pass "cargo audit completed"
else
  echo "WARN: cargo-audit not installed — skip Rust audit (install: cargo install cargo-audit)"
fi

echo ""
echo "All dependency checks passed."
