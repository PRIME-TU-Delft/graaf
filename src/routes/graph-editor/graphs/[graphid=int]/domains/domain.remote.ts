import { form, getRequestEvent } from '$app/server';
import { getUser } from '$lib/server/actions/Users';
import prisma from '$lib/server/db/prisma';
import { whereHasGraphCoursePermission } from '$lib/server/permissions';
import {
	changeDomainRelSchema,
	createDomainSchema,
	deleteDomainSchema,
	domainRelSchema,
	editDomainSchema
} from '$lib/valibot/domainSchema';
import type { DomainStyle, User } from '@prisma/client';
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

//
// MARK: - Domain Relationships
//

async function connectDomains(graphId: number, user: User, inId: number, outId: number) {
	// Check if the domains are already connected
	const isConnected = await prisma.domain.findFirst({
		where: {
			id: inId,
			targetDomains: { some: { id: outId } }
		}
	});

	if (isConnected) {
		throw new Error('Domains are already connected');
	}

	return await prisma.graph.update({
		where: {
			// Assuming both domains belong to the same graph, use the graphId from one of the domains
			id: graphId,
			...whereHasGraphCoursePermission(user, 'CourseAdminEditorORProgramAdminEditor')
		},
		data: {
			domains: {
				update: [
					{
						where: { id: inId },
						data: {
							targetDomains: { connect: { id: outId } }
						}
					},
					{
						where: { id: outId },
						data: {
							sourceDomains: { connect: { id: inId } }
						}
					}
				]
			}
		}
	});
}

async function disconnectDomains(graphId: number, user: User, sourceId: number, targetId: number) {
	return await prisma.graph.update({
		where: {
			// Assuming both domains belong to the same graph, use the graphId from one of the domains
			id: graphId,
			...whereHasGraphCoursePermission(user, 'CourseAdminEditorORProgramAdminEditor')
		},
		data: {
			domains: {
				update: [
					{
						where: { id: sourceId },
						data: {
							targetDomains: { disconnect: { id: targetId } }
						}
					},
					{
						where: { id: targetId },
						data: {
							sourceDomains: { disconnect: { id: sourceId } }
						}
					}
				]
			}
		}
	});
}

export const createDomainRel = form(
	domainRelSchema,
	async ({ graphId, sourceDomainId, targetDomainId }) => {
		const user = await getUser(getRequestEvent());

		try {
			await connectDomains(graphId, user, sourceDomainId, targetDomainId);
			return { success: true };
		} catch (e: unknown) {
			return error(401, e instanceof Error ? e.message : `${e}`);
		}
	}
);

export const deleteDomainRel = form(
	domainRelSchema,
	async ({ graphId, sourceDomainId, targetDomainId }) => {
		const user = await getUser(getRequestEvent());

		try {
			await disconnectDomains(graphId, user, sourceDomainId, targetDomainId);
			return { success: true };
		} catch (e: unknown) {
			return error(401, e instanceof Error ? e.message : `${e}`);
		}
	}
);

export const changeDomainRel = form(
	changeDomainRelSchema,
	async ({ graphId, oldSourceDomainId, oldTargetDomainId, sourceDomainId, targetDomainId }) => {
		const user = await getUser(getRequestEvent());

		try {
			await disconnectDomains(graphId, user, oldSourceDomainId, oldTargetDomainId);
			await connectDomains(graphId, user, sourceDomainId, targetDomainId);
			return { success: true };
		} catch (e: unknown) {
			return error(401, e instanceof Error ? e.message : `${e}`);
		}
	}
);
