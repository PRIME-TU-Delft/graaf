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


export const load = async ({ params }) => {
	const courseCode = params.course;
	const graphId = Number(params.graph);

	const course = await (await prisma.course.findUnique({
		where: { code: courseCode }
	}))?.dto;

	const graph = await (await prisma.graph.findUnique({
		where: { id: graphId }
	}))?.dto;
};
