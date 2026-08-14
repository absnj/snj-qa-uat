# Automatic failure triage

When the Playwright workflow fails, an agent looks at the failures, fixes the ones caused by UI changes, and opens a pull request. Everything happens inside this repo — it has no access to the app's source code.

| | |
| --- | --- |
| Workflow | `.github/workflows/playwright.yml` — the `triage` job |
| Agent | Codex (`openai/codex-action@v1`), model `gpt-5.6-sol` |
| Instructions given to it | `.claude/commands/triage-failures.md` |
| Browser access in CI | `.codex/config.toml` |
| Browser access locally | `.mcp.json` |

## When it runs

`triage` is its own job, running after `test` and `report` have finished. It only starts when two things are true: the test job failed, **and** the run was started manually. Pull request runs never trigger it — an agent reviewing its own PR would loop.

Being a separate job means it runs once against the merged result of all 4 shards. If it lived inside the test job it would run four times and open four PRs for one failure.

It rebuilds `results.json` from the merged shard data, downloads the screenshots and traces, and works from those.

## What it may and may not do

It fixes **outdated tests** — a renamed button, a restructured dialog, a moved field. It does not fix **app bugs**. When it can't tell which it's looking at, it's told to assume the app is broken, leave the test alone, and report it.

This is deliberate. An agent that makes every red test green is worse than no agent, because it turns real bugs into quiet passes.

Its only evidence is the running app. It opens the failing screen in a browser and reads the accessibility tree: if the control is there under a new name, the test is outdated; if it's missing, the app is broken. That single signal carries the whole judgement — so **read the "Suspected app regressions" section of every PR it opens.** That section is the point of the whole thing.

If every failure turns out to be an app bug or a flake, there's no PR to open, so it files an issue instead. That's why the job needs `issues: write`.

## Retries are off

CI doesn't retry failed tests, which keeps runs short. The trade-off: the agent can no longer tell a flake from a real break by looking at "failed then passed". It has to re-run the affected spec itself to check.

## Two agents, one repo

Development happens in Claude Code; CI triage runs on Codex. That costs nothing at runtime — the agent's output is a branch and a PR — but it creates two places for the same settings to drift apart. Three things to watch:

- **`CLAUDE.md` is a one-line import of `AGENTS.md`.** One rules file, both agents. Edit `AGENTS.md`; never add rules to `CLAUDE.md`.
- **`.codex/config.toml` and `.mcp.json` describe the same browser setup.** Nothing checks that they match. If the CI copy loses `--viewport-size=1536,900` or the `--storage-state` path, triage keeps running but quietly produces bad selectors. Change both together.
- **`@playwright/mcp` is pinned, and pinned to match `playwright` in `package.json`.** The agent's browser tooling expects a specific browser build; CI installs the one matching `package.json`. Let them drift and every browser call fails with `Browser "chrome-for-testing" is not installed`. `0.0.74` goes with `1.60`. Bump both together.

The instructions live under `.claude/commands/`, so you can also run `/triage-failures` locally in Claude Code against a failed run's artifacts to redo or continue a CI triage by hand.

## Setup

**Secrets** (Settings → Environments → `uat`): everything the test job already uses, plus `OPENAI_API_KEY`.

No personal access token needed — the agent pushes and opens PRs with the workflow's own `GITHUB_TOKEN`, which the job grants `contents: write`, `pull-requests: write` and `issues: write`.

You must also enable **Settings → Actions → General → "Allow GitHub Actions to create and approve pull requests"**, or the PR step fails at the very end.

## Operational notes

- **Time.** The test job caps at 30 minutes per shard, and triage at 60.
- **One at a time.** The `playwright-uat` concurrency group makes runs queue rather than overlap on shared UAT.
- **UAT is shared and stateful.** The agent is limited to read-only browsing while investigating, and to re-running only the affected specs while checking its fix. That's enforced by its instructions, not by the sandbox. Consider pointing it at a merchant account nobody depends on.
- **The workflow still goes red** when the suite failed, even if the agent opened a PR. The PR is a proposal, not a fix.
- **Sandbox settings are two separate things**, easy to confuse. `safety-strategy: drop-sudo` limits the agent process itself and is what keeps the API key out of reach. `permission-profile: triage` controls what files and network it can touch. Leaving the profile off falls back to a mode where `.git` is read-only and network is blocked, so the agent could edit tests but never commit or open a PR.
- **`codex-version` is pinned to `0.138.0`.** Permission profiles are a beta feature; on an older CLI it would silently fall back to the restricted sandbox and the agent would go quiet.
