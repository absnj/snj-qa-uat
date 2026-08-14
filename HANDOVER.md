# Handover

Automated browser tests for the ShopNJoy admin dashboard, written with [Playwright](https://playwright.dev). They sign in as each user role and click through real screens to check the app still works.

**These tests run against the shared UAT environment.** They create and change real UAT data. There is no throwaway database — treat a test run as something that touches an environment other people are using.

## Before you start

- Node.js (any current LTS version) and npm
- Admin rights on the GitHub repo, so you can add secrets
- The UAT login details — one username and password for each of the six roles, plus a superuser. Get these from the QA team.

## Step 1 — Put the code in your org

Unzip the download, then:

```bash
cd snj-qa-uat
git init
git add .
git commit -m "Initial import of UAT test suite"
git remote add origin https://github.com/<your-org>/<your-repo>.git
git push -u origin main
```

Check that `.env`, `tests/setup/.auth/`, `playwright-report/` and `test-results/` did **not** get committed. They hold passwords and UAT data, and `.gitignore` already excludes them. If any show up in `git status`, stop and sort that out first.

## Step 2 — Run it on your machine

```bash
npm install
cp .env.example .env          # then fill in the real values
npx playwright install --with-deps
npm test -- --list            # safe check: lists the tests, runs nothing
```

If the last command prints a list of test names, everything is wired up correctly. It makes no network calls and touches no UAT data.

To actually run something small:

```bash
npx playwright test tests/specs/login.spec.ts --project=merchant-admin
```

Then `npm run test:report` to open the results.

`npm test` on its own runs everything. That takes up to an hour and changes UAT data, so don't make it your first move.

## Step 3 — Set up GitHub

### 3a. Create the environment

Go to **Settings → Environments → New environment** and name it `uat`. The workflow expects this exact name.

You can also add required reviewers here if you want someone to approve each run before it touches UAT. That's optional.

### 3b. Add the secrets

Inside the `uat` environment, add these. The names must match exactly — the workflow writes them straight into a `.env` file at the start of each run.

| Secret | What it is |
|---|---|
| `UAT_URL` | Web address of the admin dashboard |
| `UAT_API_URL` | Web address of the backend API (may be different from the one above) |
| `UAT_API_MERCHANT_STORE_ID` | Store ID used by the API tests |
| `UAT_API_BRANCH_ID` | Branch ID used by the API tests |
| `UAT_SUPERUSER_USER` / `UAT_SUPERUSER_PASSWORD` | Superuser login |
| `UAT_MERCHANT_ADMIN_USER` / `UAT_MERCHANT_ADMIN_PASSWORD` | Merchant Admin login |
| `UAT_MERCHANT_STAFF_USER` / `UAT_MERCHANT_STAFF_PASSWORD` | Merchant Staff login |
| `UAT_BRANCH_ADMIN_USER` / `UAT_BRANCH_ADMIN_PASSWORD` | Branch Admin login |
| `UAT_BRANCH_STAFF_USER` / `UAT_BRANCH_STAFF_PASSWORD` | Branch Staff login |
| `UAT_SALES_AGENT_USER` / `UAT_SALES_AGENT_PASSWORD` | Sales Agent login |
| `UAT_MERCHANT_SUCCESS_STAFF_USER` / `UAT_MERCHANT_SUCCESS_STAFF_PASSWORD` | Merchant Success Staff login |
| `OPENAI_API_KEY` | Only for the automatic failure triage — see Step 3d |

Faster than adding them one at a time: once your local `.env` is filled in and working, upload the whole file.

```bash
gh secret set --env uat --env-file .env
```

Then add `OPENAI_API_KEY` separately, since it isn't in `.env`.

### 3c. Allow the workflow to open pull requests

**Settings → Actions → General → Workflow permissions**, and tick *"Allow GitHub Actions to create and approve pull requests"*.

Skip this and the triage step in Step 3d fails at the very end, after everything else has already run.

### 3d. Decide about automatic failure triage

When a run fails, the workflow calls an AI agent that looks at each failure and sorts it into one of two buckets:

- **The test is out of date** — a button was renamed, a dialog moved. It fixes the test and opens a pull request.
- **The app is genuinely broken** — it leaves the test alone and writes up what it saw.

When it can't tell which, it assumes the app is broken and reports it rather than "fixing" the test. That's deliberate: an agent that turns every red test green would hide real bugs.

**Always read the "Suspected app regressions" section of any PR it opens.** That section is the actual point of the feature — the automatic fixes are the easy part.

It needs `OPENAI_API_KEY` to run. If you'd rather not use it, delete the `triage` job from `.github/workflows/playwright.yml` and skip that secret. Everything else keeps working.

Details in [`docs/AGENT-TRIAGE.md`](docs/AGENT-TRIAGE.md).

## Step 4 — Run it in CI

Go to the **Actions** tab, pick **Playwright Tests**, and click **Run workflow**. Two dropdowns:

- **project** — which role to test as, or `all`
- **module** — which feature area to test, or `all`

The work is split across 4 machines and combined into one report at the end. Download the `playwright-report` artifact from the run, then:

```bash
npm run report:ci -- <run-id>
```

That serves the report locally. Opening the downloaded file directly in a browser won't work properly — the trace viewer needs a real web server.

Runs also happen automatically on pull requests that touch test code, scoped down to just the `merchant-admin` role so they finish in minutes.

Two runs never overlap. A second one waits for the first to finish, so they can't collide on shared UAT data.

## What isn't finished

The suite has known gaps, all deliberately marked in the code rather than quietly dropped. The big ones:

- **All API tests are switched off.** UAT rate-limits the sign-in endpoint and every API test signs in first, so they fail unpredictably. Needs a shared login token or a higher rate limit for the test accounts.
- **Public booking confirmation tests fail on reCAPTCHA.** They get all the way to the final step and stop there.
- **A few booking tests depend on which day of the week they run.** Explained in `docs/njoybook-test-plan.md`.

The full list, with reasons, is in [README's Known Gaps](README.md#known-gaps-and-in-progress-work).

## Where to read next

| Doc | Read it when |
|---|---|
| [`README.md`](README.md) | What the suite covers today and how to run it |
| [`AGENTS.md`](AGENTS.md) | Writing or changing a test — the rules the team follows |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Adding a new page object, fixture, or API client |
| [`docs/MAINTAINERS.md`](docs/MAINTAINERS.md) | Something changed in the app and a test broke |
| [`docs/COVERAGE.md`](docs/COVERAGE.md) | "Is X tested, and by which roles?" |

## Two things to keep in mind

**UAT is shared.** Tests create bookings, deals, staff members and support tickets that stay there. Some can't be cleaned up because the app has no delete for them. If you point this suite at a merchant account other people rely on, expect complaints.

**Reports contain real UAT data.** Test reports, screenshots and traces can include customer names and contact details. Don't paste them into tickets or chat, and don't loosen the `.gitignore` rules that keep them out of the repo.
