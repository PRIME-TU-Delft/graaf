import { GraphActions } from '$lib/server/actions/Graphs';
import { error, isHttpError, type ServerLoad } from '@sveltejs/kit';
import type { Prisma } from '@prisma/client';

export const load: ServerLoad = async ({ params }) => {
	const code = params.code;
	const alias = params.alias;

	if (!code || !alias) {
		throw new Error('Code and alias are required');
	}

	const uriCode = encodeURIComponent(code);
	const lookupByParent = (parent: Prisma.GraphWhereInput) =>
		GraphActions.getRenderablePayload({ ...parent, links: { some: { name: alias } } });

	let graph;
	try {
		graph = await lookupByParent({ course: { uriCode } });

		// A course code always wins over a sandbox code of the same value, so the sandbox lookup
		// only runs once the course lookup has come back empty.
		if (!graph) {
			graph = await lookupByParent({ sandbox: { uriCode } });
		}
	} catch (e: unknown) {
		if (isHttpError(e)) throw e;
		console.error(e);
		error(500, { message: e instanceof Error ? e.message : `${e}` });
	}

	if (!graph) error(404, { message: 'Graph not found' });

	// Happy path
	return {
		graph: graph
	};
};
