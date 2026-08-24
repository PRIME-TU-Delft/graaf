import prisma from '$lib/server/db/prisma';
import {
	deleteLectureSchema,
	lectureSchema,
	reorderLectureSubjectsSchema,
	reorderLecturesSchema
} from '$lib/zod/lectureSchema';
import type { User } from '@prisma/client';
import { setError, type Infer, type SuperValidated } from 'sveltekit-superforms/server';
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
	 * Reorder the lectures in a graph. `lectureIds` is the graph's lecture ids in their new
	 * display order; each lecture's `order` is set to its index in that list. Runs as a single
	 * nested write, so the whole reorder either applies or none of it does.
	 *
	 * @param user - The user performing the action, must have course or program admin/editor rights
	 * @param form - Validated form data with the graphId and the reordered lectureIds
	 * @returns Nothing on success. On invalid input, an id that isn't in this graph, or missing
	 * permission, returns the form with a `lectureIds._errors`-field error via setError instead
	 * of throwing.
	 */
	static async reorderLectures(
		user: User,
		form: SuperValidated<Infer<typeof reorderLecturesSchema>>
	) {
		if (!form.valid) return setError(form, 'lectureIds._errors', 'Invalid lecture order');

		return await withPermissionCheck(
			() =>
				prisma.graph.update({
					where: {
						id: form.data.graphId,
						...whereHasGraphCoursePermission(user, 'CourseAdminEditorORProgramAdminEditor')
					},
					data: {
						lectures: {
							update: form.data.lectureIds.map((id, order) => ({
								where: { id },
								data: { order }
							}))
						}
					}
				}),
			form,
			'lectureIds._errors',
			{ entity: 'Graph', message: "You don't have permission to reorder these lectures" }
		);
	}

	/**
	 * Replace a lecture's linked subjects with the given set. Unlike addLectureToGraph, this
	 * sets the full list rather than adding to it, so subjects omitted from subjectIds are
	 * unlinked. `subjectOrder` is kept in step: subjects that stay linked keep their place,
	 * newly linked ones are appended, unlinked ones drop out.
	 *
	 * @param user - The user performing the action, must have course or program admin/editor rights
	 * @param form - Validated form data with the graphId, lectureId, and the full subjectIds list
	 * @returns Nothing on success. On invalid input or missing permission, returns the form with
	 * a `subjectIds._errors`-field error via setError instead of throwing.
	 */
	static async linkSubjectsToLecture(
		user: User,
		form: SuperValidated<Infer<typeof lectureSchema>>
	) {
		if (!form.valid) return setError(form, 'subjectIds._errors', 'Invalid lecture');

		const where = {
			id: form.data.lectureId,
			graph: {
				id: form.data.graphId,
				...whereHasGraphCoursePermission(user, 'CourseAdminORProgramAdminEditor')
			}
		};

		return await withPermissionCheck(
			() =>
				prisma.$transaction(async (tx) => {
					const lecture = await tx.lecture.findFirstOrThrow({
						where,
						select: { subjectOrder: true }
					});

					const linked = new Set(form.data.subjectIds);
					const kept = lecture.subjectOrder.filter((id) => linked.has(id));
					const keptSet = new Set(kept);
					const added = form.data.subjectIds.filter((id) => !keptSet.has(id));

					return tx.lecture.update({
						where,
						data: {
							subjects: {
								set: form.data.subjectIds.map((id) => ({ id }))
							},
							subjectOrder: [...kept, ...added]
						}
					});
				}),
			form,
			'subjectIds._errors',
			{ entity: 'Lecture', message: "You don't have permission to edit this lecture" }
		);
	}

	/**
	 * Set the display order of the subjects within a single lecture. Also replaces the lecture's
	 * subject set, because the list a subject is dragged within is also the list it can be
	 * dragged into from another lecture, so a reorder can change which subjects are linked.
	 *
	 * @param user - The user performing the action, must have course or program admin/editor rights
	 * @param form - Validated form data with the graphId, lectureId, and the subjectIds in their
	 * new order
	 * @returns Nothing on success. On invalid input or missing permission, returns the form with
	 * a `subjectIds._errors`-field error via setError instead of throwing.
	 */
	static async reorderLectureSubjects(
		user: User,
		form: SuperValidated<Infer<typeof reorderLectureSubjectsSchema>>
	) {
		if (!form.valid) return setError(form, 'subjectIds._errors', 'Invalid subject order');

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
						},
						subjectOrder: form.data.subjectIds
					}
				}),
			form,
			'subjectIds._errors',
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
