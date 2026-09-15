import { GraphActions } from '$lib/server/actions';
import { getUser } from '$lib/server/actions/Users';
import { nodePositionsSchema } from '$lib/zod/graphSchema';
import { superValidate } from 'sveltekit-superforms';
import { zod4 as zod } from 'sveltekit-superforms/adapters';

import type { RequestEvent } from '@sveltejs/kit';

/**
 * Dragging a node on the graph canvas persists its new position. The canvas is rendered by this
 * route's layout, but form actions can only be declared on a page, so every child page spreads
 * these in and the canvas posts to whichever one is open.
 */
export const nodePositionActions = {
	'update-node-positions': async (event: RequestEvent) => {
		const form = await superValidate(event, zod(nodePositionsSchema));
		return GraphActions.updateNodePositions(await getUser(event), form);
	}
};
