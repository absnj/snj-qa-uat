import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { ConfigBasePage } from '@pages/configuration/ConfigBasePage';
import { BookingsTab } from './tabs/BookingsTab';
import { GuestHistoryTab } from './tabs/GuestHistoryTab';
import { RulesTab } from './tabs/RulesTab';
import { TimeSlotsTab } from './tabs/TimeSlotsTab';
import { StaffTab } from './tabs/StaffTab';
import { BlockoutsTab } from './tabs/BlockoutsTab';

export class NJoyBookPage extends ConfigBasePage {
    private readonly heading: Locator;
    private readonly bookingsTabButton: Locator;
    private readonly guestHistoryTabButton: Locator;
    private readonly rulesTabButton: Locator;
    private readonly timeSlotsTabButton: Locator;
    private readonly staffTabButton: Locator;
    private readonly blockoutsTabButton: Locator;
    private readonly bookingPageTabButton: Locator;

    constructor(page: Page) {
        super(page);
        this.heading = this.page.getByRole('heading', { name: 'NJoyBook', level: 3 });
        this.bookingsTabButton = this.page.getByRole('button', { name: 'Bookings' });
        this.guestHistoryTabButton = this.page.getByRole('button', { name: 'Guest History' });
        this.rulesTabButton = this.page.getByRole('button', { name: 'Rules' });
        this.timeSlotsTabButton = this.page.getByRole('button', { name: 'Time Slots' });
        this.staffTabButton = this.page.getByRole('button', { name: 'Staff' });
        this.blockoutsTabButton = this.page.getByRole('button', { name: 'Blockouts' });
        this.bookingPageTabButton = this.page.getByRole('button', { name: 'Booking Page' });
    }

    override async waitForReady(): Promise<void> {
        await super.waitForReady();
        await expect(this.heading).toBeVisible();
    }

    async goToBookings(): Promise<BookingsTab> {
        await this.bookingsTabButton.click();
        const tab = new BookingsTab(this.page);
        await tab.waitForReady();
        return tab;
    }

    async goToGuestHistory(): Promise<GuestHistoryTab> {
        await this.guestHistoryTabButton.click();
        const tab = new GuestHistoryTab(this.page);
        await tab.waitForReady();
        return tab;
    }

    async goToRules(): Promise<RulesTab> {
        await this.rulesTabButton.click();
        const tab = new RulesTab(this.page);
        await tab.waitForReady();
        return tab;
    }

    async goToTimeSlots(): Promise<TimeSlotsTab> {
        await this.timeSlotsTabButton.click();
        const tab = new TimeSlotsTab(this.page);
        await tab.waitForReady();
        return tab;
    }

    async goToStaff(): Promise<StaffTab> {
        await this.staffTabButton.click();
        const tab = new StaffTab(this.page);
        await tab.waitForReady();
        return tab;
    }

    async goToBlockouts(): Promise<BlockoutsTab> {
        await this.blockoutsTabButton.click();
        const tab = new BlockoutsTab(this.page);
        await tab.waitForReady();
        return tab;
    }

    async openBookingPage(): Promise<void> {
        await this.bookingPageTabButton.click();
    }
}