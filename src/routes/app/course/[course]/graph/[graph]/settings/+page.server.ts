
// External imports
import prisma from '$lib/server/prisma'

// Internal imports
import { CourseHelper, GraphHelper } from '$lib/server/helpers'

// Load
export const load = async ({ params }) => {
	const courseCode = params.course
	const graphId = Number(params.graph)

	const course = await CourseHelper.toDTO(
		(await prisma.course.findUnique({
			where: { code: courseCode }
		}))!
	)

	const graph = await GraphHelper.getById(graphId)
		.catch(() => Promise.reject('Graph not found'))

	return { course, graph }
}
