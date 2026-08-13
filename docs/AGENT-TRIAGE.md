# Automated failure triage

When the Playwright workflow fails, an agent triages the failures, fixes the
ones caused by UI changes, and opens a PR. Everything happens inside this repo —
there is no cross-repo trigger and no app-repo access.

| | |
| --- | --- |
| Pipeline | `.github/workflows/playwright.yml` (triage is a step, not a separate workflow) |
| Triage agent | Codex (`openai/codex-action@v1`), model `gpt-5.6-sol` |
| Agent instructions | `.claude/commands/triage-failures.md` |
| MCP server (CI) | `.codex/config.toml` |
| MCP server (local dev) | `.mcp.json` |

## How it runs

Triage is a failure-gated step in the existing test job, so it inherits the
installed browsers, `node_modules`, and `.env` rather than rebuilding them. The
run produces `results.json` (structured failures) alongside the HTML report, and
uses `--retries=1` so the agent can distinguish a hard break from a flake.

It fires only on `workflow_dispatch`. On `pull_request` the suite runs but
triage does not — an agent triaging its own PR is a loop.

## What the agent may and may not do

It fixes **test drift** — a renamed button, a restructured dialog, a moved
field. It does not fix **app regressions**. When it cannot tell the difference,
it is instructed to assume regression, leave the test alone, and report it. This
is deliberate: an agent that makes every red test green is worse than no agent,
because it converts real bugs into silent passes.

Its only evidence is the live application. It opens the failing screen through
the Playwright MCP browser and reads the accessibility tree: control present
under a new name means drift, control absent means regression. Without an app
diff to corroborate, that single signal carries the whole classification — so
read the "Suspected app regressions" section of every PR it opens. That section
is the point.

## Two agents, one repo

Development happens in Claude Code; CI triage runs on Codex. The split costs
nothing at runtime — the agent's output is a git branch and a PR — but it
creates two places for the same configuration to drift. Two guards:

- **`CLAUDE.md` is a one-line `@AGENTS.md` import.** One instruction file, both
  agents. Edit `AGENTS.md`; never add rules to `CLAUDE.md`.
- **`.codex/config.toml` and `.mcp.json` define the same MCP server.** Nothing
  enforces this. If the CI copy loses `--viewport-size=1536,900` or the
  `--storage-state` path, triage keeps running and silently produces bad
  locators. Change both in the same PR.
- **`@playwright/mcp` is pinned, and pinned to `playwright` in `package.json`.**
  The MCP server launches the browser build its own bundled playwright-core
  expects; CI installs browsers for the version in `package.json`. `@latest`
  drifts ahead and every browser call fails with `Browser "chrome-for-testing"
  is not installed`. `0.0.74` pairs with `1.60`. Bump the two together.

The prompt lives under `.claude/commands/` so you can also run
`/triage-failures` locally in Claude Code against a failed run's artifacts to
reproduce or continue a CI triage by hand.

## Setup

**Secrets** (Settings → Environments → `uat`): everything the workflow already
used, plus:

| Secret | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Runs the triage agent |
| `UAT_API_URL`, `UAT_API_MERCHANT_STORE_ID`, `UAT_API_BRANCH_ID` | Needed by the `api` project, which the workflow previously never set |

No PAT is required — the agent pushes and opens PRs with the workflow's own
`GITHUB_TOKEN`, which the job grants `contents: write` and
`pull-requests: write`.

Enable Settings → Actions → General → "Allow GitHub Actions to create and
approve pull requests", or the `gh pr create` call fails.

## Operational notes

- **Runtime.** A full suite is up to an hour, plus agent time. The job caps at
  90 minutes.
- **Serialisation.** The `playwright-uat` concurrency group means runs queue
  rather than overlap on shared UAT.
- **UAT is stateful.** The suite itself mutates UAT. The agent is restricted to
  read-only browsing while investigating and to re-running only affected specs
  while verifying — but that is prompt-level, not enforced. Consider pointing it
  at a merchant account whose data nobody depends on.
- **Retries.** CI uses `--retries=1`; the committed config stays at `0`, so
  local runs are unchanged.
- **PR runs are scoped.** `pull_request` defaults to `merchant-admin` across all
  specs so verifying a PR costs minutes, not an hour.
- **The workflow still fails red** when the suite failed, even if the agent
  opened a PR. The PR is a proposal, not a resolution.
