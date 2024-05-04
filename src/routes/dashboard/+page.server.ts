import { fail } from '@sveltejs/kit';
import orm from '$lib/server/orm';
import { Program } from '$lib/server/entities/Program';
import { Course } from '$lib/server/entities/Course';

const em = orm.em.fork();

export const actions = {
	newCourse: async ({request}) => {
		const data = await request.formData();
		const code = data.get('code')?.toString();
		const name = data.get('name')?.toString();
		const programId = Number(data.get('program'));
		console.log({code, name, programId})

		if (!code) return fail(400, { code, missing: true });
		if (!name) return fail(400, { name, missing: true });

		em.create('Course', { code, name, program: programId });
		await em.flush();
	},


	newProgram: async ({request}) => {
		const data = await request.formData();
		const name = data.get('name')?.toString();

		if (!name) return fail(400, { name, missing: true });

		em.create('Program', { name });
		await em.flush();
	}
}


export async function load() {
	let programs = await em.find('Program', {});
	let courses = await em.find('Course', {});
	return {
		programs, courses
	};
}
