import prisma from '$lib/server/db/prisma';
import type { ServerLoad } from '@sveltejs/kit';
import { setError, superValidate, type Infer, type SuperValidated } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { graphSchema } from './zodSchema.js';
import type { Course, Graph } from '@prisma/client';
import type { OrError } from '$lib/utils.js';

export const load = (async ({ params }) => {
	const result = {
		course: undefined,
		graphForm: await superValidate(zod(graphSchema)),
		error: ''
	} as OrError<{
		course: Course;
		graphForm: SuperValidated<Infer<typeof graphSchema>>;
		graphs: Graph[];
	}>;

	if (!params.code) {
		result.error = 'Course code is required';
		return result;
	}

	try {
		const dbCourse = await prisma.course.findFirst({
			where: {
				code: params.code
			},
			include: {
				graphs: {
					include: {
						_count: {
							select: {
								domains: true,
								subjects: true
							}
						}
					}
				}
			}
		});

		if (!dbCourse) {
			result.error = 'Course not found';
			return result;
		}

		// Happy path
		return {
			error: undefined,
			graphSchema: await superValidate(zod(graphSchema)),
			course: dbCourse,
			graphs: dbCourse.graphs
		};
	} catch (e: unknown) {
		result.error = e instanceof Error ? e.message : `${e}`;
		return result;
	}
}) satisfies ServerLoad;

export const actions = {
	'add-graph-to-course': async (event) => {
		const form = await superValidate(event, zod(graphSchema));

		if (!form.valid) {
			return setError(form, 'name', 'Invalid graph name');
		}

		try {
			await prisma.graph.create({
				data: {
					name: form.data.name,
					courseId: form.data.courseCode
				}
			});
		} catch (e: unknown) {
			return setError(form, 'name', e instanceof Error ? e.message : `${e}`);
		}
	}
};
