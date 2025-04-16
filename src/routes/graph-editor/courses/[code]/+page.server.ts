import { GraphActions } from '$lib/server/actions/Graphs.js';
import { getUser } from '$lib/server/actions/Users.js';
import prisma from '$lib/server/db/prisma';
import { whereHasCoursePermission } from '$lib/server/permissions.js';
import {
	createNewLinkSchema,
	duplicateGraphSchema,
	editLinkSchema,
	graphSchema,
	graphSchemaWithId
} from '$lib/zod/graphSchema.js';
import type { Course, Prisma } from '@prisma/client';
import { redirect, type ServerLoad } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const load = (async ({ params, locals }) => {
	if (!params.code) redirect(303, '/');

	const user = await getUser({ locals });

	try {
		const dbCourse = await prisma.course.findFirst({
			where: {
				code: params.code
			},
			include: {
				graphs: {
					include: {
						lectures: true,
						links: true,
						_count: {
							select: {
								domains: true,
								subjects: true
							}
						}
					}
				},
				admins: true,
				editors: true,
				programs: {
					include: {
						admins: true,
						editors: true
					}
				},
				links: true
			}
		});

		if (!dbCourse) throw new Error('Course not found, or you do not have access to it');

		// Get all courses that the user has access to
		const coursesAccessible = prisma.course.findMany({
			where: {
				NOT: {
					code: dbCourse.code
				},
				...whereHasCoursePermission(user, 'CourseAdminEditorORProgramAdminEditor')
			},
			include: {
				graphs: { select: { name: true } }
			},
			orderBy: {
				name: 'asc'
			}
		});

		// Happy path
		return {
			error: undefined,
			graphSchema: await superValidate(zod(graphSchema)),
			duplicateGraphForm: await superValidate(zod(duplicateGraphSchema)),
			editGraphForm: await superValidate(zod(graphSchemaWithId)),
			deleteGraphForm: await superValidate(zod(graphSchemaWithId)),
			deleteLinkForm: await superValidate(zod(editLinkSchema)),
			createLinkForm: await superValidate(zod(createNewLinkSchema)),
			editLinkForm: await superValidate(zod(editLinkSchema)),
			coursesAccessible,
			course: dbCourse,
			graphs: dbCourse.graphs,
			user
		};
	} catch (e: unknown) {
		return {
			error: e instanceof Error ? e.message : `${e}`,
			graphSchema: await superValidate(zod(graphSchema)),
			duplicateGraphForm: await superValidate(zod(duplicateGraphSchema)),
			coursesAccessible: new Promise(() => []) as Prisma.PrismaPromise<Course[]>,
			editGraphForm: await superValidate(zod(graphSchemaWithId)),
			deleteGraphForm: await superValidate(zod(graphSchemaWithId)),
			deleteLinkForm: await superValidate(zod(editLinkSchema)),
			createLinkForm: await superValidate(zod(createNewLinkSchema)),
			editLinkForm: await superValidate(zod(editLinkSchema)),
			course: undefined,
			graphs: [],
			user
		};
	}
}) satisfies ServerLoad;

export const actions = {
	'add-graph-to-course': async (event) => {
		const form = await superValidate(event, zod(graphSchema));

		return GraphActions.addGraphToCourse(await getUser(event), form);
	},
	'edit-graph': async (event) => {
		const form = await superValidate(event, zod(graphSchemaWithId));
		return GraphActions.editGraph(await getUser(event), form);
	},
	'delete-graph': async (event) => {
		const form = await superValidate(event, zod(graphSchemaWithId));
		return GraphActions.deleteGraphFromCourse(await getUser(event), form);
	},
	'duplicate-graph': async (event) => {
		const form = await superValidate(event, zod(duplicateGraphSchema));
		return GraphActions.duplicateGraph(await getUser(event), form, event.params.code);
	},
	'add-link': async (event) => {
		const form = await superValidate(event, zod(createNewLinkSchema));
		return GraphActions.addLink(await getUser(event), form);
	},
	'move-link': async (event) => {
		const form = await superValidate(event, zod(editLinkSchema));
		return GraphActions.moveLink(await getUser(event), form);
	},
	'delete-link': async (event) => {
		const form = await superValidate(event, zod(editLinkSchema));
		return GraphActions.deleteLinkFromGraph(await getUser(event), form);
	}
};
