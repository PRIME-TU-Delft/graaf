import { describe, expect, it } from 'vitest';
import {
	academicWeek,
	addWeeks,
	formatAcademicWeek,
	formatAcademicWeekLong,
	utcWeekStart
} from './academicWeeks';

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

describe('academicWeek', () => {
	it('numbers the week containing September 1st as week 1', () => {
		// 1 September 2025 is itself a Monday
		expect(academicWeek(new Date('2025-09-01T00:00:00Z'))).toEqual({ year: 2025, week: 1 });

		// 1 September 2024 is a Sunday, so academic week 1 starts on 26 August 2024
		expect(academicWeek(new Date('2024-08-26T00:00:00Z'))).toEqual({ year: 2024, week: 1 });
		expect(academicWeek(new Date('2024-09-02T00:00:00Z'))).toEqual({ year: 2024, week: 2 });
	});

	it('counts on through the academic year', () => {
		expect(academicWeek(new Date('2025-12-22T00:00:00Z'))).toEqual({ year: 2025, week: 17 });
	});

	it('puts a week before September 1st in the previous academic year', () => {
		expect(academicWeek(new Date('2024-08-19T00:00:00Z'))).toEqual({ year: 2023, week: 52 });
	});

	it('accepts any moment in the week, not just its start', () => {
		expect(academicWeek(new Date('2025-09-07T18:00:00Z'))).toEqual({ year: 2025, week: 1 });
	});
});

describe('formatAcademicWeek', () => {
	it('gives a short axis label', () => {
		expect(formatAcademicWeek(new Date('2025-09-15T00:00:00Z'))).toBe('W3');
	});

	it('gives a long label naming the academic year and the start date', () => {
		expect(formatAcademicWeekLong(new Date('2025-09-15T00:00:00Z'))).toBe(
			'Week 3 of 2025/2026, from 15 Sep 2025'
		);
	});
});
