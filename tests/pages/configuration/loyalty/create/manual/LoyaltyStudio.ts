import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { ConfigBasePage } from '@pages/configuration/ConfigBasePage';
import { generateLoyaltyProgramTitle } from '../../../../../testDataGenerators';

export type EarnType = 'Visits' | 'Spend';

export type ProgramConfigurationData = {
    earnType: EarnType;
    perStamp: string;
    stampsPerCard?: string;
};

export const DEFAULT_PROGRAM_CONFIGURATION: ProgramConfigurationData = {
    earnType: 'Visits',
    perStamp: '1',
};

export type LoyaltyGeneralDetailsData = {
    title: string;
    description: string;
    fullDescription: string;
    keywords: string[];
    startDate: string;
    endDate: string;
};

export type RewardData = {
    milestone: string;
    name: string;
    description: string;
    validUntil: string;
    quantity: string;
};

export const MAXIMUM_REWARDS = 5;

/**
 * The manual loyalty builder is a single "loyalty design studio" page. Details,
 * Rewards, Designs, Brand and Finish are sections of one form and "Create
 * loyalty program" validates and submits all of them, so there is no longer a
 * details step, a design step, or a "Next" button.
 *
 * Rewards changed shape too: instead of a one-at-a-time carousel with
 * Prev/Next, every reward is an expandable card in a list, capped at five.
 *
 * Fields carry no id, aria-label or test id, so they are located through the
 * one stable contract the markup offers: each field sits in a `.form-group`
 * alongside its own `label.form-label`. Everything is scoped to the studio
 * region so the NJoyBuild panel's inputs can never be matched by accident.
 */
export class LoyaltyStudio extends ConfigBasePage {
    private readonly studio: Locator;
    private readonly fieldGroups: Locator;
    private readonly rewardCards: Locator;

    private readonly detailsSection: Locator;
    private readonly rewardsSection: Locator;

    private readonly visitsEarnTypeRadio: Locator;
    private readonly spendEarnTypeRadio: Locator;
    private readonly perStampInput: Locator;
    private readonly stampsPerCardInput: Locator;

    private readonly programTitleInput: Locator;
    private readonly descriptionInput: Locator;
    private readonly fullDescriptionEditor: Locator;
    private readonly keywordsInput: Locator;
    private readonly allBranchesCheckbox: Locator;
    private readonly noExpiryCheckbox: Locator;
    private readonly startDateInput: Locator;
    private readonly endDateInput: Locator;

    private readonly addRewardButton: Locator;

    private readonly termsEditor: Locator;

    private readonly validationAlert: Locator;
    private readonly createProgramButton: Locator;

    constructor(page: Page) {
        super(page);
        this.studio = this.page.getByRole('region', { name: 'Loyalty design studio' });
        this.fieldGroups = this.studio.locator('.form-group');
        this.rewardCards = this.studio.locator('.rewards-studio-list').getByRole('article');

        this.detailsSection = this.studio.getByRole('button', { name: 'Details', exact: true });
        this.rewardsSection = this.studio.getByRole('button', { name: 'Rewards', exact: true });

        this.visitsEarnTypeRadio = this.studio.getByRole('radio', { name: 'Visits' });
        this.spendEarnTypeRadio = this.studio.getByRole('radio', { name: 'Spend' });
        // The label tracks the selected earn type ("Visits per stamp" /
        // "Spend per stamp"), so match either wording.
        this.perStampInput = this.field('(Visits|Spend) per stamp').getByRole('spinbutton');
        this.stampsPerCardInput = this.field('Stamps per card').getByRole('spinbutton');

        this.programTitleInput = this.field('Title').getByRole('textbox');
        this.descriptionInput = this.field('Short description').getByRole('textbox');
        this.fullDescriptionEditor = this.field('Full description').locator('.tiptap');
        this.keywordsInput = this.studio.getByRole('textbox', { name: 'Add a keyword' });
        this.allBranchesCheckbox = this.studio.getByRole('checkbox', { name: 'All branches' });
        this.noExpiryCheckbox = this.studio.getByRole('checkbox', { name: 'No expiry' });
        this.startDateInput = this.field('Start date').getByRole('textbox');
        this.endDateInput = this.field('End date').getByRole('textbox');

        this.addRewardButton = this.studio.getByRole('button', { name: 'Add reward' });

        this.termsEditor = this.field('Terms & Conditions').locator('.tiptap');

        this.validationAlert = this.page.getByRole('alert', { name: 'Please fix the following fields' });
        this.createProgramButton = this.page.getByRole('button', { name: 'Create loyalty program' });
    }

    /**
     * Resolves a Details-section field by its visible label. Anchored at the
     * start of the label so "Description" cannot also match "Full description".
     */
    private field(label: string): Locator {
        return this.fieldGroups.filter({
            has: this.page.locator('label.form-label').filter({ hasText: new RegExp(`^\\s*${label}\\b`) }),
        });
    }

    /**
     * Reward cards render in creation order, which is the same order the stamp
     * card and the validation summary ("Reward #1", "Reward #2", …) use.
     */
    private rewardCard(rewardNumber: number): Locator {
        return this.rewardCards.nth(rewardNumber - 1);
    }

    private rewardField(rewardNumber: number, label: string): Locator {
        return this.rewardCard(rewardNumber)
            .locator('.form-group')
            .filter({
                has: this.page.locator('label.form-label').filter({ hasText: new RegExp(`^\\s*${label}\\b`) }),
            });
    }

    static validGeneralDetails(overrides: Partial<LoyaltyGeneralDetailsData> = {}): LoyaltyGeneralDetailsData {
        return {
            title: generateLoyaltyProgramTitle(),
            description: 'Test loyalty program description',
            fullDescription: 'Full description for an automated loyalty program.',
            keywords: ['loyalty', 'uat', 'test'],
            startDate: LoyaltyStudio.futureDate(7),
            endDate: LoyaltyStudio.futureDate(60),
            ...overrides,
        };
    }

    static validReward(overrides: Partial<RewardData> = {}): RewardData {
        return {
            milestone: '10',
            name: 'Test Reward',
            description: 'Test reward description',
            validUntil: LoyaltyStudio.futureDate(90),
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
        await expect(this.studio).toBeVisible();
        await expect(this.programTitleInput).toBeVisible();
    }

    async openDetailsSection(): Promise<void> {
        await this.detailsSection.click();
        await expect(this.programTitleInput).toBeVisible();
    }

    async openRewardsSection(): Promise<void> {
        await this.rewardsSection.click();
        await expect(this.addRewardButton).toBeVisible();
    }

    async fillProgramConfiguration(data: ProgramConfigurationData): Promise<void> {
        await this.selectEarnType(data.earnType);
        await this.fillPerStamp(data.perStamp);
        if (data.stampsPerCard) {
            await this.fillStampsPerCard(data.stampsPerCard);
        }
    }

    async fillGeneralDetails(data: LoyaltyGeneralDetailsData): Promise<void> {
        await this.fillProgramTitle(data.title);
        await this.fillDescription(data.description);
        await this.fillFullDescription(data.fullDescription);
        await this.addKeywords(data.keywords);
        await this.fillStartDate(data.startDate);
        await this.fillEndDate(data.endDate);
    }

    async fillTerms(data: { terms?: string }): Promise<void> {
        if (data.terms !== undefined) {
            await this.termsEditor.fill(data.terms);
        }
    }

    async fillReward(rewardNumber: number, data: RewardData): Promise<void> {
        await this.expandReward(rewardNumber);
        await this.fillRewardMilestone(rewardNumber, data.milestone);
        await this.fillRewardName(rewardNumber, data.name);
        await this.fillRewardDescription(rewardNumber, data.description);
        await this.fillRewardValidUntil(rewardNumber, data.validUntil);
        await this.fillRewardQuantity(rewardNumber, data.quantity);
    }

    /**
     * Fills a reward but leaves one field empty. The omitted field is cleared
     * through the keyboard rather than `fill('')`: the reward inputs keep their
     * previous value when filled with an empty string, so a card that was
     * already populated would silently stay valid.
     */
    async fillRewardExcept(
        rewardNumber: number,
        data: RewardData,
        omittedField: keyof RewardData,
    ): Promise<void> {
        await this.fillReward(rewardNumber, data);
        await this.clearRewardField(rewardNumber, omittedField);
    }

    private async clearRewardField(rewardNumber: number, fieldName: keyof RewardData): Promise<void> {
        const labels: Record<keyof RewardData, string> = {
            milestone: 'Milestone',
            name: 'Name',
            description: 'Description',
            validUntil: 'Valid until',
            quantity: 'Quantity',
        };
        const group = this.rewardField(rewardNumber, labels[fieldName]);
        const input = fieldName === 'description'
            ? group.locator('.tiptap')
            : group.getByRole(fieldName === 'milestone' || fieldName === 'quantity' ? 'spinbutton' : 'textbox');

        if (fieldName === 'description') {
            await input.click();
            await this.page.keyboard.press('ControlOrMeta+A');
            await this.page.keyboard.press('Backspace');
            return;
        }

        // The card re-derives values from the rest of the form for a moment
        // after the preceding fields are filled, which can repopulate a field
        // that was just emptied. Retry the clear until it stays empty.
        await expect(async () => {
            await input.click();
            await this.page.keyboard.press('ControlOrMeta+A');
            await this.page.keyboard.press('Backspace');
            await expect(input).toHaveValue('', { timeout: 1_000 });
        }).toPass({ timeout: 15_000 });
    }

    /**
     * Adds cards until `count` rewards exist, then fills each one. Reward names
     * are suffixed so every card is distinguishable in the summary and preview.
     */
    async fillRewards(data: RewardData, count: number): Promise<void> {
        await this.openRewardsSection();
        while ((await this.rewardCards.count()) < count) {
            await this.addReward();
        }

        for (let rewardNumber = 1; rewardNumber <= count; rewardNumber++) {
            await this.fillReward(rewardNumber, {
                ...data,
                name: `${data.name} ${rewardNumber}`,
            });
        }
    }

    async addRewardsUntilMaximum(): Promise<void> {
        await this.openRewardsSection();
        while ((await this.rewardCards.count()) < MAXIMUM_REWARDS) {
            await this.addReward();
        }
    }

    async addReward(): Promise<void> {
        const before = await this.rewardCards.count();
        await expect(this.addRewardButton).toBeEnabled();
        await this.addRewardButton.click();
        await expect(this.rewardCards).toHaveCount(before + 1);
    }

    /**
     * Reward cards are an accordion — only the expanded one exposes its inputs,
     * and clicking an already-expanded header would collapse it.
     */
    private async expandReward(rewardNumber: number): Promise<void> {
        const header = this.rewardCard(rewardNumber).getByRole('button', { expanded: false });
        if (await header.count()) {
            await header.first().click();
        }
        await expect(this.rewardField(rewardNumber, 'Name').getByRole('textbox')).toBeVisible();
    }

    /**
     * Submits the studio. On success the app leaves the builder for the new
     * program's detail page, which is the observable outcome we assert on.
     */
    async submitAndExpectSuccess(): Promise<void> {
        await this.createProgramButton.click();
        await expect(this.page).toHaveURL(/\/configuration\/loyalty-program\/loyalty_setup_/);
    }

    async submitExpectingValidationError(): Promise<void> {
        await this.createProgramButton.click();
        await expect(this.validationAlert).toBeVisible();
    }

    /**
     * The studio reports validation as one summary toast that bullets each
     * offending field, so assertions name the field rather than a per-input
     * message.
     */
    async expectValidationFor(fieldName: string): Promise<void> {
        await expect(this.validationAlert).toBeVisible();
        await expect(this.validationAlert).toContainText(`• ${fieldName}`);
    }

    async expectTitleValidationError(): Promise<void> {
        await this.expectValidationFor('Title');
    }

    async expectDescriptionValidationError(): Promise<void> {
        await this.expectValidationFor('Description');
    }

    /** The summary labels this "Transactions per stamp" for both earn types. */
    async expectPerStampValidationError(): Promise<void> {
        await this.expectValidationFor('Transactions per stamp');
    }

    async expectRewardNameValidationError(rewardNumber: number): Promise<void> {
        await this.expectValidationFor(`Reward #${rewardNumber} name`);
    }

    async expectRewardDescriptionValidationError(rewardNumber: number): Promise<void> {
        await this.expectValidationFor(`Reward #${rewardNumber} description`);
    }

    async expectRewardValidUntilValidationError(rewardNumber: number): Promise<void> {
        await this.expectValidationFor(`Reward #${rewardNumber} valid until`);
    }

    async expectTermsRequiredError(): Promise<void> {
        await this.expectValidationFor('Terms & Conditions');
    }

    async expectAddRewardDisabled(): Promise<void> {
        await expect(this.addRewardButton).toBeDisabled();
    }

    async expectRewardCount(count: number): Promise<void> {
        await expect(this.rewardCards).toHaveCount(count);
    }

    async selectEarnType(earnType: EarnType): Promise<void> {
        const radio = earnType === 'Visits' ? this.visitsEarnTypeRadio : this.spendEarnTypeRadio;
        await radio.check();
    }

    async fillPerStamp(value: string): Promise<void> {
        await this.perStampInput.fill(value);
    }

    async fillStampsPerCard(value: string): Promise<void> {
        await this.stampsPerCardInput.fill(value);
    }

    async fillProgramTitle(value: string): Promise<void> {
        await this.programTitleInput.fill(value);
    }

    async fillDescription(value: string): Promise<void> {
        await this.descriptionInput.fill(value);
    }

    async fillFullDescription(value: string): Promise<void> {
        await this.fullDescriptionEditor.fill(value);
    }

    async addKeyword(keyword: string): Promise<void> {
        await this.keywordsInput.fill(keyword);
        await this.keywordsInput.press('Enter');
    }

    async addKeywords(keywords: string[]): Promise<void> {
        for (const keyword of keywords) {
            await this.addKeyword(keyword);
        }
    }

    async toggleAllBranches(): Promise<void> {
        await this.allBranchesCheckbox.click();
    }

    async toggleNoExpiry(): Promise<void> {
        await this.noExpiryCheckbox.click();
    }

    async fillStartDate(value: string): Promise<void> {
        await this.startDateInput.fill(value);
    }

    async fillEndDate(value: string): Promise<void> {
        await this.endDateInput.fill(value);
    }

    async fillRewardMilestone(rewardNumber: number, value: string): Promise<void> {
        await this.rewardField(rewardNumber, 'Milestone').getByRole('spinbutton').fill(value);
    }

    async fillRewardName(rewardNumber: number, value: string): Promise<void> {
        await this.rewardField(rewardNumber, 'Name').getByRole('textbox').fill(value);
    }

    async fillRewardDescription(rewardNumber: number, value: string): Promise<void> {
        await this.rewardField(rewardNumber, 'Description').locator('.tiptap').fill(value);
    }

    async fillRewardValidUntil(rewardNumber: number, value: string): Promise<void> {
        await this.rewardField(rewardNumber, 'Valid until').getByRole('textbox').fill(value);
    }

    async fillRewardQuantity(rewardNumber: number, value: string): Promise<void> {
        await this.rewardField(rewardNumber, 'Quantity').getByRole('spinbutton').fill(value);
    }

    async clearTermsAndConditions(): Promise<void> {
        await this.termsEditor.click();
        await this.page.keyboard.press('ControlOrMeta+A');
        await this.page.keyboard.press('Backspace');
    }
}
