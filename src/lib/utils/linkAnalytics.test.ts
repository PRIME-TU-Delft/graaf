import { describe, expect, it } from 'vitest';
import { STALE_LINK_VIEW_THRESHOLD, STALE_LINK_WINDOW_WEEKS } from '$lib/settings';
import { buildLinkAnalytics, type LinkViewWeek } from './linkAnalytics';
import { addWeeks, utcWeekStart } from './weeks';

const NOW = new Date('2026-02-11T10:30:00Z');
const CURRENT_WEEK = utcWeekStart(NOW);

/** A bucket `weeksAgo` weeks before the week containing NOW */
function bucket(linkId: number, weeksAgo: number, count: number): LinkViewWeek {
	return { linkId, weekStart: addWeeks(CURRENT_WEEK, -weeksAgo), count };
}

describe('buildLinkAnalytics', () => {
	it('takes the total from the link, not from the buckets', () => {
		const analytics = buildLinkAnalytics([{ id: 1, viewCount: 900 }], [bucket(1, 0, 3)], NOW);

		expect(analytics.get(1)?.total).toBe(900);
		expect(analytics.get(1)?.recentViews).toBe(3);
	});

	it('returns one dense week per window week, oldest first, zeroes included', () => {
		const analytics = buildLinkAnalytics([{ id: 1, viewCount: 2 }], [bucket(1, 3, 2)], NOW);
		const weeks = analytics.get(1)!.weeks;

		expect(weeks).toHaveLength(STALE_LINK_WINDOW_WEEKS);
		expect(weeks[0].weekStart).toEqual(addWeeks(CURRENT_WEEK, -(STALE_LINK_WINDOW_WEEKS - 1)));
		expect(weeks.at(-1)?.weekStart).toEqual(CURRENT_WEEK);

		// Only the week that has a bucket is non-zero
		expect(weeks.filter((week) => week.count > 0)).toEqual([
			{ weekStart: addWeeks(CURRENT_WEEK, -3), count: 2 }
		]);
	});

	it('counts the oldest week of the window but not the one before it', () => {
		const analytics = buildLinkAnalytics(
			[{ id: 1, viewCount: 5 }],
			[bucket(1, STALE_LINK_WINDOW_WEEKS - 1, 2), bucket(1, STALE_LINK_WINDOW_WEEKS, 3)],
			NOW
		);

		expect(analytics.get(1)?.recentViews).toBe(2);
	});

	it('keeps buckets of different links apart', () => {
		const analytics = buildLinkAnalytics(
			[
				{ id: 1, viewCount: 4 },
				{ id: 2, viewCount: 7 }
			],
			[bucket(1, 0, 4), bucket(2, 1, 7)],
			NOW
		);

		expect(analytics.get(1)?.recentViews).toBe(4);
		expect(analytics.get(2)?.recentViews).toBe(7);
	});

	it('marks a link stale below the threshold and not stale at it', () => {
		const analytics = buildLinkAnalytics(
			[
				{ id: 1, viewCount: 100 },
				{ id: 2, viewCount: 100 }
			],
			[
				bucket(1, 1, STALE_LINK_VIEW_THRESHOLD - 1),
				bucket(2, 1, STALE_LINK_VIEW_THRESHOLD - 1),
				bucket(2, 2, 1)
			],
			NOW
		);

		expect(analytics.get(1)?.isStale).toBe(true);
		expect(analytics.get(2)?.isStale).toBe(false);
	});

	it('counts a link with no buckets at all as stale, with an all-zero series', () => {
		const analytics = buildLinkAnalytics([{ id: 1, viewCount: 0 }], [], NOW);

		expect(analytics.get(1)?.recentViews).toBe(0);
		expect(analytics.get(1)?.isStale).toBe(true);
		expect(analytics.get(1)?.weeks.every((week) => week.count === 0)).toBe(true);
	});

	it('ignores buckets belonging to links it was not asked about', () => {
		const analytics = buildLinkAnalytics([{ id: 1, viewCount: 1 }], [bucket(2, 0, 50)], NOW);

		expect(analytics.size).toBe(1);
		expect(analytics.get(1)?.recentViews).toBe(0);
	});

	it('reports the window and threshold it used', () => {
		const analytics = buildLinkAnalytics([{ id: 1, viewCount: 0 }], [], NOW);

		expect(analytics.get(1)?.windowWeeks).toBe(STALE_LINK_WINDOW_WEEKS);
		expect(analytics.get(1)?.threshold).toBe(STALE_LINK_VIEW_THRESHOLD);
	});
});
