# Sales CRM page objects

Track → Merchant Relationship, mapped by walking the UAT app as the `sales_agent`
role (`@sales-agent`, already wired in `tests/specs/helpers/roles.ts` and as a
Playwright project).

Specs: `tests/specs/track/crm-contacts.spec.ts`, `tests/specs/track/crm-capture-lead.spec.ts`.

## What exists here

| File | Covers |
|---|---|
| `SalesCrmBasePage.ts` | Track sidebar nav, the label-scoped control factories, the Track preloader wait |
| `ContactListPage.ts` | My / Assigned / Unassigned Contacts — one class, `ContactScope` picks the route |
| `CaptureLeadPage.ts` | The "Capture a lead" form, up to but not including a successful submit |
| `CrmOverviewPage.ts` | The `/track/crm` pipeline dashboard |

Deliberately **not** here: contact detail, the Update/Remark/Close/Assign modals,
and the Qualify page. Everything they drive is either unreachable read-only (the
detail page needs an owned contact) or unrunnable against shared UAT (see
below). They were written, found to be unexercisable, and deleted. Re-add each
one alongside the spec that needs it, not before.

## The flow

```
Home → Track (/track/my-performance)
  └─ Merchant Relationship
       ├─ Overview             /track/crm                              CrmOverviewPage
       ├─ Activities           /general/activity/activity-calendar     (shared module — not mapped)
       ├─ My Contacts          /track/crm/contact/my-contacts          ContactListPage('my')
       ├─ Assigned Contacts    /track/crm/contact/assigned-contacts    ContactListPage('assigned')
       ├─ Unassigned Contacts  /track/crm/contact/unassigned-contacts  ContactListPage('unassigned')
       └─ Subprocesses         /general/tag/tag-list?module=track      (shared module — not mapped)
```

The three contact screens are the same "Contact Management" component at
different scopes. Each supports `?view=list|kanban|map` (kanban is the default).

Pipeline: `Lead → Qualified → Proposing → Close Won → Onboarding → Setup → Live`,
plus terminal `Close Lost` and `Archived`. Status advances through a **Qualify**
action (a full page at `/track/crm/contact/qualify-lead`, taking a priority and
expected closing date) and a **Close** modal (Lost or Archived). The contact
detail page also carries Details / Activities / Surveys / Media / Logs tabs and a
persistent sidebar with Remarks and a per-status subprocess checklist.

## Behaviour worth knowing before writing specs

- **Ownership gate.** A sales agent can only open a contact where they are the
  sales or merchant success owner. Anything else answers "Access Denied — You
  can only view contacts assigned to you as sales owner or merchant success" and
  stays on the list. Assigned/Unassigned are browsable but mostly not openable.
- **Claiming is by queue.** "Assign" opens a modal whose only action is *Join
  Queue*; agents do not self-assign directly.
- **No delete, anywhere.** A lead can only be closed Lost or Archived; remarks
  can never be edited or removed; joining a queue has no self-service undo. This
  is why every lifecycle scenario in the specs is parked as `.fixme()` with a
  `TODO(crm-cleanup):` note — un-fixme them when a contact delete/reset endpoint
  or a disposable sales agent exists.
- **Dependent fields.** Sub-Category only renders once a Category is chosen, in
  both the capture form and the filter bar. Picking an address suggestion fills
  City and Postal Code.
- **Business email and phone are an either/or pair** — supplying neither fails
  validation with "Provide a business email or phone number."
- **Tier** is visible to everyone but only Head of Sales and super admins can
  change it.

## Markup notes (why the locators look like this)

The CRM is Vue + radix-vue and its form controls have **no `id`, `name`,
`aria-label` or `<label for>`** — `getByLabel` reaches nothing. Every control is
wrapped in a `.form-group` carrying a `<label>`, which is the only stable
non-styling hook available, so `SalesCrmBasePage` exposes label-scoped factories
(`textField`, `numberField`, `selectTrigger`) that subclasses call from their
constructors.

- **Track renders two ShopNJoy preloaders** (a module-level "Loading Track
  module..." status plus a page-level one) where every other module renders one,
  so `BasePage.waitForReady()` trips strict mode here. `SalesCrmBasePage`
  overrides it to assert the preloader count reaches zero.
- Radix selects render both a trigger `button[role=combobox]` and a hidden
  native `<select>`, both exposing `role=combobox`. The `button` qualifier picks
  the one a user operates.
- Two dropdown flavours: form selects open a `listbox` of `option`s
  (`chooseSelectOption`); list-page filters open a menu of `menuitemcheckbox`es
  (`chooseMenuOption`).
- List rows are `<tr role="button">`, so `getByRole('row')` finds nothing.
  Kanban columns are `<article aria-label="<status>">` and their cards are
  buttons named after the merchant.
- Invalid form submits surface twice: an inline `span.form-error` inside the
  offending `.form-group`, and a `role=alert` toast naming every offending field
  ("Merchant name", "Category", "Map: address", …).
- Modals are **not** `role=dialog` — they are `.modal-container` with a heading
  and a `form.modal-body` — and **Escape does not close them**. Relevant when
  the modal page objects come back.
- The list has no ordering contract, so `findContact()` searches before acting
  rather than relying on a contact being on page 1.
