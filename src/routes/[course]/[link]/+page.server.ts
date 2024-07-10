
// External imports
import prisma from '$lib/server/prisma'

// Internal imports
import { GraphHelper } from '$lib/server/helpers'

// Load
export const load = async ({ params }) => {
	const graphId = 1 // TODO replace with actual graph id, once we have a way to get it

	const graph = await GraphHelper.toDTO(
		(await prisma.graph.findUnique({
			where: { id: graphId }
		}))!
	)

	return { graph }
}
