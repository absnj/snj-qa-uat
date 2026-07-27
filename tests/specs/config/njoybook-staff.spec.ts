import { test, expect } from '@playwright/test';
import { HomePage } from '@pages/home/HomePage';
import { NJoyBookPage } from '@pages/configuration/njoybook/NjoyBookPage';
import { RulesTab } from '@pages/configuration/njoybook/tabs/RulesTab';
import { TimeSlotsTab } from '@pages/configuration/njoybook/tabs/time-slots/TimeSlotsTab';
import { StaffTab } from '@pages/configuration/njoybook/tabs/staff/StaffTab';
import { BookingsTab } from '@pages/configuration/njoybook/tabs/bookings/BookingsTab';
import { BlockoutsTab } from '@pages/configuration/njoybook/tabs/blockouts/BlockoutsTab';
import { NJOYBOOK_FULL_ACCESS_ROLES, NJOYBOOK_LIMITED_ROLES } from '../helpers/roles';
import { PublicBookingPage } from '@pages/booking/PublicBookingPage';
import {
  nextMondayISO,
  nextWeekdayISO,
  dayLabel,
  uniqueGuest,
  futureISO,
  blockoutLabel,
  ALL_WEEKDAYS,
} from './njoybook.helpers';

// The booking flow is exercised against the "Hajime - My Village" branch — it
// is a branch published on the public booking site, configured in Staff
// booking mode with bookable staff assigned to its slots. The public site now
// also publishes "Hajime - Thomson Plaza" (Branch mode, see
// njoybook-general.spec.ts), so it no longer defaults to a single branch —
// every public-page test here must call selectBranch(TEST_BRANCH_NAME).
const TEST_BRANCH_NAME = 'Hajime - My Village';

// The public booking site lives on a DIFFERENT host from the admin app, so this
// is an absolute URL (the admin baseURL does not apply). It is a merchant-level
// page listing every published branch — selectBranch() is required.
const PUBLIC_BOOKING_URL = 'https://staging.shopnjoy.com/booking/hajime-tonkatsu-and-ramen';

const TEST_STAFF_A = 'booking-tester-staff-A';
const TEST_STAFF_B = 'booking-tester-staff-B';

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
  // Staff tab on a branch whose TUESDAY slots have BOTH test staff assigned (so a
  // slot shows two specialists). Teardown restores staff-B's bookable flag pass
  // or fail. A dedicated weekday keeps its slot-template edits off Monday, which
  // the booking tests use.
  staffToggle: StaffTab;
  // Time Slots on a branch whose WEDNESDAY slots have staff-A assigned, plus a
  // `deactivated` list: any slot start time pushed to it is re-activated in
  // teardown. Dedicated weekday, so deactivating a slot can't hide a Monday slot
  // the booking tests rely on.
  restorableTimeSlots: { tab: TimeSlotsTab; deactivated: string[] };
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

  staffToggle: async ({ njoyBookPage }, use) => {
    // Assign both test staff to the TUESDAY slots so a Tuesday slot advertises
    // two specialists. staff-B is the toggle target (staff-A is the specialist
    // the booking tests rely on), so restore B's bookable flag in teardown even
    // if the test fails.
    const timeSlots = await njoyBookPage.goToTimeSlots();
    await timeSlots.selectWeekday('Tuesday');
    await timeSlots.assignStaffToSlots(TEST_STAFF_A);
    await timeSlots.assignStaffToSlots(TEST_STAFF_B);

    const staffTab = await njoyBookPage.goToStaff();
    await use(staffTab);

    const modal = await staffTab.editStaff(TEST_STAFF_B);
    await modal.setBookable(true);
    await modal.save();
  },

  restorableTimeSlots: async ({ njoyBookPage }, use) => {
    // Give WEDNESDAY public availability (staff-A on its slots) so deactivating
    // one slot is observable against its neighbours.
    const tab = await njoyBookPage.goToTimeSlots();
    await tab.selectWeekday('Wednesday');
    await tab.assignStaffToSlots(TEST_STAFF_A);

    const deactivated: string[] = [];
    await use({ tab, deactivated });

    // Guaranteed cleanup (pass or fail): re-activate every slot the test hid.
    for (const startTime of deactivated) {
      await tab.setSlotStatus(startTime, true).catch(() => { /* already active */ });
    }
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
  // NJoyBook reads back the shared branch config it mutates — run sequentially,
  // one worker, declaration order. 'default' (not 'serial') so a failure does
  // not skip the rest. The general-branch file runs on its own worker in parallel.
  njoyBookTest.describe.configure({ mode: 'default' });

  // Full configuration access — merchant admin only. These exercise the advanced
  // tabs (Rules, Time Slots, Staff) that are hidden from every other role.
  for (const role of NJOYBOOK_FULL_ACCESS_ROLES) {
    njoyBookTest.describe(`${role.label} ${role.tag}`, () => {
      // --- Rules: Enable / Disable Booking ---

      // TODO(isolation): the concurrency issue that originally blocked these is
      // gone now that this describe runs sequentially (mode: 'default'), one
      // worker, so a parallel reset can no longer flip booking back on
      // mid-test. But a SECOND blocker surfaced when Thomson Plaza (Branch
      // mode) was published alongside this branch: expectBookingUnavailable()
      // asserts a SITE-WIDE "Online booking is not available at any branch
      // right now." message. Disabling only Hajime - My Village no longer
      // triggers that message, since Thomson Plaza stays bookable — the
      // assertion needs a per-branch "unavailable" signal instead (e.g. no
      // slots offered for that branch/date) before these can be un-fixme'd.
      // Bodies kept intact.
      njoyBookTest.describe('Rules - Enable Booking', () => {
        njoyBookTest.fixme(
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

        njoyBookTest.fixme(
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
            await publicPage.selectBranch(TEST_BRANCH_NAME);
          },
        );
      });

      // --- Rules: Auto-Confirm ---
      // These submit a real public booking; the bookableNjoyBook fixture ensures
      // the branch has slot availability (staff assigned to Monday slots).
      //
      // TODO(recaptcha-regression): verified live on 2026-07-27 — both tests
      // reach "Review your booking" with correct data (branch, date, party
      // size, specialist, name/phone/email) and fail only on "Confirm booking"
      // with "reCAPTCHA verification failed. Please try again.". This is the
      // same repo-wide regression documented in njoybook-general.spec.ts's
      // identical Auto-Confirm/End-to-End tests — the earlier claim below that
      // reCAPTCHA stopped blocking headless submission as of 2026-07-13 has
      // regressed. Un-fixme once reCAPTCHA reliably passes for headless
      // "Confirm booking" again.

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
            await publicPage.selectBranch(TEST_BRANCH_NAME);
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
            await publicPage.selectBranch(TEST_BRANCH_NAME);
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
            await publicPage.selectBranch(TEST_BRANCH_NAME);

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
            await publicPage.selectBranch(TEST_BRANCH_NAME);

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

        // Deactivating a slot goes through the Time Slots "Bulk Edit" modal's
        // Visibility toggle (TimeSlotsTab.setSlotStatus). The restorableTimeSlots
        // fixture stages staff-A on the Wednesday slots and re-activates any slot
        // the test hides. Wednesday's 19:30 slot renders as "7:30 PM" publicly;
        // deactivating it must drop that slot from the calendar while its
        // neighbours remain.
        njoyBookTest(
          'deactivating a slot removes it from the public booking page',
          async ({ restorableTimeSlots, context }) => {
            const { tab, deactivated } = restorableTimeSlots;
            await tab.setSlotStatus('19:30', false);
            deactivated.push('19:30');

            const publicTab = await context.newPage();
            const publicPage = new PublicBookingPage(publicTab);
            await publicPage.gotoReady(PUBLIC_BOOKING_URL);
            await publicPage.selectBranch(TEST_BRANCH_NAME);
            await publicPage.setDate(nextWeekdayISO(3)); // Wednesday
            // A neighbouring slot proves the date's availability loaded before we
            // assert the deactivated one is absent.
            await publicPage.expectSlotSpecialists('8:30 PM', 1);
            await publicPage.expectSlotAbsent('7:30 PM');

            await tab.setSlotStatus('19:30', true);
            deactivated.pop();
          },
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

        // TODO(product): the staffToggle fixture assigns BOTH test staff to the
        // Tuesday slots, so the slot correctly advertises two specialists (the
        // first assertion passes). But turning staff-B *non-bookable* via the
        // Staff edit modal does NOT drop the slot's public specialist count —
        // verified 2026-07-13 it stayed at two, i.e. a slot-assigned staff still
        // counts as available regardless of the "bookable" flag. So the "bookable"
        // toggle is not the lever that removes a staff from the public page; the
        // intended behaviour needs product clarification (candidates: the "Active"
        // toggle, or de-assigning the staff from the slots via Bulk Edit). The
        // scaffolding (bookableToggle, expectSlotSpecialists, two-staff fixture) is
        // in place; un-fixme once the correct removal mechanism is confirmed.
        njoyBookTest.fixme(
          'turning a staff member non-bookable removes them from the public page, and re-enabling restores them',
          async ({ staffToggle: staffTab, context }) => {
            const date = nextWeekdayISO(2); // Tuesday
            const slot = '8:30 PM';

            const publicTab = await context.newPage();
            const publicPage = new PublicBookingPage(publicTab);
            await publicPage.gotoReady(PUBLIC_BOOKING_URL);
            await publicPage.selectBranch(TEST_BRANCH_NAME);
            await publicPage.setDate(date);
            await publicPage.expectSlotSpecialists(slot, 2);

            const off = await staffTab.editStaff(TEST_STAFF_B);
            await off.setBookable(false);
            await off.save();

            await publicPage.gotoReady(PUBLIC_BOOKING_URL);
            await publicPage.selectBranch(TEST_BRANCH_NAME);
            await publicPage.setDate(date);
            await publicPage.expectSlotSpecialists(slot, 1);

            const on = await staffTab.editStaff(TEST_STAFF_B);
            await on.setBookable(true);
            await on.save();

            await publicPage.gotoReady(PUBLIC_BOOKING_URL);
            await publicPage.selectBranch(TEST_BRANCH_NAME);
            await publicPage.setDate(date);
            await publicPage.expectSlotSpecialists(slot, 2);
          },
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
        // Capacity is reset once per run in global setup ("Remove active"
        // cancels every active booking on the branch), so each run starts under
        // the per-slot cap and this booking-creating test no longer fixmes on
        // "Selected slot is not available".
        njoyBookTest(
          'admin-created booking appears in the list as Confirmed',
          async ({ bookingsOnly: bookingsTab }) => {
            const guest = uniqueGuest('Admin Add');

            const modal = await bookingsTab.openAddBooking();
            const startTime = await modal.selectFirstAvailableStartTime();
            await modal.createBooking({
              startTime,
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
      // Capacity is reset once per run in global setup ("Remove active" cancels
      // every active — Pending/Confirmed/Checked-in — booking on the branch), so
      // these no longer fixme on slot capacity. CAVEAT: "Remove active" only
      // touches active bookings; the terminal states these tests end in
      // (Completed, No-show) are untouched and status transitions cannot be
      // reverted. If Completed/No-show bookings still count toward a slot's
      // 5-booking cap, they will accumulate slowly across runs (unverified — if
      // only active bookings count toward the cap, there is no accumulation).

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

        njoyBookTest(
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

        njoyBookTest(
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

        njoyBookTest(
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
            const startTime = await modal.selectFirstAvailableStartTime();
            await modal.createBooking({
              startTime,
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
        // Capacity is reset once per run in global setup — see the Add-Booking note.
        njoyBookTest(
          'the status filter narrows the list to matching bookings',
          async ({ bookingsOnly: bookingsTab }) => {
            const guest = uniqueGuest('Filter');

            const modal = await bookingsTab.openAddBooking();
            const startTime = await modal.selectFirstAvailableStartTime();
            await modal.createBooking({
              startTime,
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
        // TODO(recaptcha-regression): same regression as the Auto-Confirm
        // tests above — verified live on 2026-07-27, fails only at "Confirm
        // booking" with "reCAPTCHA verification failed. Please try again."
        // Un-fixme together.
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

        // TODO(public-gap): staff-B is now slot-assignable, so a slot can show two
        // specialists — but the public Specialist step still renders only the
        // named-staff list and NO "No preference" entry, even with the admin rule
        // "Allow any available staff" enabled (whose own helptext promises the
        // "No preference" option). Verified 2026-07-13: the customer-facing option
        // is not implemented, so this cannot be exercised end-to-end yet. Un-fixme
        // once the public booking site renders the "No preference" choice.
        njoyBookTest.fixme(
          'customer can book with "No preference" staff selection',
          async () => {},
        );

        // A blockout closes a specific date so the public page offers no times for
        // it. The date is a future Monday inside the advance-booking window but
        // clear of the nextMonday slots the booking tests use, and the blockouts
        // fixture deletes it in teardown.
        njoyBookTest(
          'booking is rejected when no slots are available for the selected date',
          async ({ blockouts, context }) => {
            const { tab, created } = blockouts;
            const date = nextWeekdayISO(1, 2); // Monday, ~2–3 weeks out
            const label = blockoutLabel(date);

            const modal = await tab.openAddBlockout();
            await modal.fill({ startDate: date, endDate: date });
            await modal.submit();
            created.push(label);

            const publicTab = await context.newPage();
            const publicPage = new PublicBookingPage(publicTab);
            await publicPage.gotoReady(PUBLIC_BOOKING_URL);
            await publicPage.selectBranch(TEST_BRANCH_NAME);
            await publicPage.setDate(date);
            await publicPage.expectNoTablesAvailable();
          },
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
