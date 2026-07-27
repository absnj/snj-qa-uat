import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { ConfigBasePage } from '../ConfigBasePage';
import { DealsPage } from '../deals/DealsPage';
import { LoyaltyPage } from '../loyalty/LoyaltyPage';
import { BranchConfigPage } from '../branch/BranchConfigPage';

export class ConfigOverview extends ConfigBasePage {
    private readonly overviewHeader: Locator;
    private readonly branchesTab: Locator;

    constructor(page: Page) {
        super(page);
        this.overviewHeader = this.page.getByRole('heading', { name: 'Details' });
        this.branchesTab = this.page.getByRole('button', { name: 'Branches' });
    }

    async goToDeals(): Promise<DealsPage> {
        await this.dealsTab.click();
        const dealsPage = new DealsPage(this.page);
        await dealsPage.waitForReady();
        return dealsPage;
    }

    async goToLoyaltyPrograms(): Promise<LoyaltyPage> {
        await this.loyaltyTab.click();
        const loyaltyPage = new LoyaltyPage(this.page);
        await loyaltyPage.waitForReady();
        return loyaltyPage;
    }

    async waitForReady(): Promise<void> {
       await expect(this.overviewHeader).toBeVisible();
       await super.waitForReady();
    }

    /**
     * Opens the Branches tab and drills into a specific branch by name. Branch
     * cards are clickable tiles whose name is a level-4 heading (not a button).
     */
    async goToBranch(branchName: string): Promise<BranchConfigPage> {
        return this.openBranchConfig(branchName);
    }

    /**
     * Reaches a branch's configuration regardless of role scope. Merchant-level
     * roles see a "Branches" tab and pick the branch by name; branch-scoped roles
     * (branch admin/staff) have no such tab and land directly on their single
     * branch's config, so this returns that page without navigating.
     */
    async openBranchConfig(branchName: string): Promise<BranchConfigPage> {
        if (await this.branchesTab.count()) {
            await this.branchesTab.click();
            const branchCard = this.page.getByRole('heading', { name: branchName, level: 4 });
            await expect(branchCard).toBeVisible();
            await branchCard.click();
        }
        const branchConfig = new BranchConfigPage(this.page);
        await branchConfig.waitForReady();
        return branchConfig;
    }
}
