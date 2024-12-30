import prisma from '$lib/server/db/prisma';
import type { ServerLoad } from '@sveltejs/kit';

export const load = (async ({ params }) => {
	if (!params.code) {
		return {
			course: undefined,
			error: 'Course code is required'
		};
	}

	try {
		const dbCourse = await prisma.course.findFirst({
			where: {
				code: params.code
			},
			include: {
				programs: true
			}
		});

		if (!dbCourse) {
			return {
				course: undefined,
				error: 'Course not found'
			};
		}

		return {
			error: undefined,
			course: dbCourse
		};
	} catch (e: unknown) {
		return {
			course: undefined,
			error: e instanceof Error ? e.message : `${e}`
		};
	}
}) satisfies ServerLoad;

export const actions = {
	'remove-program-from-course': async ({ request }) => {
		const form = await request.formData();

		const programId = form.get('program-id') as string | null;
		const courseCode = form.get('course-id') as string | null;

		if (!programId || !courseCode) {
			return {
				status: 400,
				body: 'Invalid request'
			};
		}

		try {
			// Remove program from course
			await prisma.course.update({
				where: {
					code: courseCode
				},
				data: {
					programs: {
						disconnect: {
							id: programId
						}
					}
				}
			});

			return {
				status: 200,
				body: 'Program removed from course'
			};
		} catch (e: unknown) {
			return {
				status: 500,
				body: e instanceof Error ? e.message : `${e}`
			};
		}
	}
};
