import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { BasePage } from '../../core/BasePage';

export class PublicBookingPage extends BasePage {
    private readonly pageHeading: Locator;

    // Step 1 — Date & Time
    private readonly branchButton: Locator;
    private readonly dateInput: Locator;
    private readonly decreaseGuestsButton: Locator;
    private readonly increaseGuestsButton: Locator;
    private readonly guestCount: Locator;
    private readonly noTablesAvailable: Locator;
    private readonly continueButton: Locator;

    // Progress steps
    private readonly dateTimeStep: Locator;
    private readonly yourDetailsStep: Locator;
    private readonly reviewConfirmStep: Locator;

    constructor(page: Page) {
        super(page);
        this.pageHeading = this.page.getByRole('heading', { level: 1 });

        // Step 1
        this.branchButton = this.page.getByRole('button', { name: 'Branch' });
        this.dateInput = this.page.getByRole('textbox', { name: 'Date' });
        this.decreaseGuestsButton = this.page.getByRole('button', { name: 'Decrease guests' });
        this.increaseGuestsButton = this.page.getByRole('button', { name: 'Increase guests' });
        this.guestCount = this.page.getByText(/guests/);
        this.noTablesAvailable = this.page.getByRole('heading', { name: 'No tables available', level: 3 });
        this.continueButton = this.page.getByRole('button', { name: 'Continue' });

        // Progress nav
        this.dateTimeStep = this.page.getByRole('button', { name: 'Date & time' });
        this.yourDetailsStep = this.page.getByRole('button', { name: 'Your details' });
        this.reviewConfirmStep = this.page.getByRole('button', { name: 'Review & confirm' });
    }

    override async waitForReady(): Promise<void> {
        await expect(this.page.getByText('Reserve a table')).toBeVisible();
        await expect(this.pageHeading).toBeVisible();
    }

    // --- Branch ---

    async selectBranch(branchName: string): Promise<void> {
        await this.branchButton.click();
        await this.page.getByRole('option', { name: branchName }).click();
    }

    async expectBranch(branchName: string): Promise<void> {
        await expect(this.branchButton).toContainText(branchName);
    }

    // --- Date ---

    async setDate(isoDate: string): Promise<void> {
        await this.dateInput.fill(isoDate);
        await this.dateInput.press('Tab');
    }

    async expectDateAvailabilityHint(hint: string): Promise<void> {
        await expect(this.page.getByText(hint)).toBeVisible();
    }

    // --- Party size ---

    async increaseGuests(times: number = 1): Promise<void> {
        for (let i = 0; i < times; i++) {
            await this.increaseGuestsButton.click();
        }
    }

    async decreaseGuests(times: number = 1): Promise<void> {
        for (let i = 0; i < times; i++) {
            await this.decreaseGuestsButton.click();
        }
    }

    async expectGuestCount(count: number): Promise<void> {
        await expect(this.page.getByText(`${count}`).first()).toBeVisible();
    }

    async expectPartySizeLimits(limits: string): Promise<void> {
        await expect(this.page.getByText(limits)).toBeVisible();
    }

    async expectDecreaseDisabled(): Promise<void> {
        await expect(this.decreaseGuestsButton).toBeDisabled();
    }

    // --- Slot selection ---

    async selectTimeSlot(timeRange: string): Promise<void> {
        await this.page.getByRole('button', { name: new RegExp(timeRange) }).click();
    }

    async expectNoTablesAvailable(): Promise<void> {
        await expect(this.noTablesAvailable).toBeVisible();
    }

    // --- Navigation ---

    async expectContinueDisabled(): Promise<void> {
        await expect(this.continueButton).toBeDisabled();
    }

    async continue(): Promise<void> {
        await expect(this.continueButton).toBeEnabled();
        await this.continueButton.click();
        await expect(this.yourDetailsStep).not.toBeDisabled();
    }
}