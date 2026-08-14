#!/usr/bin/env bash
# Downloads a CI Playwright report and serves it on localhost — the same
# experience as `npx playwright show-report` after a local run, without the
# browse-to-Actions, download-zip, find-it-in-Downloads, unzip dance.
#
# The report artifact holds the HTML report only (traces and screenshots are
# uploaded separately as test-results-*), so this is a seconds-long download.
#
# Usage:
#   scripts/serve-ci-report.sh              # latest Playwright Tests run
#   scripts/serve-ci-report.sh 123456789    # a specific run id
#   scripts/serve-ci-report.sh --traces     # also fetch traces, so the trace
#                                           # viewer works for failed tests
set -euo pipefail

WITH_TRACES=0
RUN_ID=""

for arg in "$@"; do
  case "$arg" in
    --traces) WITH_TRACES=1 ;;
    *) RUN_ID="$arg" ;;
  esac
done

if ! command -v gh > /dev/null; then
  echo "The GitHub CLI (gh) is required: https://cli.github.com" >&2
  exit 1
fi

if [ -z "$RUN_ID" ]; then
  echo "Looking up the most recent Playwright Tests run..." >&2
  RUN_ID="$(gh run list --workflow=playwright.yml --limit 1 --json databaseId \
    --jq '.[0].databaseId')"
  if [ -z "$RUN_ID" ] || [ "$RUN_ID" = "null" ]; then
    echo "No Playwright Tests runs found." >&2
    exit 1
  fi
fi

DEST="$(mktemp -d)"
trap 'rm -rf "$DEST"' EXIT

echo "Downloading report from run $RUN_ID..." >&2
gh run download "$RUN_ID" --name playwright-report --dir "$DEST"

# Traces are keyed by the paths under test-results/, so they have to land
# alongside the report for the viewer to resolve them.
if [ "$WITH_TRACES" -eq 1 ]; then
  echo "Downloading traces (larger — this is the slow part)..." >&2
  gh run download "$RUN_ID" --pattern 'test-results-*' --dir "$DEST/test-results" || {
    echo "No trace artifacts on this run; serving the report without them." >&2
  }
fi

echo "Serving on localhost — press Ctrl+C to stop." >&2
npx playwright show-report "$DEST"
