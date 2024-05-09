import { fail } from '@sveltejs/kit';
import { wrap } from '@mikro-orm/core';

import orm from '$lib/server/orm';
import { Program } from '$lib/server/entities/Program';
import { Course } from '$lib/server/entities/Course';


const em = orm.em.fork();
const programRepo = em.getRepository(Program);
const courseRepo = em.getRepository(Course);


function MapToPOJO<T extends Object>(items: T[]): any[] {
	return items.map(item => wrap(item).toPOJO());
}


export const actions = {
	newCourse: async ({request}) => {
		const data = await request.formData();
		const code = String(data.get('code'));
		const name = String(data.get('name'));
		const programId = String(data.get('program'));

		if (!code) return fail(400, { code, missing: true });
		if (!name) return fail(400, { name, missing: true });

		courseRepo.create(new Course(code, name, programId));
		await em.flush();
	},


	newProgram: async ({request}) => {
		const data = await request.formData();
		const name = String(data.get('name'));

		if (!name) return fail(400, { name, missing: true });

		programRepo.create(new Program(name));
		await em.flush();
	},
}


export async function load() {
	let programs = await programRepo.findAll({ populate: ['courses', 'coordinators'] });
	let courses = await courseRepo.findAll({ populate: ['program']});

	return {
		programs: MapToPOJO(programs),
		courses: MapToPOJO(courses)
	};
}
