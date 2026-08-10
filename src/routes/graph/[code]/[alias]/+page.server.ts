import prisma from '$lib/server/db/prisma';
import { error, isHttpError, type ServerLoad } from '@sveltejs/kit';

export const load: ServerLoad = async ({ params }) => {
	const courseCode = params.code;
	const alias = params.alias;

	if (!courseCode || !alias) {
		throw new Error('Course code and alias are required');
	}

	let graph;
	try {
		graph = await prisma.graph.findFirst({
			where: {
				course: {
					uriCode: encodeURIComponent(courseCode)
				},
				links: {
					some: {
						name: alias
					}
				}
			},
			include: {
				domains: {
					include: {
						sourceDomains: true,
						targetDomains: true
					},
					orderBy: {
						order: 'asc'
					}
				},
				subjects: {
					include: {
						sourceSubjects: true,
						targetSubjects: true,
						domain: true
					},
					orderBy: {
						order: 'asc'
					}
				},
				lectures: {
					include: {
						subjects: true
					}
				}
			}
		});
	} catch (e: unknown) {
		if (isHttpError(e)) throw e;
		error(500, { message: e instanceof Error ? e.message : `${e}` });
	}

	if (!graph) error(404, { message: 'Graph not found' });

	// Happy path
	return {
		graph: graph
	};
};
