import { command, form, getRequestEvent } from '$app/server';
import { getUser } from '$lib/server/actions/Users';
import prisma from '$lib/server/db/prisma';
import { whereHasGraphCoursePermission } from '$lib/server/permissions';
import { svelteError } from '$lib/utils/setError';
import { moveSubjectToLectureSchema, reorderLecturesSchema } from '$lib/valibot/lectureSchema';

export const reorderLectures = command(reorderLecturesSchema, async ({ graphId, lectures }) => {
	const user = await getUser(getRequestEvent());

	try {
		return await prisma.graph.update({
			where: {
				id: graphId,
				...whereHasGraphCoursePermission(user, 'CourseAdminEditorORProgramAdminEditor')
			},
			data: {
				lectures: {
					updateMany: lectures.map((lecture) => ({
						where: { id: lecture.lectureId },
						data: { order: lecture.newOrder }
					}))
				}
			}
		});
	} catch (e: unknown) {
		return svelteError(e);
	}
});

export const moveSubjectToLecture = form(
	moveSubjectToLectureSchema,
	async ({ graphId, subjectId, lectureId, newLectureId }) => {
		const user = await getUser(getRequestEvent());

		try {
			return await prisma.graph.update({
				where: {
					id: graphId,
					...whereHasGraphCoursePermission(user, 'CourseAdminEditorORProgramAdminEditor')
				},
				data: {
					lectures: {
						update: [
							{
								where: { id: lectureId },
								data: { subjects: { disconnect: { id: subjectId } } }
							},
							{
								where: { id: newLectureId },
								data: { subjects: { connect: { id: subjectId } } }
							}
						]
					}
				}
			});
		} catch (e: unknown) {
			return svelteError(e);
		}
	}
);
