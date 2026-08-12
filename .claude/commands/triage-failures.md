---
description: Triage a failed Playwright run, fix selector drift, and open a PR
---

A Playwright run against shared UAT just failed. Triage it.

Structured results are at `results.json`. Failure context, screenshots, and
traces are under `test-results/`. You are running inside the test repo with
dependencies and browsers already installed and `.env` already written.

## 1. Read the failures

Parse `results.json` for every failing test. For each one record: spec file,
test title, role project, the failing locator or assertion, and the error class
(timeout waiting for locator / strict-mode violation / assertion mismatch /
navigation or auth failure).

Group failures that share a root cause. One page-object selector usually breaks
many specs across several role projects — that is one fix, not twenty.

Retries are off (`retries: 0`), so `results.json` gives you no failed-then-passed
signal to separate a flake from a hard break. You must produce that signal
yourself: re-run a suspected flake's spec, scoped to the one affected role
project, and see whether it reproduces. Do not classify anything as a flake on
the shape of the error alone.

## 2. Classify before you touch anything

This is the part that matters. For each group decide:

**A — Test drift.** The UI changed (a renamed button, a restructured dialog, a
moved field) and the test's locator no longer matches. The feature still works
for a user. → Fix the test.

**B — App regression.** The feature is broken, missing, or behaving wrongly. The
test is correct and is doing its job. → Do NOT touch the test. Record it.

**C — Flake or infrastructure.** Auth/global-setup failure, UAT downtime, a race
that does not reproduce on a scoped re-run. → Do NOT touch the test. Record it.

Your evidence is the live application. Use the Playwright MCP browser: navigate
to the failing screen on UAT and take an accessibility snapshot.

- The control the test looked for is present under a **new accessible name**, or
  moved into a different dialog/section → **A**.
- The control is **absent**, the page errors, or the flow cannot be completed by
  hand → **B**.
- The screen looks correct and the failure does not reproduce → **C**.

**When you cannot decide between A and B, treat it as B.** Silently rewriting a
test to match broken behavior destroys the only signal this suite exists to
produce. A PR that fixes three failures and reports two as suspected regressions
is a good outcome. A PR that "fixes" all five is a bad one.

## 3. Fix only the group-A failures

Follow `AGENTS.md` — it governs. Specifically:

- Derive every new locator from the live accessibility-tree snapshot, never by
  guessing from the old selector. `getByRole` with an accessible name first.
- All `Locator`s are constructed in the page-object constructor, never inline in
  a method. Parameterized locators go through a private factory off a
  constructor-held base.
- No XPath, no `locator('..')`, no styling-class selectors, no `.first()`/
  `.nth()` to silence strict mode, no `waitForTimeout`, no `force: true`, no
  global timeout bumps.
- Selectors and UI operations live in `tests/pages/`. Intent and assertions stay
  in `tests/specs/`. Do not move the boundary.
- Note the 1536px viewport constraint in `playwright.config.ts` — action button
  labels collapse to icon-only below it and lose their accessible name.

Keep the diff minimal. Do not reformat, do not refactor neighbouring selectors,
do not "improve" tests that passed.

## 4. Verify

Re-run only the affected specs and role projects, e.g.:

```
npx playwright test tests/specs/config/deals.spec.ts --project=merchant-admin
```

Iterate until they pass or you have exhausted a reasonable number of attempts.
If a fix will not converge, revert that file and reclassify the failure as B.

A fix you could not verify is not a fix. If verification cannot run at all, say
so explicitly in the PR body rather than presenting the change as confirmed.

Never re-run the full suite to verify — it takes an hour and hammers shared UAT.

## 5. Open the PR

Branch `test-fix/<run-id>` off the current commit. Commit only files under
`tests/`. Push and open the PR with the `gh` CLI.

Always pass `--base main`. The run may have been dispatched from a non-default
branch, and `gh` would otherwise target that branch instead of `main`.

Never commit: `.env`, `tests/setup/.auth/`, `tests/setup/traces/`,
`playwright-report/`, `test-results/`, `results.json`. Never weaken
`.gitignore`.

PR body, in this order:

1. **Fixed** — one line per group-A fix: what changed in the UI, what selector
   now matches, which specs and role projects it covers.
2. **Suspected app regressions** — one section per group-B failure: the test,
   what it expected, and what UAT actually does now. State plainly that this
   needs a human and may be a real bug.
3. **Flake / infrastructure** — group C, listed, not investigated further.
4. **Not fixed** — anything you could not resolve, and why.

Title: `test-fix: <n> selector fixes, <m> suspected regressions`.

If every failure is group B or C, open no PR. Instead open a GitHub issue titled
`Suspected app regressions from run <run-id>` with the same report, so the
signal is not lost.

## UAT is shared and stateful

While inspecting with the Playwright MCP browser: navigate, snapshot, and read.
Do not create, edit, or delete UAT records. Do not run state-mutating specs
outside the verification runs in step 4. If a correct fix would require a new
state-mutating scenario with no safe cleanup, do not write it — document the gap
in the PR body instead.
