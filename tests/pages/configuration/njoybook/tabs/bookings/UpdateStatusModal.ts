import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { ConfigBasePage } from '@pages/configuration/ConfigBasePage';

/**
 * The "Update status" modal opened from a booking's "Change status" control.
 * The offered actions are contextual to the current status — the booking
 * lifecycle is forward-only: Confirmed → Checked in → Completed, with Cancel /
 * No-show as terminal exits. There is no revert.
 */
export class UpdateStatusModal extends ConfigBasePage {
    private readonly modal: Locator;
    private readonly heading: Locator;
    private readonly closeButton: Locator;

    constructor(page: Page) {
        super(page);
        this.modal = this.page.locator('.modal-container');
        this.heading = this.page.getByRole('heading', { name: 'Update status', level: 2 });
        this.closeButton = this.modal.getByRole('button', { name: 'Close modal' });
    }

    override async waitForReady(): Promise<void> {
        await expect(this.heading).toBeVisible();
    }

    private async act(actionName: string): Promise<void> {
        await this.modal.getByRole('button', { name: actionName }).click();
        await expect(this.modal).not.toBeVisible();
    }

    /** From Confirmed. */
    async checkIn(): Promise<void> {
        await this.act('Check in guest');
    }

    /** From Checked in. */
    async markCompleted(): Promise<void> {
        await this.act('Mark completed');
    }

    async cancelBooking(): Promise<void> {
        await this.act('Cancel booking');
    }

    async markNoShow(): Promise<void> {
        await this.act('Mark no-show');
    }

    /** Asserts an action is offered (contextual to the current status). */
    async expectActionAvailable(actionName: string): Promise<void> {
        await expect(this.modal.getByRole('button', { name: actionName })).toBeVisible();
    }

    /** Asserts none of the status-transition actions are offered — the
     *  "Change status" trigger itself stays visible even on a terminal
     *  booking (Cancelled/No show/Completed), but the modal it opens offers
     *  no further transitions since the lifecycle is forward-only. */
    async expectNoActionsAvailable(): Promise<void> {
        for (const action of ['Check in guest', 'Mark completed', 'Cancel booking', 'Mark no-show']) {
            await expect(this.modal.getByRole('button', { name: action })).toHaveCount(0);
        }
    }

    async close(): Promise<void> {
        await this.closeButton.click();
        await expect(this.modal).not.toBeVisible();
    }
}
