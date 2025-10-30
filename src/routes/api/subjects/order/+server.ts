import prisma from '$lib/server/db/prisma';
import { json } from '@sveltejs/kit';
import { patchOrderSchema } from '../schemas';

import { whereHasCoursePermission } from '$lib/server/permissions';
import type { User } from '@prisma/client';
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
	const parsed = safeParse(patchOrderSchema, body);
	if (!parsed.success) return json({ error: parsed.issues }, { status: 400 });

	// Authenticate the request
	const session = await locals.auth();
	const user = session?.user as User | undefined;
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	// Update the order of the subjects
	try {
		const changes = parsed.output.map(({ subjectId, newOrder }) => {
			return prisma.subject.update({
				where: {
					id: subjectId,
					graph: {
						course: {
							...whereHasCoursePermission(user, 'CourseAdminEditorORProgramAdminEditor')
						}
					}
				},
				data: { order: newOrder }
			});
		});

		const newSubjects = await prisma.$transaction(changes);
		return json(newSubjects);
	} catch (e: unknown) {
		return json({ error: e instanceof Error ? e.message : `${e}` }, { status: 400 });
	}
};
