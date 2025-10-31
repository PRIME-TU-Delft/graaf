import { form, getRequestEvent } from '$app/server';
import { getUser } from '$lib/server/actions/Users';
import prisma from '$lib/server/db/prisma';
import { whereHasGraphCoursePermission } from '$lib/server/permissions';
import { svelteError } from '$lib/utils/setError';
import {
	changeSubjectRelSchema,
	createSubjectSchema,
	deleteSubjectSchema,
	subjectRelSchema,
	subjectSchema
} from '$lib/valibot/subjectSchema';
import type { User } from '@prisma/client';

export const createSubject = form(createSubjectSchema, async ({ graphId, name, domainId }) => {
	const user = await getUser(getRequestEvent());

	try {
		const lastSubject = await prisma.subject.findFirst({
			where: {
				graphId: graphId
			},
			orderBy: {
				order: 'desc'
			}
		});

		await prisma.graph.update({
			where: {
				id: graphId,
				...whereHasGraphCoursePermission(user, 'CourseAdminEditorORProgramAdminEditor')
			},
			data: {
				subjects: {
					create: {
						name: name,
						order: lastSubject ? lastSubject.order + 1 : 0,
						domainId: domainId > 0 ? domainId : null
					}
				}
			}
		});
		return { success: true };
	} catch (e) {
		svelteError(e);
	}
});

export const changeSubject = form(subjectSchema, async ({ graphId, subjectId, name, domainId }) => {
	const user = await getUser(getRequestEvent());

	try {
		await prisma.subject.update({
			where: {
				id: subjectId,
				graphId: graphId,
				...whereHasGraphCoursePermission(user, 'CourseAdminEditorORProgramAdminEditor')
			},
			data: {
				name: name,
				domainId: domainId > 0 ? domainId : null
			}
		});
		return { success: true };
	} catch (e) {
		svelteError(e);
	}
});

export const deleteSubject = form(deleteSubjectSchema, async ({ graphId, subjectId }) => {
	const user = await getUser(getRequestEvent());

	try {
		await prisma.graph.update({
			where: {
				id: graphId,
				...whereHasGraphCoursePermission(user, 'CourseAdminEditorORProgramAdminEditor')
			},
			data: {
				subjects: {
					delete: {
						id: subjectId
					}
				}
			}
		});
		return { success: true };
	} catch (e) {
		svelteError(e);
	}
});

//
// MARK: Subject relationships
//

async function connectSubjects(graphId: number, user: User, inId: number, outId: number) {
	// Check if the subjecs are already connected
	const isConnected = await prisma.subject.findFirst({
		where: {
			id: inId,
			targetSubjects: { some: { id: outId } }
		}
	});

	if (isConnected) {
		throw new Error('Subjects are already connected');
	}

	return await prisma.graph.update({
		where: {
			// Assuming both subjects belong to the same graph, use the graphId from one of the domains
			id: graphId,
			...whereHasGraphCoursePermission(user, 'CourseAdminEditorORProgramAdminEditor')
		},
		data: {
			subjects: {
				update: [
					{
						where: { id: inId },
						data: {
							targetSubjects: { connect: { id: outId } }
						}
					},
					{
						where: { id: outId },
						data: {
							sourceSubjects: { connect: { id: inId } }
						}
					}
				]
			}
		}
	});
}

async function disconnectSubjects(graphId: number, user: User, inId: number, outId: number) {
	return await prisma.graph.update({
		where: {
			// Assuming both subjects belong to the same graph, use the graphId from one of the domains
			id: graphId,
			...whereHasGraphCoursePermission(user, 'CourseAdminEditorORProgramAdminEditor')
		},
		data: {
			subjects: {
				update: [
					{
						where: { id: inId },
						data: {
							targetSubjects: { disconnect: { id: outId } }
						}
					},
					{
						where: { id: outId },
						data: {
							sourceSubjects: { disconnect: { id: inId } }
						}
					}
				]
			}
		}
	});
}

export const createSubjectRel = form(
	subjectRelSchema,
	async ({ graphId, sourceSubjectId, targetSubjectId }) => {
		const user = await getUser(getRequestEvent());

		try {
			const sourceId = sourceSubjectId;
			const targetId = targetSubjectId;
			await connectSubjects(graphId, user, sourceId, targetId);
		} catch (e: unknown) {
			return svelteError(e);
		}
	}
);

export const deleteSubjectRel = form(
	subjectRelSchema,
	async ({ graphId, sourceSubjectId, targetSubjectId }) => {
		const user = await getUser(getRequestEvent());

		try {
			const sourceId = sourceSubjectId;
			const targetId = targetSubjectId;
			await disconnectSubjects(graphId, user, sourceId, targetId);
		} catch (e: unknown) {
			return svelteError(e);
		}
	}
);

export const changeSubjectRel = form(
	changeSubjectRelSchema,
	async ({ graphId, sourceSubjectId, targetSubjectId, oldSourceSubjectId, oldTargetSubjectId }) => {
		const user = await getUser(getRequestEvent());

		try {
			await disconnectSubjects(graphId, user, oldSourceSubjectId, oldTargetSubjectId);
			await connectSubjects(graphId, user, sourceSubjectId, targetSubjectId);
		} catch (e: unknown) {
			return svelteError(e);
		}
	}
);
