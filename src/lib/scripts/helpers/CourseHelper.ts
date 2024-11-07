
// External dependencies
import prisma from '$lib/server/prisma'
import type { Course as PrismaCourse } from '@prisma/client'

// Internal dependencies
import { array_delta } from './delta'

import {
	GraphHelper,
	LinkHelper,
	UserHelper,
	ProgramHelper
} from '$scripts/helpers'

import type {
	SerializedCourse,
	SerializedGraph,
	SerializedLink,
	SerializedUser,
	SerializedProgram
} from '$scripts/types'

// Exports
export {
	create,	 	// api/course				POST
	update,	 	// api/course				PUT
	remove,	 	// api/course/[id]			DELETE
	reduce,
	getAll,	 	// api/course				GET
	getById,	// api/course/[id]			GET
	getGraphs,	// api/course/[id]/graphs	GET
	getLinks,	// api/course/[id]/links	GET
	getAdmins,	// api/course/[id]/admins	GET
	getEditors,	// api/course/[id]/editors	GET
	getPrograms	// api/course/[id]/programs	GET
}


// --------------------> Helper Functions


/**
 * Creates a Course object in the database
 * @param code Course code
 * @param name Course name
 * @returns Newly created serialized Course
 */

async function create(code: string, name: string): Promise<SerializedCourse> {
	try {
		var course = await prisma.course.create({
			data: {
				code,
				name
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await reduce(course)
}

/**
 * Updates a Course in the database
 * @param data Course data
 */

async function update(data: SerializedCourse): Promise<void> {

	// Get current data
	const [graphs, programs, links] = await Promise.all([
		getGraphs(data.id),
		getPrograms(data.id),
		getLinks(data.id)
	])

	// Get data delta
	const graph_delta = array_delta(graphs, data.graphs)
	const program_delta = array_delta(programs, data.programs)
	const link_delta = array_delta(links, data.links)

	// Update
	try {
		await prisma.course.update({
			where: {
				id: data.id
			},
			data: {
				name: data.name,
				code: data.code,
				graphs: graph_delta,
				programs: program_delta,
				links: link_delta
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}
}

/**
 * Removes a Course from the database
 * @param course_id Target Course ID
 */

async function remove(course_id: number): Promise<void> {
	try {
		await prisma.course.delete({
			where: {
				id: course_id
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}
}

/**
 * Reduces a Graph to a SerializedGraph
 * @param graph Graph object
 * @returns Serialized Graph
 */

async function reduce(course: PrismaCourse): Promise<SerializedCourse> {

	// Get additional data
	try {
		var data = await prisma.course.findUniqueOrThrow({
			where: {
				id: course.id
			},
			include: {
				graphs: {
					select: {
						id: true
					}
				},
				links: {
					select: {
						id: true
					}
				},
				programs: {
					select: {
						id: true
					}
				},
				users: {
					select: {
						userId: true,
						role: true
					}
				}
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	// Parse data
	const graphs = data.graphs
		.map(graph => graph.id)

	const links = data.links
		.map(link => link.id)

	const programs = data.programs
		.map(program => program.id)

	const admins = data.users
		.filter(user => user.role === 'ADMIN')
		.map(user => Number(user.userId))

	const editors = data.users
		.filter(user => user.role === 'EDITOR')
		.map(user => Number(user.userId))

	// Return reduced data
	return {
		id: data.id,
		code: data.code,
		name: data.name,
		graphs,
		links,
		admins,
		editors,
		programs
	}
}

/**
 * Retrieves all Courses from the database
 * @returns All serialized Courses
 */

async function getAll(): Promise<SerializedCourse[]> {
	try {
		var data = await prisma.course.findMany()
	} catch (error) {
		return Promise.reject(error)
	}

	return await Promise.all(data.map(reduce))
}

/**
 * Retrieves Courses by ID
 * @param course_id Target Course ID
 * @returns Serialized Course
 */

async function getById(course_id: number): Promise<SerializedCourse> {
	try {
		var data = await prisma.course.findUniqueOrThrow({
			where: {
				id: course_id
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await reduce(data)
}

/**
 * Retrieves Graphs assigned to target Course
 * @param course_id Target Course ID
 * @returns Serialized Graphs
 */

async function getGraphs(course_id: number): Promise<SerializedGraph[]> {
	try {
		var data = await prisma.graph.findMany({
			where: {
				course: {
					id: course_id
				}
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await Promise.all(
		data.map(GraphHelper.reduce)
	)
}

/**
 * Retrieves Links assigned to target Course
 * @param course_id Target Course ID
 * @returns Serialized Links
 */

async function getLinks(course_id: number): Promise<SerializedLink[]> {
	try {
		var data = await prisma.graphLink.findMany({
			where: {
				courseId: course_id
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await Promise.all(data.map(LinkHelper.reduce))
}

/**
 * Retrieves Admins assigned to target Course
 * @param course_id Target Course ID
 * @returns Serialized Admins
 */

async function getAdmins(course_id: number): Promise<SerializedUser[]> {
	try {
		var data = await prisma.user.findMany({
			where: {
				courses: {
					some: {
						courseId: course_id,
						role: 'ADMIN'
					}
				}
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await Promise.all(data.map(UserHelper.reduce))
}

/**
 * Retrieves Editors assigned to target Course
 * @param course_id Target Course ID
 * @returns Serialized Editors
 */

async function getEditors(course_id: number): Promise<SerializedUser[]> {
	try {
		var data = await prisma.user.findMany({
			where: {
				courses: {
					some: {
						courseId: course_id,
						role: 'EDITOR'
					}
				}
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await Promise.all(data.map(UserHelper.reduce))
}

/**
 * Retrieves Programs assigned to target Course
 * @param course_id Target Course ID
 * @returns Serialized Programs
 */

async function getPrograms(course_id: number): Promise<SerializedProgram[]> {
	try {
		var data = await prisma.program.findMany({
			where: {
				courses: {
					some: {
						id: course_id
					}
				}
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await Promise.all(data.map(ProgramHelper.reduce))
}