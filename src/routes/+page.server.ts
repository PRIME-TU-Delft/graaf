import { db } from '$lib/server/db';
import { program, course } from '$lib/server/db/schema';
import { courseSchema, programSchema } from '$lib/utils/zodSchema';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

import type { PageServerLoad, Actions } from './$types.js';
import { fail } from '@sveltejs/kit';

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
			return fail(400, {
				form
			});
		}

		try {
			await db.insert(program).values({ ...form.data });
		} catch (e) {
			if (e instanceof Error) {
				return fail(500, {
					error: e.message
				});
			}

			return fail(500, {
				error: e
			});
		}

		return {
			form
		};
	},
	'new-course': async (event) => {
		const form = await superValidate(event, zod(courseSchema));

		console.log({ data: form.data });

		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		try {
			await db
				.insert(course)
				.values({ name: form.data.name, code: form.data.code, programId: form.data.programId });
		} catch (e) {
			if (e instanceof Error) {
				return fail(500, {
					error: e.message
				});
			}

			return fail(500, {
				error: e
			});
		}

		return {
			form
		};
	}
} satisfies Actions;
