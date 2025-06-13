import prisma from '$lib/server/db/prisma';
import { getUser } from '$lib/server/actions/Users';
import { zod } from 'sveltekit-superforms/adapters';
import { newSandboxSchema } from '$lib/zod/sandboxSchema';
import { superValidate } from 'sveltekit-superforms';
import { SandboxActions } from '$lib/server/actions/Sandboxes';

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
		sandboxes,
		newSandboxForm: await superValidate(zod(newSandboxSchema))
	};
}) satisfies ServerLoad;

export const actions = {
	'new-sandbox': async (event) => {
		const form = await superValidate(event, zod(newSandboxSchema));
		return SandboxActions.newSandbox(await getUser(event), form);
	}
};