import prisma from '$lib/server/db/prisma';
import { setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { fail } from '@sveltejs/kit';

import {
	domainRelSchema,
	domainSchema,
	changeDomainRelSchema,
	deleteDomainSchema
} from '$lib/zod/domainSchema';

import type { DomainStyle } from '@prisma/client';
import type { RequestEvent } from '@sveltejs/kit';

export class DomainActions {
	// MARK: - Domain

	static async addDomainToGraph(event: RequestEvent) {
		const form = await superValidate(event, zod(domainSchema));

		if (!form.valid) {
			return setError(form, 'name', 'Invalid graph name');
		}

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

			await prisma.domain.create({
				data: {
					name: form.data.name,
					style: form.data.style == '' ? null : (form.data.style as DomainStyle),
					order: lastDomains ? lastDomains.order + 1 : 0,
					graphId: form.data.graphId
				}
			});
		} catch (e: unknown) {
			return setError(form, 'name', e instanceof Error ? e.message : `${e}`);
		}
	}

	static async deleteDomain(event: RequestEvent) {
		const form = await superValidate(event, zod(deleteDomainSchema));

		if (!form.valid) {
			return setError(form, '', 'Invalid form data');
		}

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

		const deleteDomain = prisma.domain.delete({
			where: { id: form.data.domainId }
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

	static async changeDomain(event: RequestEvent) {
		const form = await superValidate(event, zod(domainSchema));

		if (!form.valid) return setError(form, 'name', form.message);
		if (form.data.domainId === 0) {
			return setError(form, 'name', 'Invalid domain id, cannot be 0');
		}

		try {
			await prisma.domain.update({
				where: { id: form.data.domainId },
				data: {
					name: form.data.name,
					style: form.data.style == '' ? null : (form.data.style as DomainStyle)
				}
			});
		} catch (e: unknown) {
			return setError(form, 'name', e instanceof Error ? e.message : `${e}`);
		}
	}

	// MARK: - Domain Relationships

	private static async connectDomains(inId: number, outId: number) {
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

		const addTargetToSource = prisma.domain.update({
			where: {
				id: inId
			},
			data: {
				targetDomains: { connect: { id: outId } }
			}
		});

		const addSourceToTarget = prisma.domain.update({
			where: {
				id: outId
			},
			data: {
				sourceDomains: { connect: { id: inId } }
			}
		});

		await prisma.$transaction([addTargetToSource, addSourceToTarget]);
	}

	static async addDomainRel(event: RequestEvent) {
		const form = await superValidate(event, zod(domainRelSchema));

		if (!form.valid) {
			return setError(form, '', 'Invalid domain relationship');
		}

		try {
			const sourceId = form.data.sourceDomainId;
			const targetId = form.data.targetDomainId;
			await DomainActions.connectDomains(sourceId, targetId);
		} catch (e: unknown) {
			return setError(form, '', e instanceof Error ? e.message : `${e}`);
		}
	}

	private static async disconnectDomains(sourceId: number, targetId: number) {
		const removeTargetFromSource = prisma.domain.update({
			where: { id: sourceId },
			data: {
				targetDomains: {
					disconnect: { id: targetId }
				}
			}
		});

		const removeSourceFromTarget = prisma.domain.update({
			where: { id: targetId },
			data: {
				sourceDomains: {
					disconnect: { id: sourceId }
				}
			}
		});

		await prisma.$transaction([removeTargetFromSource, removeSourceFromTarget]);
	}

	static async deleteDomainRel(event: RequestEvent) {
		const form = await event.request.formData();
		const sourceDomainId = parseInt(form.get('sourceDomainId') as string);
		const targetDomainId = parseInt(form.get('targetDomainId') as string);

		if (isNaN(sourceDomainId) || isNaN(targetDomainId)) {
			return fail(400, {
				inputDomainId: sourceDomainId,
				targetDomainId: targetDomainId,
				errorMessage: 'Invalid relationship id'
			});
		}

		try {
			await DomainActions.disconnectDomains(sourceDomainId, targetDomainId);
		} catch (e: unknown) {
			return fail(500, { errorMessage: e instanceof Error ? e.message : `${e}` });
		}
	}

	static async changeDomainRel(event: RequestEvent) {
		const form = await superValidate(event, zod(changeDomainRelSchema));

		if (!form.valid) {
			return setError(form, '', form.message);
		}

		try {
			await DomainActions.disconnectDomains(
				form.data.oldSourceDomainId,
				form.data.oldTargetDomainId
			);
			await DomainActions.connectDomains(form.data.sourceDomainId, form.data.targetDomainId);
		} catch (e: unknown) {
			return setError(form, '', e instanceof Error ? e.message : `${e}`);
		}
	}
}
