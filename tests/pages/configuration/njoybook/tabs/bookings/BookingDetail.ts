import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { ConfigBasePage } from '@pages/configuration/ConfigBasePage';
import { UpdateStatusModal } from './UpdateStatusModal';
import { EditBookingModal } from './EditBookingModal';

export type BookingDetailFields = {
    name?: string;
    email?: string;
    phone?: string;
    bookingDate?: string;
    startTime?: string;
    partySize?: string;
    occasion?: string;
    staff?: string;
    source?: string;
};

/**
 * A single booking's detail view (opened by clicking a booking row). Has two
 * subtabs — Details (guest/booking/assignment/record fields) and Logs (an audit
 * trail) — plus "Change status" and "Edit details" actions.
 */
export class BookingDetail extends ConfigBasePage {
    private readonly reference: Locator;
    private readonly changeStatusButton: Locator;
    private readonly editDetailsButton: Locator;
    private readonly backButton: Locator;
    private readonly subtabs: Locator;

    constructor(page: Page) {
        super(page);
        this.reference = this.page.getByRole('heading', { level: 4, name: /^BK-\d{8}-\d+$/ });
        this.subtabs = this.page.getByRole('tablist', { name: 'Booking detail section' });
        // "Change status" / "Edit details" appear both here and (icon-only) in the
        // list, so scope to the ones carrying the visible label text.
        this.changeStatusButton = this.page.getByRole('button', { name: 'Change status' });
        this.editDetailsButton = this.page.getByRole('button', { name: 'Edit details' });
        this.backButton = this.page.getByRole('button', { name: 'Back to bookings' });
    }

    override async waitForReady(): Promise<void> {
        await expect(this.reference).toBeVisible();
    }

    async getReference(): Promise<string> {
        return (await this.reference.textContent())?.trim() ?? '';
    }

    async expectReference(pattern: RegExp = /^BK-\d{8}-\d+$/): Promise<void> {
        await expect(this.reference).toHaveText(pattern);
    }

    // --- Details subtab ---

    async openDetails(): Promise<void> {
        await this.subtabs.getByRole('button', { name: 'Details' }).click();
    }

    /**
     * Asserts booking fields, each rendered as a term/definition pair. Matches
     * the definition value exactly (anchored) so short values like a party size
     * of "2" don't substring-match other fields (names, dates, ids).
     */
    async expectFields(fields: BookingDetailFields): Promise<void> {
        for (const value of Object.values(fields)) {
            if (value !== undefined) {
                const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                await expect(
                    this.page.getByRole('definition').filter({ hasText: new RegExp(`^${escaped}$`) }),
                ).toBeVisible();
            }
        }
    }

    // --- Logs subtab ---

    async openLogs(): Promise<void> {
        await this.subtabs.getByRole('button', { name: 'Logs' }).click();
        await expect(this.page.getByRole('heading', { name: 'Audit Logs', level: 4 })).toBeVisible();
    }

    /** Asserts an audit-log entry with the given type label exists, e.g. 'Checked In'. */
    async expectAuditEntry(label: string): Promise<void> {
        await expect(this.page.getByText(label, { exact: true })).toBeVisible();
    }

    // --- Actions ---

    async openStatusModal(): Promise<UpdateStatusModal> {
        await this.changeStatusButton.click();
        const modal = new UpdateStatusModal(this.page);
        await modal.waitForReady();
        return modal;
    }

    async openEdit(): Promise<EditBookingModal> {
        await this.editDetailsButton.click();
        const modal = new EditBookingModal(this.page);
        await modal.waitForReady();
        return modal;
    }

    async goBack(): Promise<void> {
        await this.backButton.click();
    }
}
