# ShopNJoy UAT Test Automation

Playwright end-to-end tests for the ShopNJoy admin dashboard.

**New to this repo? Start with [`HANDOVER.md`](HANDOVER.md)** — setup, GitHub secrets, and first run.

These tests run against a **shared UAT environment**, not a fresh one per run. They create and change real UAT data, so read the isolation and cleanup notes below before adding or running scenarios.

The rules for writing tests (locators, fixtures, role tags, what's banned) live in [`AGENTS.md`](AGENTS.md). This README is the reference: what exists, how to run it, and what's still missing.

## Quick Start

```bash
npm install
cp .env.example .env   # fill in the URL and role logins
npx playwright install --with-deps
npm test -- --list     # lists tests, runs nothing, touches no UAT data
```

## Layout

```text
tests/specs/            What each test does — scenarios and assertions
  tests/specs/api/         API tests (no browser) — all switched off, see Known Gaps
  tests/specs/helpers/     Role definitions and API fixtures
tests/pages/             Page objects: selectors and UI actions
tests/api/               API clients, one per resource
tests/core/              Shared building blocks (BasePage, ApiClient)
tests/setup/             Env loading, login setup, saved sessions
tests/config/            Environment config helpers
tests/testDataGenerators.ts   Generates unique emails, phone numbers, titles
playwright.config.ts     Projects (one per role, plus `api`), timeouts, reporters
schema.json              Recorded API requests/responses — check field names here first
```

Specs say *what* is being tested. Page objects hold the selectors and the UI actions. Fixtures handle setup and cleanup. There is no generated-test layer, and there shouldn't be — every test's behaviour and role coverage should be readable in the spec file itself.

Import shortcuts (defined in `tsconfig.json`): `@core/*`, `@pages/*`, `@config/*`. Use these instead of long relative paths.

`typescript` isn't a dependency here, so `npx tsc --noEmit` isn't a check you can rely on.

## Roles and Login

Six roles, each with its own login in `.env` and its own saved session:

| Role | Tag | Playwright project |
|---|---|---|
| Merchant Admin | `@merchant-admin` | `merchant-admin` |
| Merchant Staff | `@merchant-staff` | `merchant-staff` |
| Branch Admin | `@branch-admin` | `branch-admin` |
| Branch Staff | `@branch-staff` | `branch-staff` |
| Sales Agent (CRM) | `@sales-agent` | `sales-agent` |
| Merchant Success Staff (CRM) | `@merchant-success-staff` | `merchant-success-staff` (no tests yet — see [Known Gaps](#known-gaps)) |

A seventh project, `api`, isn't role-based. It runs `tests/specs/api/**` with no saved session and its own base URL (`UAT_API_URL`), signing in per test with a token instead of cookies.

Role groups in `tests/specs/helpers/roles.ts` bundle these into named sets (`DEAL_CREATOR_ROLES`, `NJOYBOOK_FULL_ACCESS_ROLES`) so specs use the right subset instead of listing roles by hand. A `superuser` login exists in `.env` but has no project yet.

`tests/setup/global.setup.ts` runs once before everything:

1. Logs in as every role and saves the session to `tests/setup/.auth/<role>.json` (regenerated each run, never committed).
2. Cancels active bookings on the two NJoyBook test branches, so each run starts below the daily booking limit. If this fails for a branch it warns but doesn't stop the run.

Tests that need to be logged out must use `test.use({ storageState: undefined })` — see `login.spec.ts`.

## Running Tests

```bash
npm test -- --list                                   # list only, nothing runs
npm test                                             # everything (see the note below on runtime)
npx playwright test --project=merchant-admin         # one role
npx playwright test --project=api                    # API tests (needs UAT_API_* set)
npx playwright test tests/specs/config/deals.spec.ts  # one file
npx playwright test -g "creates a deal successfully"  # one test
npx playwright test tests/specs/config/deals.spec.ts --debug
npm run test:report                                  # open the last report
```

Run the smallest thing that covers your change — one spec against one role, not the whole matrix. Save `npm test` for when you're ready for the runtime and the UAT side effects.

**On runtime.** CI splits the suite across 4 machines, so a run finishes in roughly its slowest quarter. Locally everything shares one machine, so it takes considerably longer. The floor in both cases is `njoybook-general.spec.ts` and `njoybook-staff.spec.ts`: they run sequentially and can't be split, and each takes about 4–5 minutes on its own (measured 2026-08-13, merchant-admin only). UAT's own speed varies a lot between times of day, so treat any figure as a rough guide.

## Test Coverage

**[`docs/COVERAGE.md`](docs/COVERAGE.md) is the full inventory** — every test by name, which roles run it, and whether it's active or switched off. It's generated from the specs, so it can't drift:

```bash
npm run docs:coverage   # rerun after adding, removing or retagging a test
```

Never edit that file by hand. Regenerating with no changes gives an identical file, so any diff means coverage really moved.

The table below is orientation only — what each file is *about*. No counts, so it doesn't go stale.

| Spec | Covers | Roles |
|---|---|---|
| `login.spec.ts` | Valid and invalid sign-in | 4 base roles, logged out |
| `support/support.spec.ts` | Ticket creation and field validation | 4 base roles |
| `user-mgmt/create-user.spec.ts` | Staff creation, field validation, and that staff can't reach it | admins + staff for access checks |
| `config/deals.spec.ts` | Deal creation, validation, read-only enforcement | creator roles + branch-staff |
| `config/loyalty.spec.ts` | Visit- and spend-based programs, five-reward limit, validation | creator roles + branch-staff |
| `config/njoybook-general.spec.ts` | NJoyBook in **Branch mode** — rules, slots, bookings, blockouts, public page | merchant-admin |
| `config/njoybook-staff.spec.ts` | NJoyBook in **Staff mode**, per-staff toggles, limited-role tab visibility | merchant-admin + limited roles |
| `track/crm-contacts.spec.ts` | CRM contact lists, filters, ownership gate — read-only | sales-agent |
| `track/crm-capture-lead.spec.ts` | Capture-a-lead form and validation — never submits | sales-agent |
| `api/*.spec.ts` | Auth, deals, loyalty over HTTP — **all switched off**, see gap 8 | `api` project |

Things the inventory can't tell you:

- **The two NJoyBook specs target different branches on purpose.** `njoybook-general` uses "Hajime - Thomson Plaza" (Branch mode, capacity-based, no staff); `njoybook-staff` uses "Hajime - My Village" (Staff mode, specialist-based). Behaviour does not carry over between them. Both run sequentially within their own file because they read back config they change — but they still run in parallel with each other, since the branches are independent.
- **`crm-contacts.spec.ts` relies on two specific UAT contacts** (`HANBAOBAO PTE. LTD.`, `TestCompany`) to test the ownership gate. If those get claimed or deleted, the tests fail loudly rather than passing quietly. That's intended. Why the CRM selectors look odd: [`tests/pages/sales-crm/README.md`](tests/pages/sales-crm/README.md).
- **Planned but unwritten NJoyBook scenarios** are in [`docs/njoybook-test-plan.md`](docs/njoybook-test-plan.md) — a backlog, not a description of what exists.

## Known Gaps

All of these are marked in the specs with `test.fixme` or `test.skip`, never silently dropped. Search for `fixme` or `skip` before assuming something is covered.

1. **reCAPTCHA blocks public booking confirmation.** Every public-booking test in both NJoyBook files reaches the review step correctly and fails only at "Confirm booking". Worked headless as of 2026-07-13, broken since. **Re-confirmed 2026-08-14** by driving the flow directly: `POST https://staging.shopnjoy.com/api/recaptcha/verify` returns `400 "reCAPTCHA verification failed. Please try again."`, so the rejection is server-side on the public site, not a Playwright timing problem. Re-enable them together once reCAPTCHA passes reliably.
2. **No per-branch "booking unavailable" signal.** The `Rules - Enable Booking` tests check for a site-wide unavailable message, but with two branches published, turning one off no longer produces it. Needs a per-branch signal first.
3. **Staff "bookable" toggle doesn't change the public specialist count.** Needs a product decision on which control is meant to remove someone from the public page.
4. **Booking edit modal (staff mode).** Party-size changes don't save and the modal doesn't close on save in headless runs. Needs investigation.
5. **"No preference" staff option** isn't built on the public site yet, though the admin helptext promises it.
6. **Duplicate-email and no-role-selected validation** (user creation) — both need either a reusable form-reopen step or a decision on how to test "no role selected".
7. **Superuser role** — login exists in `.env`, but no project and no tests.
8. **All API tests are switched off** with `SKIP(api-rate-limit)`. UAT limits `POST /v2/auth/sign-in`, and every API test signs in first — roughly 15 sign-ins in under 40 seconds, so a different set fails each run. Confirmed 2026-08-06: they pass one at a time, and `--workers=1` doesn't help, because the limit is per time window rather than per connection. Fix by signing in once per role and sharing the token, or by raising the limit for the test accounts. **Do not paper over this with a sleep.**
9. **Logout may not end the session.** Found while writing `auth.spec.ts`: logging out twice with an already-expired token succeeds instead of failing. This may be a backend bug rather than a test bug. Settle it before re-enabling `auth.spec.ts`.
10. **CRM lifecycle tests are all switched off.** The CRM has no delete and no undo — a lead can only be closed, remarks can't be removed, joining an agent queue is one-way. So each of these leaves a permanent record in shared UAT. Five `TODO(crm-cleanup)` markers across the `track/` specs unblock together, once there's a way to delete a contact or a disposable sales agent account.
11. **API specs also get picked up by the role projects.** Each role project matches `**/specs/**/*.spec.ts`, which includes `specs/api/**`, and the API tests carry the same role tags. Harmless *only* because they're all switched off — re-enabling them (gap 8) would run each against the UI base URL with browser sessions, and multiply the sign-in volume that caused the rate limit. Add `testIgnore: '**/specs/api/**'` to the six role projects before re-enabling.
12. **`merchant-success-staff` has a project but no tests.** Login, session and project all exist, but nothing tags `@merchant-success-staff`, so it runs zero tests. Needs a decision on which CRM screens that role owns.
13. **Three admin-booking tests on the Staff-mode branch need staffed slots for *today*.** Skipped in `njoybook-staff.spec.ts`: Admin Add Booking, the check-in/complete lifecycle, and the status filter. Creating the booking returns `400 {"message":"Selected slot is not available"}` — confirmed against UAT on 2026-08-14 with today's booking list empty, so this is *not* the capacity cap in gap-adjacent quirks below. On a Staff-mode branch a slot is only bookable with a bookable staff member assigned, the dropdown offers unstaffed slots anyway, and nothing in the spec guarantees today's weekday is staffed. The sibling tests that still pass rely on the same unguaranteed precondition, so expect them to fail on a different weekday. Fix needs a fixture that staffs the current weekday, or a branch reserved for today-scoped booking tests — see [`docs/njoybook-test-plan.md`](docs/njoybook-test-plan.md#missing-test-support-capability-staffed-slots-for-today).

## UAT Quirks Worth Knowing

- **Booking capacity is shared and capped.** Each NJoyBook slot has a daily booking limit. Global setup clears *active* bookings, but Cancelled/No-show/Completed ones from earlier runs still count against the cap. If a test hangs waiting on the "Start time" dropdown, this is the usual cause — not a regression.
- **Admin-created bookings target today.** Only today reliably has open slots on staging; future dates return a 400.
- **"Set to Default" on the Rules tab only resets Rules.** It doesn't reset Time Slots, per-staff toggles, or delete bookings.
- **The two NJoyBook branches are configured differently on purpose** — Thomson Plaza is Branch mode, My Village is Staff mode.

## Adding Tests

1. Put it in the right file under `tests/specs/`, inside the role loop that should run it. Reuse or extend a group in `tests/specs/helpers/roles.ts` rather than listing roles inline.
2. Add page-object methods in `tests/pages/` for any new selectors. Methods should represent a real user action, not wrap a single Playwright call.
3. Need setup or cleanup? Write a fixture (`test.extend`), not cleanup at the end of the test body — a failed assertion skips the end of the body, but fixture teardown always runs.
4. Changing shared UAT data? Either generate unique data (`tests/testDataGenerators.ts`, `tests/specs/config/njoybook.helpers.ts`) or restore what you changed in fixture teardown. If you can do neither, don't add the test — write down the missing capability instead.
5. Follow the locator rules in [`AGENTS.md`](AGENTS.md): `getByRole` first, scoped to a container. No XPath, no `page.waitForTimeout()`, no `force: true` outside tests that specifically check it.
6. Never commit `test.only` — CI rejects it.

## Continuous Integration

`.github/workflows/playwright.yml`. See [`HANDOVER.md`](HANDOVER.md) for first-time setup.

- **Two triggers.** *Manual* (Actions tab) lets you pick a role project and a feature module. *Pull request* runs automatically when test code changes, scoped to `merchant-admin` so it costs minutes rather than an hour.
- **The module dropdown is hand-maintained.** It's a `case` statement mapping module name to spec path — it does not find new specs on its own. Add a `case` entry *and* an `options` entry whenever you add a spec file.
- **Split across 4 machines**, then merged into one report. Total time is roughly the slowest quarter, not the sum.
- **One run at a time.** A second run queues behind the first rather than racing it on the same UAT branches.
- **Automatic failure triage.** When a manual run fails, an agent sorts the failures, fixes ones caused by UI changes, and opens a PR. It doesn't run on pull requests. Read the "Suspected app regressions" section of every PR it opens — see [`docs/AGENT-TRIAGE.md`](docs/AGENT-TRIAGE.md).
- **Secrets, never a committed `.env`.** The job writes `.env` from the `uat` environment's secrets and deletes it afterwards, pass or fail. Secret names match the `.env` variable names.
- **Artifacts** are kept 30 days, split in two: the merged HTML report, and the traces/screenshots. `npm run report:ci` pulls just the report, so it opens in seconds. They can contain real UAT data — don't copy them elsewhere or paste them into issues.

## Configuration

`.env` at the repo root (never committed) holds the UAT URL and one username/password per role. See [`.env.example`](.env.example) for the full list and [`HANDOVER.md`](HANDOVER.md) for the matching GitHub secrets.

Get real values from the team's secret store. Never hardcode or print credentials.

`tests/setup/.auth/` and `tests/setup/traces/` are generated on every run and aren't tracked — don't edit them by hand.

## Notes

- Keep specs explicit. There's no test-generator layer and there shouldn't be one.
- `.playwright-mcp/`, `playwright-report/`, `test-results/` and `results.json` are local scratch, all gitignored. `results.json` feeds the triage agent and can contain UAT data.
- `npm run report:serve` serves a report over `http://`, which the trace viewer needs. Opening a downloaded report via `file://` won't work. It accepts a folder or a `.zip`.
- `npm run report:ci` does the same for a CI run without the download-and-unzip detour: it fetches the merged report with `gh` and serves it on localhost. No argument uses the most recent run; pass a run id for an older one. Add `--traces` when you need the trace viewer for a failure — that's the slow, large download, which is why it's opt-in.
