import { type Page } from '@playwright/test';

export type Role = {
  label: string;
  normalized: string;
  tag: string;
};

export const ROLES = {
  merchantAdmin: {
    label: 'Merchant Admin',
    normalized: 'MERCHANT_ADMIN',
    tag: '@merchant-admin',
  },
  merchantStaff: {
    label: 'Merchant Staff',
    normalized: 'MERCHANT_STAFF',
    tag: '@merchant-staff',
  },
  branchAdmin: {
    label: 'Branch Admin',
    normalized: 'BRANCH_ADMIN',
    tag: '@branch-admin',
  },
  branchStaff: {
    label: 'Branch Staff',
    normalized: 'BRANCH_STAFF',
    tag: '@branch-staff',
  },
} satisfies Record<string, Role>;

export const ALL_ROLES = [
  ROLES.merchantAdmin,
  ROLES.merchantStaff,
  ROLES.branchAdmin,
  ROLES.branchStaff,
];

export const USER_MANAGEMENT_ADMIN_ROLES = [
  ROLES.merchantAdmin,
  ROLES.branchAdmin,
];

export const USER_MANAGEMENT_STAFF_ROLES = [
  ROLES.merchantStaff,
  ROLES.branchStaff,
];

export const DEAL_CREATOR_ROLES = [
  ROLES.merchantAdmin,
  ROLES.branchAdmin,
  ROLES.merchantStaff,
];

export const DEAL_READ_ONLY_ROLES = [
  ROLES.branchStaff,
];

export const LOYALTY_CREATOR_ROLES = [
  ROLES.merchantAdmin,
  ROLES.branchAdmin,
  ROLES.merchantStaff,
];

export const LOYALTY_READ_ONLY_ROLES = [
  ROLES.branchStaff,
];

// Only the merchant admin can reach the "rich" NJoyBook configuration — Rules,
// Time Slots, Staff, Blockouts, Guest History.
export const NJOYBOOK_FULL_ACCESS_ROLES = [
  ROLES.merchantAdmin,
];

// Everyone else sees only the Bookings and Booking Page tabs (with an
// "Access Restricted" banner); the advanced tabs are not rendered for them.
export const NJOYBOOK_LIMITED_ROLES = [
  ROLES.merchantStaff,
  ROLES.branchAdmin,
  ROLES.branchStaff,
];

export async function gotoUat(page: Page): Promise<void> {
  await page.goto(process.env.UAT_URL!);
}
// specs/Auth/helpers/roles.ts
export function getCredentials(normalized: string) {
  const key = normalized.toUpperCase();
  return {
    username: process.env[`UAT_${key}_USER`]!,
    password: process.env[`UAT_${key}_PASSWORD`]!,
  };
}