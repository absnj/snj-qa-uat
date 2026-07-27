import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { ConfigBasePage } from '@pages/configuration/ConfigBasePage';

export type AddBookingData = {
    /** ISO date (YYYY-MM-DD). Omit to keep the modal's prefilled date (today). */
    date?: string;
    /** Slot start time as shown in the dropdown, e.g. '11:30'. */
    startTime: string;
    partySize?: number;
    /** Staff option label, e.g. 'No preference' or 'booking-tester-staff-A'. */
    staff?: string;
    name?: string;
    /** Required by the form. */
    email: string;
    /** Required by the form; local digits only (the +65 prefix is fixed). */
    phone: string;
    occasion?: string;
    specialRequests?: string;
};

/**
 * The admin-side "Add booking" modal (Bookings tab → "Add booking"). Creates a
 * booking server-side, bypassing the public booking page's reCAPTCHA/step flow.
 * Start time and Staff are custom comboboxes that open a listbox of options.
 */
export class AddBookingModal extends ConfigBasePage {
    private readonly modal: Locator;
    private readonly heading: Locator;
    private readonly closeButton: Locator;

    private readonly dateInput: Locator;
    private readonly calendarToggle: Locator;
    private readonly calendar: Locator;
    private readonly startTimeCombobox: Locator;
    private readonly partySizeInput: Locator;
    private readonly staffCombobox: Locator;
    private readonly nameInput: Locator;
    private readonly emailInput: Locator;
    private readonly phoneInput: Locator;
    private readonly occasionInput: Locator;
    private readonly specialRequestsInput: Locator;
    private readonly createButton: Locator;

    constructor(page: Page) {
        super(page);
        this.modal = this.page.locator('.modal-container');
        this.heading = this.page.getByRole('heading', { name: 'Add booking', level: 2 });
        this.closeButton = this.modal.getByRole('button', { name: 'Close modal' });

        this.dateInput = this.modal.getByRole('textbox', { name: 'Booking date' });
        // The toggle next to the date input is labelled with the current date,
        // e.g. "July 13, 2026" — match that shape (day cells read "Weekday,
        // Month D, YYYY", so this only matches the toggle).
        this.calendarToggle = this.modal.getByRole('button', { name: /^[A-Z][a-z]+ \d{1,2}, \d{4}$/ });
        this.calendar = this.page.locator('.snj-date-picker-calendar');
        this.startTimeCombobox = this.modal.getByRole('combobox', { name: 'Start time' });
        this.partySizeInput = this.modal.getByRole('spinbutton', { name: 'Party size' });
        this.staffCombobox = this.modal.getByRole('combobox', { name: 'Staff' });
        this.nameInput = this.modal.getByRole('textbox', { name: 'Name' });
        this.emailInput = this.modal.getByRole('textbox', { name: 'Email' });
        // The phone field is a bare type=tel input with no accessible name or
        // test id (the +65 prefix sits beside it), so scope by input type.
        this.phoneInput = this.modal.locator('input[type="tel"]');
        this.occasionInput = this.modal.getByRole('textbox', { name: 'Occasion' });
        this.specialRequestsInput = this.modal.getByRole('textbox', { name: 'Special requests' });
        this.createButton = this.modal.getByRole('button', { name: 'Create booking' });
    }

    override async waitForReady(): Promise<void> {
        await expect(this.heading).toBeVisible();
    }

    /**
     * Sets the booking date via the calendar picker. The date field is a masked
     * input that ignores fill(), and picking a date through the calendar is also
     * what makes the app reload that date's Start time slots — so callers MUST
     * (re)select the start time AFTER calling this, or the slot binding is stale.
     *
     * NOTE: only dates whose weekday has staff-assigned, available slots can be
     * booked; on staging that is reliably "today" only (see the spec).
     */
    async setDate(isoDate: string): Promise<void> {
        const target = new Date(`${isoDate}T00:00:00`);
        const monthLabel = target.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const dayLabel = target.toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        });

        await this.calendarToggle.click();
        const monthHeader = this.calendar.getByText(monthLabel, { exact: true });
        for (let i = 0; i < 12 && !(await monthHeader.count()); i++) {
            await this.calendar.getByRole('button', { name: 'Next page' }).click();
        }
        await this.calendar.getByRole('button', { name: dayLabel }).click();
        await expect(this.dateInput).toHaveValue(isoDate);
    }

    async setStartTime(time: string): Promise<void> {
        // Re-selecting an already-selected time reopens the combobox and (on a
        // Staff-mode branch) re-fetches/clears the dependent Staff selection,
        // which can silently block submission. Skip the round-trip when the
        // combobox already shows this time — callers that pre-select via
        // selectFirstAvailableStartTime() then pass the same value to fill()
        // rely on this being a no-op.
        if ((await this.startTimeCombobox.textContent())?.trim() === time) return;
        await this.startTimeCombobox.click();
        await this.page.getByRole('option', { name: time, exact: true }).click();
    }

    /**
     * Opens the Start time combobox and picks whichever option is first, rather
     * than a caller-supplied literal. Which times are actually bookable depends
     * on branch config (weekday slot template, existing bookings against the
     * per-slot cap) that this page object has no way to introspect ahead of
     * time, so tests that don't care which slot they land on should use this
     * instead of guessing a specific time. Returns the picked option's label.
     */
    async selectFirstAvailableStartTime(): Promise<string> {
        await this.startTimeCombobox.click();
        const firstOption = this.page.getByRole('option').first();
        const label = (await firstOption.textContent())?.trim() ?? '';
        await firstOption.click();
        return label;
    }

    async setPartySize(size: number): Promise<void> {
        await this.partySizeInput.fill(String(size));
    }

    async setStaff(staffName: string): Promise<void> {
        await this.staffCombobox.click();
        await this.page.getByRole('option', { name: staffName, exact: true }).click();
    }

    async fillGuest(data: AddBookingData): Promise<void> {
        if (data.name) await this.nameInput.fill(data.name);
        await this.emailInput.fill(data.email);
        await this.phoneInput.fill(data.phone);
        if (data.occasion) await this.occasionInput.fill(data.occasion);
        if (data.specialRequests) await this.specialRequestsInput.fill(data.specialRequests);
    }

    /** Fills every field but does NOT submit — useful for validation assertions. */
    async fill(data: AddBookingData): Promise<void> {
        if (data.date) await this.setDate(data.date);
        await this.setStartTime(data.startTime);
        if (data.partySize !== undefined) await this.setPartySize(data.partySize);
        if (data.staff) await this.setStaff(data.staff);
        await this.fillGuest(data);
    }

    /** Fills the form and submits; resolves once the modal has closed. */
    async createBooking(data: AddBookingData): Promise<void> {
        await this.fill(data);
        await this.createButton.click();
        await expect(this.modal).not.toBeVisible();
    }

    /** Clicks "Create booking" without asserting the modal closes. */
    async submit(): Promise<void> {
        await this.createButton.click();
    }

    /**
     * Asserts submission was blocked by validation: the modal stays open and a
     * "… is required." message is shown (required fields are validated on submit,
     * not via a disabled button).
     */
    async expectValidationError(): Promise<void> {
        await expect(this.modal).toBeVisible();
        await expect(this.modal.getByText(/is required/i).first()).toBeVisible();
    }

    async close(): Promise<void> {
        await this.closeButton.click();
        await expect(this.modal).not.toBeVisible();
    }
}
