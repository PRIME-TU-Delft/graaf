import prisma from '$lib/server/db/prisma';
import { whereHasGraphCoursePermission } from '$lib/server/permissions';
import { changeDomainRelSchema, domainRelSchema } from '$lib/valibot/domainSchema';
import type { User } from '@prisma/client';
import { fail } from '@sveltejs/kit';
import { setError, type Infer, type SuperValidated } from 'sveltekit-superforms';

export class DomainActions {
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
