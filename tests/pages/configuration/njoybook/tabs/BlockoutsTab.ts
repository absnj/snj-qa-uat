import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { ConfigBasePage } from '@pages/configuration/ConfigBasePage';
import { BlockoutModal } from './BlockoutModal';

export class BlockoutsTab extends ConfigBasePage {
    private readonly heading: Locator;
    private readonly addButton: Locator;
    private readonly emptyState: Locator;

    constructor(page: Page) {
        super(page);
        this.heading = this.page.getByRole('heading', { name: 'Blockouts', level: 3 });
        this.addButton = this.page.getByRole('button', { name: 'Add Blockout' });
        this.emptyState = this.page.getByText('No blockouts configured yet.');
    }

    override async waitForReady(): Promise<void> {
        await super.waitForReady();
        await expect(this.heading).toBeVisible();
    }

    async expectEmptyState(): Promise<void> {
        await expect(this.emptyState).toBeVisible();
    }

    async openAddBlockout(): Promise<BlockoutModal> {
        await this.addButton.click();
        const modal = new BlockoutModal(this.page);
        await modal.waitForAddReady();
        return modal;
    }

    // Each blockout renders as a `.booking-slot-grid` row (same layout class the
    // Staff tab uses for its rows) carrying the date range, "CLOSED" badge, and
    // an "Edit blockout" button. Blockout labels read like "3 Aug 2026".
    private blockoutRow(dateLabel: string): Locator {
        return this.page.locator('.booking-slot-grid').filter({ hasText: dateLabel });
    }

    async expectBlockoutVisible(dateLabel: string): Promise<void> {
        await expect(this.blockoutRow(dateLabel)).toBeVisible();
    }

    async expectBlockoutAbsent(dateLabel: string): Promise<void> {
        await expect(this.blockoutRow(dateLabel)).toHaveCount(0);
    }

    async editBlockout(dateLabel: string): Promise<BlockoutModal> {
        await this.blockoutRow(dateLabel).getByRole('button', { name: 'Edit blockout' }).click();
        const modal = new BlockoutModal(this.page);
        await modal.waitForEditReady();
        return modal;
    }

    /** Opens a blockout and deletes it. Safe to call in teardown. */
    async deleteBlockout(dateLabel: string): Promise<void> {
        const modal = await this.editBlockout(dateLabel);
        await modal.delete();
    }
}
