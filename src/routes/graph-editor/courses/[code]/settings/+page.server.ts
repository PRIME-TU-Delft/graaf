import { getUser } from '$lib/server/actions/Users';
import prisma from '$lib/server/db/prisma';
import { whereHasCoursePermission } from '$lib/server/permissions';
import { CourseActions } from '$lib/server/actions/Courses';
import { changeArchiveSchema, newCourseSchema, editSuperUserSchema, editCourseSchema } from '$lib/zod/courseSchema';
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
				}
			}
		});

		// TODO: Check if we need pagination here
		const allUsers = await prisma.user.findMany();

		if (!dbCourse) throw Error('You do not have permissions to access this course setting page');

		return {
			course: dbCourse,
			user,
			allUsers,
			editCourseForm: await superValidate(zod(newCourseSchema)),
			editSuperUserForm: await superValidate(zod(editSuperUserSchema)),
			changeArchiveForm: await superValidate(zod(changeArchiveSchema))
		};
	} catch (e) {
		// TODO: redirect to course page
		if (e instanceof Error) throw redirect(303, `/graph-editor/?error=${e.message}`);
		throw redirect(303, `/graph-editor`);
	}
}) satisfies ServerLoad;

export const actions: Actions = {
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
	}
};
