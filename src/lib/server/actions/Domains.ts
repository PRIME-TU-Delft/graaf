import prisma from '$lib/server/db/prisma';
import { whereHasGraphCoursePermission } from '$lib/server/permissions';
import {
	changeDomainRelSchema,
	deleteDomainSchema,
	domainRelSchema,
	domainSchema
} from '$lib/zod/domainSchema';
import type { DomainStyle, User } from '@prisma/client';
import { fail } from '@sveltejs/kit';
import { setError, type Infer, type SuperValidated } from 'sveltekit-superforms';

export class DomainActions {
	// MARK: - Domain

	static async addDomainToGraph(user: User, form: SuperValidated<Infer<typeof domainSchema>>) {
		if (!form.valid) return setError(form, 'name', 'Invalid graph name');

		try {
			// Find the last domain added value in the database.
			// Where creation data is the latest
			const lastDomains = await prisma.domain.findFirst({
				where: {
					graphId: form.data.graphId
				},
				orderBy: {
					order: 'desc'
				}
			});

			await prisma.graph.update({
				where: {
					id: form.data.graphId,
					...whereHasGraphCoursePermission(user, 'CourseAdminEditorORProgramAdminEditor')
				},
				data: {
					domains: {
						create: {
							name: form.data.name,
							style: form.data.style == '' ? null : (form.data.style as DomainStyle),
							order: lastDomains ? lastDomains.order + 1 : 0
						}
					}
				}
			});
		} catch (e: unknown) {
			return setError(form, 'name', e instanceof Error ? e.message : `${e}`);
		}
	}

	static async deleteDomain(user: User, form: SuperValidated<Infer<typeof deleteDomainSchema>>) {
		if (!form.valid) return setError(form, '', 'Invalid form data');

		const removeTargetFromSourceDomain = form.data.sourceDomains.map((id) => {
			return prisma.domain.update({
				where: { id },
				data: {
					sourceDomains: {
						disconnect: { id: form.data.domainId }
					}
				}
			});
		});

		const removeSourceFromTargetDomain = form.data.targetDomains.map((id) => {
			return prisma.domain.update({
				where: { id },
				data: {
					sourceDomains: {
						disconnect: { id: form.data.domainId }
					}
				}
			});
		});

		const removeDomainFromSubjects = form.data.connectedSubjects.map((id) => {
			return prisma.subject.update({
				where: { id },
				data: {
					domain: {
						disconnect: true
					}
				}
			});
		});

		const deleteDomain = prisma.graph.update({
			where: {
				id: form.data.graphId,
				...whereHasGraphCoursePermission(user, 'CourseAdminEditorORProgramAdminEditor')
			},
			data: {
				domains: {
					delete: { id: form.data.domainId }
				}
			}
		});

		try {
			await prisma.$transaction([
				...removeTargetFromSourceDomain,
				...removeSourceFromTargetDomain,
				...removeDomainFromSubjects,
				deleteDomain
			]);
		} catch (e: unknown) {
			return setError(form, '', e instanceof Error ? e.message : `${e}`);
		}
	}

	static async changeDomain(user: User, form: SuperValidated<Infer<typeof domainSchema>>) {
		if (!form.valid) return setError(form, '', 'Invalid form data');
		if (form.data.domainId === 0) {
			return setError(form, 'name', 'Invalid domain id, cannot be 0');
		}

		try {
			await prisma.graph.update({
				where: {
					id: form.data.graphId,
					...whereHasGraphCoursePermission(user, 'CourseAdminEditorORProgramAdminEditor')
				},
				data: {
					domains: {
						update: {
							where: { id: form.data.domainId },
							data: {
								name: form.data.name,
								style: form.data.style == '' ? null : (form.data.style as DomainStyle)
							}
						}
					}
				}
			});
		} catch (e: unknown) {
			return setError(form, 'name', e instanceof Error ? e.message : `${e}`);
		}
	}

	// MARK: - Domain Relationships

	private static async connectDomains(graphId: number, user: User, inId: number, outId: number) {
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

	static async addDomainRel(user: User, form: SuperValidated<Infer<typeof domainRelSchema>>) {
		try {
			const sourceId = form.data.sourceDomainId;
			const targetId = form.data.targetDomainId;
			await DomainActions.connectDomains(form.data.graphId, user, sourceId, targetId);
		} catch (e: unknown) {
			return setError(form, '', e instanceof Error ? e.message : `${e}`);
		}
	}

	private static async disconnectDomains(
		graphId: number,
		user: User,
		sourceId: number,
		targetId: number
	) {
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

	static async deleteDomainRel(user: User, form: SuperValidated<Infer<typeof domainRelSchema>>) {
		if (!form.valid) return setError(form, '', 'Invalid form data');

		try {
			await DomainActions.disconnectDomains(
				form.data.graphId,
				user,
				form.data.sourceDomainId,
				form.data.targetDomainId
			);
		} catch (e: unknown) {
			return fail(500, { errorMessage: e instanceof Error ? e.message : `${e}` });
		}
	}

	static async changeDomainRel(
		user: User,
		form: SuperValidated<Infer<typeof changeDomainRelSchema>>
	) {
		if (!form.valid) return setError(form, '', 'Invalid form data');

		try {
			await DomainActions.disconnectDomains(
				form.data.graphId,
				user,
				form.data.oldSourceDomainId,
				form.data.oldTargetDomainId
			);
			await DomainActions.connectDomains(
				form.data.graphId,
				user,
				form.data.sourceDomainId,
				form.data.targetDomainId
			);
		} catch (e: unknown) {
			return setError(form, '', e instanceof Error ? e.message : `${e}`);
		}
	}
}
