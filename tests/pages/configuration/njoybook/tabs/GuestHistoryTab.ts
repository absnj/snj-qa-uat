import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { ConfigBasePage } from '@pages/configuration/ConfigBasePage';

export type GuestType = 'Shoppers' | 'Anonymous guests';

/**
 * NJoyBook → Guest History tab. Lists past bookers, split into two toggled
 * views — registered "Shoppers" and "Anonymous guests" — with a name/contact
 * search and pagination. (Unlike Bookings/Guest-lists elsewhere, this tab has no
 * week or staff filters.)
 */
export class GuestHistoryTab extends ConfigBasePage {
    private readonly heading: Locator;

    // "Guest history type" toggle. Scoped by its own tablist name because the
    // page also renders the "NJoyBook Menu" tablist.
    private readonly typeTabs: Locator;
    private readonly shoppersToggle: Locator;
    private readonly anonymousGuestsToggle: Locator;

    private readonly searchBox: Locator;
    private readonly pagination: Locator;

    constructor(page: Page) {
        super(page);
        this.heading = this.page.getByRole('heading', { name: 'Guest History', level: 3 });

        this.typeTabs = this.page.getByRole('tablist', { name: 'Guest history type' });
        this.shoppersToggle = this.typeTabs.getByRole('button', { name: 'Shoppers' });
        this.anonymousGuestsToggle = this.typeTabs.getByRole('button', { name: 'Anonymous guests' });

        this.searchBox = this.page.getByRole('searchbox', { name: 'Search' });
        this.pagination = this.page.getByRole('navigation', { name: 'Pagination' });
    }

    override async waitForReady(): Promise<void> {
        await super.waitForReady();
        await expect(this.heading).toBeVisible();
    }

    async viewShoppers(): Promise<void> {
        await this.shoppersToggle.click();
        await expect(this.shoppersToggle).toHaveAttribute('aria-pressed', 'true');
    }

    async viewAnonymousGuests(): Promise<void> {
        await this.anonymousGuestsToggle.click();
        await expect(this.anonymousGuestsToggle).toHaveAttribute('aria-pressed', 'true');
    }

    async search(term: string): Promise<void> {
        await this.searchBox.fill(term);
    }

    // Each guest is a row button whose accessible text carries the name plus a
    // "<email> · N booking(s)" summary line, so look up by the booker name.
    private guestRow(name: string): Locator {
        return this.page.getByRole('button').filter({ hasText: name });
    }

    async expectGuestVisible(name: string): Promise<void> {
        await expect(this.guestRow(name).first()).toBeVisible();
    }

    async expectGuestAbsent(name: string): Promise<void> {
        await expect(this.guestRow(name)).toHaveCount(0);
    }

    /** Asserts the two guest-type views and the search control are present. */
    async expectControlsVisible(): Promise<void> {
        await expect(this.shoppersToggle).toBeVisible();
        await expect(this.anonymousGuestsToggle).toBeVisible();
        await expect(this.searchBox).toBeVisible();
    }
}
