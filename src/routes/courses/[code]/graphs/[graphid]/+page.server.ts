import prisma from '$lib/server/db/prisma';
import { error, type ServerLoad } from '@sveltejs/kit';
import { setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { domainSchema } from './zodSchema';
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
			newDomainForm: await superValidate(zod(domainSchema))
		};
	} catch (e: unknown) {
		error(500, { message: e instanceof Error ? e.message : `${e}` });
	}
}) satisfies ServerLoad;

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
	}
};
