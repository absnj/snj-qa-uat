import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { BasePage } from '../../core/BasePage';

export type BookingDetails = {
    name: string;
    phone: string;
    email: string;
    occasion?: string;
    specialRequests?: string;
};

export type SubmitBookingData = {
    /** ISO date (yyyy-mm-dd). Must be a date with availability. */
    date: string;
    /** Displayed slot label prefix, e.g. "11:30 AM". Omit to take the first
     *  available slot (robust when a specific time is already booked). */
    timeSlot?: string;
    /** Extra Increase-guests clicks beyond the default party size of 2. */
    increaseGuestsBy?: number;
    /** Staff option to pick on the Specialist step (skipped when a single
     *  specialist auto-advances the flow). */
    staff?: string;
    guest: BookingDetails;
};

/**
 * Public customer-facing booking page (staging.shopnjoy.com/booking/<slug>).
 * NOTE: this lives on a different host from the admin app, so callers must
 * navigate with an absolute URL — the admin baseURL does not apply here.
 *
 * Flow (Staff booking mode): Date & time -> Specialist -> Your details ->
 * Review & confirm. The Specialist step auto-advances when only one specialist
 * is available for the chosen slot.
 */
export class PublicBookingPage extends BasePage {
    private readonly pageHeading: Locator;

    // Step 1 — Date & time
    private readonly branchButton: Locator;
    private readonly dateInput: Locator;
    private readonly decreaseGuestsButton: Locator;
    private readonly increaseGuestsButton: Locator;
    private readonly noAppointmentsAvailable: Locator;
    private readonly continueButton: Locator;

    // Progress steps
    private readonly specialistStep: Locator;

    // Step 2 — Specialist
    private readonly availableStaff: Locator;

    // Step 3 — Your details
    private readonly fullNameInput: Locator;
    private readonly phoneInput: Locator;
    private readonly emailInput: Locator;
    private readonly occasionInput: Locator;
    private readonly specialRequestsInput: Locator;

    // Step 4 — Review & confirm
    private readonly confirmBookingButton: Locator;

    // Confirmation
    private readonly bookingReference: Locator;

    constructor(page: Page) {
        super(page);
        this.pageHeading = this.page.getByRole('heading', { level: 1 });

        // Step 1
        this.branchButton = this.page.getByRole('button', { name: 'Branch' });
        this.dateInput = this.page.getByRole('textbox', { name: 'Date' });
        this.decreaseGuestsButton = this.page.getByRole('button', { name: 'Decrease guests' });
        this.increaseGuestsButton = this.page.getByRole('button', { name: 'Increase guests' });
        this.noAppointmentsAvailable = this.page.getByRole('heading', { name: 'No appointments available', level: 3 });
        this.continueButton = this.page.getByRole('button', { name: 'Continue' });

        // Progress nav — only the Specialist step needs direct interaction
        // (it can auto-advance); other steps are asserted via their headings.
        this.specialistStep = this.page.getByRole('button', { name: 'Specialist' });

        // Step 2
        this.availableStaff = this.page.getByRole('listbox', { name: 'Available staff' });

        // Step 3
        this.fullNameInput = this.page.getByRole('textbox', { name: 'Full name' });
        this.phoneInput = this.page.getByPlaceholder('8123 4567');
        this.emailInput = this.page.getByRole('textbox', { name: 'Email' });
        this.occasionInput = this.page.getByRole('textbox', { name: 'Occasion' });
        this.specialRequestsInput = this.page.getByRole('textbox', { name: 'Special requests' });

        // Step 4
        this.confirmBookingButton = this.page.getByRole('button', { name: 'Confirm booking' });

        // Confirmation
        this.bookingReference = this.page.locator('strong').filter({ hasText: /^BK-\d{8}-\d+$/ });
    }

    override async waitForReady(): Promise<void> {
        await expect(this.page.getByText('Book an appointment')).toBeVisible();
        await expect(this.pageHeading).toBeVisible();
    }

    /**
     * Navigates to the public page and reloads until it is in the bookable
     * ("Book an appointment") state. The public site is a separate host and
     * caches branch config, so an admin change (e.g. re-enabling booking) can
     * take a few seconds to propagate; polling absorbs that lag.
     */
    async gotoReady(url: string, tries = 6): Promise<void> {
        for (let i = 0; i < tries; i++) {
            await this.page.goto(url);
            if (await this.page.getByText('Book an appointment').isVisible().catch(() => false)) {
                await expect(this.pageHeading).toBeVisible();
                return;
            }
            await this.page.waitForTimeout(2500);
        }
        await this.waitForReady();
    }

    // --- Branch ---

    async selectBranch(branchName: string): Promise<void> {
        await this.branchButton.click();
        await this.page.getByRole('option', { name: branchName }).click();
    }

    async expectBranch(branchName: string): Promise<void> {
        await expect(this.branchButton).toContainText(branchName);
    }

    // --- Date ---

    async setDate(isoDate: string): Promise<void> {
        await this.dateInput.fill(isoDate);
        await this.dateInput.press('Tab');
    }

    async expectDateAvailabilityHint(hint: string): Promise<void> {
        await expect(this.page.getByText(hint)).toBeVisible();
    }

    // --- Party size ---

    async increaseGuests(times: number = 1): Promise<void> {
        for (let i = 0; i < times; i++) {
            // The stepper disables at the configured max; stop rather than
            // hanging on a disabled button.
            if (await this.increaseGuestsButton.isDisabled()) break;
            await this.increaseGuestsButton.click();
        }
    }

    async decreaseGuests(times: number = 1): Promise<void> {
        for (let i = 0; i < times; i++) {
            if (await this.decreaseGuestsButton.isDisabled()) break;
            await this.decreaseGuestsButton.click();
        }
    }

    async expectGuestCount(count: number): Promise<void> {
        await expect(this.page.getByText(`${count}`).first()).toBeVisible();
    }

    async expectPartySizeLimits(limits: string): Promise<void> {
        await expect(this.page.getByText(limits)).toBeVisible();
    }

    async expectDecreaseDisabled(): Promise<void> {
        await expect(this.decreaseGuestsButton).toBeDisabled();
    }

    async expectIncreaseDisabled(): Promise<void> {
        await expect(this.increaseGuestsButton).toBeDisabled();
    }

    // --- Slot selection ---

    async selectTimeSlot(timeLabel: string): Promise<void> {
        // Slots render as "11:30 AM 1 specialist"; anchor on the leading time.
        await this.page.getByRole('button', { name: new RegExp(`^${timeLabel}`) }).click();
    }

    async selectFirstAvailableSlot(): Promise<void> {
        // Robust against a specific time being consumed by earlier bookings.
        await this.page
            .getByRole('button', { name: /\d{1,2}:\d{2}\s(AM|PM).*specialist/ })
            .first()
            .click();
    }

    async expectNoTablesAvailable(): Promise<void> {
        await expect(this.noAppointmentsAvailable).toBeVisible();
    }

    // --- Booking disabled ---

    async expectBookingUnavailable(): Promise<void> {
        await expect(
            this.page.getByText('Online booking is not available at any branch right now.'),
        ).toBeVisible();
    }

    // --- Specialist step ---

    async goToSpecialistStep(): Promise<void> {
        await this.specialistStep.click();
        await expect(this.page.getByRole('heading', { name: 'Choose your specialist' })).toBeVisible();
    }

    async selectStaffPreference(name: string): Promise<void> {
        await this.availableStaff.getByRole('option', { name }).click();
    }

    async expectStaffOptionVisible(name: string): Promise<void> {
        await expect(this.availableStaff.getByRole('option', { name })).toBeVisible();
    }

    async expectStaffOptionAbsent(name: string): Promise<void> {
        await expect(this.availableStaff.getByRole('option', { name })).toHaveCount(0);
    }

    // --- Your details step ---

    async fillDetails(details: BookingDetails): Promise<void> {
        await this.fullNameInput.fill(details.name);
        await this.phoneInput.fill(details.phone);
        await this.emailInput.fill(details.email);
        if (details.occasion) await this.occasionInput.fill(details.occasion);
        if (details.specialRequests) await this.specialRequestsInput.fill(details.specialRequests);
    }

    // --- Navigation ---

    async expectContinueDisabled(): Promise<void> {
        await expect(this.continueButton).toBeDisabled();
    }

    async continue(): Promise<void> {
        await expect(this.continueButton).toBeEnabled();
        await this.continueButton.click();
    }

    // --- Confirmation ---

    async confirm(): Promise<string> {
        await this.confirmBookingButton.click();
        // Wait on the booking reference rather than a specific heading, so this
        // works whether the booking lands confirmed or pending.
        await expect(this.bookingReference).toBeVisible();
        return (await this.bookingReference.textContent())?.trim() ?? '';
    }

    /**
     * Drives the whole flow from Step 1 through confirmation and returns the
     * booking reference (BK-YYYYMMDD-NNNN). Assumes the branch is already
     * selected (or defaults to the only public branch).
     */
    async submitBooking(data: SubmitBookingData): Promise<string> {
        await this.setDate(data.date);
        if (data.increaseGuestsBy) await this.increaseGuests(data.increaseGuestsBy);
        if (data.timeSlot) await this.selectTimeSlot(data.timeSlot);
        else await this.selectFirstAvailableSlot();
        await this.continue();

        // The Specialist step auto-advances with a single specialist; only act
        // on it when it's the active step.
        if (data.staff) {
            await this.goToSpecialistStep();
            await this.selectStaffPreference(data.staff);
            await this.continue();
        }

        await expect(this.page.getByRole('heading', { name: 'Your details' })).toBeVisible();
        await this.fillDetails(data.guest);
        await this.continue();

        await expect(this.page.getByRole('heading', { name: 'Review your booking' })).toBeVisible();
        return this.confirm();
    }
}
