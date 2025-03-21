import { whereHasCoursePermission } from '$lib/server/permissions';
import { getUser } from '$lib/server/actions/Users';
import prisma from '$lib/server/db/prisma';
import { redirect, type ServerLoad } from '@sveltejs/kit';

export const load = (async ({ params, locals }) => {
	try {
		if (!params.code) throw Error('a program id is required');
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
			allUsers
		};
	} catch (e) {
		// TODO: redirect to course page
		if (e instanceof Error) throw redirect(303, `/graph-editor/?error=${e.message}`);
		throw redirect(303, `/graph-editor`);
	}
}) satisfies ServerLoad;
