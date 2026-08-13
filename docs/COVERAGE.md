# Test Coverage

Generated from `npx playwright test --list` by `npm run docs:coverage`. **Do not edit by hand** — regenerate it after adding, removing or retagging a test.

This is the inventory only: it says what the suite *would run*, not what last passed. For why a scenario is skipped or fixme'd, see [README's Known Gaps](../README.md#known-gaps-and-in-progress-work).

**249 active** test runs across 12 spec files and 7 projects, plus 58 skipped and 17 fixme.

A "test run" is one test case in one project — a case covering three roles counts three times, because that is three executions against three different permission sets.

## By role project

| Project | Active | Skipped | Fixme |
|---|---:|---:|---:|
| `merchant-admin` | 111 | 8 | 12 |
| `merchant-staff` | 42 | 6 | — |
| `branch-admin` | 61 | 8 | — |
| `branch-staff` | 13 | 4 | — |
| `sales-agent` | 22 | 2 | 5 |
| `merchant-success-staff` | — | 2 | — |
| `api` | — | 28 | — |

## Matrix — spec file × project

Counts are active test runs; `·` means the file contributes nothing to that project.

| Spec | MA | MS | BA | BS | SA | MSS | API | Total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `specs/api/auth.spec.ts` | (2) | (2) | (2) | (2) | (2) | (2) | (14) | 26 skip |
| `specs/api/deals.spec.ts` | (2) | (2) | (2) | (1) | · | · | (7) | 14 skip |
| `specs/api/loyalty.spec.ts` | (2) | (2) | (2) | (1) | · | · | (7) | 14 skip |
| `specs/config/deals.spec.ts` | 17 | 17 | 17 | 2 | · | · | · | 53 |
| `specs/config/loyalty.spec.ts` | 15 | 15 | 15 | 1 | · | · | · | 46 |
| `specs/config/njoybook-general.spec.ts` | 32 | · | · | · | · | · | · | 32 · 4 fixme |
| `specs/config/njoybook-staff.spec.ts` | 21 | 3 | 3 | 3 | · | · | · | 30 · 8 fixme |
| `specs/login.spec.ts` | 2 | 2 | 2 | 2 | · | · | · | 8 |
| `specs/support/support.spec.ts` | 4 | 4 | 4 | 4 | · | · | · | 16 |
| `specs/track/crm-capture-lead.spec.ts` | · | · | · | · | 9 | · | · | 9 · 4 fixme |
| `specs/track/crm-contacts.spec.ts` | · | · | · | · | 13 | · | · | 13 · 1 fixme |
| `specs/user-mgmt/create-user.spec.ts` | 20 | 1 | 20 | 1 | · | · | · | 42 · 4 skip |

Legend: **MA** merchant-admin · **MS** merchant-staff · **BA** branch-admin · **BS** branch-staff · **SA** sales-agent · **MSS** merchant-success-staff · **API** api. A number in parentheses is skipped/fixme only.

## Cases by spec file

### `specs/api/auth.spec.ts`

26 skip test runs across 4 cases.

| Case | Projects | Status |
|---|---|---|
| valid credentials return a token for the expected role | MA, MS, BA, BS, SA, MSS, API | **skip** |
| invalid credentials are rejected | MA, MS, BA, BS, SA, MSS, API | **skip** |
| a refreshed token is usable for a subsequent authenticated call | API | **skip** |
| logout invalidates the token for subsequent authenticated calls | API | **skip** |

### `specs/api/deals.spec.ts`

14 skip test runs across 3 cases.

| Case | Projects | Status |
|---|---|---|
| creates, reads, updates, and deletes a deal | MA, MS, BA, API | **skip** |
| rejects a deal with a missing title | MA, MS, BA, API | **skip** |
| cannot create a deal | BS, API | **skip** |

### `specs/api/loyalty.spec.ts`

14 skip test runs across 3 cases.

| Case | Projects | Status |
|---|---|---|
| creates, reads, updates, and deletes a loyalty program | MA, MS, BA, API | **skip** |
| rejects a program with a missing title | MA, MS, BA, API | **skip** |
| cannot create a loyalty program | BS, API | **skip** |

### `specs/config/deals.spec.ts`

53 test runs across 18 cases.

| Case | Projects | Status |
|---|---|---|
| shows the deal list | MA, MS, BA, BS | active |
| creates a deal successfully | MA, MS, BA | active |
| rejects an empty deal title | MA, MS, BA | active |
| rejects a deal title over 50 characters | MA, MS, BA | active |
| rejects an empty description | MA, MS, BA | active |
| rejects a description over 100 characters | MA, MS, BA | active |
| rejects an empty start date | MA, MS, BA | active |
| rejects an empty end date | MA, MS, BA | active |
| rejects an end date before the start date | MA, MS, BA | active |
| rejects an end time before the start time | MA, MS, BA | active |
| rejects a zero deal value | MA, MS, BA | active |
| rejects an empty deal value | MA, MS, BA | active |
| rejects a negative deal value | MA, MS, BA | active |
| rejects a zero quantity | MA, MS, BA | active |
| rejects a negative quantity | MA, MS, BA | active |
| rejects empty terms and conditions | MA, MS, BA | active |
| rejects a deal value percentage over 100 | MA, MS, BA | active |
| does not show the create deal button | BS | active |

### `specs/config/loyalty.spec.ts`

46 test runs across 16 cases.

| Case | Projects | Status |
|---|---|---|
| creates a visit-based program with one reward | MA, MS, BA | active |
| creates a spend-based program with one reward | MA, MS, BA | active |
| creates a visit-based program with five rewards | MA, MS, BA | active |
| disables Add reward at the five reward maximum | MA, MS, BA | active |
| rejects a zero visits-per-stamp value | MA, MS, BA | active |
| rejects a zero spend-per-stamp value | MA, MS, BA | active |
| rejects an empty program title | MA, MS, BA | active |
| rejects a program title over 50 characters | MA, MS, BA | active |
| rejects an empty program description | MA, MS, BA | active |
| rejects a program description over 100 characters | MA, MS, BA | active |
| rejects empty terms and conditions | MA, MS, BA | active |
| rejects an empty reward name | MA, MS, BA | active |
| rejects an empty reward description | MA, MS, BA | active |
| rejects an empty reward valid-until date | MA, MS, BA | active |
| accepts an empty reward quantity | MA, MS, BA | active |
| does not show the create loyalty program button | BS | active |

### `specs/config/njoybook-general.spec.ts`

32 · 4 fixme test runs across 36 cases.

| Case | Projects | Status |
|---|---|---|
| the Staff tab is hidden for a Branch-mode branch | MA | active |
| all Branch-mode configuration tabs are visible to the merchant admin | MA | active |
| Set to Default followed by re-selecting Branch mode keeps the branch in Branch mode | MA | active |
| lists shoppers and can switch to anonymous guests | MA | active |
| shows 10 slots for Monday | MA | active |
| shows 10 slots for Tuesday | MA | active |
| shows 10 slots for Wednesday | MA | active |
| shows 10 slots for Thursday | MA | active |
| shows 10 slots for Friday | MA | active |
| shows 10 slots for Saturday | MA | active |
| shows 10 slots for Sunday | MA | active |
| the standard 11:30 slot is visible and active on Monday | MA | active |
| deactivating a slot removes it from the public booking page | MA | active |
| opens the public booking page in a new tab | MA | active |
| the public URL matches the branch's booking site | MA | active |
| disabling booking blocks the public booking page | MA | **fixme** |
| a booking made while auto-confirm is on lands as Confirmed | MA | **fixme** |
| a booking made while auto-confirm is off lands as Pending | MA | **fixme** |
| public page blocks party size below the configured minimum | MA | active |
| public page blocks party size above the configured maximum | MA | active |
| saving max party size lower than min surfaces a validation error | MA | active |
| the enable booking toggle persists across reload | MA | active |
| session length, slot interval, capacity, and booking-window settings persist across reload | MA | active |
| customer reminder checkboxes can be multi-selected and persist | MA | active |
| confirmation message and booking terms rich text persist | MA | active |
| admin-created booking appears in the list as Confirmed | MA | active |
| required fields are validated on submit | MA | active |
| checking in then completing advances the status | MA | active |
| a confirmed booking can be cancelled, and is then locked from further status changes | MA | active |
| the detail record shows source, created, and updated fields | MA | active |
| a confirmed booking can be marked no-show | MA | active |
| the status filter narrows the list to matching bookings | MA | active |
| a closed blockout can be created and then removed | MA | active |
| "Open with overrides" applies a max-bookings and discount override | MA | active |
| customer can complete a Branch-mode booking and it appears in admin as Confirmed or Pending | MA | **fixme** |
| booking is rejected when no slots are available for the selected date | MA | active |

### `specs/config/njoybook-staff.spec.ts`

30 · 8 fixme test runs across 32 cases.

| Case | Projects | Status |
|---|---|---|
| disabling booking blocks the public booking page | MA | **fixme** |
| re-enabling booking restores public availability | MA | **fixme** |
| a booking made while auto-confirm is on lands as Confirmed | MA | **fixme** |
| a booking made while auto-confirm is off lands as Pending | MA | **fixme** |
| public page blocks party size below the configured minimum | MA | active |
| public page blocks party size above the configured maximum | MA | active |
| saving max party size lower than min surfaces a validation error | MA | active |
| shows 10 slots for Monday | MA | active |
| shows 10 slots for Tuesday | MA | active |
| shows 10 slots for Wednesday | MA | active |
| shows 10 slots for Thursday | MA | active |
| shows 10 slots for Friday | MA | active |
| shows 10 slots for Saturday | MA | active |
| shows 10 slots for Sunday | MA | active |
| the standard 11:30 slot is visible and active on Monday | MA | active |
| deactivating a slot removes it from the public booking page | MA | active |
| configured staff are visible and active by default | MA | active |
| turning a staff member non-bookable removes them from the public page, and re-enabling restores them | MA | **fixme** |
| admin-created booking appears in the list as Confirmed | MA | active |
| required fields are validated on submit | MA | active |
| checking in then completing advances the status | MA | active |
| a confirmed booking can be cancelled | MA | active |
| a confirmed booking can be marked no-show | MA | active |
| editing a booking updates its details | MA | **fixme** |
| the status filter narrows the list to matching bookings | MA | active |
| a closed blockout can be created and then removed | MA | active |
| customer can complete a booking and it appears in admin as Confirmed | MA | **fixme** |
| customer can book with "No preference" staff selection | MA | **fixme** |
| booking is rejected when no slots are available for the selected date | MA | active |
| the advanced NJoyBook configuration tabs are hidden | MS, BA, BS | active |
| can open the Bookings tab | MS, BA, BS | active |
| the Booking Page tab opens the public booking site | MS, BA, BS | active |

### `specs/login.spec.ts`

8 test runs across 2 cases.

| Case | Projects | Status |
|---|---|---|
| valid credentials redirect to dashboard | MA, MS, BA, BS | active |
| invalid credentials show an error | MA, MS, BA, BS | active |

### `specs/support/support.spec.ts`

16 test runs across 4 cases.

| Case | Projects | Status |
|---|---|---|
| creates ticket successfully | MA, MS, BA, BS | active |
| rejects an empty ticket subject | MA, MS, BA, BS | active |
| rejects an empty ticket description | MA, MS, BA, BS | active |
| rejects an overlong ticket subject | MA, MS, BA, BS | active |

### `specs/track/crm-capture-lead.spec.ts`

9 · 4 fixme test runs across 13 cases.

| Case | Projects | Status |
|---|---|---|
| shows the lead is assigned to the agent automatically | SA | active |
| reveals a sub-category field once a category is chosen | SA | active |
| fills city and postal code from an address suggestion | SA | active |
| leaves the form untouched when the UEN lookup finds nothing | SA | active |
| adds and removes a contact person row | SA | active |
| rejects an empty lead name | SA | active |
| rejects a missing category | SA | active |
| rejects a lead with neither a business email nor a phone | SA | active |
| rejects a missing address | SA | active |
| creates a lead assigned to the agent | SA | **fixme** |
| qualifies a lead with a priority and expected closing date | SA | **fixme** |
| closes a lead as Lost | SA | **fixme** |
| adds a remark to a contact | SA | **fixme** |

### `specs/track/crm-contacts.spec.ts`

13 · 1 fixme test runs across 14 cases.

| Case | Projects | Status |
|---|---|---|
| shows the my contacts list | SA | active |
| shows the assigned contacts list | SA | active |
| shows the unassigned contacts list | SA | active |
| shows the CRM contact overview metrics | SA | active |
| shows every pipeline status column in kanban view | SA | active |
| switches between list, kanban and map views | SA | active |
| regroups a status column into its subprocesses and back | SA | active |
| disables the sub-category filter until a category is chosen | SA | active |
| offers every pipeline status in the status filter | SA | active |
| offers every priority in the priority filter | SA | active |
| does not open a contact owned by another agent | SA | active |
| does not open an unassigned contact | SA | active |
| disables the info action for an unassigned contact | SA | active |
| assigns an unassigned contact by joining the agent queue | SA | **fixme** |

### `specs/user-mgmt/create-user.spec.ts`

42 · 4 skip test runs across 23 cases.

| Case | Projects | Status |
|---|---|---|
| creates a user successfully | MA, BA | active |
| rejects an empty first name | MA, BA | active |
| rejects an empty email | MA, BA | active |
| rejects an email missing @ | MA, BA | active |
| rejects an email missing domain | MA, BA | active |
| rejects an email missing local part | MA, BA | active |
| rejects a duplicate email | MA, BA | **skip** |
| rejects a non-numeric phone number | MA, BA | active |
| rejects a phone number that is too short | MA, BA | active |
| rejects a phone number that is too long | MA, BA | active |
| rejects when no role is selected | MA, BA | **skip** |
| rejects an empty password | MA, BA | active |
| rejects a password that is too short | MA, BA | active |
| rejects a password missing uppercase | MA, BA | active |
| rejects a password missing lowercase | MA, BA | active |
| rejects a password missing a digit | MA, BA | active |
| rejects a password missing a special character | MA, BA | active |
| rejects a confirm password mismatch | MA, BA | active |
| rejects an empty confirm password | MA, BA | active |
| rejects all fields empty | MA, BA | active |
| accepts the minimum valid password length | MA, BA | active |
| accepts a name with a hyphen or apostrophe | MA, BA | active |
| does not show the create staff option | MS, BS | active |
