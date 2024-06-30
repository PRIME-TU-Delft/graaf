import { fail } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';


export const actions = {
	newDomain: async ({ params, request }) => {
		const data = await request.formData();
		const graphId = Number(data.get('graph'));

		if (!graphId) return fail(400, { graphId, missing: true });

		await prisma.domain.create({
			data: {
				graph: {
					connect: {
						id: graphId
					}
				}
			}
		});
	},


	newSubject: async ({ params, request }) => {
		const data = await request.formData();
		const graphId = Number(data.get('graph'));

		if (!graphId) return fail(400, { graphId, missing: true });

		await prisma.subject.create({
			data: {
				graph: {
					connect: {
						id: graphId
					}
				}
			}
		});
	}
};