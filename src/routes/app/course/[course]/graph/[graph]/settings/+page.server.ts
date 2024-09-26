
// External imports
import prisma from '$lib/server/prisma'

// Internal imports
import { CourseHelper, GraphHelper } from '$lib/server/helpers'

// Load
export const load = async ({ params }) => {
	const course_code = params.course
	const graph_id = Number(params.graph)

	const course = await CourseHelper.toDTO(
		(await prisma.course.findUnique({
			where: { code: course_code }
		}))!
	)

	const graph = await GraphHelper.getById(graph_id)
		.catch(() => Promise.reject('Graph not found'))

	return { course, graph }
}
