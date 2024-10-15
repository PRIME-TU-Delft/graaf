
// External dependencies
import prisma from '$lib/server/prisma'
import type { GraphLink as PrismaLink } from '@prisma/client'

// Internal dependencies
import {
	CourseHelper,
	GraphHelper
} from '$scripts/helpers'

import type {
	SerializedLink,
	SerializedCourse,
	SerializedGraph
} from '$scripts/types'

// Exports
export {
	create,	   // api/link			   POST
	update,	   // api/link			   PUT
	remove,	   // api/link/[id]		   DELETE
	reduce,
	getAll,	   // api/link			   GET
	getById,   // api/link/[id]		   GET
	getCourse, // api/link/[id]/course GET
	getGraph   // api/link/[id]/graph  GET
}


// --------------------> Helper Functions


/**
 * Creates a Link in the database.
 * @param course_id `number` Course ID link belongs to
 * @param graph_id `number` Graph ID belonging to link
 * @param name `string` Link name
 * @returns `SerializedLink` Serialized new Link
 */

async function create(course_id: number, graph_id: number | null, name: string): Promise<SerializedLink> {

	// Get graph data
	const graph_data = graph_id ? { id: graph_id } : undefined

	try {
		var link = await prisma.graphLink.create({
			data: {
				name,
				course: {
					connect: {
						id: course_id
					}
				},
				graph: {
					connect: graph_data
				}
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await reduce(link)
}

/**
 * Updates a Link in the database.
 * @param data `SerializedLink` New Link data
 */

async function update(data: SerializedLink): Promise<void> {

	// Get graph connection data
	const graph = await getGraph(data.id)
	const graph_data = {
		connect: data.graph ? { id: data.graph } : undefined,
		disconnect: graph ? { id: graph.id } : undefined
	}

	// Update
	try {
		await prisma.graphLink.update({
			where: { 
				id: data.id 
			},
			data: {
				name: data.name,
				graph: graph_data
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}
}

/**
 * Removes a Link from the database.
 * @param link_id `number` Target Link ID
 */

async function remove(link_id: number): Promise<void> {
	try {
		await prisma.graphLink.delete({
			where: {
				id: link_id
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}
}

/**
 * Reduces a Link to a SerializedLink.
 * @param link `PrismaLink` Link object
 * @returns `SerializedLink` Serialized Link
 */

async function reduce(link: PrismaLink): Promise<SerializedLink> {
	return {
		id: link.id,
		name: link.name,
		graph: link.graphId,
		course: link.courseId
	}
}

/**
 * Gets all Links from the database.
 * @returns `SerializedLink[]` Array of Serialized Links
 */

async function getAll(): Promise<SerializedLink[]> {
	try {
		var links = await prisma.graphLink.findMany()
	} catch (error) {
		return Promise.reject(error)
	}

	return await Promise.all(links.map(reduce))
}

/**
 * Gets a Link by ID from the database.
 * @param link_id `number` Target Link ID
 * @returns `SerializedLink` Serialized Link
 */

async function getById(link_id: number): Promise<SerializedLink> {
	try {
		var link = await prisma.graphLink.findUniqueOrThrow({
			where: {
				id: link_id
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await reduce(link)
}

/**
 * Gets the Course assigned to a Link.
 * @param link_id `number` Target Link ID
 * @returns `SerializedCourse` Serialized Course
 */

async function getCourse(link_id: number): Promise<SerializedCourse> {
	try {
		var data = await prisma.course.findFirstOrThrow({
			where: {
				links: {
					some: {
						id: link_id
					}
				}
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await CourseHelper.reduce(data)
}

/**
 * Gets the Graph assigned to a Link.
 * @param link_id `number` Target Link ID
 * @returns `SerializedGraph` Serialized Graph
 */

async function getGraph(link_id: number): Promise<SerializedGraph | null> {
	try {
		var data = await prisma.graphLink.findUniqueOrThrow({
			where: {
				id: link_id
			},
			select: {
				graph: true
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	if (data.graph) 
		return await GraphHelper.reduce(data.graph)
	return null
}