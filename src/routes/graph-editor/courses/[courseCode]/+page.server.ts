import prisma from '$lib/server/db/prisma';
import { redirect } from '@sveltejs/kit';
import { GraphActions } from '$lib/server/actions';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { getUser } from '$lib/server/actions/Users.js';
import { whereHasCoursePermission, whereHasSandboxPermission } from '$lib/server/permissions';
import { newLinkSchema, editLinkSchema } from '$lib/zod/linkSchema.js';
import { LinkActions } from '$lib/server/actions/Links';

import { newGraphSchema, graphSchemaWithId, duplicateGraphSchema } from '$lib/zod/graphSchema.js';

import type { Actions } from '@sveltejs/kit';
import type { ServerLoad } from '@sveltejs/kit';

export const load = (async ({ params, locals }) => {
	if (!params.courseCode) redirect(303, '/');

	const user = await getUser({ locals });

	try {
		const dbCourse = await prisma.course.findFirst({
			where: {
				code: params.courseCode,
				...whereHasCoursePermission(user, 'CourseAdminEditorORProgramAdminEditor')
			},
			include: {
				programs: {
					include: {
						admins: true,
						editors: true
					}
				},
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
				admins: true,
				editors: true
			}
		});

		if (!dbCourse) throw new Error('Course not found, or you do not have access to it');

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
			course: dbCourse,
			graphs: dbCourse.graphs,
			availableCourses,
			availableSandboxes,
			newGraphForm: await superValidate(zod(newGraphSchema)),
			editGraphForm: await superValidate(zod(graphSchemaWithId)),
			duplicateGraphForm: await superValidate(zod(duplicateGraphSchema)),
			deleteGraphForm: await superValidate(zod(graphSchemaWithId)),
			deleteLinkForm: await superValidate(zod(editLinkSchema)),
			newLinkForm: await superValidate(zod(newLinkSchema)),
			editLinkForm: await superValidate(zod(editLinkSchema)),
			error: undefined
		};
	} catch (e: unknown) {
		return {
			course: undefined,
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
