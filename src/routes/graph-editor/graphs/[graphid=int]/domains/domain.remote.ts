import { form, getRequestEvent } from '$app/server';
import { getUser } from '$lib/server/actions/Users';
import prisma from '$lib/server/db/prisma';
import { whereHasGraphCoursePermission } from '$lib/server/permissions';
import {
	createDomainSchema,
	deleteDomainSchema,
	editDomainSchema
} from '$lib/valibot/domainSchema';
import type { DomainStyle } from '@prisma/client';
import { error } from '@sveltejs/kit';

export const createDomain = form(createDomainSchema, async ({ graphId, name, style }) => {
	const user = await getUser(getRequestEvent());

	try {
		// Find the last domain added value in the database.
		// Where creation data is the latest
		const lastDomains = await prisma.domain.findFirst({
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
				domains: {
					create: {
						name: name,
						style: style == '' ? null : (style as DomainStyle),
						order: lastDomains ? lastDomains.order + 1 : 0
					}
				}
			}
		});

		return { success: true };
	} catch (e: unknown) {
		if (e instanceof Error) {
			return error(401, e.message);
		} else {
			return error(401, `${e}`);
		}
	}
});

export const changeDomain = form(editDomainSchema, async ({ graphId, domainId, name, style }) => {
	const user = await getUser(getRequestEvent());

	try {
		await prisma.graph.update({
			where: {
				id: graphId,
				...whereHasGraphCoursePermission(user, 'CourseAdminEditorORProgramAdminEditor')
			},
			data: {
				domains: {
					update: {
						where: {
							id: domainId
						},
						data: {
							name: name,
							style: style == '' ? null : (style as DomainStyle)
						}
					}
				}
			}
		});

		return { success: true };
	} catch (e: unknown) {
		if (e instanceof Error) {
			return error(401, e.message);
		} else {
			return error(401, `${e}`);
		}
	}
});

export const deleteDomain = form(deleteDomainSchema, async ({ graphId, domainId }) => {
	const user = await getUser(getRequestEvent());

	try {
		await prisma.graph.update({
			where: {
				id: graphId,
				...whereHasGraphCoursePermission(user, 'CourseAdminEditorORProgramAdminEditor')
			},
			data: {
				domains: {
					delete: {
						id: domainId
					}
				}
			}
		});

		return { success: true };
	} catch (e: unknown) {
		if (e instanceof Error) {
			return error(401, e.message);
		} else {
			return error(401, `${e}`);
		}
	}
});
