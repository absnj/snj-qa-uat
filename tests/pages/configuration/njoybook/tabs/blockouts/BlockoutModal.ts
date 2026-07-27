import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { ConfigBasePage } from '@pages/configuration/ConfigBasePage';

export type BlockoutMode = 'Closed (no bookings)' | 'Open with overrides';

export type BlockoutData = {
    /** ISO date (YYYY-MM-DD). */
    startDate: string;
    /** ISO date (YYYY-MM-DD). */
    endDate: string;
    mode?: BlockoutMode;
    overrideMaxBookings?: number;
    overrideDiscountPercent?: number;
};

/**
 * The "Add blockout" / "Edit blockout" modal. A blockout closes (or overrides)
 * bookings for a date range. Unlike the booking date, the date fields here are
 * plain text inputs that accept fill(). The edit variant additionally exposes a
 * "Delete blockout" action (no confirmation step).
 */
export class BlockoutModal extends ConfigBasePage {
    private readonly modal: Locator;
    private readonly closeButton: Locator;
    private readonly startDateInput: Locator;
    private readonly endDateInput: Locator;
    private readonly modeCombobox: Locator;
    private readonly overrideMaxInput: Locator;
    private readonly overrideDiscountInput: Locator;
    private readonly addButton: Locator;
    private readonly saveButton: Locator;
    private readonly deleteButton: Locator;

    constructor(page: Page) {
        super(page);
        this.modal = this.page.locator('.modal-container');
        this.closeButton = this.modal.getByRole('button', { name: 'Close modal' });

        // The two date fields have only a YYYY-MM-DD placeholder (no accessible
        // name); they render in a fixed order — Start date then End date.
        const dateInputs = this.modal.getByPlaceholder('YYYY-MM-DD');
        this.startDateInput = dateInputs.nth(0);
        this.endDateInput = dateInputs.nth(1);

        this.modeCombobox = this.modal.getByRole('combobox');
        // Two "Optional" number fields, in order: Override max bookings, Override discount %.
        const optionalInputs = this.modal.getByPlaceholder('Optional');
        this.overrideMaxInput = optionalInputs.nth(0);
        this.overrideDiscountInput = optionalInputs.nth(1);

        this.addButton = this.modal.getByRole('button', { name: 'Add blockout' });
        this.saveButton = this.modal.getByRole('button', { name: 'Save changes' });
        this.deleteButton = this.modal.getByRole('button', { name: 'Delete blockout' });
    }

    async waitForAddReady(): Promise<void> {
        await expect(this.page.getByRole('heading', { name: 'Add blockout', level: 2 })).toBeVisible();
    }

    async waitForEditReady(): Promise<void> {
        await expect(this.page.getByRole('heading', { name: 'Edit blockout', level: 2 })).toBeVisible();
    }

    async fill(data: BlockoutData): Promise<void> {
        await this.startDateInput.fill(data.startDate);
        await this.endDateInput.fill(data.endDate);
        if (data.mode) {
            await this.modeCombobox.click();
            await this.page.getByRole('option', { name: data.mode }).click();
        }
        if (data.overrideMaxBookings !== undefined) {
            await this.overrideMaxInput.fill(String(data.overrideMaxBookings));
        }
        if (data.overrideDiscountPercent !== undefined) {
            await this.overrideDiscountInput.fill(String(data.overrideDiscountPercent));
        }
    }

    /** Submits the Add form; resolves once the modal has closed. */
    async submit(): Promise<void> {
        await this.addButton.click();
        await expect(this.modal).not.toBeVisible();
    }

    /** Saves the Edit form; resolves once the modal has closed. */
    async save(): Promise<void> {
        await this.saveButton.click();
        await expect(this.modal).not.toBeVisible();
    }

    /** Asserts the override inputs hold the given values — used after re-opening
     *  a saved blockout in Edit mode to confirm "Open with overrides" data
     *  actually persisted, not just what the Add form was filled with. */
    async expectOverrides(data: { overrideMaxBookings?: number; overrideDiscountPercent?: number }): Promise<void> {
        if (data.overrideMaxBookings !== undefined) {
            await expect(this.overrideMaxInput).toHaveValue(String(data.overrideMaxBookings));
        }
        if (data.overrideDiscountPercent !== undefined) {
            await expect(this.overrideDiscountInput).toHaveValue(String(data.overrideDiscountPercent));
        }
    }

    /** Deletes the blockout being edited (no confirmation step). */
    async delete(): Promise<void> {
        await this.deleteButton.click();
        await expect(this.modal).not.toBeVisible();
    }

    async close(): Promise<void> {
        await this.closeButton.click();
        await expect(this.modal).not.toBeVisible();
    }
}
