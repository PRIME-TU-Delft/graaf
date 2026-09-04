import prisma from '$lib/server/db/prisma';
import { whereHasGraphCoursePermission } from '$lib/server/permissions';
import { withGuardedMutation } from './guardedMutation';
import {
	changeDomainRelSchema,
	deleteDomainSchema,
	domainRelSchema,
	domainSchema,
	domainStyleSchema,
	reorderDomainsSchema
} from '$lib/zod/domainSchema';
import type { DomainStyle, Prisma, User } from '@prisma/client';
import { setError, type Infer, type SuperValidated } from 'sveltekit-superforms/server';

/** Server actions for creating, editing, and deleting domains within a graph, and for
 * creating/removing relations between domains. Called from form actions in `+page.server.ts`
 * route files, one static method per operation. */
export class DomainActions {
	// MARK: - Domain

	/**
	 * Create a new domain in a graph, appended to the end of the existing domain order.
	 *
	 * @param user - The user performing the action, must have course or program admin/editor rights
	 * @param form - Validated form data with the graphId, domain name, and optional style
	 * @returns Nothing on success. On invalid input or missing permission, returns the form with
	 * a `name`-field error via setError instead of throwing.
	 */
	static async addDomainToGraph(user: User, form: SuperValidated<Infer<typeof domainSchema>>) {
		if (!form.valid) return setError(form, 'name', 'Invalid graph name');

		return await withGuardedMutation(
			async () => {
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

				return prisma.graph.update({
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
			},
			form,
			'name',
			{ entity: 'Graph', message: "You don't have permission to edit this domain" }
		);
	}

	/**
	 * Delete a domain, first disconnecting it from every domain relation it participates in and
	 * unlinking any subjects assigned to it, all in a single transaction.
	 *
	 * @param user - The user performing the action, must have course or program admin/editor rights
	 * @param form - Validated form data with the graphId, domainId to delete, and the ids of its
	 * source/target domain relations and connected subjects that need to be cleaned up
	 * @returns Nothing on success. On invalid input or a failed transaction, returns the form with
	 * an error via setError instead of throwing.
	 */
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

		return await withGuardedMutation(
			() =>
				prisma.$transaction([
					...removeTargetFromSourceDomain,
					...removeSourceFromTargetDomain,
					...removeDomainFromSubjects,
					deleteDomain
				]),
			form,
			'',
			{ entity: 'Graph', message: "You don't have permission to delete this domain" }
		);
	}

	/**
	 * Rename a domain and/or change its style.
	 *
	 * @param user - The user performing the action, must have course or program admin/editor rights
	 * @param form - Validated form data with the graphId, domainId (must be non-zero), new name,
	 * and optional style
	 * @returns Nothing on success. On invalid input or missing permission, returns the form with
	 * a `name`-field error via setError instead of throwing.
	 */
	static async changeDomain(user: User, form: SuperValidated<Infer<typeof domainSchema>>) {
		if (!form.valid) return setError(form, '', 'Invalid form data');
		if (form.data.domainId === 0) {
			return setError(form, 'name', 'Invalid domain id, cannot be 0');
		}

		return await withGuardedMutation(
			() =>
				prisma.graph.update({
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
				}),
			form,
			'name',
			{ entity: 'Graph', message: "You don't have permission to edit this domain" }
		);
	}

	/**
	 * Reorder the domains in a graph. `domainIds` is the graph's domain ids in their new display
	 * order; each domain's `order` is set to its index in that list. Runs as a single nested
	 * write, so the whole reorder either applies or none of it does.
	 *
	 * @param user - The user performing the action, must have course or program admin/editor rights
	 * @param form - Validated form data with the graphId and the reordered domainIds
	 * @returns Nothing on success. On invalid input, an id that isn't in this graph, or missing
	 * permission, returns the form with a `domainIds._errors`-field error via setError instead of
	 * throwing.
	 */
	static async reorderDomains(
		user: User,
		form: SuperValidated<Infer<typeof reorderDomainsSchema>>
	) {
		if (!form.valid) return setError(form, 'domainIds._errors', 'Invalid domain order');

		return await withGuardedMutation(
			() =>
				prisma.graph.update({
					where: {
						id: form.data.graphId,
						...whereHasGraphCoursePermission(user, 'CourseAdminEditorORProgramAdminEditor')
					},
					data: {
						domains: {
							update: form.data.domainIds.map((id, order) => ({
								where: { id },
								data: { order }
							}))
						}
					}
				}),
			form,
			'domainIds._errors',
			{ entity: 'Graph', message: "You don't have permission to reorder these domains" }
		);
	}

	/**
	 * Change a domain's style, leaving its name untouched. Split out from changeDomain because
	 * the domain list restyles a domain on its own, without the rename dialog.
	 *
	 * @param user - The user performing the action, must have course or program admin/editor rights
	 * @param form - Validated form data with the graphId, domainId, and the new style ('' clears it)
	 * @returns Nothing on success. On invalid input or missing permission, returns the form with
	 * a `style`-field error via setError instead of throwing.
	 */
	static async changeDomainStyle(
		user: User,
		form: SuperValidated<Infer<typeof domainStyleSchema>>
	) {
		if (!form.valid) return setError(form, 'style', 'Invalid domain style');

		return await withGuardedMutation(
			() =>
				prisma.graph.update({
					where: {
						id: form.data.graphId,
						...whereHasGraphCoursePermission(user, 'CourseAdminEditorORProgramAdminEditor')
					},
					data: {
						domains: {
							update: {
								where: { id: form.data.domainId },
								data: {
									style: form.data.style == '' ? null : (form.data.style as DomainStyle)
								}
							}
						}
					}
				}),
			form,
			'style',
			{ entity: 'Graph', message: "You don't have permission to edit this domain" }
		);
	}

	// MARK: - Domain Relationships

	/**
	 * Create a directed relation between two domains in the same graph (inId -> outId), used by
	 * both addDomainRel and changeDomainRel.
	 *
	 * @param graphId - The graph both domains belong to
	 * @param user - The user performing the action, must have course or program admin/editor rights
	 * @param inId - The source domain id
	 * @param outId - The target domain id
	 * @param tx - The Prisma client or transaction client to run the queries against, defaults to
	 * the shared client
	 * @returns The updated graph
	 * @throws If inId and outId are the same domain, if the domains are already connected, or if
	 * the user lacks permission
	 */
	private static async connectDomains(
		graphId: number,
		user: User,
		inId: number,
		outId: number,
		tx: Prisma.TransactionClient = prisma
	) {
		if (inId === outId) {
			throw new Error('A domain cannot be connected to itself');
		}

		// Check if the domains are already connected
		const isConnected = await tx.domain.findFirst({
			where: {
				id: inId,
				targetDomains: { some: { id: outId } }
			}
		});

		if (isConnected) {
			throw new Error('Domains are already connected');
		}

		return await tx.graph.update({
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

	/**
	 * Create a directed relation between two domains.
	 *
	 * @param user - The user performing the action, must have course or program admin/editor rights
	 * @param form - Validated form data with the graphId, sourceDomainId, and targetDomainId
	 * @returns Nothing on success. If the domains are already connected or the user lacks
	 * permission, returns the form with an error via setError instead of throwing.
	 */
	static async addDomainRel(user: User, form: SuperValidated<Infer<typeof domainRelSchema>>) {
		return await withGuardedMutation(
			() => {
				const sourceId = form.data.sourceDomainId;
				const targetId = form.data.targetDomainId;
				return DomainActions.connectDomains(form.data.graphId, user, sourceId, targetId);
			},
			form,
			'',
			{ entity: 'Graph', message: "You don't have permission to edit this domain relation" }
		);
	}

	/**
	 * Remove the directed relation between two domains in the same graph, used by both
	 * deleteDomainRel and changeDomainRel.
	 *
	 * @param graphId - The graph both domains belong to
	 * @param user - The user performing the action, must have course or program admin/editor rights
	 * @param sourceId - The source domain id
	 * @param targetId - The target domain id
	 * @param tx - The Prisma client or transaction client to run the query against, defaults to
	 * the shared client
	 * @returns The updated graph
	 * @throws If the user lacks permission
	 */
	private static async disconnectDomains(
		graphId: number,
		user: User,
		sourceId: number,
		targetId: number,
		tx: Prisma.TransactionClient = prisma
	) {
		return await tx.graph.update({
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

	/**
	 * Remove the relation between two domains.
	 *
	 * @param user - The user performing the action, must have course or program admin/editor rights
	 * @param form - Validated form data with the graphId, sourceDomainId, and targetDomainId
	 * @returns Nothing on success. On invalid input or a failed disconnect (e.g. missing
	 * permission), returns the form with an error via setError.
	 */
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
			return setError(form, '', e instanceof Error ? e.message : `${e}`);
		}
	}

	/**
	 * Move a domain relation by disconnecting its old source/target pair and connecting the new
	 * one, both in a single transaction. If the connect step fails, the disconnect is rolled back
	 * and the old relation remains intact.
	 *
	 * @param user - The user performing the action, must have course or program admin/editor rights
	 * @param form - Validated form data with the graphId, oldSourceDomainId, oldTargetDomainId,
	 * and the new sourceDomainId/targetDomainId
	 * @returns Nothing on success. On invalid input or a failed transaction, returns the form with
	 * an error via setError instead of throwing.
	 */
	static async changeDomainRel(
		user: User,
		form: SuperValidated<Infer<typeof changeDomainRelSchema>>
	) {
		if (!form.valid) return setError(form, '', 'Invalid form data');

		return await withGuardedMutation(
			() =>
				prisma.$transaction(async (tx) => {
					await DomainActions.disconnectDomains(
						form.data.graphId,
						user,
						form.data.oldSourceDomainId,
						form.data.oldTargetDomainId,
						tx
					);
					await DomainActions.connectDomains(
						form.data.graphId,
						user,
						form.data.sourceDomainId,
						form.data.targetDomainId,
						tx
					);
				}),
			form,
			'',
			{ entity: 'Graph', message: "You don't have permission to edit this domain relation" }
		);
	}
}
