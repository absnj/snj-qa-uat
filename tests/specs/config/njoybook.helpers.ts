import { type Weekday } from '@pages/configuration/njoybook/tabs/time-slots/TimeSlotsTab';

export { type Weekday };

/** Next Monday (never today) as an ISO date — the weekday whose slots the
 *  bookable fixture assigns staff to, so it always has public availability. */
export function nextMondayISO(): string {
  const d = new Date();
  const delta = ((8 - d.getDay()) % 7) || 7;
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

/**
 * ISO date of the next given weekday (0=Sunday … 6=Saturday), never today, and
 * optionally `weeksAhead` weeks further out. The slot/staff mutation tests each
 * own a distinct weekday so their recurring-template edits can't collide with
 * the Monday-based booking tests (or each other) under fullyParallel; the small
 * `weeksAhead` offsets keep dates comfortably inside the 1-month advance window.
 */
export function nextWeekdayISO(weekday: number, weeksAhead = 0): string {
  const d = new Date();
  const delta = ((weekday - d.getDay() + 7) % 7) || 7;
  d.setDate(d.getDate() + delta + weeksAhead * 7);
  return d.toISOString().slice(0, 10);
}

/** Formats an ISO date as the admin bookings day label, e.g. "13 Jul". */
export function dayLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00`);
  return `${d.getDate()} ${d.toLocaleString('en-US', { month: 'short' })}`;
}

/** A guest name unique per run so repeated runs don't collide in the (not yet
 *  auto-cleaned) bookings list. */
export function uniqueGuest(prefix: string): string {
  return `${prefix} ${Date.now()}`;
}

/** An ISO date a given number of days in the future. */
export function futureISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Formats an ISO date as the blockout list label. The list renders dates in the
 *  browser's locale; the test browser is en-US, which reads "Sep 14, 2026". */
export function blockoutLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export const ALL_WEEKDAYS: Weekday[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];
