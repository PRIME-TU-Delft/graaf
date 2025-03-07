Wimport prisma from '$lib/server/db/prisma.js';
import { emptyPrismaPromise } from '$lib/utils.js';
import type { Course } from '@prisma/client';
import { fail, setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from '../$types.js';
import { courseSchema, programSchema } from '../../lib/zod/courseSchema.js';

export const load = (async ({ url }) => {
	try {
		const search = url.searchParams.get('c')?.toLocaleLowerCase();

		const programs = await prisma.program.findMany({
			include: {
				courses: {
					orderBy: {
						updatedAt: 'desc'
					},
					where: search
						? { name: { contains: search, mode: 'insensitive' } }
						: { NOT: { name: '' } }
				}
			},
			orderBy: {
				updatedAt: 'desc'
			}
		});

		// Not high priority, so we can render the page without this data
		// TODO: check if this needs to be limmited (take only the top 50 or so courses)
		const courses = prisma.course.findMany({
			orderBy: {
				updatedAt: 'desc'
			}
		});

		return {
			error: undefined,
			programs,
			courses,
			programForm: await superValidate(zod(programSchema)),
			courseForm: await superValidate(zod(courseSchema))
		};
	} catch (e: unknown) {
		return {
			error: e instanceof Error ? e.message : `${e}`,
			programs: [],
			courses: emptyPrismaPromise([] as Course[]),
			programForm: await superValidate(zod(programSchema)),
			courseForm: await superValidate(zod(courseSchema))
		};
	}
}) satisfies PageServerLoad;

export const actions = {
	// Creates a new program with the given name
	'new-program': async (event) => {
		const form = await superValidate(event, zod(programSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await prisma.program.create({
				data: {
					name: form.data.name
				}
			});
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

	// Creates a new course with the given NAME and CODE
	'new-course': async (event) => {
		const form = await superValidate(event, zod(courseSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await prisma.program.update({
				where: {
					id: form.data.programId
				},
				data: {
					updatedAt: new Date(),
					courses: {
						create: {
							name: form.data.name,
							code: form.data.code
						}
					}
				}
			});
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
	'add-course-to-program': async ({ request }) => {
		const form = await request.formData();

		const programId = form.get('program-id') as string | null;
		const courseCode = form.get('code') as string | null;
		const courseName = form.get('name') as string | null;

		if (!programId || !courseCode || !courseName) {
			return fail(400, { error: 'Missing required fields' });
		}

		try {
			await prisma.program.update({
				where: {
					id: programId
				},
				data: {
					updatedAt: new Date(),
					courses: {
						connect: {
							code: courseCode
						}
					}
				}
			});
		} catch (e) {
			return fail(500, { error: e instanceof Error ? e.message : `${e}` });
		}
	}
} satisfies Actions;
