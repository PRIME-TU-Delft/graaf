import prisma from '$lib/server/db/prisma';
import { emptyPrismaPromise } from '$lib/utils';
import { getUser } from '$lib/server/actions/Users';
import { ProgramActions } from '$lib/server/actions/Programs';
import { CourseActions } from '$lib/server/actions/Courses';
import { SandboxActions } from '$lib/server/actions/Sandboxes';
import { whereHasCoursePermission } from '$lib/server/permissions';
import { zod } from 'sveltekit-superforms/adapters';
import { newCourseSchema, changePinSchema, linkingCoursesSchema } from '$lib/zod/courseSchema';
import { newProgramSchema } from '$lib/zod/programSchema';
import { newSandboxSchema } from '$lib/zod/sandboxSchema';
import { superValidate } from 'sveltekit-superforms';

import type { Course } from '@prisma/client';
import type { PageServerLoad } from '../$types.js';

export const load = (async ({ url, locals }) => {
	const user = await getUser({ locals });

	try {
		const programs = await prisma.program.findMany({
			where: {
				courses: {
					some: {
						...whereHasCoursePermission(user, 'CourseAdminEditorORProgramAdminEditor')
					}
				}
			},
			include: {
				courses: {
					orderBy: {
						isArchived: 'asc'
					},
					where: {
						...whereHasCoursePermission(user, 'CourseAdminEditorORProgramAdminEditor')
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

		const pinnedCourses = prisma.course.findMany({
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

		const sandboxes = prisma.sandbox.findMany({
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
			newProgramForm: await superValidate(zod(newProgramSchema)),
			newSandboxForm: await superValidate(zod(newSandboxSchema)),
			newCourseForm: await superValidate(zod(newCourseSchema)),
			linkCoursesForm: await superValidate(zod(linkingCoursesSchema)),
			coursePinnedForm: await superValidate(zod(changePinSchema))
		};
	} catch (e: unknown) {
		return {
			user,
			programs: [],
			courses: emptyPrismaPromise([] as Course[]),
			sandboxes: new Promise<[]>((resolve) => resolve([])),
			pinnedCourses: new Promise<[]>((resolve) => resolve([])),
			error: e instanceof Error ? e.message : `${e}`,
			newProgramForm: await superValidate(zod(newProgramSchema)),
			newSandboxForm: await superValidate(zod(newSandboxSchema)),
			newCourseForm: await superValidate(zod(newCourseSchema)),
			linkCoursesForm: await superValidate(zod(linkingCoursesSchema)),
			coursePinnedForm: await superValidate(zod(changePinSchema))
		};
	}
}) satisfies PageServerLoad;

export const actions = {
	'new-program': async (event) => {
		const form = await superValidate(event, zod(newProgramSchema));
		return ProgramActions.newProgram(await getUser(event), form);
	},

	'new-course': async (event) => {
		const form = await superValidate(event, zod(newCourseSchema));
		return CourseActions.newCourse(await getUser(event), form);
	},

	'new-sandbox': async (event) => {
		const form = await superValidate(event, zod(newSandboxSchema));
		return SandboxActions.newSandbox(await getUser(event), form);
	},

	'link-course': async (event) => {
		const form = await superValidate(event, zod(linkingCoursesSchema));
		return CourseActions.linkCourses(await getUser(event), form);
	},

	'change-course-pin': async (event) => {
		const form = await superValidate(event, zod(changePinSchema));
		return CourseActions.changePin(await getUser(event), form);
	}
};
