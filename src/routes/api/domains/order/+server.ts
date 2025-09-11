import { json } from '@sveltejs/kit';
import prisma from '$lib/server/db/prisma';
import { patchOrderSchema } from '../schemas';

import type { RequestHandler } from '@sveltejs/kit';
import { whereHasCoursePermission } from '$lib/server/permissions';
import type { User } from '@prisma/client';
import { safeParse } from 'valibot';

/*
 * Reorder the domains in a graph
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

	// Update the order of the domains
	try {
		const changes = parsed.output.map(({ domainId, newOrder }) => {
			return prisma.domain.update({
				where: {
					id: domainId,
					graph: {
						course: {
							...whereHasCoursePermission(user, 'CourseAdminEditorORProgramAdminEditor')
						}
					}
				},
				data: {
					order: newOrder
				}
			});
		});

		const newDomains = await prisma.$transaction(changes);
		return json(newDomains);
	} catch (e: unknown) {
		return json({ error: e instanceof Error ? e.message : `${e}` }, { status: 400 });
	}
};
