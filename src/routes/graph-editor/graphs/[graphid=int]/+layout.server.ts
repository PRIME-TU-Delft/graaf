import { GraphActions } from '$lib/server/actions/Graphs';
import type { Breadcrumb } from '$lib/utils/breadcrumbs';
import { error, redirect, isRedirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params }) => {
	if (!params.graphid) {
		error(400, { message: 'Graph ID is required' });
	}

	const graphId = parseInt(params.graphid);
	// Check if graphId is not NaN
	if (isNaN(graphId)) {
		error(400, { message: 'Graph id must be a number' });
	}

	try {
		const graph = await GraphActions.getRenderablePayload(
			{ id: graphId },
			{
				course: { select: { code: true } },
				sandbox: { select: { id: true, name: true } }
			}
		);

		if (!graph) redirect(303, '/graph-editor?error=Graph not found');

		// Build the breadcrumb trail from the graph's real parent (course or sandbox) and the
		// active leaf tab, so the nav bar shows names instead of guessing from the URL path.
		const breadcrumbs: Breadcrumb[] = [{ name: 'Home', url: '/graph-editor' }];
		if (graph.parentType === 'COURSE' && graph.course) {
			breadcrumbs.push({ name: 'Courses', url: '/graph-editor/courses' });
			breadcrumbs.push({
				name: graph.course.code,
				url: `/graph-editor/courses/${graph.course.code}`
			});
		} else if (graph.sandbox) {
			breadcrumbs.push({ name: 'Sandboxes', url: '/graph-editor/sandboxes' });
			breadcrumbs.push({
				name: graph.sandbox.name,
				url: `/graph-editor/sandboxes/${graph.sandbox.id}`
			});
		}
		breadcrumbs.push({ name: graph.name, url: `/graph-editor/graphs/${graph.id}` });

		// The trail stops at the graph. Each child page appends its own leaf, because reading
		// `url` here would make this load re-run on every tab switch, and the fresh graph object
		// makes GraphRenderer tear the canvas down and rebuild it instead of animating the view
		// transition.

		// Happy path
		return {
			graph: graph,
			breadcrumbs
		};
	} catch (e: unknown) {
		if (isRedirect(e)) throw e;
		error(500, { message: e instanceof Error ? e.message : `${e}` });
	}
};
