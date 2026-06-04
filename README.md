# ShopNJoy UAT Test Automation

Playwright end-to-end tests for the ShopNJoy admin dashboard.

## Overview

Tests are handwritten and grouped by product function under `tests/specs/`:

- `login.spec.ts`
- `support.spec.ts`
- `user-management.spec.ts`
- `deals.spec.ts`
- `loyalty.spec.ts`

Role coverage is handled by Playwright projects. Each project loads the correct storage state and runs only tests tagged for that role:

- `@merchant-admin`
- `@merchant-staff`
- `@branch-admin`
- `@branch-staff`

## Architecture

```text
tests/specs/*.spec.ts
        -> tests/flows/
        -> tests/pages/
        -> Playwright
```

Specs own the test inventory. Flows own business-level actions. Page files own selectors and direct UI interactions.

## Setup

Install dependencies:

```bash
npm install
```

Create `tests/.env` with the UAT URL and credentials:

```env
UAT_URL=https://admin-staging.shopnjoy.com
UAT_MERCHANT_ADMIN_USER=merchant-admin@example.com
UAT_MERCHANT_ADMIN_PASSWORD=password123
UAT_MERCHANT_STAFF_USER=merchant-staff@example.com
UAT_MERCHANT_STAFF_PASSWORD=password123
UAT_BRANCH_ADMIN_USER=branch-admin@example.com
UAT_BRANCH_ADMIN_PASSWORD=password123
UAT_BRANCH_STAFF_USER=branch-staff@example.com
UAT_BRANCH_STAFF_PASSWORD=password123
```

## Running Tests

Run all role projects:

```bash
npm test
```

Run one role:

```bash
npx playwright test --project=merchant-admin
```

Run one functional spec:

```bash
npx playwright test tests/specs/user-management.spec.ts
```

Run one test by title:

```bash
npx playwright test -g "creates a user successfully"
```

Debug or run headed:

```bash
npm run test:headed
npx playwright test --debug
```

## Adding Tests

1. Add the test to the relevant file in `tests/specs/`.
2. Put it inside the role describe block that should run it.
3. Add or reuse a flow in `tests/flows/`.
4. Add page-level helpers in `tests/pages/` when selectors or UI interactions are needed.

Example:

```ts
test('rejects an empty email', async ({ page }) => {
  await invalidEmailEmpty(page);
});
```

If a test applies to a new set of roles, update `tests/specs/helpers/roles.ts`.

## Project Layout

```text
tests/specs/              Handwritten test inventory, grouped by function
tests/specs/helpers/      Role tags and shared spec helpers
tests/flows/              Business-level test flows
tests/pages/              Page objects and UI helpers
tests/setup/              Global login setup and storage state files
tests/data/               Legacy/reference test data files
```

## Notes

- The old CSV-to-generator path has been removed from the active test workflow.
- Generated specs are no longer used as the source of truth.
- Keep specs readable and explicit; avoid recreating a hidden generator through over-abstracted test definitions.
