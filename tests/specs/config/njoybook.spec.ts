import { test } from '@playwright/test';
import { HomePage } from '@pages/home/HomePage';
import { NJoyBookPage } from '@pages/configuration/njoybook/NjoyBookPage';
import { RulesTab } from '@pages/configuration/njoybook/tabs/RulesTab';
import { TimeSlotsTab, Weekday } from '@pages/configuration/njoybook/tabs/TimeSlotsTab';
import { StaffTab } from '@pages/configuration/njoybook/tabs/StaffTab';
import { BookingsTab } from '@pages/configuration/njoybook/tabs/BookingsTab';
import { NJOYBOOK_CONFIG_ROLES } from '../helpers/roles';
import { PublicBookingPage } from '@pages/booking/PublicBookingPage';

const TEST_BRANCH_NAME = 'Hajime - Thomson Plaza';
const TEST_BRANCH_ID = 'branch_6HHoMh3C3N8w1xqPeK';
const PUBLIC_BOOKING_URL = '/booking/hajime-tonkatsu-and-ramen';
const TEST_STAFF_NAME = 'Jeffry Zhou';

/**
 * TODO: this endpoint does not exist yet — needs to be requested from the dev
 * team. It should reset NJoyBook config (Rules, Time Slots, Staff bookable
 * status) for the given branch back to known seeded defaults.
 *
 * Proposed: POST /internal/test/branches/:id/njoybook/reset-defaults
 *
 * Until this exists, tests that mutate Rules/Time Slots/Staff state are not
 * isolated from each other — a failure partway through a test can leave
 * config mutated for every test that runs after it.
 */
async function resetNJoyBookDefaults(request: import('@playwright/test').APIRequestContext): Promise<void> {
  await request.post(`/internal/test/branches/${TEST_BRANCH_ID}/njoybook/reset-defaults`);
}

const ALL_WEEKDAYS: Weekday[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

type NJoyBookFixtures = {
  njoyBookPage: NJoyBookPage;
  rulesTab: RulesTab;
  timeSlotsTab: TimeSlotsTab;
  staffTab: StaffTab;
  bookingsTab: BookingsTab;
};

const njoyBookTest = test.extend<NJoyBookFixtures>({
  // Resets NJoyBook config back to defaults after every test, regardless of
  // pass/fail, so a failed test can't leave Rules/Time Slots/Staff mutated
  // for whatever runs next. Runs as part of fixture teardown rather than at
  // the end of each test body, so it executes even if the test throws.
  njoyBookPage: async ({ page, request }, use) => {
    const home = new HomePage(page);
    await home.goto();

    const configOverview = await home.goToConfiguration();
    // TODO: ConfigOverview.goToBranch() does not exist yet — needs a method that
    // navigates to a specific branch's config page by name and returns a
    // BranchConfigPage (or similar) exposing goToNJoyBook().
    const branchConfig = await configOverview.goToBranch(TEST_BRANCH_NAME);
    const njoyBookPage = await branchConfig.goToNJoyBook();

    await use(njoyBookPage);

    // Teardown phase — runs after the test body completes, pass or fail.
    await resetNJoyBookDefaults(request);
  },

  rulesTab: async ({ njoyBookPage }, use) => {
    const rulesTab = await njoyBookPage.goToRules();
    await use(rulesTab);
  },

  timeSlotsTab: async ({ njoyBookPage }, use) => {
    const timeSlotsTab = await njoyBookPage.goToTimeSlots();
    await use(timeSlotsTab);
  },

  staffTab: async ({ njoyBookPage }, use) => {
    const staffTab = await njoyBookPage.goToStaff();
    await use(staffTab);
  },

  bookingsTab: async ({ njoyBookPage }, use) => {
    const bookingsTab = await njoyBookPage.goToBookings();
    await use(bookingsTab);
  },
});

test.describe('Configuration - NJoyBook', () => {
  for (const role of NJOYBOOK_CONFIG_ROLES) {
    njoyBookTest.describe(`${role.label} ${role.tag}`, () => {
      // --- Rules: Enable / Disable Booking ---

      njoyBookTest.describe('Rules - Enable Booking', () => {
        njoyBookTest('booking is enabled by default for an active branch', async ({ rulesTab }) => {
          await rulesTab.expectBookingEnabled(true);
        });

        njoyBookTest(
          'disabling booking blocks the public booking page',
          async ({ rulesTab, context }) => {
            await rulesTab.disableBooking();
            await rulesTab.save();
            await rulesTab.expectBookingEnabled(false);

            // TODO: open the public page in a fresh tab so the admin session and the
            // public booking session don't interfere.
            const publicTab = await context.newPage();
            const publicPage = new PublicBookingPage(publicTab);
            await publicTab.goto(PUBLIC_BOOKING_URL);

            // TODO: PublicBookingPage has no method to assert "booking unavailable"
            // yet — need to crawl the public page in this disabled state to find the
            // actual empty-state copy/element, then add expectBookingUnavailable().
            await publicPage.expectBookingUnavailable();
          },
        );

        njoyBookTest(
          're-enabling booking restores public availability',
          async ({ rulesTab, context }) => {
            await rulesTab.disableBooking();
            await rulesTab.save();

            await rulesTab.enableBooking();
            await rulesTab.save();
            await rulesTab.expectBookingEnabled(true);

            const publicTab = await context.newPage();
            const publicPage = new PublicBookingPage(publicTab);
            await publicTab.goto(PUBLIC_BOOKING_URL);
            await publicPage.waitForReady();
          },
        );
      });

      // --- Rules: Auto-Confirm ---

      njoyBookTest.describe('Rules - Auto-Confirm', () => {
        njoyBookTest(
          'a booking made while auto-confirm is on lands as Confirmed',
          async ({ rulesTab, njoyBookPage, context }) => {
            await rulesTab.setAutoConfirm(true);
            await rulesTab.save();

            const publicTab = await context.newPage();
            const publicPage = new PublicBookingPage(publicTab);
            await publicTab.goto(PUBLIC_BOOKING_URL);
            await publicPage.waitForReady();

            // TODO: PublicBookingPage needs a full submission flow method, e.g.
            // submitBooking(data) that drives Step 1 -> Step 2 -> Step 3 and returns
            // a confirmation reference we can search for in admin.
            const bookingRef = await publicPage.submitBooking({
              partySize: 2,
              timeSlot: '11:30',
              guestName: 'Auto Confirm Test Guest',
              guestPhone: '91234567',
            });

            const bookings = await njoyBookPage.goToBookings();
            await bookings.openFilters();
            await bookings.filterByStatus('Confirmed');

            // TODO: BookingsTab has no way to look up a booking by guest name/ref
            // yet. Needs expectBookingVisible(ref) that scans the list for a match.
            await bookings.expectBookingVisible(bookingRef);
          },
        );

        njoyBookTest(
          'a booking made while auto-confirm is off lands as Pending',
          async ({ rulesTab, njoyBookPage, context }) => {
            await rulesTab.setAutoConfirm(false);
            await rulesTab.save();

            const publicTab = await context.newPage();
            const publicPage = new PublicBookingPage(publicTab);
            await publicTab.goto(PUBLIC_BOOKING_URL);
            await publicPage.waitForReady();

            const bookingRef = await publicPage.submitBooking({
              partySize: 2,
              timeSlot: '12:30',
              guestName: 'Pending Test Guest',
              guestPhone: '91234568',
            });

            const bookings = await njoyBookPage.goToBookings();
            await bookings.openFilters();
            await bookings.filterByStatus('Pending');
            await bookings.expectBookingVisible(bookingRef);
          },
        );
      });

      // --- Rules: Party Size Boundaries ---

      njoyBookTest.describe('Rules - Party Size Boundaries', () => {
        njoyBookTest(
          'public page blocks party size below the configured minimum',
          async ({ rulesTab, context }) => {
            await rulesTab.setMinPartySize(2);
            await rulesTab.setMaxPartySize(5);
            await rulesTab.save();

            const publicTab = await context.newPage();
            const publicPage = new PublicBookingPage(publicTab);
            await publicTab.goto(PUBLIC_BOOKING_URL);
            await publicPage.waitForReady();

            await publicPage.decreaseGuests(5); // attempt to go well below min
            await publicPage.expectDecreaseDisabled();
          },
        );

        njoyBookTest(
          'public page blocks party size above the configured maximum',
          async ({ rulesTab, context }) => {
            await rulesTab.setMinPartySize(1);
            await rulesTab.setMaxPartySize(3);
            await rulesTab.save();

            const publicTab = await context.newPage();
            const publicPage = new PublicBookingPage(publicTab);
            await publicTab.goto(PUBLIC_BOOKING_URL);
            await publicPage.waitForReady();

            await publicPage.increaseGuests(10); // attempt to exceed max

            // TODO: PublicBookingPage has no expectIncreaseDisabled() yet — mirror
            // of expectDecreaseDisabled() but for the increase button at the max.
            await publicPage.expectIncreaseDisabled();
          },
        );

        njoyBookTest(
          'saving max party size lower than min surfaces a validation error',
          async ({ rulesTab }) => {
            await rulesTab.setMinPartySize(5);
            await rulesTab.setMaxPartySize(2);
            await rulesTab.save();

            await rulesTab.expectValidationError();
          },
        );
      });

      // --- Time Slots: Weekday Visibility ---

      njoyBookTest.describe('Time Slots - Weekday Visibility', () => {
        for (const day of ALL_WEEKDAYS) {
          njoyBookTest(`shows 10 slots for ${day}`, async ({ timeSlotsTab }) => {
            await timeSlotsTab.selectWeekday(day);
            await timeSlotsTab.expectSlotCount(day, 10);
          });
        }

        njoyBookTest(
          'the standard 11:30 slot is visible and active on Monday',
          async ({ timeSlotsTab }) => {
            await timeSlotsTab.selectWeekday('Monday');
            await timeSlotsTab.expectSlotVisible('11:30', 'Active');
          },
        );

        njoyBookTest(
          'deactivating a slot removes it from the public booking page',
          async ({ timeSlotsTab, context }) => {
            await timeSlotsTab.selectWeekday('Monday');
            const detail = await timeSlotsTab.openSlot('20:30');

            // TODO: TimeSlotDetail has no toggle for Active/Inactive yet — the
            // crawl only captured the read-only detail view. Need an edit
            // affordance, e.g. detail.setStatus('Inactive'), once we crawl the
            // edit mode of a slot.
            await detail.setStatus('Inactive');
            await detail.goBack();

            await timeSlotsTab.expectSlotVisible('20:30', 'Inactive');

            // TODO: cross-check on the public booking page that the 20:30 slot is
            // no longer selectable for Monday's date. Needs PublicBookingPage
            // methods to pick a specific Monday date and assert a given time slot
            // is absent from the slot list.
            const publicTab = await context.newPage();
            await publicTab.goto(PUBLIC_BOOKING_URL);
          },
        );
      });

      // --- Staff: Bookable Toggle ---

      njoyBookTest.describe('Staff - Bookable Toggle', () => {
        njoyBookTest(
          'configured staff are visible and active by default',
          async ({ staffTab }) => {
            await staffTab.expectStaffVisible('Jeffry Zhou', 'Active');
            await staffTab.expectStaffVisible('Regina George', 'Active');
          },
        );

        njoyBookTest(
          'turning a staff member non-bookable removes them from the public booking page',
          async ({ staffTab, context }) => {
            const modal = await staffTab.editStaff(TEST_STAFF_NAME);
            await modal.setBookable(false);
            await modal.save();

            const publicTab = await context.newPage();
            const publicPage = new PublicBookingPage(publicTab);
            await publicTab.goto(PUBLIC_BOOKING_URL);
            await publicPage.waitForReady();

            // TODO: PublicBookingPage needs to navigate to the staff-selection step
            // before this assertion is meaningful, plus a new
            // expectStaffOptionAbsent(name) method.
            await publicPage.expectStaffOptionAbsent(TEST_STAFF_NAME);
          },
        );

        njoyBookTest(
          're-enabling bookable restores the staff member on the public page',
          async ({ staffTab, context }) => {
            const modal = await staffTab.editStaff(TEST_STAFF_NAME);
            await modal.setBookable(false);
            await modal.save();

            const modal2 = await staffTab.editStaff(TEST_STAFF_NAME);
            await modal2.setBookable(true);
            await modal2.save();

            const publicTab = await context.newPage();
            const publicPage = new PublicBookingPage(publicTab);
            await publicTab.goto(PUBLIC_BOOKING_URL);
            await publicPage.waitForReady();

            // TODO: same dependency as above — needs PublicBookingPage staff-step
            // navigation plus an expectStaffOptionVisible(name) assertion.
            await publicPage.expectStaffOptionVisible(TEST_STAFF_NAME);
          },
        );
      });

      // --- End-to-End Booking ---
      // Deliberately not using the tab-level fixtures here — this is the core
      // happy-path flow and reads more clearly end-to-end in one place.
      //
      // CAVEAT: because these tests don't request the njoyBookPage fixture,
      // the automatic reset-to-defaults teardown above does NOT run for them.
      // These tests create real bookings rather than mutating Rules/Time
      // Slots/Staff config, so there's nothing to "reset" in the same sense —
      // but the bookings themselves persist in the system afterward. If that
      // matters (e.g. booking counts/limits affecting later tests), this
      // needs its own cleanup, likely a separate reset or delete-booking
      // endpoint from the dev team rather than the config-reset one above.

      njoyBookTest.describe('End-to-End Booking', () => {
        njoyBookTest(
          'customer can complete a booking and it appears in admin as Confirmed',
          async ({ page, context }) => {
            const publicPage = new PublicBookingPage(page);
            await page.goto(PUBLIC_BOOKING_URL);
            await publicPage.waitForReady();

            await publicPage.selectBranch(TEST_BRANCH_NAME);

            // TODO: use a "next available weekday" date helper from
            // testDataGenerators.ts rather than a hardcoded date, so this test
            // doesn't go stale.
            await publicPage.setDate('2026-07-02');

            await publicPage.increaseGuests(1); // 1 -> 2 guests
            await publicPage.selectTimeSlot('11:30');
            await publicPage.continue();

            // TODO: Step 2 (Your Details) has no page object yet. Need a
            // YourDetailsStep with fill({ name, phone, email }) and next()
            // returning ReviewConfirmStep.
            // const detailsStep = new YourDetailsStep(page);
            // await detailsStep.fill({
            //   name: 'E2E Test Guest',
            //   phone: '91234567',
            //   email: 'e2e-test@example.com',
            // });
            // const reviewStep = await detailsStep.next();

            // TODO: Step 3 (Review & Confirm) also has no page object yet. Need
            // acceptTerms() and confirm(), where confirm() returns a booking
            // reference we can search for in admin.
            // const bookingRef = await reviewStep.acceptTerms().confirm();

            const home = new HomePage(await context.newPage());
            await home.goto();

            const configOverview = await home.goToConfiguration();
            const branchConfig = await configOverview.goToBranch(TEST_BRANCH_NAME);
            const njoyBookPage = await branchConfig.goToNJoyBook();
            const bookings = await njoyBookPage.goToBookings();

            await bookings.openFilters();
            await bookings.filterByStatus('Confirmed');

            // TODO: depends on bookingRef above and on
            // BookingsTab.expectBookingVisible(), neither of which exist yet.
            // await bookings.expectBookingVisible(bookingRef);
          },
        );

        njoyBookTest(
          'customer can book with "No preference" staff selection',
          async ({ page }) => {
            const publicPage = new PublicBookingPage(page);
            await page.goto(PUBLIC_BOOKING_URL);
            await publicPage.waitForReady();

            await publicPage.selectBranch(TEST_BRANCH_NAME);
            await publicPage.setDate('2026-07-02');
            await publicPage.increaseGuests(1);
            await publicPage.selectTimeSlot('12:30');

            // TODO: no page object support yet for the staff-selection sub-step —
            // need to re-crawl with "Allow customer to choose staff" and "Allow
            // any available staff" both enabled to see exactly where this
            // selector appears in the flow.
            // await publicPage.selectStaffPreference('No preference');

            await publicPage.continue();

            // Remaining steps blocked on the Step 2/3 page objects noted above.
          },
        );

        njoyBookTest(
          'booking is rejected when no slots are available for the selected date/party size',
          async ({ page }) => {
            const publicPage = new PublicBookingPage(page);
            await page.goto(PUBLIC_BOOKING_URL);
            await publicPage.waitForReady();

            await publicPage.selectBranch(TEST_BRANCH_NAME);

            // TODO: need a date known to be fully booked or blocked out to
            // reliably trigger this state, rather than relying on incidental
            // unavailability. Likely pairs with a Blockouts setup step once
            // BlockoutsTab gains an addBlockout(date) implementation.
            await publicPage.setDate('2026-07-02');
            await publicPage.increaseGuests(20); // exceeds any realistic capacity

            await publicPage.expectNoTablesAvailable();
            await publicPage.expectContinueDisabled();
          },
        );
      });
    });
  }
});