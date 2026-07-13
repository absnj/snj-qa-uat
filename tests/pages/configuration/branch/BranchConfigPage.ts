import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { BasePage } from '@core/BasePage';
import { NJoyBookPage } from '@pages/configuration/njoybook/NjoyBookPage';

/**
 * A single branch's configuration page
 * (/configuration/branch/:branchId). The tab bar here is rendered as buttons
 * — Details / Schedule / NJoyBook / Smart QR / Media / Logs / Remarks — not the
 * link-based Overview/Deals/Loyalty tabs of the merchant-level config page.
 */
export class BranchConfigPage extends BasePage {
    private readonly detailsHeading: Locator;
    private readonly detailsTabButton: Locator;
    private readonly scheduleTabButton: Locator;
    private readonly njoyBookTabButton: Locator;

    constructor(page: Page) {
        super(page);
        this.detailsHeading = this.page.getByRole('heading', { name: 'Details', level: 3 });
        this.detailsTabButton = this.page.getByRole('button', { name: 'Details' });
        this.scheduleTabButton = this.page.getByRole('button', { name: 'Schedule' });
        this.njoyBookTabButton = this.page.getByRole('button', { name: 'NJoyBook' });
    }

    override async waitForReady(): Promise<void> {
        await super.waitForReady();
        await expect(this.njoyBookTabButton).toBeVisible();
    }

    async goToNJoyBook(): Promise<NJoyBookPage> {
        await this.njoyBookTabButton.click();
        const njoyBookPage = new NJoyBookPage(this.page);
        await njoyBookPage.waitForReady();
        return njoyBookPage;
    }
}
