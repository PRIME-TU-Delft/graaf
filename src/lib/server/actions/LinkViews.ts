import prisma from '$lib/server/db/prisma';
import { whereHasCoursePermission } from '$lib/server/permissions';
import { analyticsWindowStart } from '$lib/utils/linkAnalytics';

import type { User } from '@prisma/client';
import type { LinkViewWeek } from '$lib/utils/linkAnalytics';

/** Aggregate view counting for shareable graph links. Records a view when the public graph
 * viewer serves a graph through a link, and reads back the weekly buckets the graph-editor's
 * link list shows. Deliberately stores nothing about who viewed: no ip, no session, no user. */
export class LinkViewActions {
	/**
	 * Record one view of a link: bump the current week's bucket and the link's running total.
	 *
	 * Both writes are one statement each so concurrent views cannot lose a count, and the week
	 * boundary comes from postgres `date_trunc('week', ...)` so every bucket lands on the same
	 * UTC Monday regardless of where the app runs.
	 *
	 * Never throws. Callers on the render path must not await this, so a failure has nowhere to
	 * surface but the log.
	 *
	 * @param linkId - The link the visitor came in through
	 */
	static async recordView(linkId: number): Promise<void> {
		try {
			await prisma.$transaction([
				prisma.$executeRaw`
					INSERT INTO "LinkViewWeek" ("linkId", "weekStart", "count")
					VALUES (${linkId}, date_trunc('week', now() AT TIME ZONE 'utc')::date, 1)
					ON CONFLICT ("linkId", "weekStart")
					DO UPDATE SET "count" = "LinkViewWeek"."count" + 1
				`,
				prisma.link.update({
					where: { id: linkId },
					data: { viewCount: { increment: 1 } }
				})
			]);
		} catch (e: unknown) {
			// A view that goes uncounted is not worth failing a page render over
			console.error(`Failed to record a view for link ${linkId}:`, e);
		}
	}

	/**
	 * Read the weekly view buckets of a set of links, over the trailing staleness window.
	 *
	 * Seeing a link's analytics needs no more access than seeing the link, so this only returns
	 * buckets for links whose course the given user has at least course-editor access to
	 * (`CourseAdminEditorORProgramAdminEditor`). A link with no course, such as a sandbox link,
	 * never matches.
	 *
	 * @param user - The user asking to read the buckets
	 * @param linkIds - Links to read buckets for
	 * @param now - The moment the trailing window ends, defaults to the current time
	 * @returns Buckets for the links the user may see, oldest week first. Weeks without views
	 *   have no bucket.
	 */
	static async getWeeklyViews(
		user: User,
		linkIds: number[],
		now: Date = new Date()
	): Promise<LinkViewWeek[]> {
		if (linkIds.length === 0) return [];

		return prisma.linkViewWeek.findMany({
			where: {
				linkId: { in: linkIds },
				weekStart: { gte: analyticsWindowStart(now) },
				link: { course: whereHasCoursePermission(user, 'CourseAdminEditorORProgramAdminEditor') }
			},
			select: { linkId: true, weekStart: true, count: true },
			orderBy: { weekStart: 'asc' }
		});
	}
}
