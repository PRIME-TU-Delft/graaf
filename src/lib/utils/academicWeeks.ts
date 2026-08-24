/**
 * Week math for link view analytics.
 *
 * Storage keeps view buckets on plain UTC Monday-start weeks (what postgres
 * `date_trunc('week', ...)` produces). Everything in here is presentation: turning such a week
 * start into the TU Delft academic week numbering, where week 1 is the week containing
 * September 1st. Nothing here is stored.
 */

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

/** September, zero-indexed for Date.UTC */
const SEPTEMBER = 8;

/** Month names are spelled out here rather than taken from toLocaleDateString, so a label reads
 * the same no matter which locale data the server and the browser happen to ship. */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** An academic week: the calendar year the academic year starts in, plus the week number in it. */
export type AcademicWeek = {
	/** Calendar year the academic year started in, so 2025 means the 2025/2026 academic year */
	year: number;
	/** 1-based week number, week 1 being the week that contains September 1st */
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
 * The first week of an academic year: the UTC week containing September 1st of that year.
 *
 * @param year - Calendar year the academic year starts in
 * @returns The week start of academic week 1
 */
function academicYearStart(year: number): Date {
	return utcWeekStart(new Date(Date.UTC(year, SEPTEMBER, 1)));
}

/**
 * Convert a UTC week start into TU Delft academic week numbering.
 *
 * @param weekStart - A week start, as returned by utcWeekStart
 * @returns The academic year and 1-based week number that week falls in
 */
export function academicWeek(weekStart: Date): AcademicWeek {
	const start = utcWeekStart(weekStart);

	let year = start.getUTCFullYear();
	if (start.getTime() < academicYearStart(year).getTime()) year -= 1;

	const week = Math.round((start.getTime() - academicYearStart(year).getTime()) / MS_PER_WEEK) + 1;

	return { year, week };
}

/**
 * Short academic week label, for a chart axis or a table cell.
 *
 * @param weekStart - A week start, as returned by utcWeekStart
 * @returns A label like `W3`
 */
export function formatAcademicWeek(weekStart: Date): string {
	return `W${academicWeek(weekStart).week}`;
}

/**
 * Full academic week label, naming the academic year and the calendar date the week starts on.
 *
 * @param weekStart - A week start, as returned by utcWeekStart
 * @returns A label like `Week 3 of 2025/2026, from 15 Sep 2025`
 */
export function formatAcademicWeekLong(weekStart: Date): string {
	const { year, week } = academicWeek(weekStart);
	const start = utcWeekStart(weekStart);
	const date = `${start.getUTCDate()} ${MONTHS[start.getUTCMonth()]} ${start.getUTCFullYear()}`;

	return `Week ${week} of ${year}/${year + 1}, from ${date}`;
}
