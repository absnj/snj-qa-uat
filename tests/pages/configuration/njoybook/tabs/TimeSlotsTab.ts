import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { ConfigBasePage } from '@pages/configuration/ConfigBasePage';
import { TimeSlotDetail } from './TimeSlotDetail';

export type Weekday =
    | 'Sunday'
    | 'Monday'
    | 'Tuesday'
    | 'Wednesday'
    | 'Thursday'
    | 'Friday'
    | 'Saturday';

export class TimeSlotsTab extends ConfigBasePage {
    private readonly heading: Locator;
    private readonly addButton: Locator;

    constructor(page: Page) {
        super(page);
        this.heading = this.page.getByRole('heading', { name: 'Time Slots', level: 3 });
        this.addButton = this.page.getByRole('button', { name: 'Add time slot' });
    }

    override async waitForReady(): Promise<void> {
        await super.waitForReady();
        await expect(this.heading).toBeVisible();
    }

    async selectWeekday(day: Weekday): Promise<void> {
        await this.page.getByRole('button', { name: new RegExp(`^${day}`) }).click();
    }

    async expectSlotCount(day: Weekday, count: number): Promise<void> {
        const dayButton = this.page.getByRole('button', { name: new RegExp(`^${day}`) });
        await expect(dayButton).toContainText(String(count));
    }

    async openSlot(timeRange: string): Promise<TimeSlotDetail> {
        await this.page.getByRole('button', { name: new RegExp(timeRange) }).click();
        const detail = new TimeSlotDetail(this.page, timeRange);
        await detail.waitForReady();
        return detail;
    }

    async expectSlotVisible(timeRange: string, status: 'Active' | 'Inactive' = 'Active'): Promise<void> {
        const slot = this.page.getByRole('button', { name: new RegExp(timeRange) });
        await expect(slot).toBeVisible();
        await expect(slot).toContainText(status);
    }
}