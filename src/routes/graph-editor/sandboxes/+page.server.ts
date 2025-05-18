import prisma from '$lib/server/db/prisma';
import { getUser } from '$lib/server/actions/Users';

import type { ServerLoad } from '@sveltejs/kit';

export const load = (async ({ locals }) => {
	const user = await getUser({ locals });
	const sandboxes = await prisma.sandbox.findMany({
		where: {
			OR: [
				{ ownerId: user.id },
				{
					editors: {
						some: {
							id: user.id
						}
					}
				}
			]
		},
		include: {
			owner: true
		}
	});

	return {
		sandboxes
	};
}) satisfies ServerLoad;
