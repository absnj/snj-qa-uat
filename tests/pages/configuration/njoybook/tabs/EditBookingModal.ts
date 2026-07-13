import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { ConfigBasePage } from '@pages/configuration/ConfigBasePage';

export type EditBookingData = {
    startTime?: string;
    partySize?: number;
    staff?: string;
    occasion?: string;
    specialRequests?: string;
};

/**
 * The "Edit booking" modal (booking detail → "Edit details"). Adjusts schedule,
 * party size, staff, and notes on an existing booking — guest contact fields are
 * not editable here. Mirrors the Add booking editor's controls.
 */
export class EditBookingModal extends ConfigBasePage {
    private readonly modal: Locator;
    private readonly heading: Locator;
    private readonly closeButton: Locator;

    private readonly startTimeCombobox: Locator;
    private readonly partySizeInput: Locator;
    private readonly staffCombobox: Locator;
    private readonly occasionInput: Locator;
    private readonly specialRequestsInput: Locator;
    private readonly saveButton: Locator;

    constructor(page: Page) {
        super(page);
        this.modal = this.page.locator('.modal-container');
        this.heading = this.page.getByRole('heading', { name: 'Edit booking', level: 2 });
        this.closeButton = this.modal.getByRole('button', { name: 'Close modal' });

        this.startTimeCombobox = this.modal.getByRole('combobox', { name: 'Start time' });
        this.partySizeInput = this.modal.getByRole('spinbutton', { name: 'Party size' });
        this.staffCombobox = this.modal.getByRole('combobox', { name: 'Staff' });
        this.occasionInput = this.modal.getByRole('textbox', { name: 'Occasion' });
        this.specialRequestsInput = this.modal.getByRole('textbox', { name: 'Special requests' });
        this.saveButton = this.modal.getByRole('button', { name: 'Save changes' });
    }

    override async waitForReady(): Promise<void> {
        await expect(this.heading).toBeVisible();
    }

    async setStartTime(time: string): Promise<void> {
        await this.startTimeCombobox.click();
        await this.page.getByRole('option', { name: time, exact: true }).click();
    }

    async setPartySize(size: number): Promise<void> {
        await this.partySizeInput.fill(String(size));
    }

    async setStaff(staffName: string): Promise<void> {
        await this.staffCombobox.click();
        await this.page.getByRole('option', { name: staffName, exact: true }).click();
    }

    async setOccasion(text: string): Promise<void> {
        await this.occasionInput.fill(text);
    }

    async setSpecialRequests(text: string): Promise<void> {
        await this.specialRequestsInput.fill(text);
    }

    async fill(data: EditBookingData): Promise<void> {
        if (data.startTime) await this.setStartTime(data.startTime);
        if (data.partySize !== undefined) await this.setPartySize(data.partySize);
        if (data.staff) await this.setStaff(data.staff);
        if (data.occasion !== undefined) await this.setOccasion(data.occasion);
        if (data.specialRequests !== undefined) await this.setSpecialRequests(data.specialRequests);
    }

    async save(): Promise<void> {
        await this.saveButton.click();
        await expect(this.modal).not.toBeVisible();
    }

    async close(): Promise<void> {
        await this.closeButton.click();
        await expect(this.modal).not.toBeVisible();
    }
}
