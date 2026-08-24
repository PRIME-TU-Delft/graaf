import { STALE_LINK_VIEW_THRESHOLD, STALE_LINK_WINDOW_WEEKS } from '$lib/settings';
import { addWeeks, utcWeekStart } from './academicWeeks';

/** One stored bucket: how often one link was viewed during one UTC Monday-start week. */
export type LinkViewWeek = {
	linkId: number;
	weekStart: Date;
	count: number;
};

/** One week of a chart series. Unlike a stored bucket, a week with no views is present as 0. */
export type ViewWeek = {
	weekStart: Date;
	count: number;
};

/** Everything the link list and the analytics popup show for a single link. */
export type LinkAnalytics = {
	/** Running total of views over the link's whole lifetime */
	total: number;
	/** Views inside the trailing window, summed from the weekly buckets */
	recentViews: number;
	/** Length of the trailing window in weeks */
	windowWeeks: number;
	/** Views needed inside the window to not count as stale */
	threshold: number;
	/** True when recentViews is below threshold */
	isStale: boolean;
	/** Dense series over the trailing window, oldest week first, zero-view weeks included */
	weeks: ViewWeek[];
};

/**
 * Turn stored weekly buckets into per-link analytics, deriving staleness at read time rather
 * than reading a stored flag.
 *
 * Buckets may be passed in for any number of links and in any order, and buckets outside the
 * trailing window are ignored. Links without a single bucket still get an entry, with an
 * all-zero series.
 *
 * @param links - The links to build analytics for, each with its denormalized running total
 * @param buckets - Weekly view buckets, as stored (weeks with no views simply absent)
 * @param now - The moment the trailing window ends, defaults to the current time
 * @returns Analytics per link id
 */
export function buildLinkAnalytics(
	links: { id: number; viewCount: number }[],
	buckets: LinkViewWeek[],
	now: Date = new Date()
): Map<number, LinkAnalytics> {
	// The window is the current week plus the weeks before it, so it ends on the week we are in
	const windowStart = addWeeks(utcWeekStart(now), -(STALE_LINK_WINDOW_WEEKS - 1));

	const countsByLink = new Map<number, Map<number, number>>();
	for (const bucket of buckets) {
		const weekStart = utcWeekStart(new Date(bucket.weekStart)).getTime();

		let weekCounts = countsByLink.get(bucket.linkId);
		if (!weekCounts) {
			weekCounts = new Map();
			countsByLink.set(bucket.linkId, weekCounts);
		}

		weekCounts.set(weekStart, (weekCounts.get(weekStart) ?? 0) + bucket.count);
	}

	const analytics = new Map<number, LinkAnalytics>();
	for (const link of links) {
		const weekCounts = countsByLink.get(link.id);

		const weeks: ViewWeek[] = [];
		let recentViews = 0;

		for (let week = 0; week < STALE_LINK_WINDOW_WEEKS; week++) {
			const weekStart = addWeeks(windowStart, week);
			const count = weekCounts?.get(weekStart.getTime()) ?? 0;

			recentViews += count;
			weeks.push({ weekStart, count });
		}

		analytics.set(link.id, {
			total: link.viewCount,
			recentViews,
			windowWeeks: STALE_LINK_WINDOW_WEEKS,
			threshold: STALE_LINK_VIEW_THRESHOLD,
			isStale: recentViews < STALE_LINK_VIEW_THRESHOLD,
			weeks
		});
	}

	return analytics;
}
