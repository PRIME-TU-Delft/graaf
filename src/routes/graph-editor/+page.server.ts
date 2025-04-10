import prisma from '$lib/server/db/prisma.js';
import { emptyPrismaPromise } from '$lib/utils.js';
import { getUser } from '$lib/server/actions/Users.js';
import { ProgramActions } from '$lib/server/actions/Programs.js';
import { CourseActions } from '$lib/server/actions/Courses.js';

import { zod } from 'sveltekit-superforms/adapters';
import { newCourseSchema, changePinSchema } from '$lib/zod/courseSchema.js';
import { newProgramSchema } from '$lib/zod/programSchema.js';
import { linkingCoursesSchema } from '$lib/zod/superUserProgramSchema.js';
import { fail, superValidate } from 'sveltekit-superforms';

import type { Course, User } from '@prisma/client';
import type { PageServerLoad } from '../$types.js';

export const load = (async ({ url, locals }) => {
	const user = await getUser({ locals });

	try {
		const search = url.searchParams.get('c')?.toLocaleLowerCase();
		const programs = await prisma.program.findMany({
			include: {
				courses: {
					orderBy: {
						isArchived: 'asc'
					},
					where: search
						? { name: { contains: search, mode: 'insensitive' } }
						: { NOT: { name: '' } },
					include: {
						pinnedBy: {
							select: {
								id: true
							}
						}
					}
				},
				editors: true,
				admins: true
			},
			orderBy: {
				updatedAt: 'desc'
			}
		});

		const pinnedCourses = await prisma.course.findMany({
			where: {
				pinnedBy: {
					some: {
						id: user.id
					}
				}
			},
			include: {
				pinnedBy: {
					select: {
						id: true
					}
				}
			}
		});

		const sandboxes = await prisma.sandbox.findMany({
			where: {
				OR: [
					{ ownerId: user.id },
					{
						editors: {
							some: {
								id: user.id
							}
						}
					}
				]
			},
			include: {
				owner: true
			}
		});

		// TODO: Check if we need pagination here
		const courses = prisma.course.findMany({
			orderBy: {
				updatedAt: 'desc'
			}
		});

		return {
			user,
			programs,
			courses,
			sandboxes,
			pinnedCourses,
			error: url.searchParams.get('error'),
			programForm: await superValidate(zod(newProgramSchema)),
			createNewCourseForm: await superValidate(zod(newCourseSchema)),
			linkCoursesForm: await superValidate(zod(linkingCoursesSchema))
		};
	} catch (e: unknown) {
		return {
			user,
			programs: [],
			courses: emptyPrismaPromise([] as Course[]),
			sandboxes: [],
			pinnedCourses: [],
			error: e instanceof Error ? e.message : `${e}`,
			programForm: await superValidate(zod(newProgramSchema)),
			createNewCourseForm: await superValidate(zod(newCourseSchema)),
			linkCoursesForm: await superValidate(zod(linkingCoursesSchema))
		};
	}
}) satisfies PageServerLoad;

export const actions = {
	'new-program': async (event) => {
		const formData = await superValidate(event, zod(newProgramSchema));

		const session = await event.locals.auth();
		const user = session?.user as User | undefined;
		if (!user) return fail(401, { error: 'Unauthorized' });

		return ProgramActions.newProgram(user, formData);
	},

	'new-course': async (event) => {
		const formData = await superValidate(event, zod(newCourseSchema));

		const session = await event.locals.auth();
		const user = session?.user as User | undefined;
		if (!user) return fail(401, { error: 'Unauthorized' });

		return CourseActions.newCourse(user, formData);
	},

	'add-course-to-program': async (event) => {
		const formData = await event.request.formData();

		const session = await event.locals.auth();
		const user = session?.user as User | undefined;
		if (!user) return fail(401, { error: 'Unauthorized' });

		return CourseActions.addCourseToProgram(user, formData);
	},

	'change-course-pin': async (event) => {
		const formData = await superValidate(event, zod(changePinSchema));

		const session = await event.locals.auth();
		const user = session?.user as User | undefined;
		if (!user) return fail(401, { error: 'Unauthorized' });

		return CourseActions.changePin(user, formData);
	}
};
