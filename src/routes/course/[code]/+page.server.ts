import { db } from '$lib/server/db';
import { course } from '$lib/server/db/schema';
import type { ServerLoad } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const load: ServerLoad = async ({ params }) => {
	if (!params.code) {
		return {
			course: undefined,
			error: 'Course code is required'
		};
	}

	try {
		const dbCourse = await db.select().from(course).where(eq(course.code, params.code));

		if (!dbCourse.length) {
			return {
				course: undefined,
				error: 'Course not found'
			};
		}

		return {
			error: undefined,
			course: dbCourse[0]
		};
	} catch (e: unknown) {
		return {
			course: undefined,
			error: e instanceof Error ? e.message : `${e}`
		};
	}
};
