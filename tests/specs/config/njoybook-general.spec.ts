import { test, expect } from '@playwright/test';
import { HomePage } from '@pages/home/HomePage';
import { NJoyBookPage } from '@pages/configuration/njoybook/NjoyBookPage';
import { BookingsTab } from '@pages/configuration/njoybook/tabs/bookings/BookingsTab';
import { NJOYBOOK_FULL_ACCESS_ROLES } from '../helpers/roles';
import { PublicBookingPage } from '@pages/booking/PublicBookingPage';
import { uniqueGuest, futureISO } from './njoybook.helpers';

// The general/non-staff booking flow is exercised against "Hajime - Thomson
// Plaza" — a branch configured in Branch booking mode (no staff assignment;
// slots advertise remaining table capacity, not specialist counts) and
// published on the same public booking site as the staff-mode branch.
const TEST_BRANCH_NAME = 'Hajime - Thomson Plaza';

// Same public site as njoybook-staff.spec.ts (different host from the admin
// app, hence the absolute URL). More than one branch is published, so
// selectBranch() is always required — see PublicBookingPage's class doc.
const PUBLIC_BOOKING_URL = 'https://staging.shopnjoy.com/booking/hajime-tonkatsu-and-ramen';

type NJoyBookGeneralFixtures = {
  // Navigates to the branch's NJoyBook page. Unlike the staff file's
  // njoyBookPage fixture, this does NOT run the Rules "Set to Default" reset —
  // that reset's recommended defaults switch Booking Mode to 'Staff', which
  // would de-provision this branch's Branch-mode setup. Uses openBranchConfig,
  // which also handles branch-scoped roles that have no "Branches" tab.
  njoyBookPage: NJoyBookPage;
  bookingsTab: BookingsTab;
};

const njoyBookTest = test.extend<NJoyBookGeneralFixtures>({
  njoyBookPage: async ({ page }, use) => {
    const home = new HomePage(page);
    await home.goto();

    const configOverview = await home.goToConfiguration();
    const branchConfig = await configOverview.openBranchConfig(TEST_BRANCH_NAME);
    const njoyBookPage = await branchConfig.goToNJoyBook();

    await use(njoyBookPage);
  },

  bookingsTab: async ({ njoyBookPage }, use) => {
    const bookingsTab = await njoyBookPage.goToBookings();
    await use(bookingsTab);
  },
});

test.describe('Configuration - NJoyBook (General / Branch mode)', () => {
  // NJoyBook reads back the shared branch config it mutates — run
  // sequentially, one worker, declaration order. The staff-mode file
  // (njoybook-staff.spec.ts) runs on its own worker in parallel — different
  // branch, isolated state, so the two files don't collide.
  njoyBookTest.describe.configure({ mode: 'default' });

  for (const role of NJOYBOOK_FULL_ACCESS_ROLES) {
    njoyBookTest.describe(`${role.label} ${role.tag}`, () => {
      njoyBookTest.describe('Branch Mode Provisioning', () => {
        njoyBookTest(
          'the Staff tab is hidden for a Branch-mode branch',
          async ({ njoyBookPage }) => {
            await njoyBookPage.expectTabHidden('Staff');
          },
        );
      });

      njoyBookTest.describe('End-to-End Booking', () => {
        // Creates a real booking, so this mutates shared UAT — the per-run
        // "Remove active" reset in global setup keeps this branch's slots
        // under their capacity cap between runs.
        njoyBookTest(
          'customer can complete a Branch-mode booking and it appears in admin as Confirmed or Pending',
          async ({ bookingsTab, context }) => {
            const date = futureISO(0);
            const guest = uniqueGuest('General E2E');

            const publicTab = await context.newPage();
            const publicPage = new PublicBookingPage(publicTab);
            await publicPage.gotoReady(PUBLIC_BOOKING_URL);
            await publicPage.selectBranch(TEST_BRANCH_NAME);

            const ref = await publicPage.submitBranchBooking({
              date,
              guest: { name: guest, phone: '91234599', email: 'general-e2e@example.com' },
            });
            expect(ref).toMatch(/^BK-\d{8}-\d+$/);

            await bookingsTab.expectBookingVisible(guest);
            await bookingsTab.expectBookingStatusOneOf(guest, ['Confirmed', 'Pending']);
          },
        );
      });
    });
  }
});
