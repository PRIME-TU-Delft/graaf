import prisma from '$lib/server/db/prisma';
import { error } from '@sveltejs/kit';
import { GraphActions } from '$lib/server/actions';
import { zod } from 'sveltekit-superforms/adapters';
import { superValidate } from 'sveltekit-superforms';
import { getUser } from '$lib/server/actions/Users.js';
import { duplicateGraphSchema, graphSchemaWithId, newGraphSchema } from '$lib/zod/graphSchema.js';
import { whereHasCoursePermission, whereHasSandboxPermission } from '$lib/server/permissions';
import { LinkActions } from '$lib/server/actions/Links';
import { editLinkSchema, newLinkSchema } from '$lib/zod/linkSchema';

import type { Actions } from '@sveltejs/kit';
import type { ServerLoad } from '@sveltejs/kit';

export const load = (async ({ params, locals }) => {
	if (!params.sandboxId) throw Error('Missing sandbox ID');

	const user = await getUser({ locals });
	const sandboxId = parseInt(params.sandboxId);
	if (isNaN(sandboxId)) {
		error(400, { message: 'Sandbox id must be a number' });
	}

	try {
		const dbSandbox = await prisma.sandbox.findFirst({
			where: {
				id: sandboxId,
				...whereHasSandboxPermission(user, 'OwnerOREditor')
			},
			include: {
				graphs: {
					include: {
						links: true,
						lectures: true,
						_count: {
							select: {
								domains: true,
								subjects: true
							}
						}
					}
				},
				links: true,
				owner: true,
				editors: true
			}
		});

		if (!dbSandbox) throw new Error('Sandbox not found, or you do not have access to it');

		const availableCourses = await prisma.course.findMany({
			where: {
				...whereHasCoursePermission(user, 'CourseAdminEditorORProgramAdminEditor')
			},
			include: {
				graphs: { select: { name: true } }
			},
			orderBy: {
				name: 'asc'
			}
		});

		const availableSandboxes = await prisma.sandbox.findMany({
			where: {
				...whereHasSandboxPermission(user, 'OwnerOREditor')
			},
			include: {
				graphs: { select: { name: true } },
				owner: true
			},
			orderBy: {
				name: 'asc'
			}
		});

		return {
			user,
			sandbox: dbSandbox,
			graphs: dbSandbox.graphs,
			availableCourses,
			availableSandboxes,
			newGraphForm: await superValidate(zod(newGraphSchema)),
			editGraphForm: await superValidate(zod(graphSchemaWithId)),
			duplicateGraphForm: await superValidate(zod(duplicateGraphSchema)),
			deleteGraphForm: await superValidate(zod(graphSchemaWithId)),
			newLinkForm: await superValidate(zod(newLinkSchema)),
			editLinkForm: await superValidate(zod(editLinkSchema)),
			deleteLinkForm: await superValidate(zod(editLinkSchema)),
			error: undefined
		};
	} catch (e: unknown) {
		return {
			user,
			sandbox: undefined,
			graphs: [],
			availableCourses: [],
			availableSandboxes: [],
			newGraphForm: await superValidate(zod(newGraphSchema)),
			editGraphForm: await superValidate(zod(graphSchemaWithId)),
			duplicateGraphForm: await superValidate(zod(duplicateGraphSchema)),
			deleteGraphForm: await superValidate(zod(graphSchemaWithId)),
			deleteLinkForm: await superValidate(zod(editLinkSchema)),
			newLinkForm: await superValidate(zod(newLinkSchema)),
			editLinkForm: await superValidate(zod(editLinkSchema)),
			error: e instanceof Error ? e.message : `${e}`
		};
	}
}) satisfies ServerLoad;

export const actions: Actions = {
	'new-graph': async (event) => {
		const formData = await superValidate(event, zod(newGraphSchema));
		return GraphActions.newGraph(await getUser(event), formData);
	},
	'edit-graph': async (event) => {
		const form = await superValidate(event, zod(graphSchemaWithId));
		return GraphActions.editGraph(await getUser(event), form);
	},
	'delete-graph': async (event) => {
		const form = await superValidate(event, zod(graphSchemaWithId));
		return GraphActions.deleteGraph(await getUser(event), form);
	},
	'duplicate-graph': async (event) => {
		const form = await superValidate(event, zod(duplicateGraphSchema));
		return GraphActions.duplicateGraph(await getUser(event), form);
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
