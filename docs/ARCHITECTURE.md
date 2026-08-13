# Architecture Deep Dive

This doc explains *how* the framework pieces fit together and *why* they look the way they do — for someone extending the framework itself (new page object, new fixture, new API client), not just writing a new test case. For "what exists today" and how to run things, see [`README.md`](../README.md). For the enforced style rules (locator hierarchy, forbidden patterns), see [`CLAUDE.md`](../CLAUDE.md).

## Page Object Model

### Inheritance chain

```
BasePage (tests/core/BasePage.ts)
  └─ domain base page (AdminBasePage, ConfigBasePage, SupportBasePage, UserManagementBasePage)
       └─ concrete page (DealsPage, RulesTab, MyTicketsPage, ...)
```

`BasePage` (`tests/core/BasePage.ts`) is small on purpose:

```ts
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  async waitForReady(): Promise<void> {
    await this.page.getByRole('img', { name: 'ShopNJoy' }).waitFor({ state: 'hidden' });
  }

  async screenshot(name: string): Promise<void> { ... }
}
```

The default `waitForReady()` waits for the "ShopNJoy" loading logo to disappear — a generic "the app has stopped loading" signal. Every concrete page that has something more specific to assert **overrides** it, usually calling `super.waitForReady()` first and then adding a page-specific check. Example, `DealsPage.ts`:

```ts
override async waitForReady(): Promise<void> {
    await super.waitForReady();
    await expect(this.dealHeader).toBeVisible();
}
```

Domain base pages (`ConfigBasePage`, `AdminBasePage`, etc.) sit between `BasePage` and concrete pages when a whole section of the app shares chrome — e.g. `ConfigBasePage` (`tests/pages/configuration/ConfigBasePage.ts`) declares the `overviewTab`/`dealsTab`/`loyaltyTab` nav links shared by every Configuration sub-page. If you're adding a page inside an existing section, extend the section's base class, not `BasePage` directly.

**When adding a new page object**: pick the narrowest existing base class that already has the locators/behavior you need. Don't reintroduce shared nav locators in every leaf class.

### Locators live in the constructor, never inline in a method

Every page object declares its locators as `readonly` fields, either inline (`HomePage.ts` style) or assigned in the constructor body (`DealsPage.ts` style — needed when a locator depends on a constructor parameter). Both styles are in use; pick whichever the surrounding file already uses. What's non-negotiable: a method must never call `this.page.getByRole(...)` (or any locator factory) inline — locators are declared once, named, and reused. This makes the accessible-name contract for an element visible in one place instead of scattered across methods, and it's the first thing to check when the app's UI text changes.

### Navigation returns the next page object

The backbone pattern across the whole suite: a navigation method clicks, constructs the destination page object, calls `waitForReady()` on it, and returns it. From `HomePage.ts`:

```ts
async goToConfiguration(): Promise<ConfigOverview> {
    await this.configurationCard.click();
    const config = new ConfigOverview(this.page);
    await config.waitForReady();
    return config;
}
```

This is what lets specs read as a chain of business actions instead of raw Playwright calls:

```ts
const home = new HomePage(page);
await home.goto();
const configOverview = await home.goToConfiguration();
const dealsPage = await configOverview.goToDeals();
```

When adding a new navigation action from an existing page, follow this exact shape — click, construct, `waitForReady()`, return — so the chain stays composable. `HomePage.ts` has a few navigation methods commented out (`goToTrack`, `goToFinance`, `goToMessage`) for modules not built yet, with a lazy `import()` for the destination page — that's the pattern to copy when the corresponding module lands.

### Reserved-but-empty files

`tests/core/BaseComponent.ts` and `tests/core/BrowserManager.ts` exist but are **empty**, and `tests/core/index.ts` deliberately comments out their exports:

```ts
export { BasePage } from './BasePage';
export { ApiClient, ApiError } from './ApiClient';
// export { BaseComponent } from './BaseComponent';
// export { BrowserManager } from './BrowserManager';
```

They're reserved for future use (e.g. a shared component abstraction for repeated widgets, a browser-context helper) — not dead code left over from a removed feature. Don't delete them assuming they're cruft, and don't build on them assuming they have an implementation.

## Fixture patterns

There is no shared fixture file in `tests/core/` — every spec file that needs fixtures defines its own via `test.extend`, scoped to that file. Two patterns are in active use:

### Simple state fixture

`deals.spec.ts`'s `formTest`:

```ts
type DealFormFixtures = {
  dealData: DealDetailsData;
  detailsStep: DealDetailsStep;
};

const formTest = test.extend<DealFormFixtures>({
  dealData: async ({}, use) => { await use(validDeal()); },
  detailsStep: async ({ page }, use) => {
    const branchSelection = new BranchSelection(page);
    await branchSelection.goto();
    const buildOptions = await branchSelection.next();
    const detailsStep = await buildOptions.buildManual();
    await use(detailsStep);
  },
});
```

This exists so ~14 validation test cases each start from a form that's already navigated-to and pre-filled with valid data, instead of repeating that navigation in every test body. Use this pattern when a group of tests shares expensive setup but needs no teardown.

### Reset-before / restore-after (guaranteed cleanup)

`njoybook-general.spec.ts`'s `resetNjoyBookPage` fixture is the reference implementation for CLAUDE.md's "prefer fixture teardown over end-of-test cleanup" rule:

```ts
resetNjoyBookPage: async ({ page }, use) => {
  const home = new HomePage(page);
  await home.goto();
  const configOverview = await home.goToConfiguration();
  const branchConfig = await configOverview.openBranchConfig(TEST_BRANCH_NAME);
  const njoyBookPage = await branchConfig.goToNJoyBook();

  await resetNJoyBookRulesToBranchMode(njoyBookPage);   // baseline BEFORE

  await use(njoyBookPage);

  await resetNJoyBookRulesToBranchMode(njoyBookPage);   // restore AFTER — runs on pass or fail
},
```

The code after `await use(...)` runs whether the test passed, failed, or threw — that's what makes this safe on a shared, stateful UAT environment. The same file has a second variant for fixtures that track *what a test created* rather than resetting a fixed baseline — `blockouts` and `restorableTimeSlots` both push identifiers into an array during the test and iterate-and-undo that array in teardown:

```ts
blockouts: async ({ page }, use) => {
  // ...navigate to the tab...
  const created: string[] = [];
  await use({ tab, created });

  for (const label of created) {
    await tab.deleteBlockout(label).catch(() => { /* already gone */ });
  }
},
```

Note the `.catch(() => {})` on cleanup calls — teardown must not throw if the resource is already gone (e.g. the test itself already deleted it as part of the assertion). **When adding a new state-mutating fixture, pick whichever of these two shapes matches your scenario** (fixed baseline to restore vs. a running list of created resources to undo) rather than inventing a third shape.

### Forcing sequential execution when tests read back shared state

The repo default is `fullyParallel: true` (`playwright.config.ts`). `njoybook-general.spec.ts` and `njoybook-staff.spec.ts` both opt out for their own file:

```ts
njoyBookTest.describe.configure({ mode: 'default' });
```

This is necessary only because these tests read back branch-level config they themselves mutate (Rules, Time Slots) — parallel workers racing on the same branch's saved state would flake. The two files still run in parallel *with each other*, because they target different branches (`Hajime - Thomson Plaza` vs. `Hajime - My Village`) with isolated state. **Only reach for `mode: 'default'` when a test reads back shared config it mutates and no fixture-level isolation is possible** — it's an exception to the parallelism default, not a template to copy for convenience.

## The API testing layer

This is a second, mostly-independent testing surface: no browser, no `storageState`, HTTP calls straight to the backend.

> **The specs using this layer are all currently skipped** (`describe.skip`, `SKIP(api-rate-limit)`) — UAT throttles `POST /v2/auth/sign-in` and every API test signs in first. The layer described below is real and works; only the specs are parked. See [README's Known Gaps](../README.md#known-gaps-and-in-progress-work). The likeliest unblock — a worker-scoped fixture that signs in once per role and shares the token — lands in `apiFixtures.ts`, described at the end of this section.

### `ApiClient` (`tests/core/ApiClient.ts`)

Abstract base every concrete API client extends. It:

- Wraps Playwright's `APIRequestContext`.
- Assumes every response body is an envelope `{ status, message, data }` — confirmed against `schema.json`'s captured User/Account examples — and its private `unwrap<T>()` returns just `data`.
- Throws a custom `ApiError` (carries `httpStatus` and the raw `body`) when `response.ok()` is false.
- Exposes protected `get/post/postForm/patch/delete` helpers, each accepting an optional bearer `token`.

```ts
export class ApiError extends Error {
  constructor(readonly httpStatus: number, readonly body: unknown) { ... }
}
```

### Concrete clients (`tests/api/`)

`AuthApi.ts`, `DealsApi.ts`, `LoyaltyApi.ts` extend `ApiClient` and expose one method per endpoint, e.g.:

```ts
export class AuthApi extends ApiClient {
  async signIn(email: string, password: string): Promise<AuthTokens> {
    return this.postForm<AuthTokens>('/auth/sign-in', { email, password });
  }
  async logout(token: string): Promise<void> {
    await this.delete<void>('/auth/logout', token);
  }
}
```

`AuthApi.ts` also exports `decodeJwtPayload(token)` — decodes (not verifies) the JWT payload, sufficient for asserting the `roles` claim in a test since the token was just issued by the API under test.

**When adding coverage for a new endpoint**: add a method to the relevant existing client (or a new client if it's a new resource), following the same "one client method per endpoint, typed request/response" shape — don't call `this.request` directly from a spec.

### Fixtures (`tests/specs/helpers/apiFixtures.ts`)

```ts
export const apiTest = base.extend<ApiFixtures>({
  authApi: async ({ request }, use) => { await use(new AuthApi(request)); },
  dealsApi: async ({ request }, use) => { await use(new DealsApi(request)); },
  loyaltyApi: async ({ request }, use) => { await use(new LoyaltyApi(request)); },
});

export async function tokenFor(authApi: AuthApi, role: Role): Promise<string> {
  const { username, password } = getCredentials(role.normalized);
  const { token } = await authApi.signIn(username, password);
  return token;
}
```

`apiTest` is Playwright's `request`-fixture-backed `base.extend`, not the UI `test` — API specs import `apiTest`/`expect` from here, never the top-level `@playwright/test` `test`. `tokenFor()` reuses the same `getCredentials()` role→env-var lookup the UI suite uses, so API tests authenticate as the same roles without a separate credential set.

### The `api` Playwright project

`playwright.config.ts` has a project with no `storageState` and its own `baseURL`:

```ts
{
  name: 'api',
  testMatch: '**/specs/api/**/*.spec.ts',
  use: { baseURL: process.env.UAT_API_URL },
},
```

`UAT_API_URL` can differ from `UAT_URL` (admin dashboard frontend origin vs. backend API host — see `.env.example`'s comment). Two more env vars exist only for API tests: `UAT_API_MERCHANT_STORE_ID` / `UAT_API_BRANCH_ID` — the UI-vs-API asymmetry is that UI flows select a branch by clicking its display name, but API payloads (e.g. deal/loyalty creation) need the raw store/branch ID, which the UI never has to supply directly.

### Assertion style

API specs assert on thrown errors, not page state:

```ts
await expect(authApi.signIn(username, `${password}invalid`)).rejects.toThrow(ApiError);
```

and inspect `ApiError.httpStatus`/`.body` when the status code itself matters, e.g.:

```ts
expect((error as ApiError).httpStatus).toBeGreaterThanOrEqual(400);
```

## Role and credential wiring

`tests/specs/helpers/roles.ts` is the single source of truth connecting a role's identity to its Playwright project, its tag, and its `.env` credentials.

```ts
export type Role = { label: string; normalized: string; tag: string };

export const ROLES = {
  merchantAdmin: { label: 'Merchant Admin', normalized: 'MERCHANT_ADMIN', tag: '@merchant-admin' },
  // ...
} satisfies Record<string, Role>;
```

- `label` — human-readable, used in `test.describe` titles.
- `normalized` — uppercase-with-underscores form, used to build the env var name (`getCredentials`) and the storage-state filename (`global.setup.ts` lowercases it: `tests/setup/.auth/${role.normalized.toLowerCase()}.json`).
- `tag` — the `@role-tag` string embedded in `describe` titles, which each Playwright project's `grep: /@role-tag/` filters on.

Role **groups** (`ALL_ROLES`, `DEAL_CREATOR_ROLES`, `NJOYBOOK_FULL_ACCESS_ROLES`, etc.) are just arrays composed from `ROLES` — specs iterate a group instead of hardcoding which roles get which coverage. Adding a role to an existing group's array is how you extend coverage to a role that should already reach a feature; see [MAINTAINERS.md](./MAINTAINERS.md) for the full checklist when the role itself is new.

`getCredentials(normalized)` is the only place `.env` role variables are read:

```ts
export function getCredentials(normalized: string) {
  const key = normalized.toUpperCase();
  return {
    username: process.env[`UAT_${key}_USER`]!,
    password: process.env[`UAT_${key}_PASSWORD`]!,
  };
}
```

## `tests/setup/global.setup.ts` walkthrough

Runs once before the whole suite (wired via `globalSetup` in `playwright.config.ts`). Two phases:

1. **Per-role login and storage-state generation.** For every role in `[...ALL_ROLES, ...ALL_CRM_ROLES]` (6 roles — `superuser` is not included, matching the commented-out `superuser` project): open a fresh browser context, start tracing, log in via `LoginPage.loginAs()` (CRM roles pass `createHomePage: (p) => new AdminHomePage(p)` so their post-login landing page object is right), save `context.storageState()` to `tests/setup/.auth/<role>.json`, stop tracing to `tests/setup/traces/<role>-setup.zip`, close the context. A failure for any one role **throws and aborts the whole setup** — auth generation is all-or-nothing.
2. **NJoyBook capacity reset.** For each of the two NJoyBook test branches, opens a context using the merchant-admin storage state just generated, navigates Home → Configuration → branch config → NJoyBook → Bookings, and calls `bookings.removeAllActiveBookings()`. Unlike phase 1, a failure here is **non-fatal per branch** (`console.warn`'d, not thrown) — this reset is a convenience to keep booking-capacity tests reliable, not a suite precondition. It's documented to never run concurrently with the tests themselves (see the CI concurrency guard in `README.md`'s CI section).

If you add a new role that needs auth state generated, it must join the `ROLES` array this file builds from (`ALL_ROLES`/`ALL_CRM_ROLES` or a new group added to that spread) — see [MAINTAINERS.md](./MAINTAINERS.md#a-new-role-was-added).
