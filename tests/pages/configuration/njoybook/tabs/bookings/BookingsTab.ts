import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { ConfigBasePage } from '@pages/configuration/ConfigBasePage';
import { AddBookingModal } from './AddBookingModal';
import { BookingDetail } from './BookingDetail';

export type BookingStatus =
    | 'All'
    | 'Pending'
    | 'Confirmed'
    | 'Checked in'
    | 'Completed'
    | 'Cancelled'
    | 'No show';

export class BookingsTab extends ConfigBasePage {
    private readonly heading: Locator;
    private readonly filtersButton: Locator;
    private readonly prevWeekButton: Locator;
    private readonly nextWeekButton: Locator;
    private readonly staffDropdown: Locator;
    private readonly emptyState: Locator;

    private readonly addBookingButton: Locator;

    private readonly removeActiveButton: Locator;
    private readonly confirmModal: Locator;
    private readonly confirmRemoveButton: Locator;

    constructor(page: Page) {
        super(page);
        this.heading = this.page.getByRole('heading', { name: 'Bookings', level: 3 });
        this.addBookingButton = this.page.getByRole('button', { name: 'Add booking' });
        this.filtersButton = this.page.getByRole('button', { name: 'Filters' });
        this.prevWeekButton = this.page.getByRole('button', { name: 'Previous week' });
        this.nextWeekButton = this.page.getByRole('button', { name: 'Next week' });
        this.staffDropdown = this.page.getByRole('combobox', { name: 'Staff' });
        this.emptyState = this.page.getByText(/No bookings on/);

        this.removeActiveButton = this.page.getByRole('button', { name: 'Remove active' });
        this.confirmModal = this.page.locator('.modal-container');
        this.confirmRemoveButton = this.confirmModal.getByRole('button', { name: 'Remove all active bookings' });
    }

    override async waitForReady(): Promise<void> {
        await super.waitForReady();
        await expect(this.heading).toBeVisible();
    }

    async openFilters(): Promise<void> {
        await this.filtersButton.click();
        await expect(this.prevWeekButton).toBeVisible();
    }

    async goToNextWeek(): Promise<void> {
        await this.nextWeekButton.click();
    }

    async goToPreviousWeek(): Promise<void> {
        await this.prevWeekButton.click();
    }

    async selectDate(label: string): Promise<void> {
        await this.page.getByRole('button', { name: new RegExp(label) }).click();
    }

    // Advances week-by-week until the given day (e.g. "13 Jul") is in view, then
    // selects it. Assumes filters are already open.
    //
    // Each day button loads its booking count asynchronously: while loading it
    // reads "Mon DD, loading booking count" and only settles to "DD Mon, N
    // booking(s)" once loaded. Wait for the loading placeholders to clear each
    // iteration before matching, otherwise the loop races past the target week.
    async goToDate(dayLabel: string): Promise<void> {
        const loadingDay = this.page.getByRole('button', { name: /loading booking count/ });
        const dayButton = this.page.getByRole('button', { name: new RegExp(`^${dayLabel},`) });
        for (let i = 0; i < 8; i++) {
            await expect(loadingDay).toHaveCount(0);
            if (await dayButton.count()) {
                await dayButton.click();
                return;
            }
            await this.goToNextWeek();
        }
        throw new Error(`Date "${dayLabel}" not reachable within the booking window`);
    }

    async filterByStaff(staffName: string): Promise<void> {
        await this.staffDropdown.click();
        await this.page.getByRole('option', { name: staffName }).click();
    }

    async filterByStatus(status: BookingStatus): Promise<void> {
        await this.page.getByRole('button', { name: new RegExp(`^${status}`) }).click();
    }

    async expectEmptyState(dateLabel: string): Promise<void> {
        await expect(this.page.getByText(`No bookings on ${dateLabel}`)).toBeVisible();
    }

    async getBookingCount(dateLabel: string): Promise<string> {
        const dateButton = this.page.getByRole('button', { name: new RegExp(dateLabel) });
        return (await dateButton.textContent()) ?? '';
    }

    // Bookings are listed by guest name (the public confirmation reference is
    // not shown in this admin list), so look up by the name used at booking.
    async expectBookingVisible(guestName: string): Promise<void> {
        await expect(this.page.getByText(guestName).first()).toBeVisible();
    }

    async openAddBooking(): Promise<AddBookingModal> {
        await this.addBookingButton.click();
        const modal = new AddBookingModal(this.page);
        await modal.waitForReady();
        return modal;
    }

    // Each booking is a row button whose accessible text carries the guest
    // name/email, "Party N", the status, and a nested "Change status" control.
    private bookingRow(guest: string): Locator {
        return this.page.getByRole('button').filter({ hasText: guest });
    }

    async openBooking(guest: string): Promise<BookingDetail> {
        await this.bookingRow(guest).click();
        const detail = new BookingDetail(this.page);
        await detail.waitForReady();
        return detail;
    }

    async expectBookingStatus(guest: string, status: BookingStatus): Promise<void> {
        await expect(this.bookingRow(guest)).toContainText(status);
    }

    /** Asserts the booking's status is one of the given options — useful when
     *  a flow (e.g. auto-confirm) can legitimately land in either state. */
    async expectBookingStatusOneOf(guest: string, statuses: BookingStatus[]): Promise<void> {
        await expect(this.bookingRow(guest)).toContainText(new RegExp(statuses.join('|')));
    }

    async expectBookingAbsent(guest: string): Promise<void> {
        await expect(this.bookingRow(guest)).toHaveCount(0);
    }

    /**
     * Cancels every active booking on the branch (all dates) via "Remove active" →
     * "Remove all active bookings". Irreversible. This is a between-runs capacity
     * reset — call it once, outside parallel test execution, NOT as a per-test
     * teardown. Best-effort: no-op when there is nothing to remove.
     */
    async removeAllActiveBookings(): Promise<void> {
        if (!(await this.removeActiveButton.count())) return; // nothing active
        await this.removeActiveButton.click();
        await this.confirmRemoveButton.click();
        await expect(this.confirmModal).not.toBeVisible();
    }
}