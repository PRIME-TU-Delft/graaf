import prisma from '$lib/server/db/prisma';
import { deleteLectureSchema, lectureSchema } from '$lib/zod/lectureSchema';
import type { User } from '@prisma/client';
import { setError, type Infer, type SuperValidated } from 'sveltekit-superforms';
import { whereHasGraphCoursePermission } from '../permissions';
import { withPermissionCheck } from './permissionError';

/** Server actions for creating, renaming, and deleting lectures within a graph, and for
 * linking subjects to them. Called from form actions in `+page.server.ts` route files, one
 * static method per operation. */
export class LectureActions {
	/**
	 * Create a new lecture in a graph, appended to the end of the existing lecture order, and
	 * link it to the given subjects.
	 *
	 * @param user - The user performing the action, must have course or program admin/editor rights
	 * @param form - Validated form data with the graphId, lecture name, and subjectIds to link
	 * @returns Nothing on success. On invalid input or missing permission, returns the form with
	 * a `name`-field error via setError instead of throwing.
	 */
	static async addLectureToGraph(user: User, form: SuperValidated<Infer<typeof lectureSchema>>) {
		if (!form.valid) return setError(form, 'name', 'Invalid lecture');

		return await withPermissionCheck(
			async () => {
				const lectureCount = await prisma.lecture.count({
					where: {
						graphId: form.data.graphId
					}
				});

				return prisma.graph.update({
					where: {
						id: form.data.graphId,
						...whereHasGraphCoursePermission(user, 'CourseAdminEditorORProgramAdminEditor')
					},
					data: {
						lectures: {
							create: {
								name: form.data.name,
								order: lectureCount,
								subjects: {
									connect: form.data.subjectIds.map((id) => ({ id }))
								}
							}
						}
					}
				});
			},
			form,
			'name',
			{ entity: 'Graph', message: "You don't have permission to edit this lecture" }
		);
	}

	/**
	 * Rename a lecture.
	 *
	 * @param user - The user performing the action, must have course or program admin/editor rights
	 * @param form - Validated form data with the graphId, lectureId, and the new name
	 * @returns Nothing on success. On invalid input or missing permission, returns the form with
	 * a `name`-field error via setError instead of throwing.
	 */
	static async changeLectureName(user: User, form: SuperValidated<Infer<typeof lectureSchema>>) {
		if (!form.valid) return setError(form, 'name', 'Invalid lecture');

		return await withPermissionCheck(
			() =>
				prisma.lecture.update({
					where: {
						id: form.data.lectureId,
						graph: {
							id: form.data.graphId,
							...whereHasGraphCoursePermission(user, 'CourseAdminORProgramAdminEditor')
						}
					},
					data: {
						name: form.data.name
					}
				}),
			form,
			'name',
			{ entity: 'Lecture', message: "You don't have permission to edit this lecture" }
		);
	}

	/**
	 * Replace a lecture's linked subjects with the given set. Unlike addLectureToGraph, this
	 * sets the full list rather than adding to it, so subjects omitted from subjectIds are
	 * unlinked.
	 *
	 * @param user - The user performing the action, must have course or program admin/editor rights
	 * @param form - Validated form data with the graphId, lectureId, and the full subjectIds list
	 * @returns Nothing on success. On invalid input or missing permission, returns the form with
	 * a form-level error via setError instead of throwing.
	 */
	static async linkSubjectsToLecture(
		user: User,
		form: SuperValidated<Infer<typeof lectureSchema>>
	) {
		if (!form.valid) return setError(form, '', 'Invalid lecture');

		return await withPermissionCheck(
			() =>
				prisma.lecture.update({
					where: {
						id: form.data.lectureId,
						graph: {
							id: form.data.graphId,
							...whereHasGraphCoursePermission(user, 'CourseAdminORProgramAdminEditor')
						}
					},
					data: {
						subjects: {
							set: form.data.subjectIds.map((id) => ({ id }))
						}
					}
				}),
			form,
			'',
			{ entity: 'Lecture', message: "You don't have permission to edit this lecture" }
		);
	}

	/**
	 * Delete a lecture. Does not renumber the order of the remaining lectures in the graph.
	 *
	 * @param user - The user performing the action, must have course or program admin/editor rights
	 * @param form - Validated form data with the graphId and lectureId
	 * @returns Nothing on success. On invalid input or missing permission, returns the form with
	 * an error via setError instead of throwing.
	 */
	static async deleteLecture(user: User, form: SuperValidated<Infer<typeof deleteLectureSchema>>) {
		if (!form.valid) return setError(form, '', 'Invalid lecture');

		return await withPermissionCheck(
			() =>
				prisma.lecture.delete({
					where: {
						id: form.data.lectureId,
						graph: {
							id: form.data.graphId,
							...whereHasGraphCoursePermission(user, 'CourseAdminORProgramAdminEditor')
						}
					}
				}),
			form,
			'',
			{ entity: 'Lecture', message: "You don't have permission to delete this lecture" }
		);
	}
}
