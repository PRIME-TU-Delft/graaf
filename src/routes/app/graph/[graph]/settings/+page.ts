
// External dependencies
import type { PageLoad } from './$types'

// Internal dependencies
import { cache, graph } from './stores'

import {
	ControllerCache,
	GraphController
} from '$scripts/controllers'

// Load
export const load: PageLoad = async ({ data, fetch }) => {
	const new_cache = new ControllerCache(fetch)
	cache.set(new_cache)

	graph.set(GraphController.revive(new_cache, data.graph))
}