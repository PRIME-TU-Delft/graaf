import prisma from '$lib/server/db/prisma';
import { setError } from '$lib/utils/setError';
import { whereHasCoursePermission, whereHasProgramPermission } from '../permissions';
import {
	newCourseSchema,
	editCourseSchema,
	editSuperUserSchema,
	linkingCoursesSchema,
	changePinSchema,
	changeArchiveSchema,
	deleteCourseSchema
} from '$lib/zod/courseSchema';

import type { User } from '@prisma/client';
import type { Infer, SuperValidated } from 'sveltekit-superforms';
import { redirect } from '@sveltejs/kit';

export class CourseActions {
	/**
	 * PERMISSIONS:
	 * - https://github.com/PRIME-TU-Delft/graaf/wiki/Permissions#c1
	 * - Either PROGRAM_ADMINS, PROGRAM_EDITOR and SUPER_ADMIN can add new courses
	 */

	static async newCourse(user: User, form: SuperValidated<Infer<typeof newCourseSchema>>) {
		if (!form.valid) return setError(form, '', 'Form is not valid');

		try {
			await prisma.program.update({
				where: {
					id: form.data.programId,
					...whereHasProgramPermission(user, 'ProgramAdminEditor') // All super users can create a new course
				},
				data: {
					updatedAt: new Date(),
					courses: {
						create: {
							name: form.data.name,
							code: form.data.code,
							pinnedBy: {
								connect: {
									id: user.id
								}
							}
						}
					}
				}
			});
		} catch {
			return setError(form, 'name', "You don't have permission to create a new course");
		}

		return {
			form
		};
	}

	static async editSuperUser(user: User, form: SuperValidated<Infer<typeof editSuperUserSchema>>) {
		if (!form.valid) return setError(form, '', 'Form is not valid');

		function getData() {
			switch (form.data.role) {
				case 'admin':
					return {
						admins: { connect: { id: form.data.userId } },
						editors: { disconnect: { id: form.data.userId } }
					};
				case 'editor':
					return {
						editors: { connect: { id: form.data.userId } },
						admins: { disconnect: { id: form.data.userId } }
					};
				case 'revoke':
					return {
						admins: { disconnect: { id: form.data.userId } },
						editors: { disconnect: { id: form.data.userId } }
					};
			}
		}

		try {
			await prisma.course.update({
				where: {
					id: form.data.courseId,
					...whereHasCoursePermission(user, 'CourseAdminORProgramAdminEditor')
				},
				data: getData()
			});
		} catch {
			return setError(form, '', "You don't have permission to edit super users");
		}
	}

	static async linkCourses(
		user: User,
		form: SuperValidated<Infer<typeof linkingCoursesSchema>>,
		options: { link: boolean } = { link: true }
	) {
		if (!form.valid) return setError(form, '', 'Form is not valid');

		function getData() {
			const courseIds = form.data.courseIds.map((id) => ({ id }));
			if (options.link) return { courses: { connect: courseIds } };
			else return { courses: { disconnect: courseIds } };
		}

		try {
			await prisma.program.update({
				where: {
					id: form.data.programId,
					...whereHasProgramPermission(user, 'ProgramAdmin') // Only admins can link/unlink courses
				},
				data: getData()
			});
		} catch {
			return setError(form, '', "You don't have permission to link/unlink courses");
		}
	}

	/**
	 * PERMISSIONS:
	 * - Only PROGRAM_ADMINS and SUPER_ADMIN can edit programs
	 */
	static async editCourse(user: User, form: SuperValidated<Infer<typeof editCourseSchema>>) {
		if (!form.valid) return setError(form, '', 'Form is not valid');

		try {
			await prisma.course.update({
				where: {
					id: form.data.courseId,
					...whereHasCoursePermission(user, 'CourseAdminORProgramAdminEditor')
				},
				data: {
					name: form.data.name
				}
			});
		} catch {
			return setError(form, '', "You don't have permission to edit this course");
		}

		return { form };
	}

	static async changePin(user: User, form: SuperValidated<Infer<typeof changePinSchema>>) {
		if (!form.valid) return setError(form, '', 'Form is not valid');

		function getData() {
			if (form.data.pin) return { pinnedBy: { connect: { id: user.id } } };
			else return { pinnedBy: { disconnect: { id: user.id } } };
		}

		try {
			await prisma.course.update({
				where: {
					id: form.data.courseId
				},
				data: getData()
			});
		} catch (e) {
			return {
				error: e instanceof Error ? e.message : `${e}`
			};
		}

		return { form };
	}

	static async changeArchive(user: User, form: SuperValidated<Infer<typeof changeArchiveSchema>>) {
		if (!form.valid) return setError(form, '', 'Form is not valid');

		try {
			await prisma.course.update({
				where: {
					id: form.data.courseId,
					...whereHasCoursePermission(user, 'CourseAdminORProgramAdminEditor')
				},
				data: {
					isArchived: form.data.archive
				}
			});
		} catch {
			return setError(form, '', "You don't have permission to (de)archive this course");
		}
	}

	static async deleteCourse(user: User, form: SuperValidated<Infer<typeof deleteCourseSchema>>) {
		if (!form.valid) return setError(form, '', 'Form is not valid');

		try {
			await prisma.course.delete({
				where: {
					id: form.data.courseId,
					...whereHasCoursePermission(user, 'ProgramAdminEditor')
				}
			})
		} catch (e: unknown) {
			return {
				error: e instanceof Error ? e.message : `${e}`
			};
		}

		throw redirect(303, '/');
	}
}
