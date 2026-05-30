#!/usr/bin/env bash
# Regenerate mechanical repo-health audit artifacts (read-only, no network required).
# Narrative audit: docs/project-tracking/repo-health-audit-2026-05.md

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
mkdir -p .tmp

echo "Writing .tmp/audit-git-status.txt ..."
git status > .tmp/audit-git-status.txt 2>&1 || true

echo "Writing .tmp/audit-git-branch.txt ..."
{
  echo "branch: $(git branch --show-current 2>/dev/null || echo unknown)"
  echo "remotes:"
  git remote -v 2>/dev/null || true
  echo "branches:"
  git branch -a 2>/dev/null || true
  if git rev-parse origin/main >/dev/null 2>&1; then
    echo "ahead_behind origin/main: $(git rev-list --left-right --count origin/main...HEAD 2>/dev/null || echo n/a)"
  fi
} > .tmp/audit-git-branch.txt

echo "Writing .tmp/audit-file-inventory.txt ..."
find . \
  -path './node_modules' -prune -o \
  -path './src-tauri/target' -prune -o \
  -path './src-tauri/.tmp' -prune -o \
  -path './.git' -prune -o \
  -path './.tmp/cargo-target' -prune -o \
  -path './.tmp' -prune -o \
  -type f -print | sort > .tmp/audit-file-inventory.txt

echo "Writing .tmp/audit-large-sources.txt ..."
find src src-tauri/src -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.rs' \) \
  -print0 2>/dev/null | xargs -0 wc -l 2>/dev/null | sort -nr | head -40 > .tmp/audit-large-sources.txt || true

echo "Writing .tmp/audit-suspicious-names.txt ..."
find . \
  -path './node_modules' -prune -o \
  -path './src-tauri/target' -prune -o \
  -path './src-tauri/.tmp' -prune -o \
  -path './.git' -prune -o \
  -path './.tmp' -prune -o \
  -type f -print | grep -Ei 'copy|backup|old|temp|final|latest|new|fixed|test2|draft|wip' \
  > .tmp/audit-suspicious-names.txt || true

echo "Writing .tmp/audit-hardcoded-paths.txt ..."
{
  grep -R --exclude-dir=.tmp --exclude-dir=node_modules --exclude-dir=target "/media/chrishallberg" src src-tauri 2>/dev/null || true
  grep -R --exclude-dir=.tmp --exclude-dir=node_modules --exclude-dir=target "/media/arcade-usb" src src-tauri 2>/dev/null || true
  grep -R --exclude-dir=.tmp --exclude-dir=node_modules --exclude-dir=target "Storage 22" src src-tauri 2>/dev/null || true
} > .tmp/audit-hardcoded-paths.txt || true

echo "Writing .tmp/audit-missing-docs.txt ..."
check_doc() {
  if [ -f "$1" ]; then echo "PRESENT: $1"; else echo "MISSING: $1"; fi
}
{
  check_doc docs/operations/launch-failure-codes.md
  check_doc docs/operations/troubleshooting-pass-b.md
  check_doc docs/framework/xibalba-ui-framework-standard-v1.md
  check_doc docs/project-tracking/master-plan-2026-05.md
  check_doc docs/project-tracking/admin-feature-audit-index.md
  check_doc docs/project-tracking/feature-matrix.md
  check_doc docs/project-tracking/repo-health-audit-2026-05.md
  check_doc docs/project-tracking/historical-plans-consolidation.md
  check_doc docs/contracts/hydration-completeness-checklist.md
  check_doc docs/contracts/arcade-surface-field-spec.md
} > .tmp/audit-missing-docs.txt

echo "Done. Artifacts in .tmp/audit-*.txt"
