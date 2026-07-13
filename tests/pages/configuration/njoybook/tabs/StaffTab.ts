import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { ConfigBasePage } from '@pages/configuration/ConfigBasePage';
import { StaffEditModal } from './StaffEditModal';

export class StaffTab extends ConfigBasePage {
    private readonly heading: Locator;
    private readonly addButton: Locator;

    constructor(page: Page) {
        super(page);
        this.heading = this.page.getByRole('heading', { name: 'Bookable Staff', level: 3 });
        this.addButton = this.page.getByRole('button', { name: 'Add staff' });
    }

    override async waitForReady(): Promise<void> {
        await super.waitForReady();
        await expect(this.heading).toBeVisible();
    }

    // Each staff entry is a `.booking-slot-item` row holding the name, an
    // Active/Inactive badge, and the Edit button.
    private staffRow(staffName: string): Locator {
        return this.page.locator('.booking-slot-item').filter({ hasText: staffName });
    }

    async expectStaffVisible(staffName: string, status: 'Active' | 'Inactive' = 'Active'): Promise<void> {
        const row = this.staffRow(staffName);
        await expect(row).toBeVisible();
        await expect(row.getByText(status)).toBeVisible();
    }

    async editStaff(staffName: string): Promise<StaffEditModal> {
        await this.staffRow(staffName).getByRole('button', { name: 'Edit staff' }).click();
        const modal = new StaffEditModal(this.page);
        await modal.waitForReady();
        return modal;
    }

    async expectStaffCount(count: number): Promise<void> {
        await expect(this.page.getByRole('button', { name: 'Edit staff' })).toHaveCount(count);
    }
}