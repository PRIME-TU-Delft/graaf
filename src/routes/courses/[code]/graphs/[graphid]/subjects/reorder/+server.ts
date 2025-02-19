import prisma from '$lib/server/db/prisma';
import { json, type RequestHandler } from '@sveltejs/kit';

/*
 * Reorder the subjects in a graph
 * This can be a on a server call because it is not critical
 **/
export const PATCH: RequestHandler = async ({ request }) => {
	const needRearrange = (await request.json()) as {
		subjectId: number;
		oldOrder: number;
		newOrder: number;
	}[];

	try {
		const subjectChanges = needRearrange.map(({ subjectId, newOrder }) => {
			return prisma.subject.update({
				where: { id: subjectId },
				data: { order: newOrder }
			});
		});

		const newSubjects = await prisma.$transaction(subjectChanges);

		return json(newSubjects);
	} catch (e: unknown) {
		return json({ error: e instanceof Error ? e.message : `${e}` }, { status: 400 });
	}
};
