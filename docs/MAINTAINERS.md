# Maintainer guides

Short "what do I touch" guides for common changes, plus the UAT quirks that look like bugs but aren't. For how the framework is built, see [`ARCHITECTURE.md`](./ARCHITECTURE.md). For the rules, see [`AGENTS.md`](../AGENTS.md). For what exists and how to run it, see [`README.md`](../README.md).

## A UI element changed

1. **Find the page object.** `tests/pages/` mirrors the app's navigation, so the file to fix is usually the one whose folder matches where the element lives (Configuration → Deals → Create → Manual is `tests/pages/configuration/deals/create/manual/`).
2. **Update the selector in the constructor** — never inline it in a method. Follow the order in `AGENTS.md`: `getByRole` with a visible name first, then `getByLabel`/`getByPlaceholder`/`getByText`/test id, scoped to a container.
3. **If the behaviour changed too** (a button that used to always show is now conditional), check the matching assertion helpers on that page object. `DealsPage.expectCreateDealAvailable` / `expectCreateDealUnavailable` show the shape.
4. **Re-run the smallest affected spec** before anything broader:
   ```bash
   npx playwright test tests/specs/config/deals.spec.ts --project=merchant-admin
   ```
5. **If you changed a shared base page** (`ConfigBasePage`, `AdminBasePage`), check what else extends it first — a shared nav change can ripple across a whole section.

## A new role was added

Touch every one of these. Miss one and the role either never gets tested, or CI can't run it.

1. **`.env.example`** — add `UAT_<ROLE>_USER` and `UAT_<ROLE>_PASSWORD`, matching the existing naming (uppercase, underscores).
2. **`tests/specs/helpers/roles.ts`** — add it to the `ROLES` map (`label`, `normalized`, `tag`), and to whichever role groups should include it. Everything else reads from here.
3. **`playwright.config.ts`** — add a project (`name`, `use.storageState`, `testMatch`, `grep: /@new-role-tag/`), copying the existing six.
4. **`tests/setup/global.setup.ts`** — the role must be reachable from the `[...ALL_ROLES, ...ALL_CRM_ROLES]` list, or no session gets saved for it. If it lands on `AdminHomePage` after login, it belongs in `ALL_CRM_ROLES`.
5. **`.github/workflows/playwright.yml`** — add the role to the `project` dropdown options, and its two credentials to the `Write .env` step. There are two of those steps (`test` and `triage`) — update both.
6. **GitHub secrets** — the two new secrets must exist in the `uat` environment, or CI writes blank values and every login fails.
7. **`README.md`** — add a row to the role table.

The existing `superuser` login has *not* had steps 3–6 done. Treat it as an unfinished template, not an example to copy.

## A new spec file was added

1. Put it under the matching `tests/specs/` subfolder, following the existing grouping.
2. Loop over a role group from `tests/specs/helpers/roles.ts` — don't list roles inline.
3. **Easy to miss:** add a `case` entry to the module dispatcher in `.github/workflows/playwright.yml`:
   ```yaml
   module) SPEC="tests/specs/your/new-file.spec.ts" ;;
   ```
   and add the name to the `module` dropdown options. The workflow does **not** find spec files on its own — a spec with no `case` entry can only be run with `module: all`, or from a developer machine.
4. Shared setup or teardown? Make it a `test.extend` fixture in the spec file — see [Fixture patterns](./ARCHITECTURE.md#fixture-patterns) for the two shapes already in use.
5. Run `npm run docs:coverage` and commit the result, or the new spec is invisible in the docs. If it's a whole new feature area, add a row to `README.md`'s table too.

## A new API endpoint needs coverage

1. Add a method to the right client in `tests/api/`, or create a new one extending `ApiClient` for a new resource. One method per endpoint, routed through `get/post/postForm/patch/delete` — never `this.request` directly.
2. New client? Register a fixture in `tests/specs/helpers/apiFixtures.ts`, following the existing `authApi`/`dealsApi`/`loyaltyApi` entries.
3. Put the spec in `tests/specs/api/`, importing `apiTest`/`expect` from `apiFixtures.ts` — not the UI `test` from `@playwright/test`.
4. Check `schema.json` for a recorded example before trusting field names. If there isn't one (currently the case for Auth — see the note at the top of `tests/api/AuthApi.ts`), confirm with one real call and record what you found.
5. Assert failures with `await expect(promise).rejects.toThrow(ApiError)`, and check `.httpStatus`/`.body` when the status code matters.

## Adding a fixture with cleanup

Copy one of the two shapes in `njoybook-general.spec.ts`: `resetNjoyBookPage` (reset to a known state before and after) or `blockouts` (track what the test created, undo it afterwards). Both are written out in [ARCHITECTURE.md](./ARCHITECTURE.md#reset-before--restore-after-guaranteed-cleanup).

The rule: code after `await use(...)` runs whether the test passed or failed. Cleanup written at the end of a test body gets skipped when an assertion fails.

If neither shape can safely isolate your scenario, **don't add the test.** Write a comment describing what's missing instead — the `fixme` entries in the NJoyBook specs show the style.

## UAT gotchas

These look like regressions but are properties of the shared environment. Check here before filing a bug.

- **A test hangs on a "Start time" dropdown with no options.** Booking capacity is capped per slot per day. Global setup only clears *active* bookings — Cancelled, No-show and Completed ones from earlier runs still count against the cap. It clears itself the next day.
- **A booking test on a future date returns 400 ("Selected slot is not available").** Only today reliably has open slots on staging. Admin bookings deliberately target today.
- **"Set to Default" on the Rules tab didn't fully reset things.** It only resets Rules — not Time Slots, per-staff toggles, or bookings.
- **A public booking test fails at "Confirm booking" with a reCAPTCHA error.** Known and tracked. Affects every such test in both NJoyBook files, all marked with `TODO(recaptcha-regression)`. Don't debug it as new.
- **The two NJoyBook branches behave differently on purpose.** Thomson Plaza is Branch mode (capacity-based); My Village is Staff mode (specialist-based). A fix for one may not apply to the other.
- **An API test fails with a 429, and a different one fails next run.** UAT rate-limits sign-in, and every API test signs in first. This is why they're all switched off. They pass individually, and `--workers=1` doesn't help. Don't add a sleep — share one token per role instead.
- **Reports, screenshots and traces can contain real UAT data.** Don't paste them into issues or chat. They're gitignored for the same reason.

## Empty on purpose — not broken

- `tests/core/BaseComponent.ts` and `tests/core/BrowserManager.ts` — empty, deliberately not exported. Reserved for later.
- The `superuser` project — login exists, project and tests don't.
- `HomePage.ts`'s `goToTrack`/`goToFinance`/`goToMessage` — commented out until those modules exist. The commented code is the template to uncomment.
- Two `test.skip`s in `create-user.spec.ts` — blocked on a decision, not forgotten.
- All three `tests/specs/api/` specs — fully written, switched off because of the rate limit above. Not stubs.
- The `merchant-success-staff` project — everything exists except tests. Needs a decision on which CRM screens that role owns.
