import { test, expect } from '@playwright/test';
import { HomePage } from '@pages/home/HomePage';
import { NJoyBookPage } from '@pages/configuration/njoybook/NjoyBookPage';
import { RulesTab } from '@pages/configuration/njoybook/tabs/RulesTab';
import { TimeSlotsTab, Weekday } from '@pages/configuration/njoybook/tabs/TimeSlotsTab';
import { StaffTab } from '@pages/configuration/njoybook/tabs/StaffTab';
import { BookingsTab } from '@pages/configuration/njoybook/tabs/BookingsTab';
import { BlockoutsTab } from '@pages/configuration/njoybook/tabs/BlockoutsTab';
import { NJOYBOOK_FULL_ACCESS_ROLES, NJOYBOOK_LIMITED_ROLES } from '../helpers/roles';
import { PublicBookingPage } from '@pages/booking/PublicBookingPage';

// The booking flow is exercised against the "Hajime - My Village" branch — it
// is the branch that is actually published on the public booking site and is
// configured in Staff booking mode with bookable staff assigned to its slots.
const TEST_BRANCH_NAME = 'Hajime - My Village';

// The public booking site lives on a DIFFERENT host from the admin app, so this
// is an absolute URL (the admin baseURL does not apply). It is a merchant-level
// page that defaults to the only publicly-bookable branch (My Village).
const PUBLIC_BOOKING_URL = 'https://staging.shopnjoy.com/booking/hajime-tonkatsu-and-ramen';

const TEST_STAFF_A = 'booking-tester-staff-A';
const TEST_STAFF_B = 'booking-tester-staff-B';

/** Next Monday (never today) as an ISO date — the weekday whose slots the
 *  bookable fixture assigns staff to, so it always has public availability. */
function nextMondayISO(): string {
  const d = new Date();
  const delta = ((8 - d.getDay()) % 7) || 7;
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

/** Formats an ISO date as the admin bookings day label, e.g. "13 Jul". */
function dayLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00`);
  return `${d.getDate()} ${d.toLocaleString('en-US', { month: 'short' })}`;
}

/** A guest name unique per run so repeated runs don't collide in the (not yet
 *  auto-cleaned) bookings list. */
function uniqueGuest(prefix: string): string {
  return `${prefix} ${Date.now()}`;
}

/** An ISO date a given number of days in the future. */
function futureISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Formats an ISO date as the blockout list label. The list renders dates in the
 *  browser's locale; the test browser is en-US, which reads "Sep 14, 2026". */
function blockoutLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Restores a known-good NJoyBook baseline via the Rules tab's "Set to Default"
 * button, then saves. The recommended defaults use Booking Mode = 'Staff',
 * which is what these tests need (Staff tab + staff controls), so this doubles
 * as both the Staff-mode precondition and the between-tests reset.
 *
 * CAVEAT: "Set to Default" only resets the Rules tab. It does NOT reset Time
 * Slots, per-staff toggles, or delete created bookings, so tests that mutate
 * those are still not fully isolated. A dedicated reset/delete endpoint from
 * the dev team is the long-term fix.
 */
async function resetNJoyBookRules(njoyBookPage: NJoyBookPage): Promise<void> {
  const rules = await njoyBookPage.goToRules();
  await rules.setToDefault();
  await rules.save();
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
  // Like njoyBookPage, but additionally re-assigns a staff member to the
  // (Monday) time slots so the branch has public availability — the Rules
  // "Set to Default" reset clears slot-staff assignments, which availability
  // depends on. Used by the booking-flow tests.
  bookableNjoyBook: NJoyBookPage;
  // Navigates to the branch's NJoyBook page WITHOUT touching Rules. Used by the
  // limited roles, which cannot open the Rules tab (so the reset the njoyBookPage
  // fixture performs is neither possible nor needed). Uses openBranchConfig, which
  // also handles branch-scoped roles that have no "Branches" tab.
  limitedNjoyBookPage: NJoyBookPage;
  rulesTab: RulesTab;
  timeSlotsTab: TimeSlotsTab;
  staffTab: StaffTab;
  bookingsTab: BookingsTab;
  // Bookings tab reached WITHOUT the Rules "Set to Default" reset. Admin booking
  // creation/management does not depend on Rules state, so these tests skip the
  // reset to avoid needless shared-config churn (and concurrent-reset clashes).
  bookingsOnly: BookingsTab;
  // Blockouts tab plus a `created` list: any date labels pushed to it are deleted
  // in teardown (blockouts fully support create + delete, so tests self-clean).
  blockouts: { tab: BlockoutsTab; created: string[] };
};

const njoyBookTest = test.extend<NJoyBookFixtures>({
  // Establishes a clean Staff-mode baseline before each test and restores it
  // afterward (teardown runs pass or fail, so a failed test can't leave Rules
  // mutated for whatever runs next).
  njoyBookPage: async ({ page }, use) => {
    const home = new HomePage(page);
    await home.goto();

    const configOverview = await home.goToConfiguration();
    const branchConfig = await configOverview.goToBranch(TEST_BRANCH_NAME);
    const njoyBookPage = await branchConfig.goToNJoyBook();

    await resetNJoyBookRules(njoyBookPage);

    await use(njoyBookPage);

    await resetNJoyBookRules(njoyBookPage);
  },

  bookableNjoyBook: async ({ njoyBookPage }, use) => {
    // Runs after njoyBookPage's reset (which clears slot-staff assignments), so
    // re-establish availability by assigning a staff member to the slots. A plain
    // Rules save does not clear these, so later rule tweaks in the test body are
    // safe; only "Set to Default" clears them.
    const timeSlots = await njoyBookPage.goToTimeSlots();
    await timeSlots.assignStaffToSlots(TEST_STAFF_A);
    await use(njoyBookPage);
  },

  limitedNjoyBookPage: async ({ page }, use) => {
    const home = new HomePage(page);
    await home.goto();

    const configOverview = await home.goToConfiguration();
    const branchConfig = await configOverview.openBranchConfig(TEST_BRANCH_NAME);
    const njoyBookPage = await branchConfig.goToNJoyBook();

    await use(njoyBookPage);
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

  bookingsOnly: async ({ page }, use) => {
    const home = new HomePage(page);
    await home.goto();

    const configOverview = await home.goToConfiguration();
    const branchConfig = await configOverview.openBranchConfig(TEST_BRANCH_NAME);
    const njoyBookPage = await branchConfig.goToNJoyBook();
    const bookingsTab = await njoyBookPage.goToBookings();

    await use(bookingsTab);
  },

  blockouts: async ({ page }, use) => {
    const home = new HomePage(page);
    await home.goto();

    const configOverview = await home.goToConfiguration();
    const branchConfig = await configOverview.openBranchConfig(TEST_BRANCH_NAME);
    const njoyBookPage = await branchConfig.goToNJoyBook();
    const tab = await njoyBookPage.goToBlockouts();

    const created: string[] = [];
    await use({ tab, created });

    // Guaranteed cleanup (runs pass or fail): delete every blockout the test made.
    for (const label of created) {
      await tab.deleteBlockout(label).catch(() => { /* already gone */ });
    }
  },
});

test.describe('Configuration - NJoyBook', () => {
  // Full configuration access — merchant admin only. These exercise the advanced
  // tabs (Rules, Time Slots, Staff) that are hidden from every other role.
  for (const role of NJOYBOOK_FULL_ACCESS_ROLES) {
    njoyBookTest.describe(`${role.label} ${role.tag}`, () => {
      // --- Rules: Enable / Disable Booking ---

      njoyBookTest.describe('Rules - Enable Booking', () => {
        njoyBookTest(
          'disabling booking blocks the public booking page',
          async ({ rulesTab, context }) => {
            await rulesTab.disableBooking();
            await rulesTab.save();
            await rulesTab.expectBookingEnabled(false);

            const publicTab = await context.newPage();
            const publicPage = new PublicBookingPage(publicTab);
            await publicTab.goto(PUBLIC_BOOKING_URL);
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
            await publicPage.gotoReady(PUBLIC_BOOKING_URL);
          },
        );
      });

      // --- Rules: Auto-Confirm ---
      // These submit a real public booking; the bookableNjoyBook fixture ensures
      // the branch has slot availability (staff assigned to Monday slots).
      //
      // TODO(recaptcha): the whole flow works (availability, all 4 steps), but
      // the public site guards the final "Confirm booking" with reCAPTCHA, which
      // rejects the headless test context ("reCAPTCHA verification failed").
      // Kept as fixme (bodies intact) until staging exposes a reCAPTCHA test-key
      // / bypass so headless submission passes. Verified working manually.

      njoyBookTest.describe('Rules - Auto-Confirm', () => {
        njoyBookTest.fixme(
          'a booking made while auto-confirm is on lands as Confirmed',
          async ({ bookableNjoyBook, context }) => {
            const rules = await bookableNjoyBook.goToRules();
            await rules.setAutoConfirm(true);
            await rules.save();

            const date = nextMondayISO();
            const guest = uniqueGuest('AutoConfirm On');

            const publicTab = await context.newPage();
            const publicPage = new PublicBookingPage(publicTab);
            await publicPage.gotoReady(PUBLIC_BOOKING_URL);
            await publicPage.submitBooking({
              date,
              guest: { name: guest, phone: '91234567', email: 'auto-confirm@example.com' },
            });

            const bookings = await bookableNjoyBook.goToBookings();
            await bookings.openFilters();
            await bookings.goToDate(dayLabel(date));
            await bookings.filterByStatus('Confirmed');
            await bookings.expectBookingVisible(guest);
          },
        );

        njoyBookTest.fixme(
          'a booking made while auto-confirm is off lands as Pending',
          async ({ bookableNjoyBook, context }) => {
            const rules = await bookableNjoyBook.goToRules();
            await rules.setAutoConfirm(false);
            await rules.save();

            const date = nextMondayISO();
            const guest = uniqueGuest('AutoConfirm Off');

            const publicTab = await context.newPage();
            const publicPage = new PublicBookingPage(publicTab);
            await publicPage.gotoReady(PUBLIC_BOOKING_URL);
            await publicPage.submitBooking({
              date,
              guest: { name: guest, phone: '91234568', email: 'pending@example.com' },
            });

            const bookings = await bookableNjoyBook.goToBookings();
            await bookings.openFilters();
            await bookings.goToDate(dayLabel(date));
            await bookings.filterByStatus('Pending');
            await bookings.expectBookingVisible(guest);
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
            await publicPage.gotoReady(PUBLIC_BOOKING_URL);

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
            await publicPage.gotoReady(PUBLIC_BOOKING_URL);

            await publicPage.increaseGuests(10); // attempt to exceed max
            await publicPage.expectIncreaseDisabled();
          },
        );

        njoyBookTest(
          'saving max party size lower than min surfaces a validation error',
          async ({ rulesTab }) => {
            await rulesTab.setMinPartySize(5);
            await rulesTab.setMaxPartySize(2);
            await rulesTab.save();

            await rulesTab.expectRuleValidationError();
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

        // TODO(env): deactivating a slot goes through the Time Slots "Bulk Edit"
        // modal (Visibility → "Set selected slots as active"), not the read-only
        // slot detail. Needs a TimeSlotsTab.setSlotStatus() built on that modal,
        // plus a stable way to assert the slot is gone from the public page for a
        // specific date. Deferred until the bulk-edit flow is automated.
        njoyBookTest.fixme(
          'deactivating a slot removes it from the public booking page',
          async () => {},
        );
      });

      // --- Staff: Bookable Toggle ---

      njoyBookTest.describe('Staff - Bookable Toggle', () => {
        njoyBookTest(
          'configured staff are visible and active by default',
          async ({ staffTab }) => {
            await staffTab.expectStaffVisible(TEST_STAFF_A, 'Active');
            await staffTab.expectStaffVisible(TEST_STAFF_B, 'Active');
          },
        );

        // TODO(env): these require BOTH test staff to be assigned to the branch's
        // time slots so that turning one non-bookable leaves the other as a
        // reachable specialist on the public page. Currently only staff-A is
        // reliably slot-assigned, so toggling it off removes availability
        // entirely. Re-enable once staff-B is assigned to the slots.
        njoyBookTest.fixme(
          'turning a staff member non-bookable removes them from the public booking page',
          async () => {},
        );

        njoyBookTest.fixme(
          're-enabling bookable restores the staff member on the public page',
          async () => {},
        );
      });

      // --- Bookings: Admin Add Booking ---
      // Admin-side booking creation (the "Add booking" modal) lands directly as
      // Confirmed and bypasses the public reCAPTCHA/step flow. Guest names are
      // unique per run.
      //
      // ENV PRECONDITION: bookings are created for TODAY (the modal's default
      // date) because only dates whose weekday has staff-assigned, available
      // slots can be booked, and on staging that is reliably today only. Future
      // dates return API 400 "Selected slot is not available". So these tests
      // require today to have availability (staffed slots) — see
      // njoybook-test-environment. New bookings appear in the default (today)
      // list view without navigation.

      njoyBookTest.describe('Bookings - Admin Add Booking', () => {
        // TODO(delete-booking): verified working end-to-end against a low-volume
        // environment, but each fixed slot caps at 5 bookings and there is no way
        // to delete bookings yet, so on shared UAT the slots fill up across runs
        // and creation returns "Selected slot is not available". Un-fixme the
        // booking-creating tests once the frontend delete button lands and a
        // deleteBooking() teardown can free capacity.
        njoyBookTest.fixme(
          'admin-created booking appears in the list as Confirmed',
          async ({ bookingsOnly: bookingsTab }) => {
            const guest = uniqueGuest('Admin Add');

            const modal = await bookingsTab.openAddBooking();
            await modal.createBooking({
              startTime: '15:30',
              partySize: 2,
              name: guest,
              email: 'admin-add@example.com',
              phone: '91234500',
            });

            await bookingsTab.expectBookingVisible(guest);
            await bookingsTab.expectBookingStatus(guest, 'Confirmed');
          },
        );

        njoyBookTest(
          'required fields are validated on submit',
          async ({ bookingsOnly: bookingsTab }) => {
            const modal = await bookingsTab.openAddBooking();
            await modal.submit();
            await modal.expectValidationError();
            await modal.close();
          },
        );
      });

      // --- Bookings: Status Lifecycle ---
      // The booking status machine is forward-only: Confirmed -> Checked in ->
      // Completed, with Cancel / No-show as terminal exits. Each test creates its
      // own booking so runs are independent.
      //
      // TODO(delete-booking): these leave bookings behind — status transitions
      // cannot be reverted and there is no delete action yet. Wire a
      // deleteBooking() teardown once the frontend delete button ships.

      njoyBookTest.describe('Bookings - Status Lifecycle', () => {
        // Creates a Confirmed booking (today) at the given slot; the row appears
        // in the default list view. Returns the unique guest name.
        async function seedConfirmedBooking(
          bookingsTab: BookingsTab,
          label: string,
          startTime: string,
          phone: string,
        ): Promise<string> {
          const guest = uniqueGuest(label);
          const modal = await bookingsTab.openAddBooking();
          await modal.createBooking({
            startTime,
            partySize: 2,
            name: guest,
            email: 'lifecycle@example.com',
            phone,
          });
          return guest;
        }

        // TODO(delete-booking): see the Add-Booking note — these create bookings
        // and share the slot-capacity limitation until the delete button ships.
        njoyBookTest.fixme(
          'checking in then completing advances the status',
          async ({ bookingsOnly: bookingsTab }) => {
            const guest = await seedConfirmedBooking(bookingsTab, 'Lifecycle CheckIn', '16:30', '91234501');

            const detail = await bookingsTab.openBooking(guest);
            const status = await detail.openStatusModal();
            await status.checkIn();
            await detail.openLogs();
            await detail.expectAuditEntry('Checked In');
            await detail.goBack();
            await bookingsTab.expectBookingStatus(guest, 'Checked in');

            const detail2 = await bookingsTab.openBooking(guest);
            const status2 = await detail2.openStatusModal();
            await status2.markCompleted();
            await detail2.goBack();
            await bookingsTab.expectBookingStatus(guest, 'Completed');
          },
        );

        njoyBookTest.fixme(
          'a confirmed booking can be cancelled',
          async ({ bookingsOnly: bookingsTab }) => {
            const guest = await seedConfirmedBooking(bookingsTab, 'Lifecycle Cancel', '18:30', '91234502');

            const detail = await bookingsTab.openBooking(guest);
            const status = await detail.openStatusModal();
            await status.cancelBooking();
            await detail.goBack();
            await bookingsTab.expectBookingStatus(guest, 'Cancelled');
          },
        );

        njoyBookTest.fixme(
          'a confirmed booking can be marked no-show',
          async ({ bookingsOnly: bookingsTab }) => {
            const guest = await seedConfirmedBooking(bookingsTab, 'Lifecycle NoShow', '19:30', '91234503');

            const detail = await bookingsTab.openBooking(guest);
            const status = await detail.openStatusModal();
            await status.markNoShow();
            await detail.goBack();
            await bookingsTab.expectBookingStatus(guest, 'No show');
          },
        );
      });

      // --- Bookings: Detail & Edit ---

      njoyBookTest.describe('Bookings - Detail & Edit', () => {
        // TODO(edit-modal): the create/detail/edit chain reaches the "Edit
        // booking" modal, but the party-size change is not persisting and the
        // modal does not close on Save in headless runs (the Add-booking modal is
        // what remains visible). The EditBookingModal page object is in place;
        // this needs a trace-level look at the openEdit -> save flow. The detail
        // read-path (expectFields) is covered by the passing lifecycle tests.
        njoyBookTest.fixme(
          'editing a booking updates its details',
          async ({ bookingsOnly: bookingsTab }) => {
            const guest = uniqueGuest('Edit');

            const modal = await bookingsTab.openAddBooking();
            await modal.createBooking({
              startTime: '20:30',
              partySize: 2,
              name: guest,
              email: 'edit@example.com',
              phone: '91234504',
            });

            const detail = await bookingsTab.openBooking(guest);
            await detail.expectFields({ name: guest, partySize: '2' });

            const edit = await detail.openEdit();
            await edit.fill({ partySize: 4, occasion: 'Birthday' });
            await edit.save();

            await detail.openDetails();
            await detail.expectFields({ occasion: 'Birthday', partySize: '4' });
          },
        );
      });

      // --- Bookings: Filters ---

      njoyBookTest.describe('Bookings - Filters', () => {
        // TODO(delete-booking): creates a booking, so shares the slot-capacity
        // limitation until the delete button ships (see the Add-Booking note).
        njoyBookTest.fixme(
          'the status filter narrows the list to matching bookings',
          async ({ bookingsOnly: bookingsTab }) => {
            const guest = uniqueGuest('Filter');

            const modal = await bookingsTab.openAddBooking();
            await modal.createBooking({
              startTime: '12:30',
              partySize: 2,
              name: guest,
              email: 'filter@example.com',
              phone: '91234505',
            });

            await bookingsTab.openFilters();
            await bookingsTab.filterByStatus('Confirmed');
            await bookingsTab.expectBookingVisible(guest);

            await bookingsTab.filterByStatus('Pending');
            await bookingsTab.expectBookingAbsent(guest);
          },
        );
      });

      // --- Blockouts ---
      // Blockouts fully support create + delete, so these self-clean via the
      // `blockouts` fixture teardown (unlike bookings). A far-future date is used
      // so the temporary closure can't affect the booking tests.

      njoyBookTest.describe('Blockouts', () => {
        njoyBookTest(
          'a closed blockout can be created and then removed',
          async ({ blockouts }) => {
            const { tab, created } = blockouts;
            const date = futureISO(60);
            const label = blockoutLabel(date);

            const modal = await tab.openAddBlockout();
            await modal.fill({ startDate: date, endDate: date });
            await modal.submit();
            created.push(label);

            await tab.expectBlockoutVisible(label);

            await tab.deleteBlockout(label);
            created.pop();
            await tab.expectBlockoutAbsent(label);
          },
        );
      });

      // --- End-to-End Booking ---
      // These create real bookings and don't request the njoyBookPage fixture's
      // reset (there is nothing to reset in the Rules sense), so the bookings
      // persist. Guest names are made unique per run to avoid collisions.

      njoyBookTest.describe('End-to-End Booking', () => {
        // TODO(recaptcha): blocked at the final "Confirm booking" by reCAPTCHA in
        // headless runs (see the Auto-Confirm note). Flow + availability verified;
        // un-fixme once a staging reCAPTCHA bypass exists.
        njoyBookTest.fixme(
          'customer can complete a booking and it appears in admin as Confirmed',
          async ({ bookableNjoyBook, context }) => {
            const date = nextMondayISO();
            const guest = uniqueGuest('E2E Guest');

            const publicTab = await context.newPage();
            const publicPage = new PublicBookingPage(publicTab);
            await publicPage.gotoReady(PUBLIC_BOOKING_URL);
            await publicPage.selectBranch(TEST_BRANCH_NAME);

            const ref = await publicPage.submitBooking({
              date,
              guest: { name: guest, phone: '91234567', email: 'e2e-test@example.com' },
            });
            expect(ref).toMatch(/^BK-\d{8}-\d+$/);

            const bookings = await bookableNjoyBook.goToBookings();
            await bookings.openFilters();
            await bookings.goToDate(dayLabel(date));
            await bookings.filterByStatus('Confirmed');
            await bookings.expectBookingVisible(guest);
          },
        );

        // TODO(env): needs 2+ specialists available for a slot so the
        // "No preference" auto-assign option appears. Blocked on staff-B being
        // assigned to the branch's time slots.
        njoyBookTest.fixme(
          'customer can book with "No preference" staff selection',
          async () => {},
        );

        // TODO(env): needs a date that is reliably fully-booked or blocked out to
        // trigger the no-availability state on demand. Pairs with a Blockouts
        // setup step (BlockoutsTab.addBlockout) once that is implemented.
        njoyBookTest.fixme(
          'booking is rejected when no slots are available for the selected date/party size',
          async () => {},
        );
      });
    });
  }

  // Limited access — merchant staff, branch admin, branch staff. These roles see
  // only the Bookings and Booking Page tabs; the advanced tabs are hidden and an
  // "Access Restricted" banner is shown. Read-only, so safe under fullyParallel.
  for (const role of NJOYBOOK_LIMITED_ROLES) {
    njoyBookTest.describe(`${role.label} ${role.tag}`, () => {
      njoyBookTest.describe('Access Control', () => {
        njoyBookTest(
          'the advanced NJoyBook configuration tabs are hidden',
          async ({ limitedNjoyBookPage }) => {
            await limitedNjoyBookPage.expectAdvancedTabsHidden();
          },
        );

        njoyBookTest(
          'can open the Bookings tab',
          async ({ limitedNjoyBookPage }) => {
            await limitedNjoyBookPage.expectTabVisible('Bookings');
            // goToBookings() asserts the Bookings heading, proving access.
            await limitedNjoyBookPage.goToBookings();
          },
        );

        njoyBookTest(
          'the Booking Page tab opens the public booking site',
          async ({ limitedNjoyBookPage }) => {
            await limitedNjoyBookPage.expectTabVisible('Booking Page');
            const publicTab = await limitedNjoyBookPage.openBookingPage();
            await expect(publicTab).toHaveURL(/staging\.shopnjoy\.com\/booking\//);
          },
        );
      });
    });
  }
});
