import { GraphActions } from '$lib/server/actions';
import { getUser } from '$lib/server/actions/Users';
import prisma from '$lib/server/db/prisma';
import { whereHasCoursePermission } from '$lib/server/permissions';
import { CourseActions } from '$lib/server/actions/Courses';
import { LinkActions } from '$lib/server/actions/Links';
import { graphSchemaWithId } from '$lib/zod/graphSchema';
import { newLinkSchema, editLinkSchema } from '$lib/zod/linkSchema';
import { redirect, type ServerLoad } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import {
	changeArchiveSchema,
	newCourseSchema,
	editSuperUserSchema,
	editCourseSchema
} from '$lib/zod/courseSchema';

import type { Actions } from './$types';

export const load = (async ({ params, locals }) => {
	try {
		if (!params.courseCode) throw Error('Missing course code');

		const user = await getUser({ locals });
		const dbCourse = await prisma.course.findFirst({
			where: {
				code: params.courseCode,
				...whereHasCoursePermission(user, 'CourseAdminEditorORProgramAdminEditor')
			},
			include: {
				admins: true,
				editors: true,
				programs: {
					include: {
						admins: true,
						editors: true
					}
				},
				graphs: {
					include: {
						lectures: true,
						links: true
					}
				},
				links: true
			}
		});
		if (!dbCourse) throw Error('You do not have permissions to access this course setting page');

		// TODO: Check if we need pagination here
		const allUsers = await prisma.user.findMany();

		return {
			course: dbCourse,
			user,
			allUsers,
			editCourseForm: await superValidate(zod(newCourseSchema)),
			editSuperUserForm: await superValidate(zod(editSuperUserSchema)),
			changeArchiveForm: await superValidate(zod(changeArchiveSchema)),
			editGraphForm: await superValidate(zod(graphSchemaWithId)),
			deleteGraphForm: await superValidate(zod(graphSchemaWithId)),
			newLinkForm: await superValidate(zod(newLinkSchema)),
			editLinkForm: await superValidate(zod(editLinkSchema))
		};
	} catch (e) {
		// TODO: redirect to course page
		if (e instanceof Error) throw redirect(303, `/graph-editor/?error=${e.message}`);
		throw redirect(303, `/graph-editor`);
	}
}) satisfies ServerLoad;

export const actions: Actions = {
	'edit-graph': async (event) => {
		const form = await superValidate(event, zod(graphSchemaWithId));
		return GraphActions.editGraph(await getUser(event), form);
	},
	'delete-graph': async (event) => {
		const form = await superValidate(event, zod(graphSchemaWithId));
		return GraphActions.deleteGraph(await getUser(event), form);
	},
	'edit-course': async (event) => {
		const form = await superValidate(event, zod(editCourseSchema));
		return CourseActions.editCourse(await getUser(event), form);
	},
	'edit-super-user': async (event) => {
		const form = await superValidate(event, zod(editSuperUserSchema));
		return CourseActions.editSuperUser(await getUser(event), form);
	},
	'change-archive': async (event) => {
		const form = await superValidate(event, zod(changeArchiveSchema));
		return CourseActions.changeArchive(await getUser(event), form);
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
