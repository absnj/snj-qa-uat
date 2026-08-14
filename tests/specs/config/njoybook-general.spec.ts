import { test, expect } from '@playwright/test';
import { BranchConfigPage } from '@pages/configuration/branch/BranchConfigPage';
import { NJoyBookPage } from '@pages/configuration/njoybook/NjoyBookPage';
import { RulesTab } from '@pages/configuration/njoybook/tabs/RulesTab';
import { BookingsTab } from '@pages/configuration/njoybook/tabs/bookings/BookingsTab';
import { BlockoutsTab } from '@pages/configuration/njoybook/tabs/blockouts/BlockoutsTab';
import { TimeSlotsTab } from '@pages/configuration/njoybook/tabs/time-slots/TimeSlotsTab';
import { NJOYBOOK_FULL_ACCESS_ROLES } from '../helpers/roles';
import { PublicBookingPage } from '@pages/booking/PublicBookingPage';
import { uniqueGuest, futureISO, blockoutLabel, nextWeekdayISO, ALL_WEEKDAYS } from './njoybook.helpers';

// The general/non-staff booking flow is exercised against "Hajime - Thomson
// Plaza" — a branch configured in Branch booking mode (no staff assignment;
// slots advertise remaining table capacity, not specialist counts) and
// published on the same public booking site as the staff-mode branch.
const TEST_BRANCH_NAME = 'Hajime - Thomson Plaza';

// Same public site as njoybook-staff.spec.ts (different host from the admin
// app, hence the absolute URL). More than one branch is published, so
// selectBranch() is always required — see PublicBookingPage's class doc.
const PUBLIC_BOOKING_URL = 'https://staging.shopnjoy.com/booking/hajime-tonkatsu-and-ramen';

/**
 * Restores a known-good Rules baseline via "Set to Default", then switches
 * Booking Mode back to 'Branch' before saving. The recommended defaults use
 * Booking Mode = 'Staff' (see njoybook-staff.spec.ts's identical helper),
 * which would de-provision this branch's Branch-mode setup (hide Time Slots'
 * table-capacity behaviour, drop the public page back to the Staff-mode
 * flow) if left uncorrected — so every reset here explicitly re-selects
 * 'Branch' before persisting.
 *
 * CAVEAT: "Set to Default" only resets the Rules tab. It does not reset Time
 * Slots or delete created bookings.
 */
async function resetNJoyBookRulesToBranchMode(njoyBookPage: NJoyBookPage): Promise<void> {
  const rules = await njoyBookPage.goToRules();
  await rules.setToDefault();
  await rules.setBookingMode('Branch');
  await rules.save();
}

type NJoyBookGeneralFixtures = {
  // Navigates to the branch's NJoyBook page. Does NOT reset Rules — used by
  // scenarios that only read config or that were already passing against
  // whatever Rules state is currently saved (Branch Mode Provisioning, Guest
  // History, the plain End-to-End booking). Uses openBranchConfig, which also
  // handles branch-scoped roles that have no "Branches" tab.
  njoyBookPage: NJoyBookPage;
  bookingsTab: BookingsTab;
  // Like njoyBookPage, but establishes a clean Rules baseline before each test
  // (Branch-mode-safe — see resetNJoyBookRulesToBranchMode) and restores it
  // afterward, pass or fail. Used by Rules-mutating scenarios.
  resetNjoyBookPage: NJoyBookPage;
  rulesTab: RulesTab;
  // Bookings tab reached WITHOUT the Rules reset. Admin booking creation and
  // status management do not depend on Rules state, so these skip the reset
  // to avoid needless shared-config churn (mirrors njoybook-staff.spec.ts).
  bookingsOnly: BookingsTab;
  // Blockouts tab plus a `created` list: any date labels pushed to it are
  // deleted in teardown (blockouts fully support create + delete).
  blockouts: { tab: BlockoutsTab; created: string[] };
  // Time Slots on Wednesday (never "today" — today is Monday — so
  // deactivating a slot here can't hide a slot the "today"-dependent
  // Bookings tests rely on), plus a `deactivated` list: any slot start time
  // pushed to it is re-activated in teardown, pass or fail.
  restorableTimeSlots: { tab: TimeSlotsTab; deactivated: string[] };
};

const njoyBookTest = test.extend<NJoyBookGeneralFixtures>({
  njoyBookPage: async ({ page }, use) => {
    const branchConfig = await BranchConfigPage.open(page, TEST_BRANCH_NAME);
    const njoyBookPage = await branchConfig.goToNJoyBook();

    await use(njoyBookPage);
  },

  bookingsTab: async ({ njoyBookPage }, use) => {
    const bookingsTab = await njoyBookPage.goToBookings();
    await use(bookingsTab);
  },

  resetNjoyBookPage: async ({ page }, use) => {
    const branchConfig = await BranchConfigPage.open(page, TEST_BRANCH_NAME);
    const njoyBookPage = await branchConfig.goToNJoyBook();

    await resetNJoyBookRulesToBranchMode(njoyBookPage);

    await use(njoyBookPage);

    await resetNJoyBookRulesToBranchMode(njoyBookPage);
  },

  rulesTab: async ({ resetNjoyBookPage }, use) => {
    const rulesTab = await resetNjoyBookPage.goToRules();
    await use(rulesTab);
  },

  bookingsOnly: async ({ page }, use) => {
    const branchConfig = await BranchConfigPage.open(page, TEST_BRANCH_NAME);
    const njoyBookPage = await branchConfig.goToNJoyBook();
    const bookingsTab = await njoyBookPage.goToBookings();

    await use(bookingsTab);
  },

  blockouts: async ({ page }, use) => {
    const branchConfig = await BranchConfigPage.open(page, TEST_BRANCH_NAME);
    const njoyBookPage = await branchConfig.goToNJoyBook();
    const tab = await njoyBookPage.goToBlockouts();

    const created: string[] = [];
    await use({ tab, created });

    // Guaranteed cleanup (runs pass or fail): delete every blockout the test made.
    for (const label of created) {
      await tab.deleteBlockout(label).catch(() => { /* already gone */ });
    }
  },

  restorableTimeSlots: async ({ resetNjoyBookPage }, use) => {
    const tab = await resetNjoyBookPage.goToTimeSlots();
    await tab.selectWeekday('Wednesday');

    const deactivated: string[] = [];
    await use({ tab, deactivated });

    for (const startTime of deactivated) {
      await tab.setSlotStatus(startTime, true).catch(() => { /* already active */ });
    }
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

        njoyBookTest(
          'all Branch-mode configuration tabs are visible to the merchant admin',
          async ({ njoyBookPage }) => {
            for (const tab of [
              'Bookings',
              'Guest History',
              'Rules',
              'Time Slots',
              'Blockouts',
              'Booking Page',
            ] as const) {
              await njoyBookPage.expectTabVisible(tab);
            }
          },
        );

        // Confirms the reset helper other tests rely on actually lands back in
        // Branch mode (not the 'Set to Default' recommended Staff mode) —
        // doubles as a regression check for resetNJoyBookRulesToBranchMode.
        njoyBookTest(
          'Set to Default followed by re-selecting Branch mode keeps the branch in Branch mode',
          async ({ resetNjoyBookPage }) => {
            await resetNjoyBookPage.expectTabHidden('Staff');
          },
        );
      });

      njoyBookTest.describe('Guest History', () => {
        // Read-only: opens the tab and exercises the Shoppers / Anonymous guests
        // toggle and search control. Does not depend on specific guest data.
        njoyBookTest(
          'lists shoppers and can switch to anonymous guests',
          async ({ njoyBookPage }) => {
            const guestHistory = await njoyBookPage.goToGuestHistory();
            await guestHistory.expectControlsVisible();
            await guestHistory.viewAnonymousGuests();
            await guestHistory.viewShoppers();
          },
        );
      });

      // --- Time Slots ---
      // Verified live against Thomson Plaza on 2026-07-20: every weekday
      // shows 10 standard slots running hourly 11:30-20:30, each "Max 5 ·
      // Active" — the same template shape as the staff-mode branch.

      njoyBookTest.describe('Time Slots - Weekday Visibility', () => {
        for (const day of ALL_WEEKDAYS) {
          njoyBookTest(`shows 10 slots for ${day}`, async ({ njoyBookPage }) => {
            const timeSlots = await njoyBookPage.goToTimeSlots();
            await timeSlots.selectWeekday(day);
            await timeSlots.expectSlotCount(day, 10);
          });
        }

        njoyBookTest(
          'the standard 11:30 slot is visible and active on Monday',
          async ({ njoyBookPage }) => {
            const timeSlots = await njoyBookPage.goToTimeSlots();
            await timeSlots.selectWeekday('Monday');
            await timeSlots.expectSlotVisible('11:30', 'Active');
          },
        );

        // Wednesday's 19:30 slot renders as "7:30 PM" publicly; deactivating
        // it must drop that slot from the calendar while its neighbours
        // remain. Unlike the staff-mode branch, no staff assignment is
        // needed first — Branch-mode public availability isn't staff-gated
        // (the existing End-to-End booking test already confirms this).
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
            // A neighbouring slot proves the date's availability loaded
            // before asserting the deactivated one is absent.
            await publicPage.expectSlotOffered('8:30 PM');
            await publicPage.expectSlotAbsent('7:30 PM');

            await tab.setSlotStatus('19:30', true);
            deactivated.pop();
          },
        );
      });

      // --- Booking Page ---
      // The tab is a deep link to the public site, not an in-app panel — see
      // NJoyBookPage.openBookingPage()'s class doc.

      njoyBookTest.describe('Booking Page', () => {
        njoyBookTest(
          'opens the public booking page in a new tab',
          async ({ njoyBookPage }) => {
            const publicTab = await njoyBookPage.openBookingPage();
            await expect(publicTab).toHaveURL(/staging\.shopnjoy\.com\/booking\//);
          },
        );

        njoyBookTest(
          "the public URL matches the branch's booking site",
          async ({ njoyBookPage }) => {
            const publicTab = await njoyBookPage.openBookingPage();
            await expect(publicTab).toHaveURL(PUBLIC_BOOKING_URL);
          },
        );
      });

      // --- Rules: Enable / Disable Booking ---

      // Mirrors the same TODO in njoybook-staff.spec.ts: with two branches
      // published on the shared public site, disabling only THIS branch does
      // not trigger the site-wide "not available at any branch" message,
      // because the other (Staff-mode) branch remains bookable. Bodies kept
      // intact pending a per-branch "unavailable" signal.
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
      });

      // --- Rules: Auto-Confirm ---
      // Submits a real public Branch-mode booking against today (see the
      // AddBookingModal / ENV PRECONDITION note in njoybook-staff.spec.ts —
      // future dates are not reliably bookable on staging).
      //
      // TODO(recaptcha-regression): verified 2026-07-20, reproduced twice —
      // both tests reach "Review your booking" with correct data and fail only
      // at "Confirm booking" with "reCAPTCHA verification failed. Please try
      // again." Affects PublicBookingPage.confirm() repo-wide, not just these.
      // Re-enable once reCAPTCHA reliably passes headless.

      njoyBookTest.describe('Rules - Auto-Confirm', () => {
        njoyBookTest.fixme(
          'a booking made while auto-confirm is on lands as Confirmed',
          async ({ rulesTab, resetNjoyBookPage, context }) => {
            await rulesTab.setAutoConfirm(true);
            await rulesTab.save();

            const date = futureISO(0);
            const guest = uniqueGuest('General AutoConfirm On');

            const publicTab = await context.newPage();
            const publicPage = new PublicBookingPage(publicTab);
            await publicPage.gotoReady(PUBLIC_BOOKING_URL);
            await publicPage.selectBranch(TEST_BRANCH_NAME);
            await publicPage.submitBranchBooking({
              date,
              guest: { name: guest, phone: '91234510', email: 'general-auto-confirm@example.com' },
            });

            const bookings = await resetNjoyBookPage.goToBookings();
            await bookings.expectBookingVisible(guest);
            await bookings.expectBookingStatus(guest, 'Confirmed');
          },
        );

        njoyBookTest.fixme(
          'a booking made while auto-confirm is off lands as Pending',
          async ({ rulesTab, resetNjoyBookPage, context }) => {
            await rulesTab.setAutoConfirm(false);
            await rulesTab.save();

            const date = futureISO(0);
            const guest = uniqueGuest('General AutoConfirm Off');

            const publicTab = await context.newPage();
            const publicPage = new PublicBookingPage(publicTab);
            await publicPage.gotoReady(PUBLIC_BOOKING_URL);
            await publicPage.selectBranch(TEST_BRANCH_NAME);
            await publicPage.submitBranchBooking({
              date,
              guest: { name: guest, phone: '91234511', email: 'general-pending@example.com' },
            });

            const bookings = await resetNjoyBookPage.goToBookings();
            await bookings.expectBookingVisible(guest);
            await bookings.expectBookingStatus(guest, 'Pending');
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

      // --- Rules: Persistence Across Reload ---
      // Each test saves, reloads the page, and re-opens Rules as a fresh
      // RulesTab instance, so the assertion reads back the persisted server
      // state rather than lingering unsaved form state.

      njoyBookTest.describe('Rules - Persistence Across Reload', () => {
        njoyBookTest(
          'the enable booking toggle persists across reload',
          async ({ rulesTab, page }) => {
            await rulesTab.disableBooking();
            await rulesTab.save();

            await page.reload();
            const reloadedRules = await new NJoyBookPage(page).goToRules();
            await reloadedRules.expectBookingEnabled(false);
          },
        );

        njoyBookTest(
          'session length, slot interval, capacity, and booking-window settings persist across reload',
          async ({ rulesTab, page }) => {
            // This test's setup/teardown resets plus 7 fields set, saved,
            // reloaded, and re-read individually run past the global 75s
            // test timeout (observed live 2026-07-20) — not a functional
            // failure, just more work than the default budget allows.
            njoyBookTest.setTimeout(150_000);

            await rulesTab.fill({
              sessionLength: '1 hour 30 minutes',
              slotCadence: '30 minutes',
              bookingsPerSlot: 3,
              overbookingBuffer: 1,
              advanceBookingWindow: 'Up to 2 weeks ahead',
              minimumNotice: 'At least 1 hour ahead',
              noShowWindow: '30 minutes after start',
            });
            await rulesTab.save();

            await page.reload();
            const reloadedRules = await new NJoyBookPage(page).goToRules();

            await reloadedRules.expectSessionLength('1 hour 30 minutes');
            await reloadedRules.expectSlotCadence('30 minutes');
            await reloadedRules.expectBookingsPerSlot(3);
            await reloadedRules.expectOverbookingBuffer(1);
            await reloadedRules.expectAdvanceBookingWindow('Up to 2 weeks ahead');
            await reloadedRules.expectMinimumNotice('At least 1 hour ahead');
            await reloadedRules.expectNoShowWindow('30 minutes after start');
          },
        );

        njoyBookTest(
          'customer reminder checkboxes can be multi-selected and persist',
          async ({ rulesTab, page }) => {
            await rulesTab.setReminderTimings(['1 day before', '1 hour before']);
            await rulesTab.save();

            await page.reload();
            const reloadedRules = await new NJoyBookPage(page).goToRules();

            await reloadedRules.expectReminderTimingChecked('1 day before', true);
            await reloadedRules.expectReminderTimingChecked('1 hour before', true);
            await reloadedRules.expectReminderTimingChecked('3 hours before', false);
          },
        );

        njoyBookTest(
          'confirmation message and booking terms rich text persist',
          async ({ rulesTab, page }) => {
            const confirmationText = `Thanks for booking! ${Date.now()}`;
            const termsText = `Terms apply. ${Date.now()}`;
            await rulesTab.setConfirmationMessage(confirmationText);
            await rulesTab.setBookingTerms(termsText);
            await rulesTab.save();

            await page.reload();
            const reloadedRules = await new NJoyBookPage(page).goToRules();

            await reloadedRules.expectConfirmationMessage(confirmationText);
            await reloadedRules.expectBookingTerms(termsText);
          },
        );
      });

      // --- Bookings: Admin Add Booking ---
      // Admin-side booking creation lands directly as Confirmed and bypasses
      // the public reCAPTCHA/step flow. Picks whichever start time the modal
      // offers first rather than a hardcoded literal — which slots are
      // actually bookable depends on branch config and existing bookings
      // against the per-slot cap, neither of which this spec can assume.

      njoyBookTest.describe('Bookings - Admin Add Booking', () => {
        njoyBookTest(
          'admin-created booking appears in the list as Confirmed',
          async ({ bookingsOnly: bookingsTab }) => {
            const guest = uniqueGuest('General Admin Add');

            const modal = await bookingsTab.openAddBooking();
            const startTime = await modal.selectFirstAvailableStartTime();
            await modal.createBooking({
              startTime,
              partySize: 2,
              name: guest,
              email: 'general-admin-add@example.com',
              phone: '91234512',
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
      // Each test creates its own booking so runs are independent.
      //
      // ENV PRECONDITION (same as njoybook-staff.spec.ts): admin bookings land
      // on TODAY, because only today reliably has open slots on staging. Each
      // of this branch's 10 slots caps at 5 bookings/day, and global setup only
      // cancels *active* bookings — Cancelled/No-show/Completed ones from
      // earlier runs still count against the cap (verified 2026-07-20), so a
      // day's capacity can run out. Not a code defect: it clears the next day.
      // If these hang on the Start time combobox, that's the cause.

      njoyBookTest.describe('Bookings - Status Lifecycle', () => {
        async function seedConfirmedBooking(
          bookingsTab: BookingsTab,
          label: string,
          phone: string,
        ): Promise<string> {
          const guest = uniqueGuest(label);
          const modal = await bookingsTab.openAddBooking();
          const startTime = await modal.selectFirstAvailableStartTime();
          await modal.createBooking({
            startTime,
            partySize: 2,
            name: guest,
            email: 'general-lifecycle@example.com',
            phone,
          });
          return guest;
        }

        njoyBookTest(
          'checking in then completing advances the status',
          async ({ bookingsOnly: bookingsTab }) => {
            const guest = await seedConfirmedBooking(bookingsTab, 'General Lifecycle CheckIn', '91234513');

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
          'a confirmed booking can be cancelled, and is then locked from further status changes',
          async ({ bookingsOnly: bookingsTab }) => {
            const guest = await seedConfirmedBooking(bookingsTab, 'General Lifecycle Cancel', '91234514');

            const detail = await bookingsTab.openBooking(guest);
            const status = await detail.openStatusModal();
            await status.cancelBooking();
            await detail.goBack();
            await bookingsTab.expectBookingStatus(guest, 'Cancelled');

            const cancelledDetail = await bookingsTab.openBooking(guest);
            await cancelledDetail.expectStatusChangeUnavailable();
          },
        );

        njoyBookTest(
          'the detail record shows source, created, and updated fields',
          async ({ bookingsOnly: bookingsTab }) => {
            const guest = await seedConfirmedBooking(bookingsTab, 'General Lifecycle Record', '91234517');

            const detail = await bookingsTab.openBooking(guest);
            await detail.expectFieldLabelsVisible(['Source', 'Created', 'Last updated']);
          },
        );

        njoyBookTest(
          'a confirmed booking can be marked no-show',
          async ({ bookingsOnly: bookingsTab }) => {
            const guest = await seedConfirmedBooking(bookingsTab, 'General Lifecycle NoShow', '91234515');

            const detail = await bookingsTab.openBooking(guest);
            const status = await detail.openStatusModal();
            await status.markNoShow();
            await detail.goBack();
            await bookingsTab.expectBookingStatus(guest, 'No show');
          },
        );
      });

      // --- Bookings: Filters ---

      njoyBookTest.describe('Bookings - Filters', () => {
        njoyBookTest(
          'the status filter narrows the list to matching bookings',
          async ({ bookingsOnly: bookingsTab }) => {
            const guest = uniqueGuest('General Filter');

            const modal = await bookingsTab.openAddBooking();
            const startTime = await modal.selectFirstAvailableStartTime();
            await modal.createBooking({
              startTime,
              partySize: 2,
              name: guest,
              email: 'general-filter@example.com',
              phone: '91234516',
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
      // Blockouts fully support create + delete, so this self-cleans via the
      // `blockouts` fixture teardown. A far-future date keeps the temporary
      // closure clear of the "today" bookings the other scenarios rely on.

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

        njoyBookTest(
          '"Open with overrides" applies a max-bookings and discount override',
          async ({ blockouts }) => {
            const { tab, created } = blockouts;
            const date = futureISO(61);
            const label = blockoutLabel(date);

            const modal = await tab.openAddBlockout();
            await modal.fill({
              startDate: date,
              endDate: date,
              mode: 'Open with overrides',
              overrideMaxBookings: 2,
              overrideDiscountPercent: 10,
            });
            await modal.submit();
            created.push(label);

            await tab.expectBlockoutVisible(label);

            const edit = await tab.editBlockout(label);
            await edit.expectOverrides({ overrideMaxBookings: 2, overrideDiscountPercent: 10 });
            await edit.close();

            await tab.deleteBlockout(label);
            created.pop();
          },
        );
      });

      // --- End-to-End Booking ---

      njoyBookTest.describe('End-to-End Booking', () => {
        // Creates a real booking, so this mutates shared UAT — the per-run
        // "Remove active" reset in global setup keeps this branch's slots
        // under their capacity cap between runs.
        //
        // TODO(recaptcha-regression): see the identical note on the
        // Rules - Auto-Confirm tests above — this fails at the same
        // "Confirm booking" step for the same reason (verified live
        // 2026-07-20), not a defect in this test. Un-fixme together.
        njoyBookTest.fixme(
          'customer can complete a Branch-mode booking and it appears in admin as Confirmed or Pending',
          async ({ bookingsTab, context }) => {
            const date = futureISO(0);
            const guest = uniqueGuest('General E2E');

            const publicTab = await context.newPage();
            const publicPage = new PublicBookingPage(publicTab);
            await publicPage.gotoReady(PUBLIC_BOOKING_URL);
            await publicPage.selectBranch(TEST_BRANCH_NAME);

            // Branch-mode slots advertise remaining table capacity, not a
            // specialist count — assert that wording before booking.
            await publicPage.expectRemainingCapacitySlotOffered();

            const ref = await publicPage.submitBranchBooking({
              date,
              guest: { name: guest, phone: '91234599', email: 'general-e2e@example.com' },
            });
            expect(ref).toMatch(/^BK-\d{8}-\d+$/);

            await bookingsTab.expectBookingVisible(guest);
            await bookingsTab.expectBookingStatusOneOf(guest, ['Confirmed', 'Pending']);
          },
        );

        // A blockout closes a specific date so the public page offers no
        // times for it. Far-future date, inside the advance-booking window,
        // clear of the "today" bookings the other scenarios rely on; the
        // blockouts fixture deletes it in teardown.
        njoyBookTest(
          'booking is rejected when no slots are available for the selected date',
          async ({ blockouts, context }) => {
            const { tab, created } = blockouts;
            const date = nextWeekdayISO(1, 2); // Monday, ~2-3 weeks out
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
});
