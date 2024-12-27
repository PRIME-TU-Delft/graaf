import { db } from '$lib/server/db';
import { program } from '$lib/server/db/schema';
import { courseSchema, programSchema } from '$lib/utils/zodSchema';
import { fail, setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

import type { Actions, PageServerLoad } from './$types.js';

export const load = (async () => {
	try {
		const programs = await db.query.program.findMany({
			with: {
				courses: true
			}
		});

		return {
			error: undefined,
			programs,
			programForm: await superValidate(zod(programSchema)),
			courseForm: await superValidate(zod(courseSchema))
		};
	} catch (e: unknown) {
		return {
			error: e instanceof Error ? e.message : `${e}`,
			programs: [],
			programForm: await superValidate(zod(programSchema)),
			courseForm: await superValidate(zod(courseSchema))
		};
	}
}) satisfies PageServerLoad;

export const actions = {
	'new-program': async (event) => {
		const form = await superValidate(event, zod(programSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await db.insert(program).values({ ...form.data });
		} catch (e) {
			if (!(e instanceof Object) || !('message' in e)) {
				return setError(form, 'name', e instanceof Error ? e.message : `${e}`);
			}

			return setError(form, 'name', `${e.message}`);
		}

		return {
			form
		};
	},
	'new-course': async (event) => {
		const form = await superValidate(event, zod(courseSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		// try {
		// 	const c = await db
		// 		.insert(course)
		// 		.values({ name: form.data.name, code: form.data.code }).returning();

		// 	await db.query.courseToProgram.create({})
		// } catch (e: unknown) {
		// 	if (!(e instanceof Object) || !('message' in e)) {
		// 		return setError(form, 'code', e instanceof Error ? e.message : `${e}`);
		// 	}

		// 	// When the DB throws a unique constraint error
		// 	if ('duplicate key value violates unique constraint "course_pkey"' === e.message) {
		// 		return setError(
		// 			form,
		// 			'code',
		// 			'Code id already existes in the database, it needs to be unique'
		// 		);
		// 	}

		// 	return setError(form, 'code', `${e.message}`);
		// }

		return {
			form
		};
	}
} satisfies Actions;
