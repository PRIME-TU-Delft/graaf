import { json } from '@sveltejs/kit';
import prisma from '$lib/server/db/prisma';
import { patchPositionSchema } from '../schemas';

import type { RequestHandler } from '@sveltejs/kit';

/*
 * Reposition the domains in a graph
 * This can be a on a server call because it doesn't affect graph topography
 * and thus will never be critical
 **/

export const PATCH: RequestHandler = async ({ request }) => {

	// Validate the request body
	const body = await request.json();
	const parsed = patchPositionSchema.safeParse(body);
	if (!parsed.success) {
		return json({ error: parsed.error }, { status: 400 });
	}

	// Update the position of the domains
	try {
		const changes = parsed.data.map(({ domainId, x, y }) => {
			return prisma.domain.update({
				where: { id: domainId },
				data: { x, y }
			});
		});

		const newDomains = await prisma.$transaction(changes);
		return json(newDomains);
	} catch (e: unknown) {
		return json({ error: e instanceof Error ? e.message : `${e}` }, { status: 400 });
	}
};
