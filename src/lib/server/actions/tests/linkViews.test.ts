import { describe, expect, it } from 'vitest';
import prisma from '$lib/server/db/prisma';
import { LinkViewActions } from '$lib/server/actions/LinkViews';
import { STALE_LINK_VIEW_THRESHOLD, STALE_LINK_WINDOW_WEEKS } from '$lib/settings';
import { addWeeks, utcWeekStart } from '$lib/utils/weeks';
import { buildLinkAnalytics } from '$lib/utils/linkAnalytics';
import { FIXTURE_COURSES, FIXTURE_GRAPHS } from './helpers/fixture';

/** Create a link on the fixture's first graph. Each test uses its own name, since the fixture is
 * only reseeded between files. */
async function makeLink(name: string) {
	const graph = await prisma.graph.findFirstOrThrow({
		where: { name: FIXTURE_GRAPHS.one, course: { code: FIXTURE_COURSES.one.code } }
	});

	return prisma.link.create({
		data: { name, graphId: graph.id, parentType: 'COURSE', courseId: graph.courseId }
	});
}

describe('LinkViewActions.recordView', () => {
	it('starts a link off at zero views with no buckets', async () => {
		const link = await makeLink('views-fresh');

		expect(link.viewCount).toBe(0);
		expect(await prisma.linkViewWeek.count({ where: { linkId: link.id } })).toBe(0);
	});

	it('bumps the running total and the current week bucket', async () => {
		const link = await makeLink('views-counted');

		await LinkViewActions.recordView(link.id);
		await LinkViewActions.recordView(link.id);
		await LinkViewActions.recordView(link.id);

		const updated = await prisma.link.findUniqueOrThrow({ where: { id: link.id } });
		expect(updated.viewCount).toBe(3);

		const buckets = await prisma.linkViewWeek.findMany({ where: { linkId: link.id } });
		expect(buckets).toHaveLength(1);
		expect(buckets[0].count).toBe(3);
	});

	it('buckets on the UTC Monday of the current week', async () => {
		const link = await makeLink('views-week-start');

		await LinkViewActions.recordView(link.id);

		const bucket = await prisma.linkViewWeek.findFirstOrThrow({ where: { linkId: link.id } });
		expect(bucket.weekStart).toEqual(utcWeekStart(new Date()));
	});

	it('keeps the counts of different links apart', async () => {
		const one = await makeLink('views-split-one');
		const two = await makeLink('views-split-two');

		await LinkViewActions.recordView(one.id);
		await LinkViewActions.recordView(two.id);
		await LinkViewActions.recordView(two.id);

		expect((await prisma.link.findUniqueOrThrow({ where: { id: one.id } })).viewCount).toBe(1);
		expect((await prisma.link.findUniqueOrThrow({ where: { id: two.id } })).viewCount).toBe(2);
	});

	it('swallows a failed write instead of throwing, and writes nothing', async () => {
		const before = await prisma.linkViewWeek.count();

		await expect(LinkViewActions.recordView(-1)).resolves.toBeUndefined();

		expect(await prisma.linkViewWeek.count()).toBe(before);
	});
});

describe('LinkViewActions.getWeeklyViews', () => {
	it('reads back the buckets inside the window and skips the ones before it', async () => {
		const link = await makeLink('views-window');
		const currentWeek = utcWeekStart(new Date());
		const oldestInWindow = addWeeks(currentWeek, -(STALE_LINK_WINDOW_WEEKS - 1));

		await prisma.linkViewWeek.createMany({
			data: [
				{ linkId: link.id, weekStart: oldestInWindow, count: 4 },
				{ linkId: link.id, weekStart: addWeeks(currentWeek, -STALE_LINK_WINDOW_WEEKS), count: 9 }
			]
		});

		expect(await LinkViewActions.getWeeklyViews([link.id])).toEqual([
			{ linkId: link.id, weekStart: oldestInWindow, count: 4 }
		]);
	});

	it('reads nothing when asked about no links', async () => {
		expect(await LinkViewActions.getWeeklyViews([])).toEqual([]);
	});

	it('feeds staleness, which stays derived from the buckets that were read', async () => {
		const stale = await makeLink('views-stale');
		const busy = await makeLink('views-busy');
		const currentWeek = utcWeekStart(new Date());

		await prisma.linkViewWeek.createMany({
			data: [
				// Plenty of views, but all of them from before the window
				{
					linkId: stale.id,
					weekStart: addWeeks(currentWeek, -STALE_LINK_WINDOW_WEEKS),
					count: STALE_LINK_VIEW_THRESHOLD * 10
				},
				{ linkId: busy.id, weekStart: currentWeek, count: STALE_LINK_VIEW_THRESHOLD }
			]
		});
		await prisma.link.update({
			where: { id: stale.id },
			data: { viewCount: STALE_LINK_VIEW_THRESHOLD * 10 }
		});

		const buckets = await LinkViewActions.getWeeklyViews([stale.id, busy.id]);
		const analytics = buildLinkAnalytics(
			[
				{ id: stale.id, viewCount: STALE_LINK_VIEW_THRESHOLD * 10 },
				{ id: busy.id, viewCount: STALE_LINK_VIEW_THRESHOLD }
			],
			buckets
		);

		expect(analytics.get(stale.id)?.isStale).toBe(true);
		expect(analytics.get(stale.id)?.recentViews).toBe(0);
		expect(analytics.get(busy.id)?.isStale).toBe(false);
	});
});
