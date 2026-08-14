# NJoyBook Test Plan — Configuration ▸ Branch ▸ NJoyBook

> **Backlog, not current state.** This is the originally scoped coverage, written before the
> specs existed. Much of it is now implemented; some of it was found to be unrunnable. For what
> actually runs today, see [README's Test Coverage](../README.md#test-coverage) — use this list
> only to pick the next scenario to write.

The module has 6 tabs: **Bookings, Guest History, Rules, Time Slots, Blockouts, Booking Page**.
Tags are in the form `nJoyBook:<test name>`.

## Bookings
- nJoyBook:bookings-list-groups-by-time-slot-with-count
- nJoyBook:bookings-add-booking-modal-renders-schedule-guest-notes-sections
- nJoyBook:bookings-add-booking-requires-start-time-email-and-phone
- nJoyBook:bookings-add-booking-start-time-options-follow-weekday-schedule
- nJoyBook:bookings-create-booking-succeeds-and-appears-in-slot
- nJoyBook:bookings-remove-active-toggle-filters-list
- nJoyBook:bookings-open-booking-detail-shows-guest-booking-record-sections
- nJoyBook:bookings-detail-record-shows-source-created-and-updated
- nJoyBook:bookings-change-status-updates-active-booking
- nJoyBook:bookings-cancelled-booking-is-locked-and-status-cannot-change
- nJoyBook:bookings-detail-logs-subtab-shows-history

## Guest History
- nJoyBook:guesthistory-shoppers-and-anonymous-subtabs-switch
- nJoyBook:guesthistory-search-filters-guest-list
- nJoyBook:guesthistory-pagination-per-page-changes-page-size
- nJoyBook:guesthistory-shopper-detail-shows-attendance-and-summary-stats
- nJoyBook:guesthistory-shopper-detail-recent-bookings-table
- nJoyBook:guesthistory-no-show-reflected-in-attendance-percentage
- nJoyBook:guesthistory-anonymous-guests-list-renders

## Rules & Regulations
- nJoyBook:rules-enable-booking-toggle-persists
- nJoyBook:rules-service-type-and-booking-mode-selection-persists
- nJoyBook:rules-auto-confirm-toggle-persists
- nJoyBook:rules-capacity-min-max-party-size-validation
- nJoyBook:rules-session-length-and-slot-interval-selection
- nJoyBook:rules-bookings-per-slot-and-overbooking-buffer-persist
- nJoyBook:rules-booking-window-lead-time-and-min-notice
- nJoyBook:rules-mark-no-show-after-selection
- nJoyBook:rules-customer-reminder-checkboxes-multi-select
- nJoyBook:rules-confirmation-message-rich-text-editing
- nJoyBook:rules-booking-terms-rich-text-editing
- nJoyBook:rules-booking-photos-upload-limit-five
- nJoyBook:rules-save-booking-settings-persists-across-reload
- nJoyBook:rules-set-to-default-restores-defaults

## Time Slots
- nJoyBook:timeslots-weekday-selector-shows-per-day-slot-counts
- nJoyBook:timeslots-list-renders-slots-with-time-type-max-status
- nJoyBook:timeslots-add-slot-modal-fields-day-time-label-max-discount
- nJoyBook:timeslots-add-slot-creates-active-slot
- nJoyBook:timeslots-add-slot-inactive-toggle-hides-from-calendar
- nJoyBook:timeslots-edit-existing-slot
- nJoyBook:timeslots-bulk-edit-applies-to-multiple-slots

## Blockouts
- nJoyBook:blockouts-empty-state-when-none-configured
- nJoyBook:blockouts-add-blockout-modal-fields-date-range-mode-overrides
- nJoyBook:blockouts-closed-mode-blocks-bookings-for-date-range
- nJoyBook:blockouts-open-with-overrides-applies-max-and-discount
- nJoyBook:blockouts-created-blockout-appears-in-list

## Booking Page
- nJoyBook:bookingpage-opens-public-booking-page-in-new-tab
- nJoyBook:bookingpage-public-url-matches-branch

## Cross-cutting / access
- nJoyBook:access-enable-booking-off-hides-slots-from-public-page
- nJoyBook:module-tab-navigation-preserves-branch-context
- nJoyBook:role-visibility-across-merchant-and-branch-roles

---

## Notes for scaffolding
- The **Booking Page** tab is a deep link to the public site
  (staging.shopnjoy.com/booking/<slug>), so its tests span two origins —
  the admin baseURL and the public host.
- Several Rules / Time Slots / Blockouts scenarios mutate shared branch config;
  per CLAUDE.md they need a fixture that restores state via "Set to Default" or
  captured-and-restored settings, or must use unique data. Flag blockouts-* and
  rules-save-* as state-mutating.
- Crawl was done on **Hajime – Thomson Plaza**. This is now settled: both branches
  are targeted, by two different specs. `njoybook-general.spec.ts` covers Thomson
  Plaza (Branch mode, capacity-based) and `njoybook-staff.spec.ts` covers My Village
  (Staff mode, specialist-based). Pick the spec matching the booking mode your
  scenario needs — behaviour does not transfer between the two.

---

## Missing test-support capability: staffed slots for *today*

Three admin-booking scenarios on the Staff-mode branch (My Village) are
`test.skip`ped in `njoybook-staff.spec.ts` and cannot be re-enabled from the test
code alone:

- `Bookings - Admin Add Booking` › admin-created booking appears in the list as Confirmed
- `Bookings - Status Lifecycle` › checking in then completing advances the status
- `Bookings - Filters` › the status filter narrows the list to matching bookings

**Symptom.** Creating the booking fails with `400 {"message":"Selected slot is
not available"}`; the modal stays open and the test times out on the
closed-modal assertion. Confirmed directly against UAT on 2026-08-14 with
today's booking list *empty*, so this is not the per-slot capacity cap that
global setup's "Remove active" reset already handles.

**Cause.** On a Staff-mode branch a slot is only bookable when a bookable staff
member is assigned to it, and the Add-booking dropdown offers unstaffed slots
anyway — the rejection only arrives after submit. These tests book *today*, but
nothing guarantees today's weekday slots are staffed: the `bookingsOnly` fixture
deliberately skips the Rules reset, and the fixtures that do call
`assignStaffToSlots()` target Monday/Tuesday/Wednesday. So a run's outcome
depends on the weekday it runs on and on the slot-staff state a previous run
left behind. The sibling tests that still pass (lifecycle 18:30/19:30, Detail &
Edit) rest on the same unguaranteed precondition.

**What would unblock it** — either:

1. a fixture that assigns a bookable staff member to the *current* weekday's
   slots and restores the prior assignment in teardown; or
2. a branch reserved for today-scoped booking tests that no other spec
   re-configures (the Rules "Set to Default" reset is what clears slot-staff
   assignments).

Option 2 is preferable: option 1 still mutates a branch other tests read back,
which is why these files are serial in the first place.
