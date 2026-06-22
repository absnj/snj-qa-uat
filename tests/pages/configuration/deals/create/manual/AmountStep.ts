import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { ConfigBasePage } from '@pages/configuration/ConfigBasePage';
import { TncStep } from './TncStep';

type AmountData = {
    dealValue: string;
    minimumSpend: string;
    currentQuantity?: string;
    unlimitedQuantity?: boolean;
};

export class AmountStep extends ConfigBasePage {
    private readonly pageTitle: Locator;
    private readonly dealValueTypeToggle: Locator;
    private readonly dealValueInput: Locator;
    private readonly minimumSpendInput: Locator;
    private readonly unlimitedQuantityToggle: Locator;
    private readonly currentQuantityInput: Locator;
    private readonly nextButton: Locator;

    constructor(page: Page) {
        super(page);
        this.pageTitle = this.page.locator('form').getByText('Amount & Currency');
        this.dealValueTypeToggle = this.page.getByRole('combobox').filter({ hasText: '%' });
        this.dealValueInput = this.page.getByRole('spinbutton').first();
        this.minimumSpendInput = this.page.getByText('Minimum Spend Minimum amount').getByRole('spinbutton');
        this.unlimitedQuantityToggle = this.page.getByRole('switch');
        this.currentQuantityInput = this.page.getByRole('spinbutton').nth(2);
        this.nextButton = this.page.getByRole('button', { name: 'Next', exact: true });
    }

    override async waitForReady(): Promise<void> {
        await super.waitForReady();
        await expect(this.pageTitle).toBeVisible();
    }

    async fill(data: AmountData): Promise<void> {
        await this.fillDealValue(data.dealValue);
        await this.fillMinimumSpend(data.minimumSpend);

        if (data.unlimitedQuantity) { return; }
        if (data.currentQuantity) {
            await this.toggleUnlimitedQuantity();
            await this.fillCurrentQuantity(data.currentQuantity);
        }
        return;
    }

    async next(): Promise<TncStep> {
        await this.nextButton.click();
        return new TncStep(this.page);
    }

    async selectDealValueType(value: string): Promise<void> {
        await this.dealValueTypeToggle.selectOption(value);
    }

    private async fillDealValue(value: string): Promise<void> {
        await this.dealValueInput.click();
        await this.dealValueInput.fill(value);
    }

    private async fillMinimumSpend(value: string): Promise<void> {
        await this.minimumSpendInput.click();
        await this.minimumSpendInput.fill(value);
    }

    private async toggleUnlimitedQuantity(): Promise<void> {
        await this.unlimitedQuantityToggle.click();
    }

    private async fillCurrentQuantity(value: string): Promise<void> {
        await this.currentQuantityInput.click();
        await this.currentQuantityInput.fill(value);
    }
}
