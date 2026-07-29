# ShopNJoy UAT Test Automation

Playwright end-to-end tests for the ShopNJoy admin dashboard, run against a **shared, stateful UAT environment** (not a disposable per-run environment). Tests can create or modify real UAT data — read the isolation and cleanup notes below before adding or running scenarios.

For contribution rules (locator policy, fixture/teardown conventions, role tags, forbidden patterns), see `CLAUDE.md` / `AGENTS.md` at the repo root — those files are the enforced style guide and are kept in sync with each other. This README is the onboarding/reference doc: what exists today, how to run it, and where the known gaps are.

Extending the framework itself (a new page object, fixture, or API client)? See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for how the existing pieces are built and why. Reacting to an app change, or picking this suite up cold? See [`docs/MAINTAINERS.md`](docs/MAINTAINERS.md) for playbooks (new role, new spec module, new API endpoint, UI selector changed) and a troubleshooting guide for shared-UAT quirks.

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
tests/pages/             Page objects: selectors + direct UI interactions
tests/core/               Shared page/browser abstractions (BasePage, BaseComponent, BrowserManager)
tests/setup/              Env loading, global auth setup, generated storage state, traces
tests/config/             Environment config helpers
tests/testDataGenerators.ts   Unique test-data helpers (emails, phone numbers, titles)
playwright.config.ts     Projects (one per role), timeouts, reporters, shared browser options
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
| Merchant Success Staff (CRM) | `@merchant-success-staff` | `merchant-success-staff` |

Role groups live in `tests/specs/helpers/roles.ts` and compose these six into named sets (e.g. `DEAL_CREATOR_ROLES`, `NJOYBOOK_FULL_ACCESS_ROLES`) so specs iterate over the right subset instead of hardcoding role lists. A `superuser` credential exists in `.env` but has no project yet (`playwright.config.ts` has a `TODO` marker there).

`tests/setup/global.setup.ts` runs once before the suite: it logs in every role via `LoginPage`, saves storage state to `tests/setup/.auth/<role>.json` (untracked, regenerated each run), and then performs a **NJoyBook capacity reset** — it cancels active bookings on the two NJoyBook test branches (`Hajime - My Village`, `Hajime - Thomson Plaza`) so each run starts under the per-slot booking cap. This reset is non-fatal per branch (a failure warns but doesn't fail the suite) and must never run concurrently with the tests themselves — see [CI](#continuous-integration-github-actions) for how that's enforced.

Login/unauthenticated scenarios must use `test.use({ storageState: undefined })` (see `login.spec.ts`).

## Running Tests

```bash
# Parse configuration and list tests without executing UAT scenarios
npm test -- --list

# Run everything (all six role projects)
npm test

# Run one role project
npx playwright test --project=merchant-admin

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

Coverage is organized by spec file, which is the unit of "module" in this repo (there is no tag-based module split). All counts are test cases as written, including skipped/fixme ones (called out separately).

### `tests/specs/login.spec.ts` — Login
Roles: all 4 base roles (`ALL_ROLES`). Unauthenticated (`storageState: undefined`).
- Valid credentials redirect to the dashboard.
- Invalid credentials show `Invalid email or password.`

### `tests/specs/support/support.spec.ts` — Support
Roles: all 4 base roles.
- Creates a ticket successfully.
- Rejects an empty ticket subject / empty description / an overlong subject.

### `tests/specs/user-mgmt/create-user.spec.ts` — User Management
- **Create User** (`USER_MANAGEMENT_ADMIN_ROLES` = merchant-admin, branch-admin): happy-path staff creation.
- **Create User Validation** (same admin roles): ~20 cases covering empty/invalid first name, email (missing `@`, domain, local part), phone (non-numeric, too short, too long), password (too short, missing upper/lower/digit/special char, mismatch, empty), all-fields-empty, and accepted edge cases (minimum valid password length, hyphen/apostrophe in name).
  - **Skipped**: `rejects a duplicate email` (needs a review-submit validation locator or a flow to reopen the form after first success — no test-support gap documented beyond the inline TODO). `rejects when no role is selected` (needs a decision on how to exercise "no role selected" in the UI).
- **Access Control** (`USER_MANAGEMENT_STAFF_ROLES` = merchant-staff, branch-staff): confirms the "create staff" option is hidden.

### `tests/specs/config/deals.spec.ts` — Configuration ▸ Deals
- **Creator roles** (`DEAL_CREATOR_ROLES` = merchant-admin, branch-admin, merchant-staff): list view renders; a deal can be created end-to-end (manual build path).
- **Creator roles — validation**: ~14 cases — empty/overlong title, empty/overlong description, empty start/end date, end date before start, end time before start, zero/empty/negative/>100% deal value, zero/negative quantity, empty terms.
- **Read-only role** (`DEAL_READ_ONLY_ROLES` = branch-staff): list view renders; "create deal" button is hidden.

### `tests/specs/config/loyalty.spec.ts` — Configuration ▸ Loyalty Programs
- **Creator roles** (`LOYALTY_CREATOR_ROLES` = merchant-admin, branch-admin, merchant-staff): visit-based program with one reward; transaction-based (spend) program; visit-based with 5 rewards (the maximum); "Add Reward" disables at the 5-reward cap; empty visits-per-stamp / amount-per-stamp validation; empty/overlong program title; empty/overlong description; empty reward milestone/name/valid-until date; empty reward quantity is accepted (optional field).
- **Read-only role** (`LOYALTY_READ_ONLY_ROLES` = branch-staff): "create loyalty program" button is hidden.

### `tests/specs/config/njoybook-general.spec.ts` — Configuration ▸ Branch ▸ NJoyBook (Branch mode)
Exercised against **"Hajime - Thomson Plaza"** (Branch booking mode — slots show remaining table capacity, no staff assignment). Role: `NJOYBOOK_FULL_ACCESS_ROLES` (merchant-admin only — this is the only role with the advanced tabs).
- **Branch Mode Provisioning**: Staff tab hidden in Branch mode; all Branch-mode tabs visible; the reset helper correctly restores Branch mode (not Staff mode).
- **Guest History**: shopper/anonymous toggle and search render.
- **Time Slots — Weekday Visibility**: 10 slots/day for every weekday; the 11:30 Monday slot is active; deactivating a slot removes it from the public page.
- **Booking Page**: opens the public site in a new tab at the correct branch URL.
- **Rules — Enable Booking**: *fixme* — blocked on a per-branch "unavailable" signal (see [Known Gaps](#known-gaps-and-in-progress-work)).
- **Rules — Auto-Confirm**: *fixme* (×2) — blocked on a reCAPTCHA regression (see below).
- **Rules — Party Size Boundaries**: public page blocks below-min / above-max party size; saving max < min surfaces a validation error.
- **Rules — Persistence Across Reload**: enable-booking toggle; session length/slot interval/capacity/booking-window fields (7 fields, needs an extended 150s timeout); reminder checkboxes; confirmation message and terms rich text.
- **Bookings — Admin Add Booking**: admin-created booking lands Confirmed; required-field validation.
- **Bookings — Status Lifecycle**: check-in → complete; cancel (and confirm it locks further changes); detail record shows source/created/updated; mark no-show.
- **Bookings — Filters**: status filter narrows the list.
- **Blockouts**: create + delete a closed blockout; "Open with overrides" applies max-bookings/discount overrides.
- **End-to-End Booking**: full public booking flow — *fixme* (reCAPTCHA); a blockout correctly makes a date unbookable (passing).

### `tests/specs/config/njoybook-staff.spec.ts` — Configuration ▸ Branch ▸ NJoyBook (Staff mode)
Exercised against **"Hajime - My Village"** (Staff booking mode — bookable staff assigned per slot). Two staff fixtures, `booking-tester-staff-A`/`B`.
- **Full-access role** (merchant-admin): mirrors the General/Branch-mode suite's Rules, Time Slots, Bookings, and Blockouts coverage, plus:
  - **Staff — Bookable Toggle**: configured staff show Active by default (passing); toggling a staff member non-bookable to remove them from the public page is *fixme*, pending product clarification (the "bookable" flag doesn't currently drop the public specialist count — see [Known Gaps](#known-gaps-and-in-progress-work)).
  - **Bookings — Detail & Edit**: editing a booking's details is *fixme* (edit modal doesn't persist party-size changes / doesn't close on save in headless runs).
  - **End-to-End Booking**: standard flow *fixme* (reCAPTCHA); "No preference" staff selection *fixme* (not implemented on the public site yet); blockout-rejects-booking is passing.
- **Limited-access roles** (`NJOYBOOK_LIMITED_ROLES` = merchant-staff, branch-admin, branch-staff): advanced tabs are hidden; Bookings tab is reachable; Booking Page tab opens the public site. Fully parallel-safe (read-only).

**Cross-cutting NJoyBook notes:**
- Both NJoyBook spec files run with `test.describe.configure({ mode: 'default' })` — sequential, single worker, declaration order — because they read back the shared branch config they mutate. The two files target different branches and run on separate workers in parallel with each other.
- A companion planning doc, `njoybook-test-plan.md`, lists the originally scoped coverage (tagged `nJoyBook:<name>`) across all 6 tabs (Bookings, Guest History, Rules, Time Slots, Blockouts, Booking Page) — useful for spotting scenarios that were planned but not yet implemented (e.g. guest-history search/pagination/shopper-detail stats, time-slot add/edit/bulk-edit, blockout empty-state). Treat it as a backlog reference, not current-state documentation.

## Known Gaps and In-Progress Work

These are tracked as `test.fixme` or `test.skip` in the specs themselves (never silently dropped) — grep for `fixme`/`skip` before assuming a scenario is covered:

1. **reCAPTCHA regression (repo-wide)** — every public-booking-confirmation test (`Rules - Auto-Confirm` and `End-to-End Booking` in both NJoyBook spec files) reaches the review step correctly and fails only at "Confirm booking" with a reCAPTCHA error. Previously believed fixed for headless runs as of 2026-07-13; regressed since. Un-fixme all of these together once reCAPTCHA reliably passes headless.
2. **Per-branch "booking unavailable" signal** — `Rules - Enable Booking` tests assert a site-wide unavailability message, but with two branches now published on the shared public booking site, disabling one branch no longer triggers that message (the other stays bookable). Needs a per-branch signal (e.g. "no slots for this branch/date") before these can be un-fixme'd.
3. **Staff "bookable" toggle doesn't affect public specialist count** — needs product clarification on which control (bookable flag vs. "Active" toggle vs. de-assigning from Bulk Edit) is meant to remove a staff member from the public page.
4. **Booking edit modal (staff-mode)** — party-size changes don't persist and the modal doesn't close on save in headless runs; needs a trace-level investigation.
5. **Public "No preference" staff selection** — not implemented on the public booking site yet, despite the admin rule's helptext promising it.
6. **Duplicate-email / no-role-selected validation** (user creation) — both skipped pending either a reusable form-reopen flow or a decision on how to exercise "no role selected" in the UI.
7. **Superuser role** — credentials exist in `.env`; no Playwright project or tests exist yet (`playwright.config.ts` has an explicit `TODO`).

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
  - `module` — one spec file (`login`, `deals`, `loyalty`, `njoybook-general`, `njoybook-staff`, `support`, `user-mgmt`), or `all`. This is a hand-maintained mapping from module name to spec path in the workflow's `case` statement — **add a new `case` entry whenever a new spec file is added**, it does not auto-discover.
- **Concurrency guard** — `concurrency: { group: playwright-uat, cancel-in-progress: false }` at the workflow level queues a second dispatch behind one already running, rather than letting two runs race the same shared UAT branches (in particular, the NJoyBook capacity reset in global setup).
- **Secrets, not a committed `.env`** — the job writes `.env` from repo (or environment-scoped) secrets in a dedicated step, and removes it in an `if: always()` step after the run. Secret names mirror the `.env` variable names (`UAT_URL`, `UAT_MERCHANT_ADMIN_USER`/`PASSWORD`, etc. — see [Setup](#setup) below for the full list). Use `gh secret set --env-file .env` (optionally `--env <environment-name>`) to bulk-load them from a local `.env` file rather than adding them one at a time in the UI.
- **Artifacts** — the Playwright HTML report is uploaded (30-day retention) whether the run passes or fails, unless cancelled. Reports can contain sensitive UAT data — don't copy them elsewhere or paste their contents into issues/PRs.

Optional next step, not yet configured: a GitHub Environment (e.g. `uat`) scoping these secrets and adding required-reviewer approval before the job runs, for an extra manual gate on top of `workflow_dispatch`.

## Setup

`.env` at the repo root (never committed — see `.gitignore`) supplies the UAT URL and one username/password pair per role:

```env
UAT_URL=

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

- The old CSV-to-generator path has been removed from the active test workflow; generated specs are not the source of truth. Keep specs explicit — resist recreating a hidden generator through over-abstracted test definitions.
- `.playwright-mcp/` (Playwright MCP browser snapshots) is gitignored — it's local tooling scratch, not test output.
