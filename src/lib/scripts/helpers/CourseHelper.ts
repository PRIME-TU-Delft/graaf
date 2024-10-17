
// External dependencies
import prisma from '$lib/server/prisma'
import type { Course as PrismaCourse } from '@prisma/client'

// Internal dependencies
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
 * Creates a Course object in the database.
 * @param code `string` Course code
 * @param name `string` Course name
 * @returns `SerializedCourse` Serialized new Course
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
 * Updates a Course in the database.
 * @param data `SerializedCourse` New Course data
 */

async function update(data: SerializedCourse): Promise<void> {

	// Get graph data
	const graphs = await getGraphs(data.id)
	const old_graphs = graphs
		.filter(graph => !data.graphs.includes(graph.id))
		.map(graph => ({ id: graph.id }))
	const new_graphs = data.graphs
		.filter(id => !graphs.some(graph => graph.id === id))
		.map(id => ({ id }))

	const graph_data: { connect?: any, disconnect?: any } = {}
	if (new_graphs.length) graph_data.connect = new_graphs
	if (old_graphs.length) graph_data.disconnect = old_graphs

	// Get program data
	const programs = await getPrograms(data.id)
	const old_programs = programs
		.filter(program => !data.programs.includes(program.id))
		.map(program => ({ id: program.id }))
	const new_programs = data.programs
		.filter(id => !programs.some(program => program.id === id))
		.map(id => ({ id }))

	const program_data: { connect?: any, disconnect?: any } = {}
	if (new_programs.length) program_data.connect = new_programs
	if (old_programs.length) program_data.disconnect = old_programs

	// Get link data
	const links = await getLinks(data.id)
	const old_links = links
		.filter(link => !data.links.includes(link.id))
		.map(link => ({ id: link.id }))
	const new_links = data.links
		.filter(id => !links.some(link => link.id === id))
		.map(id => ({ id }))

	const link_data: { connect?: any, disconnect?: any } = {}
	if (new_links.length) link_data.connect = new_links
	if (old_links.length) link_data.disconnect = old_links

	// Update
	try {
		await prisma.course.update({
			where: {
				id: data.id
			},
			data: {
				name: data.name,
				code: data.code,
				graphs: graph_data,
				programs: program_data,
				links: link_data
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}
}

/**
 * Removes a Course from the database.
 * @param course_id `number` Target Course ID
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
 * Reduces a Graph to a SerializedGraph.
 * @param graph `PrismaGraph` Graph object
 * @returns `SerializedGraph` Serialized Graph
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
				coordinators: {
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
	const graphs = data.graphs.map(graph => graph.id)
	const links = data.links.map(link => link.id)
	const programs = data.programs.map(program => program.id)

	const admins = data.coordinators
		.filter(coordinator => coordinator.role === 'ADMIN')
		.map(coordinator => Number(coordinator.userId))
	const editors = data.coordinators
		.filter(coordinator => coordinator.role === 'EDITOR')
		.map(coordinator => Number(coordinator.userId))

	// Return reduced data
	return {
		id: data.id,
		code: data.code,
		name: data.name,
		archived: true, // TODO Implement archived field
		graphs, links, admins, editors, programs
	}
}

/**
 * Retrieves all Courses from the database.
 * @returns `SerializedCourse[]` All serialized Courses
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
 * @param course_id `number` Target Course ID
 * @returns `SerializedCourse` Serialized Course
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
 * Retrieves Graphs assigned to target Course.
 * @param course_id `number` Target Course ID
 * @returns `SerializedGraph[]` Serialized Graphs
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
 * Retrieves Links assigned to target Course.
 * @param course_id `number` Target Course ID
 * @returns `SerializedLink[]` Serialized Links
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
 * Retrieves Admins assigned to target Course.
 * @param course_id `number` Target Course ID
 * @returns `SerializedUser[]` Serialized Admins
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
 * Retrieves Editors assigned to target Course.
 * @param course_id `number` Target Course ID
 * @returns `SerializedUser[]` Serialized Editors
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
 * Retrieves Programs assigned to target Course.
 * @param course_id `number` Target Course ID
 * @returns `SerializedProgram[]` Serialized Programs
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