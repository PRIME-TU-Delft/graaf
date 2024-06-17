import { fail } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';

export const actions = {
	newGraph: async ({ params, request }) => {
		const data = await request.formData();
		const code = params.course;
		const name = String(data.get('name'));

		if (!name) return fail(400, { name, missing: true });

		await prisma.graph.create({
			data: {
				name,
				course: {
					connect: {
						code
					}
				}
			}
		});
	}
};


export async function load({ params }) {
	return {
		course: await prisma.course.findUniqueOrThrow({
			where: {
				code: params.course
			},
			include: {
				graphs: true
			}
		})
	};
}
