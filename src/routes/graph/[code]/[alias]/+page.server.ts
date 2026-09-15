import { GraphActions } from '$lib/server/actions/Graphs';
import { LinkViewActions } from '$lib/server/actions/LinkViews';
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
		GraphActions.getRenderablePayload(
			{ ...parent, links: { some: { name: alias } } },
			{
				// The link that resolved this page, so its view can be counted below
				links: { where: { name: alias }, select: { id: true } }
			}
		);

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

	// The resolved link is only needed to count the view, the viewer itself has no use for it
	const { links: resolvedLinks, ...graphPayload } = graph;

	// Count the view. This route is the only public way into a graph, so the graph-editor's own
	// loaders (which fetch graphs by id) never count. Not awaited on purpose: recording a view
	// must not add latency to this response, and recordView swallows its own failures.
	const linkId = resolvedLinks[0]?.id;
	if (linkId != undefined) void LinkViewActions.recordView(linkId);

	// Happy path
	return {
		graph: graphPayload
	};
};
