import prisma from '$lib/server/db/prisma.js';
import { courseSchema, programSchema } from '$lib/utils/zodSchema';
import { fail, setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types.js';
import type { Course, Prisma, Program } from '@prisma/client';

export const load = (async () => {
	try {
		const programs = await prisma.program.findMany({
			where: {
				isArchived: false
			},
			include: {
				courses: true
			},
			orderBy: {
				updatedAt: 'desc'
			}
		});
		const archivedPrograms = prisma.program.findMany({
			where: {
				isArchived: true
			},
			include: {
				courses: true
			},
			orderBy: {
				updatedAt: 'desc'
			}
		});

		const courses = await prisma.course.findMany({
			orderBy: {
				updatedAt: 'desc'
			}
		});

		return {
			error: undefined,
			programs,
			archivedPrograms,
			courses,
			programForm: await superValidate(zod(programSchema)),
			courseForm: await superValidate(zod(courseSchema))
		};
	} catch (e: unknown) {
		return {
			error: e instanceof Error ? e.message : `${e}`,
			programs: [],
			courses: [],
			archivedPrograms: new Promise((resolve) => resolve([])) as Prisma.PrismaPromise<
				(Program & { courses: Course[] })[]
			>,
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
			return {
				status: 400,
				body: 'Invalid request'
			};
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
