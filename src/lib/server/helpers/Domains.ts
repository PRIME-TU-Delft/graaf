import { domainRelSchema, domainSchema, changeDomainRelSchema } from '$lib/zod/domainSubjectSchema';
import type { DomainStyle } from '@prisma/client';
import { fail, type RequestEvent } from '@sveltejs/kit';
import { setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import prisma from '../db/prisma';

export class Domains {
	// MARK: - Domain

	static async addDomainToGraph(event: RequestEvent) {
		const form = await superValidate(event, zod(domainSchema));

		if (!form.valid) {
			return setError(form, 'name', 'Invalid graph name');
		}

		try {
			// Is needed to get the count of domains in the graph for the order
			const domainCount = await prisma.domain.count({
				where: {
					graphId: form.data.graphId
				}
			});

			await prisma.domain.create({
				data: {
					name: form.data.name,
					style: form.data.color == '' ? null : (form.data.color as DomainStyle),
					order: domainCount,
					graphId: form.data.graphId
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
				outgoingDomains: { some: { id: outId } }
			}
		});

		if (isConnected) {
			throw new Error('Domains are already connected');
		}

		const addOutToIn = prisma.domain.update({
			where: {
				id: inId
			},
			data: {
				outgoingDomains: { connect: { id: outId } }
			}
		});

		const addInToOut = prisma.domain.update({
			where: {
				id: outId
			},
			data: {
				incommingDomains: { connect: { id: inId } }
			}
		});

		await prisma.$transaction([addOutToIn, addInToOut]);
	}

	static async addDomainRel(event: RequestEvent) {
		const form = await superValidate(event, zod(domainRelSchema));

		if (!form.valid) {
			return setError(form, '', 'Invalid domain relationship');
		}

		try {
			const inId = form.data.domainInId;
			const outId = form.data.domainOutId;

			await Domains.connectDomains(inId, outId);
		} catch (e: unknown) {
			return setError(form, '', e instanceof Error ? e.message : `${e}`);
		}
	}

	private static async disconnectDomains(inId: number, outId: number) {
		const removeOutToIn = prisma.domain.update({
			where: { id: inId },
			data: {
				outgoingDomains: {
					disconnect: { id: outId }
				}
			}
		});

		const removeInToOut = prisma.domain.update({
			where: { id: outId },
			data: {
				incommingDomains: {
					disconnect: { id: inId }
				}
			}
		});

		await prisma.$transaction([removeOutToIn, removeInToOut]);
	}

	static async deleteDomainRel(event: RequestEvent) {
		const form = await event.request.formData();

		const domainInId = parseInt(form.get('domainInId') as string);
		const domainOutId = parseInt(form.get('domainOutId') as string);

		if (isNaN(domainInId) || isNaN(domainOutId)) {
			return fail(400, { domainInId, domainOutId, errorMessage: 'Invalid relationship id' });
		}

		try {
			await Domains.disconnectDomains(domainInId, domainOutId);
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
			await Domains.disconnectDomains(form.data.oldDomainInId, form.data.oldDomainOutId);
			await Domains.connectDomains(form.data.domainInId, form.data.domainOutId);
		} catch (e: unknown) {
			return setError(form, '', e instanceof Error ? e.message : `${e}`);
		}
	}
}
