import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { ConfigBasePage } from '@pages/configuration/ConfigBasePage';
import { AmountStep } from './AmountStep';

type DateTimeData = {
    startDate: string;
    endDate: string;
    startHour: string;
    startMin: string;
    endHour: string;
    endMin: string;
};

export class DateTimeStep extends ConfigBasePage {
    private readonly pageTitle: Locator;
    private readonly startDateInput: Locator;
    private readonly endDateInput: Locator;
    private readonly startTimeButton: Locator;
    private readonly endTimeButton: Locator;
    private readonly hourDropdown: Locator;
    private readonly minDropdown: Locator;
    private readonly dateRangeError: Locator;
    private readonly dateTimeRangeError: Locator;
    private readonly nextButton: Locator;

    constructor(page: Page) {
        super(page);
        this.pageTitle = this.page.locator('form').getByText('Date & Time Settings');
        this.startDateInput = this.page.getByRole('textbox', { name: 'YYYY-MM-DD' }).first();
        this.endDateInput = this.page.getByRole('textbox', { name: 'YYYY-MM-DD' }).nth(1);
        this.startTimeButton = this.page.getByRole('button', { name: ':00' });
        this.endTimeButton = this.page.getByRole('button', { name: ':59' });
        this.hourDropdown = this.page.getByRole('combobox').first();
        this.minDropdown = this.page.getByRole('combobox').nth(1);
        this.dateRangeError = this.page.getByRole('alert', { name: 'Please fix the following' });
        this.dateTimeRangeError = this.page.getByText(/End (date|time) must be after start/i);
        this.nextButton = this.page.getByRole('button', { name: 'Next', exact: true });
    }

    override async waitForReady(): Promise<void> {
        await super.waitForReady();
        await expect(this.pageTitle).toBeVisible();
    }

    async fill(data: DateTimeData): Promise<void> {
        await this.fillStartDate(data.startDate);
        await this.fillEndDate(data.endDate);
        await this.fillStartTime(data.startHour, data.startMin);
        await this.fillEndTime(data.endHour, data.endMin);
    }

    async next(): Promise<AmountStep> {
        await this.nextButton.click();
        const amountStep = new AmountStep(this.page);
        await amountStep.waitForReady();
        return amountStep;
    }

    async nextExpectingValidationError(): Promise<void> {
        await this.nextButton.click();
        await this.expectValidationError();
    }

    async expectStartDateValidationError(): Promise<void> {
        await this.expectValidationError();
    }

    async expectEndDateValidationError(): Promise<void> {
        await this.expectValidationError();
    }

    async expectEndDateBeforeStartError(): Promise<void> {
        await this.expectValidationError();
        await expect(this.dateTimeRangeError).toBeVisible();
    }

    async expectEndTimeBeforeStartError(): Promise<void> {
        await this.expectValidationError();
        await expect(this.dateTimeRangeError).toBeVisible();
    }

    async expectValidationError(): Promise<void> {
        await expect(this.dateRangeError).toBeVisible();
    }

    async fillStartDate(value: string): Promise<void> {
        await this.startDateInput.click();
        await this.startDateInput.fill(value);
    }

    async fillEndDate(value: string): Promise<void> {
        await this.endDateInput.click();
        await this.endDateInput.fill(value);
    }

    async fillStartTime(hour: string, min: string): Promise<void> {
        await this.startTimeButton.click();
        await this.hourDropdown.selectOption(hour);
        await this.minDropdown.selectOption(min);
    }

    async fillEndTime(hour: string, min: string): Promise<void> {
        await this.endTimeButton.click();
        await this.hourDropdown.selectOption(hour);
        await this.minDropdown.selectOption(min);
    }
}
