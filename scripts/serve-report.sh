#!/usr/bin/env bash
# Serves a Playwright HTML report over localhost (http://), which trace
# viewer requires — a downloaded artifact zip opened via file:// won't work.
#
# Usage:
#   scripts/serve-report.sh                          # serve ./playwright-report
#   scripts/serve-report.sh path/to/playwright-report # serve an existing directory
#   scripts/serve-report.sh path/to/playwright-report.zip # unzip, then serve
set -euo pipefail

INPUT="${1:-playwright-report}"

if [ -d "$INPUT" ]; then
  REPORT_DIR="$INPUT"
elif [ -f "$INPUT" ]; then
  case "$INPUT" in
    *.zip) ;;
    *) echo "Not a directory or .zip file: $INPUT" >&2; exit 1 ;;
  esac
  REPORT_DIR="$(mktemp -d)"
  unzip -q "$INPUT" -d "$REPORT_DIR"
else
  echo "Not found: $INPUT" >&2
  echo "Usage: $0 [path/to/playwright-report | path/to/playwright-report.zip]" >&2
  exit 1
fi

npx playwright show-report "$REPORT_DIR"
