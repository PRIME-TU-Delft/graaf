import { GraphActions } from '$lib/server/actions/Graphs';
import { error, type ServerLoad } from '@sveltejs/kit';

export const load: ServerLoad = async ({ params }) => {
	const courseCode = params.code;
	const alias = params.alias;

	if (!courseCode || !alias) {
		throw new Error('Course code and alias are required');
	}

	try {
		const graph = await GraphActions.getRenderablePayload({
			course: {
				uriCode: encodeURIComponent(courseCode)
			},
			links: {
				some: {
					name: alias
				}
			}
		});

		if (!graph) error(404, { message: 'Graph not found' });

		// Happy path
		return {
			graph: graph
		};
	} catch (e: unknown) {
		error(500, { message: e instanceof Error ? e.message : `${e}` });
	}
};
