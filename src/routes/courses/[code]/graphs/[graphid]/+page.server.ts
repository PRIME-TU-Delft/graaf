import prisma from '$lib/server/db/prisma';
import { error, type ServerLoad } from '@sveltejs/kit';
import { setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { domainRelSchema, domainSchema } from './zodSchema';
import type { DomainStyle } from '@prisma/client';

export const load = (async ({ params }) => {
	if (!params.code || !params.graphid) {
		error(400, { message: 'Course code and Graph id are required' });
	}

	const graphId = parseInt(params.graphid);
	// Check if graphId is not NaN
	if (isNaN(graphId)) {
		error(400, { message: 'Graph id must be a number' });
	}

	try {
		const course = await prisma.course.findFirst({
			where: {
				code: params.code
			},
			include: {
				graphs: {
					where: {
						id: graphId
					},
					include: {
						domains: {
							include: {
								incommingDomains: true,
								outgoingDomains: true
							}
						}
					}
				}
			}
		});

		if (!course) error(404, { message: 'Course not found' });
		if (course.graphs.length === 0) error(404, { message: 'Graph not found' });

		// Happy path
		return {
			course: course,
			newDomainForm: await superValidate(zod(domainSchema)),
			newDomainRelForm: await superValidate(zod(domainRelSchema))
		};
	} catch (e: unknown) {
		error(500, { message: e instanceof Error ? e.message : `${e}` });
	}
}) satisfies ServerLoad;

// ACTIONS
export const actions = {
	'add-domain-to-graph': async (event) => {
		const form = await superValidate(event, zod(domainSchema));

		if (!form.valid) {
			return setError(form, 'name', 'Invalid graph name');
		}

		try {
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
	},
	'add-domain-rel': async (event) => {
		const form = await superValidate(event, zod(domainRelSchema));

		if (!form.valid) {
			return setError(form, '', 'Invalid domain relationship');
		}

		try {
			// Check if the domains are already connected
			const isConnected = await prisma.domain.findFirst({
				where: {
					id: form.data.domainInId,
					outgoingDomains: {
						some: {
							id: form.data.domainOutId
						}
					}
				}
			});

			if (isConnected) {
				return setError(form, '', 'Domains are already connected');
			}

			const addOutToIn = prisma.domain.update({
				where: {
					id: form.data.domainInId
				},
				data: {
					outgoingDomains: {
						connect: {
							id: form.data.domainOutId
						}
					}
				}
			});

			const addInToOut = prisma.domain.update({
				where: {
					id: form.data.domainOutId
				},
				data: {
					incommingDomains: {
						connect: {
							id: form.data.domainInId
						}
					}
				}
			});

			await prisma.$transaction([addOutToIn, addInToOut]);
		} catch (e: unknown) {
			return setError(form, '', e instanceof Error ? e.message : `${e}`);
		}
	}
};
