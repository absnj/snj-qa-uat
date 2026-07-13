import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { ConfigBasePage } from '@pages/configuration/ConfigBasePage';

export type StaffProfileData = {
    displayOrder?: number;
    bio?: string;
    specializations?: string[];
    bookable?: boolean;
    active?: boolean;
};

export class StaffEditModal extends ConfigBasePage {
    private readonly modal: Locator;
    private readonly closeButton: Locator;

    // Read-only source fields
    private readonly staffIdInput: Locator;
    private readonly bookableStaffIdInput: Locator;
    private readonly displayNameInput: Locator;
    private readonly notificationEmailInput: Locator;
    private readonly notificationPhoneInput: Locator;

    // Editable booking profile fields
    private readonly displayOrderInput: Locator;
    private readonly bioEditor: Locator;
    private readonly specializationsInput: Locator;
    private readonly bookableToggle: Locator;
    private readonly activeToggle: Locator;

    // Actions
    private readonly saveButton: Locator;
    private readonly deleteButton: Locator;

    constructor(page: Page) {
        super(page);
        // The modal has no role="dialog"; it's a plain container div
        // (.modal-container.popup-style.booking-popup).
        this.modal = this.page.locator('.modal-container');

        this.closeButton = this.modal.getByRole('button', { name: 'Close modal' });

        // Read-only source fields, in DOM order:
        // 0 Staff ID, 1 Bookable staff ID, 2 Display name, 3 Photo URL,
        // 4 Notification email, 5 Notification phone.
        this.staffIdInput = this.modal.getByRole('textbox').nth(0);
        this.bookableStaffIdInput = this.modal.getByRole('textbox').nth(1);
        this.displayNameInput = this.modal.getByRole('textbox').nth(2);
        this.notificationEmailInput = this.modal.getByRole('textbox').nth(4);
        this.notificationPhoneInput = this.modal.getByRole('textbox').nth(5);

        // Editable profile fields
        this.displayOrderInput = this.modal.getByRole('spinbutton', { name: 'Display order' });
        this.bioEditor = this.modal.locator('.tiptap');
        this.specializationsInput = this.modal.getByRole('textbox', { name: 'Type a specialization and press Enter...' });
        this.bookableToggle = this.modal.getByRole('switch').first();
        this.activeToggle = this.modal.getByRole('switch').nth(1);

        this.saveButton = this.modal.getByRole('button', { name: 'Save changes' });
        this.deleteButton = this.modal.getByRole('button', { name: 'Delete staff' });
    }

    override async waitForReady(): Promise<void> {
        await super.waitForReady();
        await expect(this.modal).toBeVisible();
        await expect(this.page.getByRole('heading', { name: 'Edit staff', level: 2 })).toBeVisible();
    }

    // --- Read-only field assertions ---

    async expectDisplayName(name: string): Promise<void> {
        await expect(this.displayNameInput).toHaveValue(name);
    }

    async expectNotificationEmail(email: string): Promise<void> {
        await expect(this.notificationEmailInput).toHaveValue(email);
    }

    // --- Editable profile fields ---

    async setDisplayOrder(order: number): Promise<void> {
        await this.displayOrderInput.fill(String(order));
    }

    async setBio(text: string): Promise<void> {
        await this.bioEditor.click();
        await this.bioEditor.fill(text);
    }

    async addSpecialization(value: string): Promise<void> {
        await this.specializationsInput.click();
        await this.specializationsInput.fill(value);
        await this.specializationsInput.press('Enter');
    }

    async addSpecializations(values: string[]): Promise<void> {
        for (const value of values) {
            await this.addSpecialization(value);
        }
    }

    async setBookable(enabled: boolean): Promise<void> {
        const checked = await this.bookableToggle.isChecked();
        if (checked !== enabled) await this.bookableToggle.click();
    }

    async setActive(enabled: boolean): Promise<void> {
        const checked = await this.activeToggle.isChecked();
        if (checked !== enabled) await this.activeToggle.click();
    }

    async fill(data: StaffProfileData): Promise<void> {
        if (data.displayOrder !== undefined) await this.setDisplayOrder(data.displayOrder);
        if (data.bio) await this.setBio(data.bio);
        if (data.specializations) await this.addSpecializations(data.specializations);
        if (data.bookable !== undefined) await this.setBookable(data.bookable);
        if (data.active !== undefined) await this.setActive(data.active);
    }

    // --- Actions ---

    async save(): Promise<void> {
        await this.saveButton.click();
        await expect(this.modal).not.toBeVisible();
    }

    async delete(): Promise<void> {
        await this.deleteButton.click();
    }

    async close(): Promise<void> {
        await this.closeButton.click();
        await expect(this.modal).not.toBeVisible();
    }
}