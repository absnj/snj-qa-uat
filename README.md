# ShopNJoy UAT Test Automation

Playwright end-to-end tests for the ShopNJoy admin dashboard, run against a **shared, stateful UAT environment** (not a disposable per-run environment). Tests can create or modify real UAT data — read the isolation and cleanup notes below before adding or running scenarios.

For contribution rules (locator policy, fixture/teardown conventions, role tags, forbidden patterns), see `CLAUDE.md` / `AGENTS.md` at the repo root — those files are the enforced style guide and are kept in sync with each other. This README is the onboarding/reference doc: what exists today, how to run it, and where the known gaps are.

Extending the framework itself (a new page object, fixture, or API client)? See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for how the existing pieces are built and why. Reacting to an app change, or picking this suite up cold? See [`docs/MAINTAINERS.md`](docs/MAINTAINERS.md) for playbooks (new role, new spec module, new API endpoint, UI selector changed) and a troubleshooting guide for shared-UAT quirks. When CI fails, an agent triages the failures and opens a fix PR — see [`docs/AGENT-TRIAGE.md`](docs/AGENT-TRIAGE.md). [`docs/README.md`](docs/README.md) indexes all of them.

## Quick Start

```bash
npm install
cp .env.example .env   # fill in UAT_URL and role credentials (ask a teammate)
npx playwright install --with-deps
npm test -- --list     # sanity check: parses config, lists tests, makes no network calls
```

Then see [Running Tests](#running-tests).

## Architecture

```text
tests/specs/            Test intent, business scenarios, assertions (the readable test inventory)
  tests/specs/api/         API-level specs (no browser) — currently all skipped, see Known Gaps
  tests/specs/helpers/     Role definitions/groups and the API-client fixtures
tests/pages/             Page objects: selectors + direct UI interactions
tests/api/               API clients, one per resource (AuthApi, DealsApi, LoyaltyApi)
tests/core/               Shared page/browser/HTTP abstractions (BasePage, ApiClient, BaseComponent, BrowserManager)
tests/setup/              Env loading, global auth setup, generated storage state, traces
tests/config/             Environment config helpers
tests/testDataGenerators.ts   Unique test-data helpers (emails, phone numbers, titles)
playwright.config.ts     Projects (one per role, plus `api`), timeouts, reporters, shared browser options
schema.json              Captured API request/response examples — check field names here first
```

Specs own test intent and outcome assertions. Page objects own selectors and meaningful user actions (not arbitrary Playwright-call wrappers). Setup/fixtures own reusable state and guaranteed cleanup. There is no generated-spec or hidden data-driven test layer by design — every test's behavior and role coverage must be visible in the spec file itself.

TypeScript path aliases (`tsconfig.json`) — use these instead of long relative imports:

| Alias | Resolves to |
|---|---|
| `@core/*` | `tests/core/*` |
| `@pages/*` | `tests/pages/*` |
| `@config/*` | `tests/config/*` |
| `@components/*`, `@fixtures/*`, `@helpers/*` | declared but not yet populated |

`typescript` is not a declared project dependency — don't rely on `npx tsc --noEmit` as a verification step unless that's intentionally added.

## Roles and Auth

Six roles are modeled, each with its own credentials in `.env` and its own generated storage state:

| Role | Tag | Playwright project |
|---|---|---|
| Merchant Admin | `@merchant-admin` | `merchant-admin` |
| Merchant Staff | `@merchant-staff` | `merchant-staff` |
| Branch Admin | `@branch-admin` | `branch-admin` |
| Branch Staff | `@branch-staff` | `branch-staff` |
| Sales Agent (CRM) | `@sales-agent` | `sales-agent` |
| Merchant Success Staff (CRM) | `@merchant-success-staff` | `merchant-success-staff` (no tests yet — see [Known Gaps](#known-gaps-and-in-progress-work)) |

A seventh Playwright project, `api`, is not role-based: it runs `tests/specs/api/**` with no `storageState` and its own `baseURL` (`UAT_API_URL`), authenticating per-test with a bearer token instead of cookies.

Role groups live in `tests/specs/helpers/roles.ts` and compose these six into named sets (e.g. `DEAL_CREATOR_ROLES`, `NJOYBOOK_FULL_ACCESS_ROLES`) so specs iterate over the right subset instead of hardcoding role lists. A `superuser` credential exists in `.env` but has no project yet (`playwright.config.ts` has a `TODO` marker there).

`tests/setup/global.setup.ts` runs once before the suite: it logs in every role via `LoginPage`, saves storage state to `tests/setup/.auth/<role>.json` (untracked, regenerated each run), and then performs a **NJoyBook capacity reset** — it cancels active bookings on the two NJoyBook test branches (`Hajime - My Village`, `Hajime - Thomson Plaza`) so each run starts under the per-slot booking cap. This reset is non-fatal per branch (a failure warns but doesn't fail the suite) and must never run concurrently with the tests themselves — see [CI](#continuous-integration-github-actions) for how that's enforced.

Login/unauthenticated scenarios must use `test.use({ storageState: undefined })` (see `login.spec.ts`).

## Running Tests

```bash
# Parse configuration and list tests without executing UAT scenarios
npm test -- --list

# Run everything (all six role projects plus `api`)
npm test

# Run one role project
npx playwright test --project=merchant-admin

# Run the API project (no browser; needs UAT_API_* vars — see Setup)
npx playwright test --project=api

# Run one spec file
npx playwright test tests/specs/config/deals.spec.ts

# Run one test by title
npx playwright test -g "creates a deal successfully"

# Debug / headed
npx playwright test tests/specs/config/deals.spec.ts --debug
npm run test:headed

# View the last HTML report
npm run test:report
```

Prefer the smallest relevant check for a change: one spec against one role project, not the full matrix. Run `npm test` (the full matrix) only when you've confirmed credentials are set up and you're comfortable with the shared-UAT side effects.

## Test Coverage

**[`docs/COVERAGE.md`](docs/COVERAGE.md) is the inventory** — every case by name, which role projects run it, and whether it is active, skipped or fixme, with a spec × project matrix. It is generated from `npx playwright test --list`, so it cannot drift from the specs:

```bash
npm run docs:coverage   # regenerate after adding, removing or retagging a test
```

Never hand-edit that file. Regenerating when nothing changed produces a byte-identical result, so any diff means coverage actually moved.

The table below is orientation only — what each spec file is *about*. It deliberately carries no counts, so it does not go stale.

| Spec | Covers | Roles |
|---|---|---|
| `login.spec.ts` | Valid and invalid sign-in | 4 base roles, unauthenticated |
| `support/support.spec.ts` | Ticket creation and its field validation | 4 base roles |
| `user-mgmt/create-user.spec.ts` | Staff creation, extensive field validation, and that staff roles cannot reach it | admin roles + staff roles for access control |
| `config/deals.spec.ts` | Deal creation end-to-end, validation, and read-only enforcement | creator roles + branch-staff |
| `config/loyalty.spec.ts` | Visit- and spend-based programs, the five-reward maximum, validation | creator roles + branch-staff |
| `config/njoybook-general.spec.ts` | NJoyBook in **Branch mode** — rules, time slots, bookings, blockouts, public booking page | merchant-admin |
| `config/njoybook-staff.spec.ts` | NJoyBook in **Staff mode**, plus per-staff bookable toggles and limited-role tab visibility | merchant-admin + limited roles |
| `track/crm-contacts.spec.ts` | CRM contact lists, filters, and the ownership access gate — entirely read-only | sales-agent |
| `track/crm-capture-lead.spec.ts` | The capture-a-lead form and its validation — never submits | sales-agent |
| `api/*.spec.ts` | Auth, deals and loyalty at the HTTP layer — **all skipped**, see gap 8 | `api` project |

**Things the inventory can't tell you:**

- **The two NJoyBook specs target different branches on purpose.** `njoybook-general` runs against "Hajime - Thomson Plaza" (Branch mode, capacity-based, no staff); `njoybook-staff` runs against "Hajime - My Village" (Staff mode, specialist-based). Behaviour does not transfer between them. Both files use `test.describe.configure({ mode: 'default' })` — sequential within the file — because they read back branch config they mutate; they still run in parallel with each other, since the branches are independent.
- **`crm-contacts.spec.ts` hardcodes two UAT contacts** (`HANBAOBAO PTE. LTD.`, `TestCompany`) to exercise the ownership gate. If they're ever claimed or removed those tests fail loudly rather than silently pass — that's intended. Why the CRM locators look unusual is in [`tests/pages/sales-crm/README.md`](tests/pages/sales-crm/README.md).
- **Planned-but-unwritten NJoyBook scenarios** live in [`docs/njoybook-test-plan.md`](docs/njoybook-test-plan.md) — a backlog, not current state.

## Known Gaps and In-Progress Work

These are tracked as `test.fixme` or `test.skip` in the specs themselves (never silently dropped) — grep for `fixme`/`skip` before assuming a scenario is covered:

1. **reCAPTCHA regression (repo-wide)** — every public-booking-confirmation test (`Rules - Auto-Confirm` and `End-to-End Booking` in both NJoyBook spec files) reaches the review step correctly and fails only at "Confirm booking" with a reCAPTCHA error. Previously believed fixed for headless runs as of 2026-07-13; regressed since. Un-fixme all of these together once reCAPTCHA reliably passes headless.
2. **Per-branch "booking unavailable" signal** — `Rules - Enable Booking` tests assert a site-wide unavailability message, but with two branches now published on the shared public booking site, disabling one branch no longer triggers that message (the other stays bookable). Needs a per-branch signal (e.g. "no slots for this branch/date") before these can be un-fixme'd.
3. **Staff "bookable" toggle doesn't affect public specialist count** — needs product clarification on which control (bookable flag vs. "Active" toggle vs. de-assigning from Bulk Edit) is meant to remove a staff member from the public page.
4. **Booking edit modal (staff-mode)** — party-size changes don't persist and the modal doesn't close on save in headless runs; needs a trace-level investigation.
5. **Public "No preference" staff selection** — not implemented on the public booking site yet, despite the admin rule's helptext promising it.
6. **Duplicate-email / no-role-selected validation** (user creation) — both skipped pending either a reusable form-reopen flow or a decision on how to exercise "no role selected" in the UI.
7. **Superuser role** — credentials exist in `.env`; no Playwright project or tests exist yet (`playwright.config.ts` has an explicit `TODO`).
8. **The whole API suite is skipped on a UAT rate limit** — all three `tests/specs/api/` specs are `describe.skip`'d with `SKIP(api-rate-limit)`. UAT throttles `POST /v2/auth/sign-in`, and because every API test signs in first, the suite makes ~15 sign-ins in under 40s and starts getting 429s, so a *different* subset fails on every run. Verified 2026-08-06: tests pass individually, and `--workers=1` does not help — the limit is requests-per-window, not concurrency. Unblock by cutting sign-in volume (a worker-scoped fixture that signs in once per role and shares the token) or by raising the limit for the UAT test accounts. **Do not "fix" this with a sleep.**
9. **Logout may not invalidate sessions** — surfaced while writing `auth.spec.ts`: a second logout with an already-logged-out token *resolves* instead of rejecting. This is a possible backend issue, not just a test problem, and needs a human decision on whether the test's premise or the backend is wrong. Settle it before unskipping `auth.spec.ts`.
10. **CRM lifecycle scenarios are all `fixme`** — the CRM has no delete and no undo anywhere (a lead can only be closed Lost/Archived, remarks can't be removed, joining an agent queue is one-way), so creating/qualifying/closing a lead and adding a remark each leave a permanent shared-UAT record. Five `TODO(crm-cleanup)` fixmes across the two `track/` specs unblock together, once a contact delete/reset endpoint or a disposable sales agent exists.
11. **API specs are collected into the role projects too** — each role project's `testMatch` is `**/specs/**/*.spec.ts`, which also matches `specs/api/**`, and the API describes carry the same `@role` tags the projects `grep` on. `npm test -- --list` shows 26 API entries under the six role projects on top of the 54 under `api`. This is inert *only* because every API spec is currently skipped; unskipping them (gap 8) would run each one against the UI `baseURL` with browser storage state — and multiply the sign-in volume that caused the rate limit in the first place. Fix before unskipping: add `testIgnore: '**/specs/api/**'` to the six role projects.
12. **`merchant-success-staff` has a project but no tests** — credentials, storage state and a Playwright project all exist, but no spec tags `@merchant-success-staff`, so the project runs zero tests. The role is referenced only by the (skipped) `api/auth.spec.ts`. The CRM specs deliberately scope to `SALES_AGENT_ROLES`; extending them needs a decision on which CRM screens merchant success actually owns.

## Environment Constraints Worth Knowing

- **Booking capacity is shared and capped** — each NJoyBook branch's slots cap at a fixed number of bookings/day. Global setup resets *active* (Pending/Confirmed/Checked-in) bookings once per run, but terminal-state bookings (Cancelled/No-show/Completed) from earlier runs are not cleared and may still count against the cap on some days — if a test hangs waiting on the "Start time" combobox, this exhaustion is the likely cause, not a regression.
- **Admin-created bookings target "today"** — only today reliably has staffed/open slots on staging; future dates return a 400 ("Selected slot is not available").
- **`Set to Default` on the Rules tab only resets Rules** — it does not reset Time Slots, per-staff toggles, or delete created bookings. Tests that mutate those still aren't fully isolated by that helper alone.
- **The two NJoyBook test branches are configured differently on purpose** — "Hajime - Thomson Plaza" is Branch mode (capacity-based, no staff), "Hajime - My Village" is Staff mode (specialist-based). Don't assume behavior transfers between the two specs.

## Adding Tests

1. Put the test in the relevant file under `tests/specs/`, inside the role-describe loop that should run it (reuse or extend a role group in `tests/specs/helpers/roles.ts` rather than hardcoding a role list).
2. Add or reuse page-object methods in `tests/pages/` for any new selectors or UI interactions — methods should represent a meaningful user action or observable state, not a thin wrapper around a single Playwright call.
3. If the scenario needs setup/teardown, add a fixture (`test.extend`) rather than cleaning up inline at the end of the test body, so cleanup still runs after a failure.
4. If the scenario mutates shared UAT state, either generate unique data (see `tests/testDataGenerators.ts` and `tests/specs/config/njoybook.helpers.ts` for existing helpers — unique emails, phone numbers, guest names, deal/program titles, ISO dates) or restore shared config via fixture teardown. If neither isolation nor cleanup is possible, don't add the test — document the missing test-support capability in a comment instead (see the `fixme` entries above for the existing style).
5. Follow the locator hierarchy in `CLAUDE.md`/`AGENTS.md`: `getByRole` first, then `getByLabel`/`getByPlaceholder`/`getByText`/test id, scoped to a container; no XPath, no positional locators without a documented ordering contract, no `page.waitForTimeout()`, no `force: true` outside a scenario that specifically tests bypassing actionability.
6. Never leave `test.only` in committed code — CI's `forbidOnly` rejects it.

## Continuous Integration (GitHub Actions)

`.github/workflows/playwright.yml` runs the suite in CI. Key decisions, given this hits a shared, stateful environment:

- **Trigger: `workflow_dispatch` only** — no automatic run on push/PR. Someone must deliberately trigger it from the Actions tab, choosing:
  - `project` — one role project, or `all`.
  - `module` — one spec file (`login`, `deals`, `loyalty`, `njoybook-general`, `njoybook-staff`, `support`, `user-mgmt`, `crm-contacts`, `crm-capture-lead`), or `api` (the whole `tests/specs/api/` directory), or `all`. This is a hand-maintained mapping from module name to spec path in the workflow's `case` statement — **add a new `case` entry, and a matching `options` entry, whenever a new spec file is added**; it does not auto-discover.
- **Failure triage** — when the suite goes red on a `workflow_dispatch` run, an agent step triages the failures, fixes the ones caused by UI drift, and opens a PR. It does not run on `pull_request` (an agent triaging its own PR is a loop). Read the "Suspected app regressions" section of every PR it opens — see [`docs/AGENT-TRIAGE.md`](docs/AGENT-TRIAGE.md).
- **Concurrency guard** — `concurrency: { group: playwright-uat, cancel-in-progress: false }` at the workflow level queues a second dispatch behind one already running, rather than letting two runs race the same shared UAT branches (in particular, the NJoyBook capacity reset in global setup).
- **Secrets, not a committed `.env`** — the job writes `.env` from repo (or environment-scoped) secrets in a dedicated step, and removes it in an `if: always()` step after the run. Secret names mirror the `.env` variable names (`UAT_URL`, `UAT_MERCHANT_ADMIN_USER`/`PASSWORD`, etc. — see [Setup](#setup) below for the full list). Use `gh secret set --env-file .env` (optionally `--env <environment-name>`) to bulk-load them from a local `.env` file rather than adding them one at a time in the UI.
- **Artifacts** — the Playwright HTML report is uploaded (30-day retention) whether the run passes or fails, unless cancelled. Reports can contain sensitive UAT data — don't copy them elsewhere or paste their contents into issues/PRs.

Optional next step, not yet configured: a GitHub Environment (e.g. `uat`) scoping these secrets and adding required-reviewer approval before the job runs, for an extra manual gate on top of `workflow_dispatch`.

## Setup

`.env` at the repo root (never committed — see `.gitignore`) supplies the UAT URL and one username/password pair per role:

```env
UAT_URL=

# Only needed by the `api` project (tests/specs/api/). UAT_API_URL is the
# backend host and may differ from UAT_URL, which is the dashboard frontend.
# The store/branch IDs exist because Deals/Loyalty API payloads take raw IDs —
# the UI tests avoid this by clicking branches by display name.
UAT_API_URL=
UAT_API_MERCHANT_STORE_ID=
UAT_API_BRANCH_ID=

UAT_SUPERUSER_USER=
UAT_SUPERUSER_PASSWORD=

UAT_MERCHANT_ADMIN_USER=
UAT_MERCHANT_ADMIN_PASSWORD=

UAT_MERCHANT_STAFF_USER=
UAT_MERCHANT_STAFF_PASSWORD=

UAT_BRANCH_ADMIN_USER=
UAT_BRANCH_ADMIN_PASSWORD=

UAT_BRANCH_STAFF_USER=
UAT_BRANCH_STAFF_PASSWORD=

UAT_SALES_AGENT_USER=
UAT_SALES_AGENT_PASSWORD=

UAT_MERCHANT_SUCCESS_STAFF_USER=
UAT_MERCHANT_SUCCESS_STAFF_PASSWORD=
```

Get real values from a teammate or the team's secret store — never hardcode or print credentials. `tests/setup/.auth/` (generated login storage state) and `tests/setup/traces/` are untracked and regenerated by global setup on every run; don't hand-edit them.

## Notes

- Keep specs explicit. There is no generated-spec layer and shouldn't be one — resist recreating a hidden generator through over-abstracted test definitions.
- `.playwright-mcp/` (Playwright MCP browser snapshots), `playwright-report/`, `test-results/` and `results.json` are all gitignored local scratch, not test source. `results.json` in particular is the triage agent's structured input and can contain UAT data.
- `npm run report:serve` (`scripts/serve-report.sh`) serves a report over `http://`, which the trace viewer requires — a downloaded artifact zip opened via `file://` won't work. It accepts a directory or a `.zip`.
