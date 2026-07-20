import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { ConfigBasePage } from '@pages/configuration/ConfigBasePage';
import { BookingStatus } from './bookings/BookingsTab';

export class GuestHistoryTab extends ConfigBasePage {
    private readonly heading: Locator;
    private readonly filtersButton: Locator;
    private readonly prevWeekButton: Locator;
    private readonly nextWeekButton: Locator;
    private readonly staffDropdown: Locator;

    constructor(page: Page) {
        super(page);
        this.heading = this.page.getByRole('heading', { name: 'Bookings', level: 3 });
        this.filtersButton = this.page.getByRole('button', { name: 'Filters' });
        this.prevWeekButton = this.page.getByRole('button', { name: 'Previous week' });
        this.nextWeekButton = this.page.getByRole('button', { name: 'Next week' });
        this.staffDropdown = this.page.getByRole('combobox', { name: 'Staff' });
    }

    override async waitForReady(): Promise<void> {
        await super.waitForReady();
        await expect(this.heading).toBeVisible();
    }

    async openFilters(): Promise<void> {
        await this.filtersButton.click();
        await expect(this.prevWeekButton).toBeVisible();
    }

    async goToNextWeek(): Promise<void> {
        await this.nextWeekButton.click();
    }

    async goToPreviousWeek(): Promise<void> {
        await this.prevWeekButton.click();
    }

    async selectDate(label: string): Promise<void> {
        await this.page.getByRole('button', { name: new RegExp(label) }).click();
    }

    async filterByStaff(staffName: string): Promise<void> {
        await this.staffDropdown.click();
        await this.page.getByRole('option', { name: staffName }).click();
    }

    async filterByStatus(status: BookingStatus): Promise<void> {
        await this.page.getByRole('button', { name: new RegExp(`^${status}`) }).click();
    }

    async expectEmptyState(dateLabel: string): Promise<void> {
        await expect(this.page.getByText(`No bookings on ${dateLabel}`)).toBeVisible();
    }
}