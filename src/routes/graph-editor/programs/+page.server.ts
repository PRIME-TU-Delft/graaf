import { CourseActions } from '$lib/server/actions/Courses.js';
import { ProgramActions } from '$lib/server/actions/Programs.js';
import { getUser } from '$lib/server/actions/Users.js';
import prisma from '$lib/server/db/prisma.js';
import { emptyPrismaPromise } from '$lib/utils.js';
import { changePinSchema, newCourseSchema } from '$lib/valibot/courseSchema.js';
import { newProgramSchema } from '$lib/valibot/programSchema.js';
import { linkingCoursesSchema } from '$lib/valibot/programSchema.js';
import type { Course } from '@prisma/client';
import { superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from '../$types.js';

export const load = (async ({ url, locals }) => {
	const user = await getUser({ locals });

	try {
		const programs = await prisma.program.findMany({
			include: {
				courses: {
					orderBy: {
						isArchived: 'asc'
					},
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

		// TODO: Check if we need pagination here
		const courses = prisma.course.findMany({
			orderBy: {
				updatedAt: 'desc'
			}
		});

		return {
			pinnedCourses,
			error: url.searchParams.get('error'),
			programs,
			courses,
			user,
			newProgramForm: await superValidate(valibot(newProgramSchema)),
			newCourseForm: await superValidate(valibot(newCourseSchema)),
			linkCoursesForm: await superValidate(valibot(linkingCoursesSchema)),
			coursePinnedForm: await superValidate(valibot(changePinSchema))
		};
	} catch (e: unknown) {
		return {
			pinnedCourses: [],
			error: e instanceof Error ? e.message : `${e}`,
			programs: [],
			user,
			courses: emptyPrismaPromise([] as Course[]),
			newProgramForm: await superValidate(valibot(newProgramSchema)),
			newCourseForm: await superValidate(valibot(newCourseSchema)),
			linkCoursesForm: await superValidate(valibot(linkingCoursesSchema)),
			coursePinnedForm: await superValidate(valibot(changePinSchema))
		};
	}
}) satisfies PageServerLoad;

export const actions = {
	'new-program': async (event) => {
		const formData = await superValidate(event, valibot(newProgramSchema));
		return ProgramActions.newProgram(await getUser(event), formData);
	},

	'new-course': async (event) => {
		const formData = await superValidate(event, valibot(newCourseSchema));
		return CourseActions.newCourse(await getUser(event), formData);
	},

	'link-courses': async (event) => {
		const form = await superValidate(event, valibot(linkingCoursesSchema));
		return CourseActions.linkCourses(await getUser(event), form, { link: true });
	},

	'unlink-courses': async (event) => {
		const form = await superValidate(event, valibot(linkingCoursesSchema));
		return CourseActions.linkCourses(await getUser(event), form, { link: false });
	}
} satisfies Actions;
