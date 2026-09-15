import { exampleGraph } from '$lib/data/exampleGraph';
import type { ServerLoad } from '@sveltejs/kit';

export const load: ServerLoad = async () => {
	return {
		graph: exampleGraph
	};
};
