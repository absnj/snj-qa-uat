import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { ConfigBasePage } from '@pages/configuration/ConfigBasePage';

export type ServiceType = 'General';

export type BookingMode = 'Staff';

export type StaffVisibility = 'Own only' | 'All staff';

export type SessionLength =
    | '30 minutes'
    | '45 minutes'
    | '1 hour (recommended)'
    | '1.5 hours'
    | '2 hours';

export type SlotCadence = 'Back to back (recommended)' | '15 minutes' | '30 minutes' | '1 hour';

export type AdvanceBookingWindow =
    | 'Up to 1 week ahead'
    | 'Up to 2 weeks ahead'
    | 'Up to 1 month ahead'
    | 'Up to 2 months ahead'
    | 'Up to 3 months ahead';

export type MinimumNotice =
    | 'Allow immediate bookings'
    | '30 minutes'
    | '1 hour'
    | '2 hours'
    | '4 hours'
    | '1 day';

export type NoShowWindow =
    | '5 minutes after start'
    | '10 minutes after start'
    | '15 minutes after start (recommended)'
    | '30 minutes after start';

export type ReminderTiming =
    | '1 day before'
    | '3 hours before'
    | '2 hours before'
    | '1 hour before'
    | '30 minutes before';

export type RulesData = {
    enableBooking?: boolean;
    serviceType?: ServiceType;
    bookingMode?: BookingMode;
    autoConfirm?: boolean;
    staffVisibility?: StaffVisibility;
    allowCustomerChooseStaff?: boolean;
    allowAnyAvailableStaff?: boolean;
    minPartySize?: number;
    maxPartySize?: number;
    sessionLength?: SessionLength;
    slotCadence?: SlotCadence;
    bookingsPerSlot?: number;
    overbookingBuffer?: number;
    advanceBookingWindow?: AdvanceBookingWindow;
    minimumNotice?: MinimumNotice;
    noShowWindow?: NoShowWindow;
    reminderTimings?: ReminderTiming[];
    confirmationMessage?: string;
    bookingTerms?: string;
};

export class RulesTab extends ConfigBasePage {
    // Enable booking
    private readonly enableBookingToggle: Locator;

    // Service & Booking Mode
    private readonly serviceTypeDropdown: Locator;
    private readonly bookingModeDropdown: Locator;

    // Approval & Staff Controls
    private readonly autoConfirmToggle: Locator;
    private readonly staffVisibilityDropdown: Locator;
    private readonly allowCustomerChooseStaffToggle: Locator;
    private readonly allowAnyAvailableStaffToggle: Locator;

    // Capacity & Sessions
    private readonly minPartySizeInput: Locator;
    private readonly maxPartySizeInput: Locator;
    private readonly sessionLengthDropdown: Locator;
    private readonly slotCadenceDropdown: Locator;
    private readonly bookingsPerSlotInput: Locator;
    private readonly overbookingBufferInput: Locator;

    // Booking Window
    private readonly advanceBookingWindowDropdown: Locator;
    private readonly minimumNoticeDropdown: Locator;
    private readonly noShowWindowDropdown: Locator;

    // Customer Communication
    private readonly confirmationMessageEditor: Locator;
    private readonly bookingTermsEditor: Locator;

    // Save
    private readonly saveButton: Locator;

    // Heading (waitForReady anchor)
    private readonly heading: Locator;

    constructor(page: Page) {
        super(page);
        this.heading = this.page.getByRole('heading', { name: 'Rules and Regulations', level: 3 });

        // Enable booking — first switch on the page
        this.enableBookingToggle = this.page.getByRole('switch').first();

        // Service & Booking Mode
        this.serviceTypeDropdown = this.page.getByRole('combobox', { name: 'Service Type' });
        this.bookingModeDropdown = this.page.getByRole('combobox', { name: 'Booking Mode' });

        // Approval & Staff Controls
        this.autoConfirmToggle = this.page.getByRole('switch').nth(1);
        this.staffVisibilityDropdown = this.page.getByRole('combobox', { name: 'Staff Visibility' });
        this.allowCustomerChooseStaffToggle = this.page.getByRole('switch').nth(2);
        this.allowAnyAvailableStaffToggle = this.page.getByRole('switch').nth(3);

        // Capacity & Sessions
        this.minPartySizeInput = this.page.getByRole('spinbutton', { name: 'Minimum Party Size' });
        this.maxPartySizeInput = this.page.getByRole('spinbutton', { name: 'Maximum Party Size' });
        this.sessionLengthDropdown = this.page.getByRole('combobox', { name: 'Session Length' });
        this.slotCadenceDropdown = this.page.getByRole('combobox', { name: 'New Slot Opens Every' });
        this.bookingsPerSlotInput = this.page.getByRole('spinbutton', { name: 'Bookings Allowed Per Slot' });
        this.overbookingBufferInput = this.page.getByRole('spinbutton', { name: 'Extra Buffer (Overbooking)' });

        // Booking Window
        this.advanceBookingWindowDropdown = this.page.getByRole('combobox', { name: 'How Far Ahead Customers Can Book' });
        this.minimumNoticeDropdown = this.page.getByRole('combobox', { name: 'Minimum Notice Required' });
        this.noShowWindowDropdown = this.page.getByRole('combobox', { name: 'Mark As No-Show After' });

        // Customer Communication — two .tiptap rich text editors in order
        this.confirmationMessageEditor = this.page.locator('.tiptap').first();
        this.bookingTermsEditor = this.page.locator('.tiptap').nth(1);

        this.saveButton = this.page.getByRole('button', { name: 'Save Booking Settings' });
    }

    override async waitForReady(): Promise<void> {
        await super.waitForReady();
        await expect(this.heading).toBeVisible();
    }

    // --- Enable Booking ---

    async enableBooking(): Promise<void> {
        const checked = await this.enableBookingToggle.isChecked();
        if (!checked) await this.enableBookingToggle.click();
    }

    async disableBooking(): Promise<void> {
        const checked = await this.enableBookingToggle.isChecked();
        if (checked) await this.enableBookingToggle.click();
    }

    async expectBookingEnabled(enabled: boolean): Promise<void> {
        if (enabled) {
            await expect(this.enableBookingToggle).toBeChecked();
        } else {
            await expect(this.enableBookingToggle).not.toBeChecked();
        }
    }

    // --- Service & Booking Mode ---

    async setServiceType(value: ServiceType): Promise<void> {
        await this.serviceTypeDropdown.click();
        await this.page.getByRole('option', { name: value }).click();
    }

    async setBookingMode(value: BookingMode): Promise<void> {
        await this.bookingModeDropdown.click();
        await this.page.getByRole('option', { name: value }).click();
    }

    // --- Approval & Staff Controls ---

    async setAutoConfirm(enabled: boolean): Promise<void> {
        const checked = await this.autoConfirmToggle.isChecked();
        if (checked !== enabled) await this.autoConfirmToggle.click();
    }

    async setStaffVisibility(value: StaffVisibility): Promise<void> {
        await this.staffVisibilityDropdown.click();
        await this.page.getByRole('option', { name: value }).click();
    }

    async setAllowCustomerChooseStaff(enabled: boolean): Promise<void> {
        const checked = await this.allowCustomerChooseStaffToggle.isChecked();
        if (checked !== enabled) await this.allowCustomerChooseStaffToggle.click();
    }

    async setAllowAnyAvailableStaff(enabled: boolean): Promise<void> {
        const checked = await this.allowAnyAvailableStaffToggle.isChecked();
        if (checked !== enabled) await this.allowAnyAvailableStaffToggle.click();
    }

    // --- Capacity & Sessions ---

    async setMinPartySize(value: number): Promise<void> {
        await this.minPartySizeInput.fill(String(value));
    }

    async setMaxPartySize(value: number): Promise<void> {
        await this.maxPartySizeInput.fill(String(value));
    }

    async setSessionLength(value: SessionLength): Promise<void> {
        await this.sessionLengthDropdown.click();
        await this.page.getByRole('option', { name: value }).click();
    }

    async setSlotCadence(value: SlotCadence): Promise<void> {
        await this.slotCadenceDropdown.click();
        await this.page.getByRole('option', { name: value }).click();
    }

    async setBookingsPerSlot(value: number): Promise<void> {
        await this.bookingsPerSlotInput.fill(String(value));
    }

    async setOverbookingBuffer(value: number): Promise<void> {
        await this.overbookingBufferInput.fill(String(value));
    }

    // --- Booking Window ---

    async setAdvanceBookingWindow(value: AdvanceBookingWindow): Promise<void> {
        await this.advanceBookingWindowDropdown.click();
        await this.page.getByRole('option', { name: value }).click();
    }

    async setMinimumNotice(value: MinimumNotice): Promise<void> {
        await this.minimumNoticeDropdown.click();
        await this.page.getByRole('option', { name: value }).click();
    }

    async setNoShowWindow(value: NoShowWindow): Promise<void> {
        await this.noShowWindowDropdown.click();
        await this.page.getByRole('option', { name: value }).click();
    }

    // --- Customer Communication ---

    async setReminderTiming(timing: ReminderTiming, checked: boolean): Promise<void> {
        const checkbox = this.page.getByRole('checkbox', { name: timing });
        const current = await checkbox.isChecked();
        if (current !== checked) await checkbox.click();
    }

    async setReminderTimings(timings: ReminderTiming[]): Promise<void> {
        const all: ReminderTiming[] = [
            '1 day before',
            '3 hours before',
            '2 hours before',
            '1 hour before',
            '30 minutes before',
        ];
        for (const timing of all) {
            await this.setReminderTiming(timing, timings.includes(timing));
        }
    }

    async setConfirmationMessage(text: string): Promise<void> {
        await this.confirmationMessageEditor.click();
        await this.confirmationMessageEditor.fill(text);
    }

    async setBookingTerms(text: string): Promise<void> {
        await this.bookingTermsEditor.click();
        await this.bookingTermsEditor.fill(text);
    }

    // --- Bulk fill ---

    async fill(data: RulesData): Promise<void> {
        if (data.enableBooking !== undefined) {
            data.enableBooking ? await this.enableBooking() : await this.disableBooking();
        }
        if (data.serviceType) await this.setServiceType(data.serviceType);
        if (data.bookingMode) await this.setBookingMode(data.bookingMode);
        if (data.autoConfirm !== undefined) await this.setAutoConfirm(data.autoConfirm);
        if (data.staffVisibility) await this.setStaffVisibility(data.staffVisibility);
        if (data.allowCustomerChooseStaff !== undefined) await this.setAllowCustomerChooseStaff(data.allowCustomerChooseStaff);
        if (data.allowAnyAvailableStaff !== undefined) await this.setAllowAnyAvailableStaff(data.allowAnyAvailableStaff);
        if (data.minPartySize !== undefined) await this.setMinPartySize(data.minPartySize);
        if (data.maxPartySize !== undefined) await this.setMaxPartySize(data.maxPartySize);
        if (data.sessionLength) await this.setSessionLength(data.sessionLength);
        if (data.slotCadence) await this.setSlotCadence(data.slotCadence);
        if (data.bookingsPerSlot !== undefined) await this.setBookingsPerSlot(data.bookingsPerSlot);
        if (data.overbookingBuffer !== undefined) await this.setOverbookingBuffer(data.overbookingBuffer);
        if (data.advanceBookingWindow) await this.setAdvanceBookingWindow(data.advanceBookingWindow);
        if (data.minimumNotice) await this.setMinimumNotice(data.minimumNotice);
        if (data.noShowWindow) await this.setNoShowWindow(data.noShowWindow);
        if (data.reminderTimings) await this.setReminderTimings(data.reminderTimings);
        if (data.confirmationMessage) await this.setConfirmationMessage(data.confirmationMessage);
        if (data.bookingTerms) await this.setBookingTerms(data.bookingTerms);
    }

    async save(): Promise<void> {
        await this.saveButton.click();
    }

    // --- Assertions ---

    async expectValidationError(): Promise<void> {
        await expect(this.page.getByRole('alert', { name: /Please fix the following/ })).toBeVisible();
    }
}