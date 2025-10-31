import { form, getRequestEvent } from '$app/server';
import { getUser } from '$lib/server/actions/Users';
import prisma from '$lib/server/db/prisma';
import { whereHasGraphCoursePermission } from '$lib/server/permissions';
import { svelteError } from '$lib/utils/setError';
import { createSubjectSchema, subjectSchema } from '$lib/valibot/subjectSchema';

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
