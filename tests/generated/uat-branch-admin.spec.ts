import { test } from '@playwright/test';
import * as flows from '../flows';

test.describe('UAT matrix role: Branch Admin', () => {

  test.describe('Feature tests', () => {
    test.beforeEach(async ({ page }) => {
      await flows.loginAs(page, 'BRANCH_ADMIN');
    });

    test('Branch Admin creates user - success [User Management | create]', async ({ page, context }) => {
      // Role: Branch Admin
      // Feature/Module: User Management
      // Operation: create
      // Expected Behavior: User created and visible in list

      await flows.createUserHappyPath(page);
    });

  });

});
