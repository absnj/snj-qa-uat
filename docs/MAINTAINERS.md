# Maintainer Playbooks

Short, scannable "what do I touch" guides for common changes, plus a troubleshooting section for shared-UAT quirks that look like bugs but aren't. For *how the framework is built* (POM conventions, fixture patterns, API layer), see [`ARCHITECTURE.md`](./ARCHITECTURE.md). For the enforced style rules, see [`CLAUDE.md`](../CLAUDE.md) / `AGENTS.md`. For what exists today and how to run it, see [`README.md`](../README.md).

## Playbook: a UI element changed (selector, label, or flow)

1. Find the owning page object. `tests/pages/` mirrors the app's navigation structure (e.g. Configuration → Deals → Create → Manual is `tests/pages/configuration/deals/create/manual/`), so the page object to fix is usually the one whose folder matches where the element lives in the app.
2. Update the locator in that page object's constructor — never inline it into a method. Follow the locator hierarchy in `CLAUDE.md`: `getByRole` with an accessible name first, then `getByLabel`/`getByPlaceholder`/`getByText`/test id, scoped to a container.
3. If the element's *behavior* changed (e.g. a button that used to be always-visible is now conditionally rendered), check whether any `expectXAvailable`/`expectXUnavailable`-style assertion helpers on that page object need to change too — see `DealsPage.expectCreateDealAvailable`/`expectCreateDealUnavailable` for the existing shape.
4. Re-run the smallest affected spec against the smallest relevant role before running anything broader:
   ```bash
   npx playwright test tests/specs/config/deals.spec.ts --project=merchant-admin
   ```
5. If the change affects a shared base page (`ConfigBasePage`, `AdminBasePage`, etc.), grep for other page objects extending it before assuming the fix is isolated — a shared-nav change can ripple across a whole section.

## Playbook: a new role was added

Touch every one of these — missing one means the role silently doesn't get exercised, or CI can't run it:

1. **`.env.example`** — add `UAT_<ROLE>_USER` / `UAT_<ROLE>_PASSWORD` placeholders, matching the `<ROLE>` naming already in use (uppercase, underscores).
2. **`tests/specs/helpers/roles.ts`** — add the role to the `ROLES` map (`label`, `normalized`, `tag`), and add it to whichever existing role groups (or a new group) should include it. This is the single source of truth other files read from.
3. **`playwright.config.ts`** — add a new project entry (`name`, `use.storageState`, `testMatch`, `grep: /@new-role-tag/`), mirroring the existing six.
4. **`tests/setup/global.setup.ts`** — the role must be reachable from the `[...ALL_ROLES, ...ALL_CRM_ROLES]` spread (or add it to whichever array feeds the loop) so its storage state actually gets generated on setup. If it's a CRM-style role landing on `AdminHomePage` after login, it belongs with `ALL_CRM_ROLES`, not `ALL_ROLES`.
5. **`.github/workflows/playwright.yml`** — add the role to the `project` choice-input `options` list, and add its two credential secrets to the `Write .env` heredoc step.
6. **GitHub repo secrets** — the two new `UAT_<ROLE>_USER`/`_PASSWORD` secrets need to actually exist in the `uat` GitHub Environment, or CI will write blank values.
7. **`README.md`**'s role table — add a row so the doc stays accurate.

Note the existing `superuser` credential in `.env.example` has **not** done steps 3–6 yet (`playwright.config.ts` has an explicit `TODO`) — treat it as a template gap, not a pattern to copy.

## Playbook: a new spec file (module) was added

1. Put it under the matching `tests/specs/` subfolder (create one if the feature area is new), following the existing `tests/specs/config/`, `tests/specs/support/`, etc. grouping.
2. Iterate a role group from `tests/specs/helpers/roles.ts` (reuse or extend one) — don't hardcode a role list in the spec.
3. **Easy to miss:** add a `case` entry to `.github/workflows/playwright.yml`'s module dispatcher:
   ```yaml
   module) SPEC="tests/specs/your/new-file.spec.ts" ;;
   ```
   and add the module name to the `module` choice-input's `options` list. The workflow does **not** auto-discover spec files — a spec that exists but has no `case` entry can only be run by triggering the workflow with `module: all` (or from a developer machine directly), not by name.
4. If the new module has shared setup/teardown (navigating to a config screen, resetting shared state), model it as a `test.extend` fixture in the spec file — see `ARCHITECTURE.md`'s [Fixture patterns](./ARCHITECTURE.md#fixture-patterns) for the two established shapes.
5. Run `npm run docs:coverage` to regenerate [`COVERAGE.md`](./COVERAGE.md), and commit the result — it is generated from `playwright test --list`, so a new spec is invisible in the docs until you do. If the new spec is a whole feature area, also add a one-line row to `README.md`'s orientation table (that table carries no counts, so it needs touching only when a *file* is added, not when a case is).

## Playbook: a new API endpoint needs coverage

1. Add a method to the relevant existing client in `tests/api/` (`AuthApi.ts`, `DealsApi.ts`, `LoyaltyApi.ts`), or create a new client extending `ApiClient` if it's a new resource — one typed method per endpoint, routed through `get/post/postForm/patch/delete`, never `this.request` directly.
2. If the endpoint needs a new client, register a fixture for it in `tests/specs/helpers/apiFixtures.ts` (`ApiFixtures` type + `apiTest.extend` entry), following the existing `authApi`/`dealsApi`/`loyaltyApi` pattern.
3. Add the spec under `tests/specs/api/`, importing `apiTest`/`expect` from `apiFixtures.ts` — not the UI `test` from `@playwright/test`.
4. Before trusting field names in the request/response, check `schema.json` for a captured example. If none exists (as is currently the case for the Auth endpoints — see the `NOTE` comment atop `tests/api/AuthApi.ts`), confirm the shape with one real call and leave a comment recording that it's confirmed (or still a guess, with a `fixme` if the test can't be trusted yet).
5. Assert failures via `await expect(promise).rejects.toThrow(ApiError)`, and inspect `.httpStatus`/`.body` when the status code or error payload itself matters.

## Playbook: adding a fixture with cleanup

Use `njoybook-general.spec.ts`'s `resetNjoyBookPage` (fixed baseline, reset before and after) or `blockouts` (track what the test created, undo it in teardown) as the template — see [ARCHITECTURE.md](./ARCHITECTURE.md#reset-before--restore-after-guaranteed-cleanup) for both, with code. The rule from `CLAUDE.md`: teardown after `await use(...)` runs on pass *or* fail — never rely on cleanup written at the end of the test body, since a failed assertion skips it.

If neither a fixed-baseline reset nor a track-and-undo list can safely isolate the scenario, **don't add the test** — leave a comment describing the missing test-support capability instead (see the `fixme` entries in `njoybook-general.spec.ts`/`njoybook-staff.spec.ts` for the existing style, e.g. the reCAPTCHA and per-branch-signal notes).

## Troubleshooting / shared-UAT gotchas

These look like regressions but are properties of the shared, stateful UAT environment. Check here before filing a bug:

- **A test hangs waiting on a "Start time" combobox with no options.** Booking capacity is shared and capped per slot per day. Global setup's reset only clears *active* (Pending/Confirmed/Checked-in) bookings — Cancelled/No-show/Completed bookings from earlier runs are **not** cleared and still count against the cap. This self-resolves the next calendar day; it's not a code defect. See the `ENV PRECONDITION` comment in `njoybook-general.spec.ts`'s "Bookings - Status Lifecycle" section for the confirmed details.
- **A booking test against a future date returns a 400 ("Selected slot is not available").** Only *today* reliably has staffed/open slots on staging. Admin-created bookings intentionally target today (`AddBookingModal.selectFirstAvailableStartTime()`), not a hardcoded future date.
- **"Set to Default" on the Rules tab didn't fully reset a NJoyBook test.** It only resets the Rules tab — it does not reset Time Slots, per-staff toggles, or delete created bookings. A fixture relying on it alone is not fully isolated for those other surfaces.
- **A public-booking-confirmation test fails at "Confirm booking" with a reCAPTCHA error.** Known, tracked regression (repo-wide as of the last verification) — affects every `Rules - Auto-Confirm` and `End-to-End Booking` test in both NJoyBook spec files, all currently `test.fixme`'d with the same `TODO(recaptcha-regression)` comment. Don't debug this as a new issue; check whether it's already the tracked one first.
- **Two NJoyBook branches behave differently on purpose.** "Hajime - Thomson Plaza" is Branch mode (capacity-based, no staff); "Hajime - My Village" is Staff mode (specialist-based). Don't assume a fix or a test pattern transfers between the two without checking which mode it targets.
- **An API test fails with a 429, and a different one fails next run.** UAT rate-limits `POST /v2/auth/sign-in` per window, and every API test signs in first. This is why all three `tests/specs/api/` specs are `describe.skip`'d. Individual tests pass in isolation and `--workers=1` doesn't help (the limit is requests-per-window, not concurrency). Don't add a sleep — cut sign-in volume with a shared per-role token instead.
- **Traces, screenshots, and the HTML report can contain sensitive UAT data.** Don't paste report contents or trace files into issues, Slack, or logs. They're gitignored for the same reason — don't weaken that.

## Known-empty / placeholder files — not broken, just unbuilt

- `tests/core/BaseComponent.ts`, `tests/core/BrowserManager.ts` — empty, deliberately not exported from `tests/core/index.ts`. Reserved for future use.
- The `superuser` Playwright project — credentials exist in `.env.example`, but no project or tests exist yet (`playwright.config.ts` has an explicit `TODO`).
- `HomePage.ts`'s `goToTrack`/`goToFinance`/`goToMessage` — commented out pending those modules being built; the commented code is the template to uncomment once the destination page object exists.
- Two `test.skip`s in `create-user.spec.ts` (duplicate-email validation, no-role-selected validation) — blocked on either a reusable form-reopen flow or a UI decision, not forgotten.
- All three `tests/specs/api/` specs — written and reviewable, `describe.skip`'d on a UAT sign-in rate limit (see Troubleshooting above). Don't mistake them for stubs.
- The `merchant-success-staff` project — role, credentials, storage state and project all exist, but no spec tags `@merchant-success-staff`, so it runs zero tests. Needs a decision on which CRM screens that role owns.
