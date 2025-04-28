import { getUser } from '$lib/server/actions/Users';
import prisma from '$lib/server/db/prisma';
import { whereHasSandboxPermission } from '$lib/server/permissions';
import { redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { SandboxActions } from '$lib/server/actions/Sandboxes';
import { GraphActions } from '$lib/server/actions/Graphs';
import { graphSchemaWithId } from '$lib/zod/graphSchema';
import { LinkActions } from '$lib/server/actions/Links';

import { 
	newLinkSchema,
	editLinkSchema
} from '$lib/zod/linkSchema';

import { 
	editSandboxSchema,
	deleteSandboxSchema
} from '$lib/zod/sandboxSchema';

// Types
import type { Actions } from './$types';
import type { ServerLoad } from '@sveltejs/kit';

export const load = (async ({ params, locals }) => {
	try {
		if (!params.sandboxId) throw Error('Missing sandbox ID');

		const user = await getUser({ locals });
		const dbSandbox = await prisma.sandbox.findFirst({
			where: {
				id: Number(params.sandboxId),
				...whereHasSandboxPermission(user, 'Owner')
			},
			include: {
				owner: true,
				editors: true,
				graphs: {
					include: {
						lectures: true,
						links: true
					}
				},
				links: true
			}
		});
		if (!dbSandbox) throw Error('You do not have permissions to access this sandbox\'s settings');

		// TODO: Check if we need pagination here
		const allUsers = await prisma.user.findMany();

		return {
			sandbox: dbSandbox,
			user,
			allUsers,
			editSandboxForm: await superValidate(zod(editSandboxSchema)),
			deleteSandboxForm: await superValidate(zod(deleteSandboxSchema)),
			editGraphForm: await superValidate(zod(graphSchemaWithId)),
			newLinkForm: await superValidate(zod(newLinkSchema)),
			editLinkForm: await superValidate(zod(editLinkSchema))

			/* editSuperUserForm: await superValidate(zod(editSuperUserSchema)),
			changeArchiveForm: await superValidate(zod(changeArchiveSchema)),
			deleteGraphForm: await superValidate(zod(graphSchemaWithId)),
			createLinkForm: await superValidate(zod(newLinkSchema)),
			editLinkForm: await superValidate(zod(editLinkSchema)) */
		};
	} catch (e) {
		// TODO: redirect to course page
		if (e instanceof Error) throw redirect(303, `/graph-editor/?error=${e.message}`);
		throw redirect(303, `/graph-editor`);
	}
}) satisfies ServerLoad;

export const actions: Actions = {
	'edit-sandbox': async (event) => {
		const form = await superValidate(event, zod(editSandboxSchema));
		return SandboxActions.editSandbox(await getUser(event), form);
	},
	'delete-sandbox': async (event) => {
		const form = await superValidate(event, zod(deleteSandboxSchema));
		return SandboxActions.deleteSandbox(await getUser(event), form);
	},
	'edit-graph': async (event) => {
		const form = await superValidate(event, zod(graphSchemaWithId));
		return GraphActions.editGraph(await getUser(event), form);
	},
	'new-link': async (event) => {
		const form = await superValidate(event, zod(newLinkSchema));
		return LinkActions.newLink(await getUser(event), form);
	},
	'move-link': async (event) => {
		const form = await superValidate(event, zod(editLinkSchema));
		return LinkActions.moveLink(await getUser(event), form);
	},
	'delete-link': async (event) => {
		const form = await superValidate(event, zod(editLinkSchema));
		return LinkActions.deleteLink(await getUser(event), form);
	}
};
