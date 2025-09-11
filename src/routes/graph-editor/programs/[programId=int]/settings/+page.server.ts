import { ProgramActions } from '$lib/server/actions';
import { whereHasProgramPermission } from '$lib/server/permissions';
import { getUser } from '$lib/server/actions/Users';
import prisma from '$lib/server/db/prisma';
import { newCourseSchema } from '$lib/valibot/courseSchema';
import {
	deleteProgramSchema,
	editProgramSchema,
	editSuperUserSchema,
	linkingCoursesSchema
} from '$lib/valibot/programSchema';
import { redirect, type Actions, type ServerLoad } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { CourseActions } from '$lib/server/actions/Courses';

export const load = (async ({ params, locals }) => {
	try {
		if (!params.programId) throw Error('a program id is required');
		const programId = parseInt(params.programId, 10);

		const user = await getUser({ locals });

		const dbProgram = await prisma.program.findFirst({
			where: {
				id: programId,
				...whereHasProgramPermission(user, 'ProgramAdminEditor') // is either a program editor, admin, or super user
			},
			include: {
				courses: true,
				admins: true,
				editors: true
			}
		});

		// TODO: Check if we need pagination here
		const allUsers = await prisma.user.findMany();
		const allCourses = prisma.course.findMany({
			orderBy: {
				updatedAt: 'desc'
			}
		});

		if (!dbProgram) throw Error('You do not have permissions to access this program setting page');

		return {
			program: dbProgram,
			user,
			allUsers,
			allCourses,
			editProgramForm: await superValidate(valibot(editProgramSchema)),
			deleteProgramForm: await superValidate(valibot(deleteProgramSchema)),
			editSuperUserForm: await superValidate(valibot(editSuperUserSchema)),
			linkCoursesForm: await superValidate(valibot(linkingCoursesSchema)),
			createNewCourseForm: await superValidate(valibot(newCourseSchema))
		};
	} catch (e) {
		if (e instanceof Error) throw redirect(303, `/graph-editor/?error=${e.message}`);
		throw redirect(303, '/graph-editor');
	}
}) satisfies ServerLoad;

export const actions: Actions = {
	'edit-program': async (event) => {
		const form = await superValidate(event, valibot(editProgramSchema));
		return ProgramActions.editProgram(await getUser(event), form);
	},
	'delete-program': async (event) => {
		const form = await superValidate(event, valibot(deleteProgramSchema));
		return ProgramActions.deleteProgram(await getUser(event), form);
	},
	'edit-super-user': async (event) => {
		const form = await superValidate(event, valibot(editSuperUserSchema));
		return ProgramActions.editSuperUser(await getUser(event), form);
	},
	'link-courses': async (event) => {
		const form = await superValidate(event, valibot(linkingCoursesSchema));
		return CourseActions.linkCourses(await getUser(event), form, { link: true });
	},
	'unlink-courses': async (event) => {
		const form = await superValidate(event, valibot(linkingCoursesSchema));
		return CourseActions.linkCourses(await getUser(event), form, { link: false });
	},
	'new-course': async (event) => {
		const form = await superValidate(event, valibot(newCourseSchema));
		return CourseActions.newCourse(await getUser(event), form);
	}
};
