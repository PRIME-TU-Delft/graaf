import { fail } from '@sveltejs/kit';

import { GraphHelper } from '$scripts/helpers';
import { CourseController, GraphController } from '$lib/server/controllers';


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
	const course = await CourseController.getCourseByCode(params.course);
	const graphs = await GraphController.getGraphsByCourseCode(params.course);

	return {
		course,
		graphs
	};
}
