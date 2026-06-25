import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { ConfigBasePage } from '@pages/configuration/ConfigBasePage';

export class BlockoutsTab extends ConfigBasePage {
    private readonly heading: Locator;
    private readonly addButton: Locator;
    private readonly emptyState: Locator;

    constructor(page: Page) {
        super(page);
        this.heading = this.page.getByRole('heading', { name: 'Blockouts', level: 3 });
        this.addButton = this.page.getByRole('button', { name: 'Add blockout' });
        this.emptyState = this.page.getByText('No blockouts configured yet.');
    }

    override async waitForReady(): Promise<void> {
        await super.waitForReady();
        await expect(this.heading).toBeVisible();
    }

    async expectEmptyState(): Promise<void> {
        await expect(this.emptyState).toBeVisible();
    }

    async addBlockout(): Promise<void> {
        await this.addButton.click();
    }

    async expectBlockoutVisible(label: string): Promise<void> {
        await expect(this.page.getByText(label)).toBeVisible();
    }
}