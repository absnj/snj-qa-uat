import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { ConfigBasePage } from '@pages/configuration/ConfigBasePage';
import { BookingsTab } from './tabs/bookings/BookingsTab';
import { GuestHistoryTab } from './tabs/GuestHistoryTab';
import { RulesTab } from './tabs/RulesTab';
import { TimeSlotsTab } from './tabs/time-slots/TimeSlotsTab';
import { StaffTab } from './tabs/staff/StaffTab';
import { BlockoutsTab } from './tabs/blockouts/BlockoutsTab';

export type NJoyBookTab =
    | 'Bookings'
    | 'Guest History'
    | 'Rules'
    | 'Time Slots'
    | 'Staff'
    | 'Blockouts'
    | 'Booking Page';

// The tabs that only the merchant admin can access; hidden for every other role.
const ADVANCED_TABS: NJoyBookTab[] = [
    'Guest History',
    'Rules',
    'Time Slots',
    'Staff',
    'Blockouts',
];

export class NJoyBookPage extends ConfigBasePage {
    private readonly heading: Locator;
    private readonly bookingsTabButton: Locator;
    private readonly guestHistoryTabButton: Locator;
    private readonly rulesTabButton: Locator;
    private readonly timeSlotsTabButton: Locator;
    private readonly staffTabButton: Locator;
    private readonly blockoutsTabButton: Locator;
    private readonly bookingPageTabButton: Locator;

    private readonly menu: Locator;

    constructor(page: Page) {
        super(page);
        this.heading = this.page.getByRole('heading', { name: 'NJoyBook', level: 3 });

        // Scope every tab lookup to the "NJoyBook Menu" tablist. Each content
        // pane also renders a "<section> help" button (e.g. "Bookings help"),
        // so an unscoped getByRole('button', { name: 'Bookings' }) matches two
        // elements and trips strict mode.
        this.menu = this.page.getByRole('tablist', { name: 'NJoyBook Menu' });
        this.bookingsTabButton = this.menu.getByRole('button', { name: 'Bookings' });
        this.guestHistoryTabButton = this.menu.getByRole('button', { name: 'Guest History' });
        this.rulesTabButton = this.menu.getByRole('button', { name: 'Rules' });
        this.timeSlotsTabButton = this.menu.getByRole('button', { name: 'Time Slots' });
        // The Staff tab only appears when Booking Mode is set to "Staff".
        this.staffTabButton = this.menu.getByRole('button', { name: 'Staff', exact: true });
        this.blockoutsTabButton = this.menu.getByRole('button', { name: 'Blockouts' });
        this.bookingPageTabButton = this.menu.getByRole('button', { name: 'Booking Page' });
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

    /**
     * The "Booking Page" tab is not an in-app panel — it opens the branch's
     * public booking site (staging.shopnjoy.com/booking/<slug>) in a new browser
     * tab. Returns that page so callers can assert its URL / drive the flow.
     */
    async openBookingPage(): Promise<Page> {
        const [publicTab] = await Promise.all([
            this.page.context().waitForEvent('page'),
            this.bookingPageTabButton.click(),
        ]);
        await publicTab.waitForLoadState('domcontentloaded');
        return publicTab;
    }

    // --- Tab access assertions ---

    private tabButton(name: NJoyBookTab): Locator {
        return this.menu.getByRole('button', { name, exact: true });
    }

    async expectTabVisible(name: NJoyBookTab): Promise<void> {
        await expect(this.tabButton(name)).toBeVisible();
    }

    async expectTabHidden(name: NJoyBookTab): Promise<void> {
        await expect(this.tabButton(name)).toHaveCount(0);
    }

    /** Asserts none of the merchant-admin-only tabs are rendered. */
    async expectAdvancedTabsHidden(): Promise<void> {
        for (const tab of ADVANCED_TABS) {
            await this.expectTabHidden(tab);
        }
    }
}