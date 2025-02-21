import prisma from '$lib/server/db/prisma';
import type { ServerLoad } from '@sveltejs/kit';

export const load = (async () => {
	const courses = await prisma.course.findMany({});

	return {
		courses
	};
}) satisfies ServerLoad;
