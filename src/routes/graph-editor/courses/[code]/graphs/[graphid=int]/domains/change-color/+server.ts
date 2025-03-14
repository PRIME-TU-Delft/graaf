import prisma from '$lib/server/db/prisma';
import { json } from '@sveltejs/kit';

import type { DomainStyle } from '@prisma/client';
import type { RequestHandler } from '@sveltejs/kit';

/*
 * Add a color to a domain
 * This can be a on a server call because it is not critical
 **/

export const PATCH: RequestHandler = async ({ request }) => {
	const { domainId, color } = (await request.json()) as {
		domainId: number;
		color: DomainStyle | null;
	};

	try {
		const domain = await prisma.domain.update({
			where: { id: domainId },
			data: { style: color }
		});

		return json(domain);
	} catch (e: unknown) {
		return json({ error: e instanceof Error ? e.message : `${e}` }, { status: 400 });
	}
};
