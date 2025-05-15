import prisma from '$lib/server/db/prisma';
import { lectureSchema } from '$lib/zod/lectureSchema';
import type { User } from '@prisma/client';
import { setError, type Infer, type SuperValidated } from 'sveltekit-superforms';
import { whereHasGraphCoursePermission } from '../permissions';

export class LectureActions {
	/**
	 * Adds a lecture to the graph based on the provided event.
	 *
	 * @param event - The request event containing the form data for the lecture.
	 * @returns A promise that resolves to an error message if the form is invalid.
	 * @throws Will throw an error if there is an issue with the database transaction.
	 *
	 * The function performs the following steps:
	 * 1. Validates the form data using `superValidate` and `zod(lectureSchema)`.
	 * 2. Adds the lecture to the graph
	 * 3. If there is an error, returns the error message.
	 * 4. If successful, returns the lecture.
	 **/
	static async addLectureToGraph(user: User, form: SuperValidated<Infer<typeof lectureSchema>>) {
		if (!form.valid) return setError(form, 'name', 'Invalid lecture');

		try {
			const lectureCount = await prisma.lecture.count({
				where: {
					graphId: form.data.graphId
				}
			});

			await prisma.graph.update({
				where: {
					id: form.data.graphId,
					...whereHasGraphCoursePermission(user, 'CourseAdminORProgramAdminEditor')
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
		} catch (e: unknown) {
			return setError(form, 'name', e instanceof Error ? e.message : `${e}`);
		}
	}

	static async linkSubjectsToLecture(
		user: User,
		form: SuperValidated<Infer<typeof lectureSchema>>
	) {
		if (!form.valid) return setError(form, 'subjectIds._errors', 'Invalid lecture');

		try {
			await prisma.lecture.update({
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
			});
		} catch (e: unknown) {
			return setError(form, 'subjectIds._errors', e instanceof Error ? e.message : `${e}`);
		}
	}
}
