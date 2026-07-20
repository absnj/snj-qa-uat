import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { ConfigBasePage } from '@pages/configuration/ConfigBasePage';
import { TimeSlotDetail } from './TimeSlotDetail';

export type Weekday =
    | 'Sunday'
    | 'Monday'
    | 'Tuesday'
    | 'Wednesday'
    | 'Thursday'
    | 'Friday'
    | 'Saturday';

export class TimeSlotsTab extends ConfigBasePage {
    private readonly heading: Locator;
    private readonly addButton: Locator;
    private readonly bulkEditButton: Locator;

    // Bulk Edit modal (used by setSlotStatus).
    private readonly bulkEditDialog: Locator;
    private readonly bulkEditHeading: Locator;
    private readonly slotVisibilitySwitch: Locator;
    private readonly bulkApplyButton: Locator;
    private readonly slotsUpdatedToast: Locator;

    constructor(page: Page) {
        super(page);
        this.heading = this.page.getByRole('heading', { name: 'Time Slots', level: 3 });
        this.addButton = this.page.getByRole('button', { name: 'Add time slot' });
        this.bulkEditButton = this.page.getByRole('button', { name: 'Bulk Edit' });

        this.bulkEditDialog = this.page.locator('.modal-container');
        this.bulkEditHeading = this.bulkEditDialog.getByRole('heading', { name: 'Bulk Edit Time Slots' });
        // The modal's single switch is the "Set selected slots as active" visibility control.
        this.slotVisibilitySwitch = this.bulkEditDialog.getByRole('switch');
        this.bulkApplyButton = this.bulkEditDialog.getByRole('button', { name: 'Apply to selected' });
        this.slotsUpdatedToast = this.page.getByText(/slot\(s\) were updated/).first();
    }

    override async waitForReady(): Promise<void> {
        await super.waitForReady();
        await expect(this.heading).toBeVisible();
    }

    async selectWeekday(day: Weekday): Promise<void> {
        await this.page.getByRole('button', { name: new RegExp(`^${day}`) }).click();
    }

    async expectSlotCount(day: Weekday, count: number): Promise<void> {
        const dayButton = this.page.getByRole('button', { name: new RegExp(`^${day}`) });
        await expect(dayButton).toContainText(String(count));
    }

    async openSlot(timeRange: string): Promise<TimeSlotDetail> {
        await this.slotButton(timeRange).click();
        const detail = new TimeSlotDetail(this.page, timeRange);
        await detail.waitForReady();
        return detail;
    }

    async expectSlotVisible(timeRange: string, status: 'Active' | 'Inactive' = 'Active'): Promise<void> {
        const slot = this.slotButton(timeRange);
        await expect(slot).toBeVisible();
        await expect(slot).toContainText(status);
    }

    // Slot buttons are labelled by their full range, e.g. "20:30 – 21:30 …".
    // Anchor on the start so a lookup for "20:30" doesn't also match the
    // preceding "19:30 – 20:30" slot (which would trip strict mode).
    private slotButton(timeRange: string): Locator {
        return this.page.getByRole('button', { name: new RegExp(`^${timeRange}`) });
    }

    /**
     * Assigns a staff member to every slot of the currently-selected weekday via
     * the Bulk Edit modal. Public booking availability requires staff to be
     * assigned to slots, and the Rules "Set to Default" reset clears those
     * assignments — so this is used by fixtures to re-establish a bookable state
     * after a reset. Defaults to the branch's default weekday (Monday); call
     * selectWeekday() first to target another.
     */
    async assignStaffToSlots(staffName: string): Promise<void> {
        await this.bulkEditButton.click();
        const dialog = this.page.locator('.modal-container');
        await expect(dialog.getByRole('heading', { name: 'Bulk Edit Time Slots' })).toBeVisible();

        await dialog.getByRole('checkbox', { name: /Select all slots in selected weekdays/ }).click();
        await dialog.getByRole('radio', { name: /Add one staff member/ }).click();
        await dialog.getByRole('combobox').filter({ hasText: 'Choose staff to add' }).first().click();
        await this.page.getByRole('option', { name: staffName, exact: true }).click();
        await dialog.getByRole('button', { name: 'Apply to selected' }).click();

        await expect(this.page.getByText(/slot\(s\) were updated/).first()).toBeVisible();
    }

    /**
     * Activates or deactivates a single slot of the currently-selected weekday
     * via the Bulk Edit modal's "Visibility" toggle ("Set selected slots as
     * active"). A deactivated slot is hidden from the public booking calendar.
     * Call selectWeekday() first to target a weekday other than the default
     * (Monday); pass the slot's start time, e.g. "19:30".
     */
    async setSlotStatus(startTime: string, active: boolean): Promise<void> {
        await this.bulkEditButton.click();
        await expect(this.bulkEditHeading).toBeVisible();

        // Select only the target slot, then drive the visibility toggle.
        await this.slotCheckbox(startTime).check();
        if ((await this.slotVisibilitySwitch.isChecked()) !== active) await this.slotVisibilitySwitch.click();

        await this.bulkApplyButton.click();
        await expect(this.slotsUpdatedToast).toBeVisible();
    }

    // Bulk Edit slot checkboxes are labelled by their full range, e.g.
    // "19:30 – 20:30 …"; anchor on the start time so a lookup doesn't also match
    // an adjacent slot. Scoped to the modal declared in the constructor.
    private slotCheckbox(startTime: string): Locator {
        return this.bulkEditDialog.getByRole('checkbox', { name: new RegExp(`^${startTime}\\b`) });
    }
}