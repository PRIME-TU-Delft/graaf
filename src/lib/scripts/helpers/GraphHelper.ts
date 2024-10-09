
// External imports
import prisma from '$lib/server/prisma'
import type { Graph as PrismaGraph } from '@prisma/client'

// Internal imports
import type { SerializedGraph } from '$scripts/types'

// Exports
export { create, remove, update, reduce, getAll, getById }


// --------------------> Helper Functions


/**
 * Creates a Graph object in the database.
 * @param course_id `number`
 * @param name `string`
 * @returns `SerializedGraph`
 */

async function create(course_id: number, name: string): Promise<SerializedGraph> {
	try {
		var graph = await prisma.graph.create({
			data: {
				name,
				course: {
					connect: {
						id: course_id
					}
				}
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await reduce(graph)
}

/**
 * Removes a Graph from the database.
 * @param graph_ids `number[]`
 */

async function remove(...graph_ids: number[]): Promise<void> {
	try {
		await prisma.graph.deleteMany({
			where: {
				id: {
					in: graph_ids
				}
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}
}

/**
 * Updates a Graph in the database.
 * @param data 'SerializedGraph'
 */

async function update(data: SerializedGraph): Promise<void> {

	const course = await getCourseID(data.id)
	const course_data = course === data.course ? {} : {
		connect : { id: data.course },
		disconnect : { id: course }
	}

	const domains = await getDomainIDs(data.id)
	const old_domains = domains.filter(domain => !data.domains.includes(domain))
	const new_domains = data.domains.filter(domain => !domains.includes(domain))

	const subjects = await getSubjectIDs(data.id)
	const old_subjects = subjects.filter(subject => !data.subjects.includes(subject))
	const new_subjects = data.subjects.filter(subject => !subjects.includes(subject))

	const lectures = await getLectureIDs(data.id)
	const old_lectures = lectures.filter(lecture => !data.lectures.includes(lecture))
	const new_lectures = data.lectures.filter(lecture => !lectures.includes(lecture))

	try {
		await prisma.graph.update({
			where: {
				id: data.id,
			},
			data: {
				name: data.name,
				course: course_data,
				domains: {
					connect: new_domains.map(domain => ({ id: domain })),
					disconnect: old_domains.map(domain => ({ id: domain }))
				},
				subjects: {
					connect: new_subjects.map(subject => ({ id: subject })),
					disconnect: old_subjects.map(subject => ({ id: subject }))
				},
				lectures: {
					connect: new_lectures.map(lecture => ({ id: lecture })),
					disconnect: old_lectures.map(lecture => ({ id: lecture }))
				}
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}
}

/**
 * Reduces a Graph to a SerializedGraph.
 * @param graph `PrismaGraph`
 * @returns `SerializedGraph`
 */

async function reduce(graph: PrismaGraph): Promise<SerializedGraph> {
	return {
		id: graph.id,
		name: graph.name,
		course: graph.courseId,
		domains: await getDomainIDs(graph.id),
		subjects: await getSubjectIDs(graph.id),
		lectures: await getLectureIDs(graph.id)
	}
}

/**
 * Retrieves all Graphs from the database.
 * @returns `SerializedGraph[]`
 */

async function getAll(): Promise<SerializedGraph[]> {
	try {
		var graphs = await prisma.graph.findMany()
	} catch (error) {
		return Promise.reject(error)
	}

	return await Promise.all(graphs.map(reduce))
}

/**
 * Retrieves Groups by ID
 * @param group_ids `number[]`
 * @returns `SerializedGraph[]` or `SerializedGraph` if a single ID is provided
 */

async function getById(...graph_ids: number[]): Promise<SerializedGraph | SerializedGraph[]> {
	try {
		var graphs = await prisma.graph.findMany({
			where: {
				id: {
					in: graph_ids
				}
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	if (graph_ids.length === 1) {
		return await reduce(graphs[0])
	} else {
		return await Promise.all(graphs.map(reduce))
	}
}

/**
 * Retrieves Graph course ID.
 * @param graph_id `number`
 * @returns `number`
 */

async function getCourseID(graph_id: number): Promise<number> {
	try {
		var graph = await prisma.graph.findUniqueOrThrow({
			where: {
				id: graph_id
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return graph.courseId
}

/**
 * Retrieves Graph domain IDs.
 * @param graph_id `number`
 * @returns `number[]`
 */

async function getDomainIDs(graph_id: number): Promise<number[]> {
	try {
		var domains = await prisma.domain.findMany({
			where: {
				graphId: graph_id
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return domains.map(domain => domain.id)
}

/**
 * Retrieves Graph subject IDs.
 * @param graph_id `number`
 * @returns `number[]`
 */

async function getSubjectIDs(graph_id: number): Promise<number[]> {
	try {
		var subjects = await prisma.subject.findMany({
			where: {
				graphId: graph_id
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return subjects.map(subject => subject.id)
}

/**
 * Retrieves Graph lecture IDs.
 * @param graph_id `number`
 * @returns `number[]`
 */

async function getLectureIDs(graph_id: number): Promise<number[]> {
	try {
		var lectures = await prisma.lecture.findMany({
			where: {
				graphId: graph_id
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return lectures.map(lecture => lecture.id)
}