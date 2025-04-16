import prisma from '$lib/server/db/prisma';
import { redirect } from '@sveltejs/kit';
import { GraphActions } from '$lib/server/actions';
import { zod } from 'sveltekit-superforms/adapters';
import { superValidate } from 'sveltekit-superforms';
import { getUser } from '$lib/server/actions/Users.js';
import { duplicateGraphSchema, graphSchemaWithId, newGraphSchema } from '$lib/zod/graphSchema.js';
import { whereHasCoursePermission, whereHasSandboxPermission } from '$lib/server/permissions';

import type { Actions } from '@sveltejs/kit';
import type { ServerLoad } from '@sveltejs/kit';

export const load = (async ({ params, locals }) => {
	if (!params.sandboxId) redirect(303, '/');

	const user = await getUser({ locals });

	try {
		const dbCourse = await prisma.course.findFirst({
			where: {
				code: params.code,
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
						_count: {
							select: {
								domains: true,
								subjects: true
							}
						}
					}
				},
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
			user,
			course: dbCourse,
			graphs: dbCourse.graphs,
			availableCourses,
			availableSandboxes,
			newGraphForm: await superValidate(zod(newGraphSchema)),
			editGraphForm: await superValidate(zod(graphSchemaWithId)),
			duplicateGraphForm: await superValidate(zod(duplicateGraphSchema)),
			error: undefined
		};
	} catch (e: unknown) {
		return {
			user,
			course: undefined,
			graphs: [],
			availableCourses: [],
			availableSandboxes: [],
			newGraphForm: await superValidate(zod(newGraphSchema)),
			editGraphForm: await superValidate(zod(graphSchemaWithId)),
			duplicateGraphForm: await superValidate(zod(duplicateGraphSchema)),
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
	}
};
