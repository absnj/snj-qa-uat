# Project Instructions

This repository contains Playwright end-to-end tests for the ShopNJoy UAT admin dashboard. Treat the target environment as shared and stateful: tests can create or modify real UAT data.

## Repository Map

- `tests/specs/`: readable test inventory grouped by product function.
- `tests/specs/helpers/roles.ts`: role definitions, tags, and role groups.
- `tests/pages/`: page objects and direct UI interactions.
- `tests/core/`: shared page and browser abstractions.
- `tests/setup/`: environment loading, global authentication, traces, and generated storage state.
- `tests/testDataGenerators.ts`: unique test-data helpers.
- `playwright.config.ts`: projects, timeouts, reporters, and shared browser options.

Do not introduce a generated-spec or hidden data-driven test layer. Keep test cases explicit enough that their behavior and role coverage are visible in the spec.

## Test Structure

- Put test intent, business scenarios, and outcome assertions in specs.
- Put selectors and reusable UI operations in page objects. Page-object methods should represent meaningful user actions or observable states, not arbitrary wrappers around every Playwright call.
- Put reusable setup and guaranteed cleanup in fixtures. Prefer fixture teardown over cleanup at the end of a test body so cleanup still runs after failures.
- Add or reuse role groups in `tests/specs/helpers/roles.ts`. Keep the existing role tags:
  - `@merchant-admin`
  - `@merchant-staff`
  - `@branch-admin`
  - `@branch-staff`
- Tests run with authenticated storage state by default. Login and other unauthenticated scenarios must use `test.use({ storageState: undefined })`.
- Use the configured `baseURL`; navigate with relative paths where practical.

## Playwright Rules

Tests must be isolated and independently runnable. The configuration uses `fullyParallel: true`, so never depend on test order, shared mutable variables, or data created by another test. Do not use serial mode to conceal a state dependency.

When a test changes UAT state:

- Generate unique data when the scenario permits it.
- Restore shared configuration through a fixture or another guaranteed teardown mechanism.
- Do not add a state-mutating scenario if there is no safe isolation or cleanup strategy. Document the missing test-support capability instead.

Locators must model how a user identifies an element:

1. Prefer `getByRole` with an accessible name.
2. Then prefer `getByLabel`, `getByPlaceholder`, `getByText`, or a stable test id.
3. Scope locators to a dialog, form, row, or other meaningful container and use filtering when needed.
4. Use CSS selectors only for UI without a usable accessible or test-id contract, and keep them narrowly scoped.

Do not add:

- XPath selectors or selectors coupled to styling classes or DOM structure.
- Parent traversal such as `locator('..')`.
- `.first()`, `.last()`, or `.nth()` merely to silence a strict-mode violation. A positional locator requires a stable, documented ordering contract.
- `page.waitForTimeout()` or other arbitrary sleeps.
- `force: true` unless the scenario explicitly verifies behavior that bypasses normal actionability.
- `waitUntil: 'networkidle'` as a substitute for an application-ready assertion.
- Global timeout increases to mask one slow or flaky interaction.

Rely on Playwright auto-waiting. Assert eventual UI state with awaited web-first assertions such as `toBeVisible`, `toHaveText`, `toHaveURL`, `toBeEnabled`, or `toHaveCount`. For non-DOM eventual state, use `expect.poll` or `expect(...).toPass()` with a bounded timeout. Do not use immediate checks such as `expect(await locator.isVisible()).toBe(true)`.

Every Playwright action and asynchronous assertion must be awaited. Prefer assertions on user-visible behavior over implementation details. Use `test.step` when it materially improves reports for a long business flow.

## Authentication and Secrets

- `.env` supplies `UAT_URL` and role credentials. Never commit, print, or hard-code credentials.
- Files under `tests/setup/.auth/` contain reusable authenticated state and must remain untracked.
- Traces, screenshots, and reports can contain sensitive UAT data. Do not commit them or expose them in logs and summaries.
- Do not weaken `.gitignore` protections for environment files, auth state, reports, or test results.

## Working Practices

- Inspect the relevant spec, page object, role group, and configuration before changing behavior.
- Follow existing TypeScript path aliases where they improve clarity.
- Keep changes focused. Do not refactor unrelated legacy selectors or formatting while adding a scenario.
- Do not leave `test.only`; CI rejects it. Use `test.skip` only with a concrete reason and a reference to the blocking condition.
- Treat existing TODOs and incomplete page-object calls as unresolved work, not as proof that the referenced capability exists.
- Do not edit generated auth files, traces, reports, or test results.

## Verification

Start with the smallest relevant check:

```bash
# Parse configuration and list tests without executing UAT scenarios
npm test -- --list

# Run one spec
npx playwright test tests/specs/path/to/example.spec.ts

# Run one role project
npx playwright test --project=merchant-admin

# Run one test by title
npx playwright test -g "test title"

# Debug locally
npx playwright test tests/specs/path/to/example.spec.ts --debug

# Open the HTML report
npm run test:report
```

Run `npm test` only when the credentials, shared-UAT side effects, and expected runtime are appropriate. For a code change, run the affected spec against the smallest relevant role set before considering the full suite.

`typescript` is not currently a declared project dependency, so do not report `npx tsc --noEmit` as a supported verification command unless the dependency and script are intentionally added.

In the final summary, state which checks ran, which role/project was exercised, and any checks skipped because they require UAT access or can mutate shared data.
