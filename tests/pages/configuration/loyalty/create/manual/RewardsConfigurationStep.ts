import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { ConfigBasePage } from '@pages/configuration/ConfigBasePage';
import { LoyaltyTncStep } from './LoyaltyTncStep';

export type RewardData = {
    milestone: string;
    name: string;
    description: string;
    validUntil: string;
    quantity: string;
};

export class RewardsConfigurationStep extends ConfigBasePage {
    private readonly pageTitle: Locator;
    private readonly addRewardButton: Locator;
    private readonly rewardMilestoneInput: Locator;
    private readonly rewardNameInput: Locator;
    private readonly rewardDescriptionEditor: Locator;
    private readonly rewardValidUntilInput: Locator;
    private readonly rewardQuantityInput: Locator;
    private readonly nextRewardButton: Locator;
    private readonly previousRewardButton: Locator;
    private readonly validationError: Locator;
    private readonly nextButton: Locator;

    constructor(page: Page) {
        super(page);
        this.pageTitle = this.page.getByText('Reward Milestone');
        this.addRewardButton = this.page.getByRole('button', { name: 'Add Reward', exact: true });
        this.rewardMilestoneInput = this.page.getByRole('spinbutton').first();
        this.rewardNameInput = this.page.getByRole('textbox').first();
        this.rewardDescriptionEditor = this.page.locator('.tiptap').first();
        this.rewardValidUntilInput = this.page.getByRole('textbox', { name: 'YYYY-MM-DD' });
        this.rewardQuantityInput = this.page.getByRole('spinbutton').nth(1);
        this.nextRewardButton = this.page.getByRole('button', { name: 'Next' }).first();
        this.previousRewardButton = this.page.getByRole('button', { name: 'Prev' }).first();
        this.validationError = this.page.getByRole('alert', { name: 'Please fix the following' });
        this.nextButton = this.page.getByRole('button', { name: 'Next', exact: true }).nth(1);
    }

    static validData(overrides: Partial<RewardData> = {}): RewardData {
        return {
            milestone: '10',
            name: 'Test Reward',
            description: 'Test reward description',
            validUntil: RewardsConfigurationStep.futureDate(90),
            quantity: '1000',
            ...overrides,
        };
    }

    private static futureDate(daysFromNow: number): string {
        const date = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
        return date.toISOString().slice(0, 10);
    }

    override async waitForReady(): Promise<void> {
        await super.waitForReady();
        await expect(this.pageTitle).toBeVisible();
    }

    async fillCurrentReward(data: RewardData): Promise<void> {
        await this.fillRewardMilestone(data.milestone);
        await this.fillRewardName(data.name);
        await this.fillRewardDescription(data.description);
        await this.fillRewardValidUntil(data.validUntil);
        await this.fillRewardQuantity(data.quantity);
    }

    async fillRewards(data: RewardData, count: number): Promise<void> {
        for (let rewardIndex = 2; rewardIndex <= count; rewardIndex++) {
            await this.addReward();
        }

        for (let rewardIndex = 2; rewardIndex <= count; rewardIndex++) {
            await this.previousReward();
        }

        for (let rewardIndex = 1; rewardIndex <= count; rewardIndex++) {
            await this.fillCurrentReward({
                ...data,
                name: `${data.name} ${rewardIndex}`,
            });

            if (rewardIndex < count) {
                await this.nextReward();
            }
        }
    }

    async fillCurrentRewardExcept(data: RewardData, omittedField: keyof RewardData): Promise<void> {
        if (omittedField !== 'milestone') {
            await this.fillRewardMilestone(data.milestone);
        } else { await this.clearRewardMilestone(); }

        if (omittedField !== 'name') {
            await this.fillRewardName(data.name);
        }
        if (omittedField !== 'description') {
            await this.fillRewardDescription(data.description);
        }
        if (omittedField !== 'validUntil') {
            await this.fillRewardValidUntil(data.validUntil);
        }
        if (omittedField !== 'quantity') {
            await this.fillRewardQuantity(data.quantity);
        } else {
            await this.clearRewardQuantity();
        }
    }

    async addRewardsUntilMaximum(): Promise<void> {
        for (let rewardCount = 2; rewardCount <= 5; rewardCount++) {
            await this.addReward();
        }
    }

    async addReward(): Promise<void> {
        await expect(this.addRewardButton).toBeEnabled();
        await this.addRewardButton.click();
        await this.waitForReady();
    }

    async nextReward(): Promise<void> {
        await expect(this.nextRewardButton).toBeEnabled();
        await this.nextRewardButton.click();
        await this.waitForReady();
    }

    async previousReward(): Promise<void> {
        await expect(this.previousRewardButton).toBeEnabled();
        await this.previousRewardButton.click();
        await this.waitForReady();
    }

    async next(): Promise<LoyaltyTncStep> {
        await this.nextButton.click();
        const tncStep = new LoyaltyTncStep(this.page);
        await tncStep.waitForReady();
        return tncStep;
    }

    async nextExpectingValidationError(): Promise<void> {
        await this.nextButton.click();
        await this.expectValidationError();
    }

    async fillRewardMilestone(value: string): Promise<void> {
        await this.rewardMilestoneInput.click();
        await this.rewardMilestoneInput.fill(value);
    }

    async clearRewardMilestone(): Promise<void> {
        await this.rewardMilestoneInput.click();
        await this.rewardMilestoneInput.fill('');
    }

    async fillRewardName(value: string): Promise<void> {
        await this.rewardNameInput.click();
        await this.rewardNameInput.fill(value);
    }

    async fillRewardDescription(value: string): Promise<void> {
        await this.rewardDescriptionEditor.click();
        await this.rewardDescriptionEditor.fill(value);
    }

    async fillRewardValidUntil(value: string): Promise<void> {
        await this.rewardValidUntilInput.click();
        await this.rewardValidUntilInput.fill(value);
    }

    async fillRewardQuantity(value: string): Promise<void> {
        await this.rewardQuantityInput.click();
        await this.rewardQuantityInput.fill(value);
    }

    async clearRewardQuantity(): Promise<void> {
        await this.rewardQuantityInput.click();
        await this.rewardQuantityInput.fill('');
    }

    async expectAddRewardDisabled(): Promise<void> {
        await expect(this.addRewardButton).toBeDisabled();
    }

    async expectRewardMilestoneValidationError(): Promise<void> {
        await this.expectValidationError();
    }

    async expectRewardNameValidationError(): Promise<void> {
        await this.expectValidationError();
    }

    async expectRewardValidUntilValidationError(): Promise<void> {
        await this.expectValidationError();
    }

    async expectRewardQuantityValidationError(): Promise<void> {
        await this.expectValidationError();
    }

    async expectValidationError(): Promise<void> {
        await expect(this.validationError).toBeVisible();
    }
}
