
// External dependencies
import type { PageServerLoad } from './$types'

// Internal dependencies
import { GraphHelper } from '$scripts/helpers'

// Load
export const load: PageServerLoad = async ({ params }) => {
	const graph_id = Number(params.graph)
	if (isNaN(graph_id))
		return Promise.reject('Invalid graph ID')
	const graph = await GraphHelper.getById(graph_id)

	return { graph }
}
