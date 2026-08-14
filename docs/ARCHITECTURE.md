# How the framework is built

For someone extending the framework itself — a new page object, fixture, or API client. For what exists and how to run it, see [`README.md`](../README.md). For the rules, see [`AGENTS.md`](../AGENTS.md).

## Page objects

### The inheritance chain

```
BasePage (tests/core/BasePage.ts)
  └─ section base page (AdminBasePage, ConfigBasePage, SupportBasePage, UserManagementBasePage)
       └─ actual page (DealsPage, RulesTab, MyTicketsPage, ...)
```

`BasePage` is deliberately small:

```ts
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  async waitForReady(): Promise<void> {
    await this.page.getByRole('img', { name: 'ShopNJoy' }).waitFor({ state: 'hidden' });
  }

  async screenshot(name: string): Promise<void> { ... }
}
```

The default `waitForReady()` just waits for the loading logo to disappear — a generic "the app has stopped loading" signal. Any page with something more specific to check **overrides** it, usually calling `super.waitForReady()` first:

```ts
override async waitForReady(): Promise<void> {
    await super.waitForReady();
    await expect(this.dealHeader).toBeVisible();
}
```

Section base pages sit in the middle when a whole area of the app shares navigation — `ConfigBasePage` holds the Configuration tabs every sub-page uses. Adding a page inside an existing section? Extend that section's base class, not `BasePage`.

**Pick the narrowest base class that already has what you need.** Don't re-declare shared nav selectors in every page.

### Selectors go in the constructor, never in a method

Every page object declares its selectors as `readonly` fields — either inline (`HomePage.ts` style) or assigned in the constructor body (`DealsPage.ts` style, needed when a selector depends on a constructor argument). Both are fine; match the file you're in.

What's not optional: a method must never call `this.page.getByRole(...)` inline. Selectors are declared once, named, and reused. That keeps every element's name contract in one place, which is the first thing you check when the app's wording changes.

### Navigation returns the next page object

The core pattern: click, build the destination page object, wait for it, return it.

```ts
async goToConfiguration(): Promise<ConfigOverview> {
    await this.configurationCard.click();
    const config = new ConfigOverview(this.page);
    await config.waitForReady();
    return config;
}
```

That's what lets specs read as a chain of actions instead of raw Playwright calls:

```ts
const home = new HomePage(page);
await home.goto();
const configOverview = await home.goToConfiguration();
const dealsPage = await configOverview.goToDeals();
```

Follow this exact shape for new navigation methods so the chain stays composable. `HomePage.ts` has a few commented out for modules that don't exist yet — that's the template to copy when they land.

### Reserved but empty

`tests/core/BaseComponent.ts` and `tests/core/BrowserManager.ts` exist but are empty, and `tests/core/index.ts` leaves their exports commented out. They're placeholders for later, not leftovers. Don't delete them, and don't build on them expecting an implementation.

## Fixtures

There's no shared fixture file. Each spec defines its own with `test.extend`. Two patterns are in use.

### Plain setup, no cleanup

`deals.spec.ts`'s `formTest`:

```ts
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

Around 14 validation tests each start from a form that's already open and filled in, instead of repeating that navigation every time. Use this when tests share expensive setup but need no cleanup.

### Reset before, restore after

`njoybook-general.spec.ts`'s `resetNjoyBookPage`:

```ts
resetNjoyBookPage: async ({ page }, use) => {
  const home = new HomePage(page);
  await home.goto();
  const configOverview = await home.goToConfiguration();
  const branchConfig = await configOverview.openBranchConfig(TEST_BRANCH_NAME);
  const njoyBookPage = await branchConfig.goToNJoyBook();

  await resetNJoyBookRulesToBranchMode(njoyBookPage);   // known state BEFORE

  await use(njoyBookPage);

  await resetNJoyBookRulesToBranchMode(njoyBookPage);   // restore AFTER — pass or fail
},
```

Everything after `await use(...)` runs whether the test passed, failed, or threw. That's what makes it safe on shared UAT.

The second variant tracks what a test *created* rather than resetting to a fixed state:

```ts
blockouts: async ({ page }, use) => {
  const created: string[] = [];
  await use({ tab, created });

  for (const label of created) {
    await tab.deleteBlockout(label).catch(() => { /* already gone */ });
  }
},
```

Note the `.catch()` — cleanup must not throw if the thing is already gone, since the test may have deleted it itself.

**Pick whichever of these two matches your scenario** rather than inventing a third.

## Running sequentially when tests read back what they changed

The default is `fullyParallel: true`. Both NJoyBook specs opt out for their own file:

```ts
njoyBookTest.describe.configure({ mode: 'default' });
```

They need this because they read back branch config they themselves change — parallel workers would race each other. The two files still run in parallel *with each other*, since they target different branches.

**Only reach for this when a test reads back shared config it changed and no fixture can isolate it.** It's an exception, not a convenience.

### These two files set the floor on CI time

Splitting work across machines happens at the level of runnable groups, and a sequential file is a single group — it can't be split. So the suite can never finish faster than the slower of these two files, no matter how many machines you add. A second saved *inside* them comes straight off the total; a second saved anywhere else usually doesn't.

That's why the NJoyBook fixtures jump straight to the branch page via `BranchConfigPage.open()` instead of clicking through Home → Configuration → Branches. It's about 6 seconds per test.

If the suite needs to get meaningfully faster, the answer is more test branches so NJoyBook scenarios can spread out and run in parallel — not more machines.

## The API layer

A second, mostly separate testing surface: no browser, no saved session, HTTP straight to the backend.

> **All the specs using this are currently switched off** — UAT rate-limits sign-in and every API test signs in first. The layer below works; only the specs are parked. See [README's Known Gaps](../README.md#known-gaps). The likely fix — sign in once per role and share the token — goes in `apiFixtures.ts`.

### `ApiClient` (`tests/core/ApiClient.ts`)

The base every API client extends. It:

- Wraps Playwright's `APIRequestContext`.
- Assumes every response looks like `{ status, message, data }` and returns just `data`.
- Throws `ApiError` (carrying `httpStatus` and the raw body) when the response isn't OK.
- Provides `get/post/postForm/patch/delete`, each taking an optional bearer token.

### Concrete clients (`tests/api/`)

One method per endpoint:

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

`AuthApi.ts` also exports `decodeJwtPayload(token)` — it decodes but doesn't verify, which is fine for checking the `roles` claim on a token the API under test just issued.

**Adding an endpoint:** add a method to the right client, same typed shape. Never call `this.request` from a spec.

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

API specs import `apiTest` and `expect` from here, never the UI `test`. `tokenFor()` reuses the same credential lookup the UI tests use, so both authenticate as the same roles.

### The `api` project

No saved session, its own base URL:

```ts
{
  name: 'api',
  testMatch: '**/specs/api/**/*.spec.ts',
  use: { baseURL: process.env.UAT_API_URL },
},
```

`UAT_API_URL` can differ from `UAT_URL` — one is the backend, the other the dashboard. Two more variables exist only for API tests: `UAT_API_MERCHANT_STORE_ID` and `UAT_API_BRANCH_ID`. UI tests pick a branch by clicking its name; API calls need the raw ID.

### Assertion style

API specs assert on thrown errors, not page state:

```ts
await expect(authApi.signIn(username, `${password}invalid`)).rejects.toThrow(ApiError);
```

and inspect `ApiError.httpStatus` when the status code itself matters.

## Roles and credentials

`tests/specs/helpers/roles.ts` connects a role to its project, its tag, and its `.env` credentials.

```ts
export const ROLES = {
  merchantAdmin: { label: 'Merchant Admin', normalized: 'MERCHANT_ADMIN', tag: '@merchant-admin' },
  // ...
} satisfies Record<string, Role>;
```

- `label` — readable name, used in test titles.
- `normalized` — uppercase form, used to build the env var name and the session filename (lowercased).
- `tag` — the `@role-tag` in describe titles, which each project's `grep` filters on.

Role groups are just arrays built from `ROLES`. Specs loop over a group instead of hardcoding roles. Adding a role to an existing group is how you extend coverage; see [MAINTAINERS.md](./MAINTAINERS.md#a-new-role-was-added) when the role itself is new.

`getCredentials(normalized)` is the only place `.env` role variables get read:

```ts
export function getCredentials(normalized: string) {
  const key = normalized.toUpperCase();
  return {
    username: process.env[`UAT_${key}_USER`]!,
    password: process.env[`UAT_${key}_PASSWORD`]!,
  };
}
```

## `tests/setup/global.setup.ts`

Runs once before the whole suite. Two phases:

1. **Log in as every role and save the session.** For each of the 6 roles: fresh browser context, start tracing, log in, save the session to `tests/setup/.auth/<role>.json`, save the trace, close. If any role fails, **the whole setup fails** — it's all or nothing. (CRM roles pass a different landing page object, since they land on `AdminHomePage`.)
2. **Clear NJoyBook bookings.** For each of the two test branches, open a context with the merchant-admin session just saved, navigate to the Bookings tab, and cancel active bookings. Unlike phase 1, a failure here just warns — this is a convenience to keep booking tests reliable, not a requirement. It must never run at the same time as the tests themselves, which is what the CI concurrency guard prevents.

A new role that needs a session must be reachable from the `[...ALL_ROLES, ...ALL_CRM_ROLES]` list this file builds from.
