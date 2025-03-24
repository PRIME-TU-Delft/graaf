import { GraphActions } from '$lib/server/actions';
import { getUser } from '$lib/server/actions/Users';
import prisma from '$lib/server/db/prisma';
import { CourseActions, whereHasCoursePermission } from '$lib/server/permissions';
import { changeArchive, courseSchema, editSuperUserSchema } from '$lib/zod/courseSchema';
import { graphEditSchema, graphSchemaWithId } from '$lib/zod/graphSchema';
import { redirect, type ServerLoad } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import type { Actions } from './$types';

export const load = (async ({ params, locals }) => {
	try {
		if (!params.code) throw Error('a cousre code is required');
		const courseCode = params.code;

		const user = await getUser({ locals });

		const dbCourse = await prisma.course.findFirst({
			where: {
				code: courseCode,
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
						links: true,
						lectures: true
					}
				}
			}
		});
		if (!dbCourse) throw Error('You do not have permissions to access this course setting page');

		// TODO: Check if we need pagination here
		const allUsers = await prisma.user.findMany();

		return {
			course: dbCourse,
			user,
			allUsers,
			editCourseForm: await superValidate(zod(courseSchema)),
			editSuperUserForm: await superValidate(zod(editSuperUserSchema)),
			changeArchiveForm: await superValidate(zod(changeArchive)),
			editGraphForm: await superValidate(zod(graphEditSchema)),
			deleteGraphForm: await superValidate(zod(graphSchemaWithId))
		};
	} catch (e) {
		// TODO: redirect to course page
		if (e instanceof Error) throw redirect(303, `/graph-editor/?error=${e.message}`);
		throw redirect(303, `/graph-editor`);
	}
}) satisfies ServerLoad;

export const actions: Actions = {
	'edit-graph': async (event) => {
		const form = await superValidate(event, zod(graphEditSchema));
		return GraphActions.editGraph(await getUser(event), form);
	},
	'delete-graph': async (event) => {
		const form = await superValidate(event, zod(graphSchemaWithId));
		return GraphActions.deleteGraphFromCourse(await getUser(event), form);
	},
	'edit-course': async (event) => {
		const form = await superValidate(event, zod(courseSchema));
		return CourseActions.editProgram(await getUser(event), form);
	},
	'edit-super-user': async (event) => {
		const form = await superValidate(event, zod(editSuperUserSchema));
		return CourseActions.editSuperUser(await getUser(event), form);
	},
	'change-archive': async (event) => {
		const form = await superValidate(event, zod(changeArchive));
		return CourseActions.changeArchive(await getUser(event), form);
	}
};
