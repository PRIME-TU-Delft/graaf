/**
 * Week math for link view analytics.
 *
 * Storage keeps view buckets on plain UTC Monday-start weeks (what postgres
 * `date_trunc('week', ...)` produces). Everything else in here is presentation: turning such a
 * week start into an ISO 8601 week number. Nothing here is stored.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_WEEK = 7 * MS_PER_DAY;

/** Month names are spelled out here rather than taken from toLocaleDateString, so a label reads
 * the same no matter which locale data the server and the browser happen to ship. */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** An ISO 8601 week: its week number, and the ISO year that week belongs to. */
export type IsoWeek = {
	/** ISO week-numbering year, which can differ from the calendar year of the week's own days */
	year: number;
	/** 1-based ISO week number, 1 to 53 */
	week: number;
};

/**
 * Snap a moment to the start of its UTC week, Monday 00:00:00.000 UTC. Mirrors what
 * `date_trunc('week', ...)` does in postgres, so a JS-side week start and a stored week start
 * are the same value.
 *
 * @param date - Any moment
 * @returns A new Date at Monday 00:00 UTC of the week containing `date`
 */
export function utcWeekStart(date: Date): Date {
	const weekStart = new Date(
		Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
	);

	// getUTCDay() is 0 for Sunday, which is 6 days into a Monday-start week
	const daysSinceMonday = (weekStart.getUTCDay() + 6) % 7;
	weekStart.setUTCDate(weekStart.getUTCDate() - daysSinceMonday);

	return weekStart;
}

/**
 * Shift a week start by a whole number of weeks.
 *
 * @param weekStart - A week start, as returned by utcWeekStart
 * @param weeks - Number of weeks to add, may be negative
 * @returns A new Date, `weeks` weeks after `weekStart`
 */
export function addWeeks(weekStart: Date, weeks: number): Date {
	return new Date(weekStart.getTime() + weeks * MS_PER_WEEK);
}

/**
 * The ISO week number of a week, and the ISO year it counts towards.
 *
 * Two rules decide both: the year is the one containing that week's Thursday, and week 1 is the
 * week containing 4 January. That is why a week can sit in a different ISO year than the
 * calendar year of most of its days, as with 29 December 2025, which is week 1 of 2026.
 *
 * @param date - Any moment in the week
 * @returns The ISO year and 1-based week number
 */
export function isoWeek(date: Date): IsoWeek {
	const weekStart = utcWeekStart(date);
	const thursday = new Date(weekStart.getTime() + 3 * MS_PER_DAY);
	const year = thursday.getUTCFullYear();

	// 4 January is always in week 1, so its week start is where the numbering begins
	const firstWeekStart = utcWeekStart(new Date(Date.UTC(year, 0, 4)));
	const week = Math.round((weekStart.getTime() - firstWeekStart.getTime()) / MS_PER_WEEK) + 1;

	return { year, week };
}

/**
 * Short week label, for a chart axis or a table cell.
 *
 * @param date - Any moment in the week
 * @returns A label like `W15`
 */
export function formatWeek(date: Date): string {
	return `W${isoWeek(date).week}`;
}

/**
 * Full week label, naming the ISO year and the calendar date the week starts on.
 *
 * @param date - Any moment in the week
 * @returns A label like `Week 15 of 2026, from 6 Apr 2026`
 */
export function formatWeekLong(date: Date): string {
	const { year, week } = isoWeek(date);
	const start = utcWeekStart(date);
	const from = `${start.getUTCDate()} ${MONTHS[start.getUTCMonth()]} ${start.getUTCFullYear()}`;

	return `Week ${week} of ${year}, from ${from}`;
}
