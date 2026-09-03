import { describe, expect, it } from 'vitest';
import { addWeeks, formatWeek, formatWeekLong, isoWeek, utcWeekStart } from './weeks';

describe('utcWeekStart', () => {
	it('keeps a Monday where it is', () => {
		// 1 September 2025 is a Monday
		expect(utcWeekStart(new Date('2025-09-01T00:00:00Z')).toISOString()).toBe(
			'2025-09-01T00:00:00.000Z'
		);
	});

	it('snaps a Sunday back to the Monday before it', () => {
		expect(utcWeekStart(new Date('2024-09-01T23:59:59Z')).toISOString()).toBe(
			'2024-08-26T00:00:00.000Z'
		);
	});

	it('drops the time of day', () => {
		expect(utcWeekStart(new Date('2025-09-04T13:45:12.345Z')).toISOString()).toBe(
			'2025-09-01T00:00:00.000Z'
		);
	});
});

describe('addWeeks', () => {
	it('shifts forwards and backwards by whole weeks', () => {
		const week = utcWeekStart(new Date('2025-09-01T00:00:00Z'));

		expect(addWeeks(week, 2).toISOString()).toBe('2025-09-15T00:00:00.000Z');
		expect(addWeeks(week, -1).toISOString()).toBe('2025-08-25T00:00:00.000Z');
	});
});

describe('isoWeek', () => {
	it('numbers the week containing 4 January as week 1', () => {
		// 4 January 2026 is a Sunday, so week 1 of 2026 starts on 29 December 2025
		expect(isoWeek(new Date('2025-12-29T00:00:00Z'))).toEqual({ year: 2026, week: 1 });
		expect(isoWeek(new Date('2026-01-05T00:00:00Z'))).toEqual({ year: 2026, week: 2 });
	});

	it('keeps a late December week in the old year when its Thursday is still there', () => {
		expect(isoWeek(new Date('2025-12-22T00:00:00Z'))).toEqual({ year: 2025, week: 52 });
	});

	it('counts weeks through the year', () => {
		expect(isoWeek(new Date('2025-09-01T00:00:00Z'))).toEqual({ year: 2025, week: 36 });
		expect(isoWeek(new Date('2026-04-06T00:00:00Z'))).toEqual({ year: 2026, week: 15 });
		expect(isoWeek(new Date('2026-08-24T00:00:00Z'))).toEqual({ year: 2026, week: 35 });
	});

	it('reports week 53 in a year that has one', () => {
		// 2026 is a 53-week ISO year: its last week starts on 28 December 2026
		expect(isoWeek(new Date('2026-12-28T00:00:00Z'))).toEqual({ year: 2026, week: 53 });
		expect(isoWeek(new Date('2027-01-04T00:00:00Z'))).toEqual({ year: 2027, week: 1 });
	});

	it('accepts any moment in the week, not just its start', () => {
		expect(isoWeek(new Date('2026-04-12T18:00:00Z'))).toEqual({ year: 2026, week: 15 });
	});
});

describe('formatWeek', () => {
	it('gives a short axis label', () => {
		expect(formatWeek(new Date('2026-04-06T00:00:00Z'))).toBe('W15');
	});

	it('gives a long label naming the ISO year and the start date', () => {
		expect(formatWeekLong(new Date('2026-04-06T00:00:00Z'))).toBe(
			'Week 15 of 2026, from 6 Apr 2026'
		);
	});

	it('names the ISO year, not the calendar year, at a year boundary', () => {
		expect(formatWeekLong(new Date('2025-12-29T00:00:00Z'))).toBe(
			'Week 1 of 2026, from 29 Dec 2025'
		);
	});
});
