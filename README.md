# ShopNJoy UAT Test Automation Framework

A CSV-driven Playwright test automation framework for comprehensive end-to-end testing of the ShopNJoy admin dashboard.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
- [Adding Tests](#adding-tests)
- [Running Tests](#running-tests)
- [Flows & Helpers](#flows--helpers)
- [Test Data](#test-data)
- [Troubleshooting](#troubleshooting)

---

## Overview

This framework automates UAT testing across 6 modules:
- **User Management** — Staff creation and permissions
- **Support** — Ticket creation and management
- **Finance** — Transactions and invoicing
- **Track** — Performance dashboards
- **Message** — Chat and communications
- **Configuration** — Merchants, branches, deals

### Key Features

**CSV-driven test generation** — Define tests in a spreadsheet, auto-generate Playwright code  
**Flow-based architecture** — Reusable, modular test flows  
**Role-based testing** — Test across 4 roles (Merchant Admin, Merchant Staff, Branch Admin, Branch Staff)  
**Module filtering** — Generate only the tests you need  
**Automatic test data** — Random email and phone number generation  
**Helper functions** — Abstracted selectors and interactions  
**Environment-based credentials** — Support for UAT/staging environments  

---

## Architecture

```
CSV Matrix (uat-matrix.xlsx)
        ↓
    Generator
        ↓
Flow Signatures (flow-signatures.js)
        ↓
Generated Tests (uat-*.spec.ts)
        ↓
Flow Functions (flows/)
        ↓
Helpers & Utils (tests/utils/)
        ↓
Playwright Test Execution
```

### Key Components

| Component | Purpose |
|-----------|---------|
| **uat-matrix.xlsx** | Single source of truth; define all test cases here |
| **flow-signatures.js** | Maps flow names to their parameters |
| **generate-uat-tests.js** | Reads CSV, generates test files using flow signatures |
| **flows/** | Business logic for each test (createUserHappyPath, etc.) |

---

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment

Create a `.env` file at project root:

```env
BASE_URL=https://admin-staging.shopnjoy.com
MERCHANT_ADMIN_EMAIL=admin@example.com
MERCHANT_ADMIN_PASSWORD=password123
MERCHANT_STAFF_EMAIL=staff@example.com
MERCHANT_STAFF_PASSWORD=password123
BRANCH_ADMIN_EMAIL=branch_admin@example.com
BRANCH_ADMIN_PASSWORD=password123
BRANCH_STAFF_EMAIL=branch_staff@example.com
BRANCH_STAFF_PASSWORD=password123
```

### 3. Edit Test Matrix

Open `data/uat-matrix.xlsx` and add test cases:

| Role | Feature/Module | Operation | Test Scenario | Priority | Environment | Expected Behavior | Browser Coverage | Flow |
|------|---|---|---|---|---|---|---|---|
| Merchant Admin | User Management | create | Merchant Admin creates user - success | High | UAT | User created and visible in list | Chromium | createUserHappyPath |
| Merchant Staff | User Management | create | Merchant Staff creates user - success | High | UAT | User created and visible in list | Chromium | createUserHappyPath |

### 4. Convert & Generate Tests

```bash
# Convert Excel to CSV
npm run convert

# Generate test files for User Management only
npm run generate -- --modules "User Management"

# Or generate all modules
npm run generate
```

### 5. Run Tests

```bash
# Run all tests
npm test

# Run specific test file
npx playwright test tests/generated/uat-merchant-admin.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Run in debug mode
npx playwright test --debug

```

---

## Adding Tests

### Step 1: Add Row to uat-matrix.xlsx

| Column | Value |
|--------|-------|
| Role | Merchant Admin |
| Feature/Module | User Management |
| Operation | create |
| Test Scenario | Merchant Admin creates user - success |
| Priority | High |
| Environment | UAT |
| Expected Behavior | User created and visible in list |
| Browser Coverage | Chromium |
| Flow | createUserHappyPath |

### Step 2: Create Flow (if new)

If `createUserHappyPath` doesn't exist, create it in `tests/flows/user-mgmt.ts`:

```typescript
export async function createUserHappyPath(page: Page): Promise<{ email: string; password: string }> {
  // Step 1: Navigate
  await navigateToUserManagement(page);
  
  // Step 2: Interact
  await clickCreateUserButton(page);
  await fillFirstName(page, 'Test');
  
  // Step 3: Verify
  await verifyUserCreatedInList(page, email);
  
  return { email, password };
}
```

### Step 3: Add Flow to flow-signatures.js

```javascript
module.exports = {
  // ... existing flows ...
  createUserHappyPath: ['page'],  // ← Add this
};
```

### Step 4: Create Helpers (if needed)

Add new selectors/interactions to `tests/utils/userMgmtHelpers.ts`:

```typescript
export async function fillFirstName(page: Page, firstName: string): Promise<void> {
  await page.getByText('Basic Information').click();
  await page.getByRole('textbox').first().fill(firstName);
}
```

### Step 5: Generate & Run

```bash
npm run convert
npm run generate -- --modules "User Management"
npm test
```

---

## Running Tests

### Generate Tests

```bash
# Convert Excel to CSV
npm run convert

# Generate all tests
npm run generate

# Generate specific module
npm run generate -- --modules "User Management"

# Generate multiple modules
npm run generate -- --modules "User Management,Support"

# Show help
npm run generate -- --help
```

### Run Tests

```bash
# Run all tests
npm test

# Run specific file
npx playwright test tests/generated/uat-merchant-admin.spec.ts

# Run specific test
npx playwright test -g "creates user"

# Run in headed mode
npx playwright test --headed

# Run in debug mode
npx playwright test --debug

# Run with specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox

# Generate HTML report
npx playwright test --reporter=html
```

### Best Practices

| Do | Don't |
|----|-------|
| Keep flows focused on test logic | Mix selectors into flows |
| Use helpers for all DOM interactions | Hardcode selectors in flows |
| Use descriptive function names | Create generic helpers |
| Add waits before every interaction | Rely on implicit waits |
| Return test data from flows | Log test data |

---

## Test Data

### Automatic Generators

The framework provides random test data generation:

```typescript
import { generateRandomEmail, generateRandomPhoneNumber } from '../flows/utils/testDataGenerators';

const email = generateRandomEmail();      // testuser_1716352800_abc123@xyz789.com
const phone = generateRandomPhoneNumber(); // 81234567
```

### Environment Variables

Credentials are loaded from `.env`:

```typescript
import { getEmailFromEnv, getPasswordFromEnv } from '../utils/envHelpers';

const email = getEmailFromEnv('MERCHANT_ADMIN_EMAIL');
const password = getPasswordFromEnv('MERCHANT_ADMIN_PASSWORD');
```

### Data Cleanup

Each test should clean up after itself:

```typescript
// In flow
export async function createUserHappyPath(page: Page): Promise<{ email: string; password: string }> {
  // ... create user ...
  
  // Clean up (optional, depending on test strategy)
  await deleteUserCreated(page, email);
  
  return { email, password };
}
```

---

## Troubleshooting

### Selector Not Found

**Use Playwright codegen to find correct selector:**

```bash
npx playwright codegen https://admin-staging.shopnjoy.com
```

Then update the helper with the correct selector.

### Environment Variables Not Loading

**Verify `.env` exists and is in `.gitignore`:**

```bash
# Check if .env is present
cat .env

# Verify it's ignored
cat .gitignore | grep .env
```

## Contributing

### Adding a New Module

1. Create flow file: `tests/flows/[module].ts`
2. Create helpers file: `tests/utils/[module]Helpers.ts`
3. Add flows to `flow-signatures.js`
4. Export from `tests/flows/index.ts`
5. Add test rows to `uat-matrix.xlsx`
6. Run: `npm run convert && npm run generate`

### Code Standards

- Use explicit waits (`waitForLoadState`, `waitForNavigation`)
- Name flows as verbs: `createUserHappyPath`, `loginAsAdminUser`
- Name helpers as actions: `fillFirstName`, `clickCreateButton`
- Add JSDoc comments for all public functions

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [CSV Format Guide](https://en.wikipedia.org/wiki/Comma-separated_values)

---

**Last Updated:** May 22, 2026  
**Framework Version:** 1.0  
**Status:** Active Development
