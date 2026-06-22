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
    private readonly validationError: Locator;
    private readonly dealValueError: Locator;
    private readonly percentageDealValueError: Locator;
    private readonly quantityError: Locator;
    private readonly nextButton: Locator;

    constructor(page: Page) {
        super(page);
        this.pageTitle = this.page.locator('form').getByText('Amount & Currency');
        this.dealValueTypeToggle = this.page.getByRole('combobox').filter({ hasText: '%' });
        this.dealValueInput = this.page.getByRole('spinbutton').first();
        this.minimumSpendInput = this.page.getByText('Minimum Spend Minimum amount').getByRole('spinbutton');
        this.unlimitedQuantityToggle = this.page.getByRole('switch');
        this.currentQuantityInput = this.page.getByRole('spinbutton').nth(2);
        this.validationError = this.page.getByRole('alert', { name: 'Please fix the following' });
        this.dealValueError = this.page.getByText('Deal value must be greater');
        this.percentageDealValueError = this.page.getByText('Percentage deal value must be between 0 and 100', { exact: true });
        this.quantityError = this.page.getByText('Quantity must be greater than');
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
        const tncStep = new TncStep(this.page);
        await tncStep.waitForReady();
        return tncStep;
    }

    async nextExpectingValidationError(): Promise<void> {
        await this.nextButton.click();
        await this.expectValidationError();
    }

    async expectDealValueValidationError(): Promise<void> {
        await this.expectValidationError();
        await expect(this.dealValueError).toBeVisible();
    }

    async expectPercentageDealValueValidationError(): Promise<void> {
        await this.expectValidationError();
        await expect(this.percentageDealValueError).toBeVisible();
    }

    async expectQuantityValidationError(): Promise<void> {
        await this.expectValidationError();
        await expect(this.quantityError).toBeVisible();
    }

    async expectValidationError(): Promise<void> {
        await expect(this.validationError).toBeVisible();
    }

    async selectDealValueType(value: string): Promise<void> {
        await this.dealValueTypeToggle.selectOption(value);
    }

    async fillDealValue(value: string): Promise<void> {
        await this.dealValueInput.click();
        await this.dealValueInput.fill(value);
    }

    async fillMinimumSpend(value: string): Promise<void> {
        await this.minimumSpendInput.click();
        await this.minimumSpendInput.fill(value);
    }

    async toggleUnlimitedQuantity(): Promise<void> {
        await this.unlimitedQuantityToggle.click();
    }

    async fillCurrentQuantity(value: string): Promise<void> {
        await this.currentQuantityInput.click();
        await this.currentQuantityInput.fill(value);
    }
}
