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

/** Server actions for creating, editing, archiving, and deleting courses, linking/unlinking
 * them to programs, and managing their admin/editor super users. Called from form actions in
 * `+page.server.ts` route files, one static method per operation. */
export class CourseActions {
	/**
	 * Create a new course under a program and pin it for the creating user.
	 *
	 * PERMISSIONS:
	 * - https://github.com/PRIME-TU-Delft/graaf/wiki/Permissions#c1
	 * - Either PROGRAM_ADMINS, PROGRAM_EDITOR and SUPER_ADMIN can add new courses
	 *
	 * @param user - The user performing the action
	 * @param form - Validated form data with the course name, code, and destination programId
	 * @returns `{ form }` on success. On invalid input or missing permission, returns the form
	 * with a `name`-field error via setError instead of throwing.
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
							uriCode: encodeURIComponent(form.data.code),
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

	/**
	 * Set, change, or revoke a course-level admin/editor role for a user.
	 *
	 * @param user - The user performing the action, must have course or program admin/editor rights
	 * @param form - Validated form data with courseId, the target userId, and the new role
	 * ('admin' | 'editor' | 'revoke')
	 * @returns Nothing on success. On invalid input or missing permission, returns the form with
	 * an error via setError instead of throwing.
	 */
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

	/**
	 * Link or unlink one or more courses to/from a program.
	 *
	 * @param user - The user performing the action, must have program admin rights
	 * @param form - Validated form data with the target programId and the list of courseIds
	 * @param options - `{ link: true }` (default) connects the courses to the program,
	 * `{ link: false }` disconnects them
	 * @returns Nothing on success. On invalid input or missing permission, returns the form with
	 * an error via setError instead of throwing.
	 */
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
	 * Rename a course.
	 *
	 * PERMISSIONS:
	 * - Only PROGRAM_ADMINS and SUPER_ADMIN can edit programs
	 *
	 * @param user - The user performing the action
	 * @param form - Validated form data with the courseId and the new name
	 * @returns `{ form }` on success. On invalid input or missing permission, returns the form
	 * with an error via setError instead of throwing.
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

	/**
	 * Pin or unpin a course for the current user. Any authenticated user may pin any course
	 * for themselves; there is no course-permission check.
	 *
	 * @param user - The user performing the action, courses are pinned for this user specifically
	 * @param form - Validated form data with the courseId and whether to pin or unpin
	 * @returns `{ form }` on success, or `{ error }` if the update fails
	 */
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

	/**
	 * Archive or restore a course.
	 *
	 * @param user - The user performing the action, must have course or program admin/editor rights
	 * @param form - Validated form data with the courseId and the desired archive state
	 * @returns Nothing on success. On invalid input or missing permission, returns the form with
	 * an error via setError instead of throwing.
	 */
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

	/**
	 * Permanently delete a course, then redirect the caller to the home page.
	 *
	 * @param user - The user performing the action, must have program admin/editor rights
	 * @param form - Validated form data with the courseId to delete
	 * @returns Never returns normally: on success it throws a redirect to `/`. On invalid input
	 * it returns the form with an error via setError; on a failed delete it returns `{ error }`.
	 */
	static async deleteCourse(user: User, form: SuperValidated<Infer<typeof deleteCourseSchema>>) {
		if (!form.valid) return setError(form, '', 'Form is not valid');

		try {
			await prisma.course.delete({
				where: {
					id: form.data.courseId,
					...whereHasCoursePermission(user, 'ProgramAdminEditor')
				}
			});
		} catch (e: unknown) {
			return {
				error: e instanceof Error ? e.message : `${e}`
			};
		}

		throw redirect(303, '/');
	}
}
