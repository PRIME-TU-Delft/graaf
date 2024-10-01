
// External imports
import prisma from '$lib/server/prisma'
import type { Graph as PrismaGraph } from '@prisma/client'

// Internal imports
import type { SerializedGraph } from '$scripts/types'

// Exports
export { create, remove, update, reduce, getByCourseId, getById }


// --------------------> Helper Functions


/**
 * Retrieves all Graphs associated with a Course.
 * @param course_id
 * @returns Array of SerializedGraph objects
 */

async function getByCourseId(course_id: number): Promise<SerializedGraph[]> {
	try {
		var graphs = await prisma.graph.findMany({
			where: {
				course: {
					id: course_id
				}
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await Promise.all(graphs.map(reduce))
}

/**
 * Retrieves a Graph by its ID.
 * @param graph_id
 * @returns SerializedGraph object
 */

async function getById(graph_id: number): Promise<SerializedGraph> {
	try {
		var graph = await prisma.graph.findUniqueOrThrow({
			where: {
				id: graph_id
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await reduce(graph)
}

/**
 * Creates a Graph object in the database.
 * @param course_id The id of the Course to which the Graph belongs
 * @param name The name of the Graph
 * @returns SerializedGraph object
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
 * @param graph_id ID of the Graph to remove
 */

async function remove(graph_id: number): Promise<void> {
	try {
		await prisma.graph.delete({
			where: {
				id: graph_id
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}
}

/**
 * Updates a Graph in the database.
 * @param data SerializedGraph object
 */

async function update(data: SerializedGraph): Promise<void> {
	try {
		await prisma.graph.update({
			where: {
				id: data.id
			},
			data: {
				name: data.name
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}
}

/**
 * Reduces a Graph to a SerializedGraph.
 * @param graph PrismaGraph object
 * @returns SerializedGraph object
 */

async function reduce(graph: PrismaGraph): Promise<SerializedGraph> {
	return {
		id: graph.id,
		name: graph.name
	}
}