import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { ConfigBasePage } from '@pages/configuration/ConfigBasePage';

export type TimeSlotDetailData = {
    label: string;
    time: string;
    maxBookings: string;
    status: 'Active' | 'Inactive';
};

export class TimeSlotDetail extends ConfigBasePage {
    private readonly backButton: Locator;
    private readonly statusBadge: Locator;

    constructor(page: Page, private readonly slotTime: string) {
        super(page);
        this.backButton = this.page.getByRole('button', { name: 'Back to time slots' });
        this.statusBadge = this.page.getByText('Active').first();
    }

    override async waitForReady(): Promise<void> {
        await super.waitForReady();
        await expect(
            this.page.getByRole('heading', { name: this.slotTime, level: 4 })
        ).toBeVisible();
    }

    async expectDetails(data: Partial<TimeSlotDetailData>): Promise<void> {
        if (data.label) {
            await expect(this.page.getByRole('definition').filter({ hasText: data.label })).toBeVisible();
        }
        if (data.time) {
            await expect(this.page.getByRole('definition').filter({ hasText: data.time })).toBeVisible();
        }
        if (data.maxBookings) {
            await expect(this.page.getByRole('definition').filter({ hasText: data.maxBookings })).toBeVisible();
        }
        if (data.status) {
            await expect(this.page.getByText(data.status).first()).toBeVisible();
        }
    }

    async expectBookableStaff(staffName: string): Promise<void> {
        await expect(this.page.getByText(staffName)).toBeVisible();
    }

    async goBack(): Promise<void> {
        await this.backButton.click();
    }
}