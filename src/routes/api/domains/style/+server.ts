import { json } from '@sveltejs/kit';
import prisma from '$lib/server/db/prisma';
import { patchStyleSchema } from '../schemas';

import type { DomainStyle, User } from '@prisma/client';
import type { RequestHandler } from '@sveltejs/kit';
import { whereHasCoursePermission } from '$lib/server/actions/Courses';

/*
 * Restyle a domain
 * This can be a on a server call because it doesn't affect graph topography
 * and thus will never be critical
 **/

export const PATCH: RequestHandler = async ({ request, locals }) => {
	// Validate the request body
	const body = await request.json();
	const parsed = patchStyleSchema.safeParse(body);
	if (!parsed.success) return json({ error: parsed.error }, { status: 400 });

	// Authenticate the request
	const session = await locals.auth();
	const user = session?.user as User | undefined;
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	// Update the style of the domain
	try {
		const newDomain = await prisma.domain.update({
			where: {
				id: parsed.data.domainId,
				graph: {
					course: {
						...whereHasCoursePermission(user, 'CourseAdminEditorORProgramAdminEditor')
					}
				}
			},
			data: {
				style: parsed.data.style as DomainStyle
			}
		});

		return json(newDomain);
	} catch (e: unknown) {
		return json({ error: e instanceof Error ? e.message : `${e}` }, { status: 400 });
	}
};
