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

    /**
     * Opens a branch's configuration directly by its URL slug, skipping the
     * home -> Configuration -> Branches -> branch card click-path. Measured at
     * ~2.8s against ~9.4s for the click-path, which matters because the
     * NJoyBook specs run sequentially: the saved seconds come straight off the
     * suite's critical path, once per test.
     *
     * The slug is the branch name lowercased with non-alphanumerics collapsed
     * to single dashes ("Hajime - My Village" -> "hajime-my-village"), which is
     * what the app itself puts in the address bar. Branch-scoped roles (branch
     * admin/staff), which have no "Branches" tab, resolve the same URL.
     */
    static async open(page: Page, branchName: string): Promise<BranchConfigPage> {
        const slug = branchName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
        await page.goto(`/configuration/branch/${slug}`);
        const branchConfig = new BranchConfigPage(page);
        await branchConfig.waitForReady();
        return branchConfig;
    }

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
