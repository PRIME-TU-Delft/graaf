import prisma from '$lib/server/db/prisma';
import { json } from '@sveltejs/kit';

import { getUserResponse } from '$lib/server/actions/Users';
import { whereHasGraphCoursePermission } from '$lib/server/permissions';
import { lectureSchema } from '$lib/valibot/lectureSchema';
import type { RequestHandler } from '@sveltejs/kit';
import { safeParse } from 'valibot';

/*
 * Reorder the subjects in a graph
 * This can be a on a server call because it doesn't affect graph topography
 * and thus will never be critical
 **/
export const PATCH: RequestHandler = async ({ request, locals }) => {
	// Validate the request body
	const body = await request.json();
	const parsed = safeParse(lectureSchema, body);
	if (!parsed.success) return json({ error: parsed.issues }, { status: 400 });

	// Authenticate the request
	const user = await getUserResponse({ locals });
	if ('error' in user) return json(user, { status: 401 });

	// Update the order of the subjects
	try {
		const newLecture = await prisma.lecture.update({
			where: {
				id: parsed.output.lectureId,
				graph: {
					id: parsed.output.graphId,
					...whereHasGraphCoursePermission(user, 'CourseAdminORProgramAdminEditor')
				}
			},
			data: {
				subjects: {
					set: parsed.output.subjectIds.map((id) => ({ id }))
				}
			}
		});

		return json(newLecture);
	} catch (e: unknown) {
		return json({ error: e instanceof Error ? e.message : `${e}` }, { status: 400 });
	}
};
