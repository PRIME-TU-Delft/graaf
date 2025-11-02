import { command, form, getRequestEvent } from '$app/server';
import { getUser } from '$lib/server/actions/Users';
import prisma from '$lib/server/db/prisma';
import { whereHasGraphCoursePermission } from '$lib/server/permissions';
import { svelteError } from '$lib/utils/setError';
import {
	changeLectureNameSchema,
	changeLectureSubjectsSchema,
	createLectureSchema,
	deleteLectureSchema,
	moveSubjectToLectureSchema,
	reorderLecturesSchema
} from '$lib/valibot/lectureSchema';

export const createLecture = form(createLectureSchema, async ({ graphId, name }) => {
	const user = await getUser(getRequestEvent());

	try {
		const lastLecture = await prisma.lecture.findFirst({
			where: {
				graphId: graphId
			},
			orderBy: {
				order: 'desc'
			}
		});

		return await prisma.graph.update({
			where: {
				id: graphId,
				...whereHasGraphCoursePermission(user, 'CourseAdminEditorORProgramAdminEditor')
			},
			data: {
				lectures: {
					create: {
						name,
						order: lastLecture ? lastLecture.order + 1 : 0
					}
				}
			}
		});
	} catch (e: unknown) {
		return svelteError(e);
	}
});

export const deleteLecture = form(deleteLectureSchema, async ({ graphId, lectureId }) => {
	const user = await getUser(getRequestEvent());

	try {
		await prisma.lecture.delete({
			where: {
				id: lectureId,
				graph: {
					id: graphId,
					...whereHasGraphCoursePermission(user, 'CourseAdminORProgramAdminEditor')
				}
			}
		});
	} catch (e) {
		svelteError(e);
	}
});

export const changeLectureName = form(
	changeLectureNameSchema,
	async ({ graphId, lectureId, name }) => {
		const user = await getUser(getRequestEvent());

		try {
			await prisma.lecture.update({
				where: {
					id: lectureId,
					graph: {
						id: graphId,
						...whereHasGraphCoursePermission(user, 'CourseAdminORProgramAdminEditor')
					}
				},
				data: {
					name: name
				}
			});
		} catch (e) {
			svelteError(e);
		}
	}
);

export const changeLectureSubjects = form(
	changeLectureSubjectsSchema,
	async ({ graphId, lectureId, subjects }) => {
		const user = await getUser(getRequestEvent());

		try {
			await prisma.lecture.update({
				where: {
					id: lectureId,
					graph: {
						id: graphId,
						...whereHasGraphCoursePermission(user, 'CourseAdminORProgramAdminEditor')
					}
				},
				data: {
					subjects: {
						set: subjects.map((id) => ({ id }))
					}
				}
			});
		} catch (e) {
			svelteError(e);
		}
	}
);

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
