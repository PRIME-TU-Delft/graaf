import prisma from '$lib/server/db/prisma';
import { json } from '@sveltejs/kit';

import type { RequestHandler } from '@sveltejs/kit';

/*
 * Reorder the domains in a graph
 * This can be a on a server call because it is not critical
 **/

export const PATCH: RequestHandler = async ({ request }) => {
	const needRearrange = (await request.json()) as {
		domainId: number;
		oldOrder: number;
		newOrder: number;
	}[];

	try {
		const domainChanges = needRearrange.map(({ domainId, newOrder }) => {
			return prisma.domain.update({
				where: { id: domainId },
				data: { order: newOrder }
			});
		});

		const newDomains = await prisma.$transaction(domainChanges);

		return json(newDomains);
	} catch (e: unknown) {
		return json({ error: e instanceof Error ? e.message : `${e}` }, { status: 400 });
	}
};
