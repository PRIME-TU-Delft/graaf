import { GraphActions } from '$lib/server/actions/Graphs';
import { LinkActions } from '$lib/server/actions/Links';
import { SandboxActions } from '$lib/server/actions/Sandboxes';
import { getUser } from '$lib/server/actions/Users';
import prisma from '$lib/server/db/prisma';
import { whereHasSandboxPermission } from '$lib/server/permissions';
import { graphSchemaWithId } from '$lib/valibot/graphSchema';
import { editLinkSchema, newLinkSchema } from '$lib/valibot/linkSchema';
import {
	deleteSandboxSchema,
	editSandboxSchema,
	editSuperUserSchema
} from '$lib/valibot/sandboxSchema';

import { redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';

// Types
import type { ServerLoad } from '@sveltejs/kit';
import type { Actions } from './$types';

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
		if (!dbSandbox) throw Error("You do not have permissions to access this sandbox's settings");

		// TODO: Check if we need pagination here
		const allUsers = await prisma.user.findMany();

		return {
			sandbox: dbSandbox,
			user,
			allUsers,
			editSandboxForm: await superValidate(valibot(editSandboxSchema)),
			editSuperUserForm: await superValidate(valibot(editSuperUserSchema)),
			deleteSandboxForm: await superValidate(valibot(deleteSandboxSchema)),
			editGraphForm: await superValidate(valibot(graphSchemaWithId)),
			deleteGraphForm: await superValidate(valibot(graphSchemaWithId)),
			newLinkForm: await superValidate(valibot(newLinkSchema)),
			editLinkForm: await superValidate(valibot(editLinkSchema)),
			deleteLinkForm: await superValidate(valibot(editLinkSchema))
		};
	} catch (e) {
		// TODO: redirect to course page
		if (e instanceof Error) throw redirect(303, `/graph-editor/?error=${e.message}`);
		throw redirect(303, `/graph-editor`);
	}
}) satisfies ServerLoad;

export const actions: Actions = {
	'edit-sandbox': async (event) => {
		const form = await superValidate(event, valibot(editSandboxSchema));
		return SandboxActions.editSandbox(await getUser(event), form);
	},
	'edit-super-user': async (event) => {
		const form = await superValidate(event, valibot(editSuperUserSchema));
		return SandboxActions.editSuperUser(await getUser(event), form);
	},
	'delete-sandbox': async (event) => {
		const form = await superValidate(event, valibot(deleteSandboxSchema));
		return SandboxActions.deleteSandbox(await getUser(event), form);
	},
	'edit-graph': async (event) => {
		const form = await superValidate(event, valibot(graphSchemaWithId));
		return GraphActions.editGraph(await getUser(event), form);
	},
	'delete-graph': async (event) => {
		const form = await superValidate(event, valibot(graphSchemaWithId));
		return GraphActions.deleteGraph(await getUser(event), form);
	},
	'new-link': async (event) => {
		const form = await superValidate(event, valibot(newLinkSchema));
		return LinkActions.newLink(await getUser(event), form);
	},
	'move-link': async (event) => {
		const form = await superValidate(event, valibot(editLinkSchema));
		return LinkActions.moveLink(await getUser(event), form);
	},
	'delete-link': async (event) => {
		const form = await superValidate(event, valibot(editLinkSchema));
		return LinkActions.deleteLink(await getUser(event), form);
	}
};
