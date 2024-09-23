
// Svelte imports
import { fail } from '@sveltejs/kit'

// External imports
import prisma from '$lib/server/prisma'

// Internal imports
import { CourseHelper, GraphHelper, DomainHelper, SubjectHelper, LectureHelper } from '$lib/server/helpers'

// Actions
export const actions = {
	newLecture: async ({ params, request }): Promise<number> => {
		const data = await request.formData()
		const graphId = Number(data.get('graph'))

		if (!graphId) return fail(400, { graphId, missing: true })

		return await LectureHelper.create(graphId)
	}
}

// Load
export const load = async ({ params }) => {
	const courseCode = params.course
	const graphId = Number(params.graph)

	const course = await CourseHelper.toDTO(
		(await prisma.course.findUnique({
			where: { code: courseCode }
		}))!
	)

	const graph = await GraphHelper.toDTO(
		(await prisma.graph.findUnique({
			where: { id: graphId }
		}))!
	)

	return { course, graph }
}
