import { fail } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';

import { CourseHelper, GraphHelper, DomainHelper, SubjectHelper } from '$lib/server/helpers';


export const actions = {
	newDomain: async ({ params, request }) => {
		const data = await request.formData();
		const graphId = Number(data.get('graph'));

		if (!graphId) return fail(400, { graphId, missing: true });

		await DomainHelper.create(graphId);
	},


	newSubject: async ({ params, request }) => {
		const data = await request.formData();
		const graphId = Number(data.get('graph'));

		if (!graphId) return fail(400, { graphId, missing: true });

		await SubjectHelper.create(graphId);
	}
};


export const load = async ({ params }) => {
	const courseCode = params.course;
	const graphId = Number(params.graph);

	const course = await CourseHelper.toDTO(
		(await prisma.course.findUnique({
			where: { code: courseCode }
		}))!
	);

	const graph = await GraphHelper.toDTO(
		(await prisma.graph.findUnique({
			where: { id: graphId }
		}))!
	);

	return { course, graph };
};
