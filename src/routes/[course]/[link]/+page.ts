
// Svelte imports
import type { PageLoad } from './$types'

// Internal imports
import { Graph } from '$scripts/entities'
import { graph } from '$stores'

// load
export const load: PageLoad = ({ data }) => {
	graph.set(Graph.revive(data.graph))
}