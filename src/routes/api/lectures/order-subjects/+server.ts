import prisma from '$lib/server/db/prisma';
import { json } from '@sveltejs/kit';

import { getUserResponse } from '$lib/server/actions/Users';
import { whereHasGraphCoursePermission } from '$lib/server/permissions';
import { orderSubjectsSchema } from '$lib/zod/lectureSchema';
import type { RequestHandler } from '@sveltejs/kit';

/*
 * Reorder the subjects in a graph
 * This can be a on a server call because it doesn't affect graph topography
 * and thus will never be critical
 **/
export const PATCH: RequestHandler = async ({ request, locals }) => {
	// Validate the request body
	const body = await request.json();
	const parsed = orderSubjectsSchema.safeParse(body);
	if (!parsed.success) return json({ error: parsed.error }, { status: 400 });

	// Authenticate the request
	const user = await getUserResponse({ locals });
	if ('error' in user) return json(user, { status: 401 });

	// Update the order of the subjects
	try {
		const newLecture = await prisma.lecture.update({
			where: {
				id: parsed.data.lectureId,
				graph: {
					id: parsed.data.graphId,
					...whereHasGraphCoursePermission(user, 'CourseAdminORProgramAdminEditor')
				}
			},
			data: {
				subjects: {
					set: parsed.data.subjectIds.map((id) => ({ id }))
				}
			}
		});

		// Persist the display order using raw SQL — Prisma client may not yet include
		// the subjectOrder column if generate hasn't run since the schema migration.
		const orderJson = JSON.stringify(parsed.data.subjectIds);
		try {
			await prisma.$executeRaw`UPDATE "Lecture" SET "subjectOrder" = ${orderJson} WHERE id = ${parsed.data.lectureId}`;
		} catch {
			// Non-fatal: subjects are still reordered, order just won't persist across reloads
		}

		return json(newLecture);
	} catch (e: unknown) {
		return json({ error: e instanceof Error ? e.message : `${e}` }, { status: 400 });
	}
};
