import { fail } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';

export const actions = {
	newCourse: async ({ request }) => {
		const data = await request.formData();
		const code = String(data.get('code'));
		const name = String(data.get('name'));
		const programId = Number(data.get('program'));

		if (!code) return fail(400, { code, missing: true });
		if (!name) return fail(400, { name, missing: true });

		await prisma.course.create({
			data: {
				code,
				name,
				program: {
					connect: {
						id: programId
					}
				}
			}
		});
	},


	newProgram: async ({ request }) => {
		const data = await request.formData();
		const name = String(data.get('name'));

		if (!name) return fail(400, { name, missing: true });

		await prisma.program.create({
			data: { name }
		});
	}
};


export async function load() {
	return {
		programs: await prisma.program.findMany({ include: { courses: true, coordinators: true } }),
		courses: await prisma.course.findMany({ include: { program: true } })
	};
}
