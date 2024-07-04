import { fail } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';

import * as GraphHelper from '$lib/server/GraphHelper';
import * as CourseHelper from '$lib/server/CourseHelper';


export const actions = {
	newGraph: async ({ params, request }) => {
		const data = await request.formData();
		const code = params.course;
		const name = String(data.get('name'));

		if (!name) return fail(400, { name, missing: true });

		await GraphHelper.createWithCourseCode(code, name);
	}
};


export async function load({ params }) {
	const course = await prisma.course.findUniqueOrThrow({
		where: {
			code: params.course
		}
	});

	const graphs = await prisma.graph.findMany({
		where: {
			courseId: course.id
		}
	});

	return {
		course: await CourseHelper.toDTO(course),
		graphs: await Promise.all(graphs.map(g => GraphHelper.toDTO(g)))
	};
}
