
// External dependencies
import prisma from '$lib/server/prisma'
import type { Course as PrismaCourse } from '@prisma/client'

// Internal dependencies
import {
	ProgramHelper,
	GraphHelper
} from '$scripts/helpers'

import type {
	SerializedCourse,
	SerializedGraph,
	SerializedProgram
} from '$scripts/types'

// Exports
export { create, remove, update, reduce, getAll, getById, getGraphs, getPrograms, getAdmins, getEditors }


// --------------------> Helper Functions


/**
 * Creates a Course object in the database.
 * @param code `string`
 * @param name `string`
 * @returns `SerializedCourse`
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
 * Removes a Course from the database.
 * @param course_id `number`
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
 * Updates a Course in the database.
 * @param data `SerializedCourse`
 */

async function update(data: SerializedCourse): Promise<void> {

	// Get old and new graphs
	const graphs = await getGraphs(data.id)
	const old_graphs = graphs
		.filter(graph => !data.graphs.includes(graph.id))
		.map(graph => ({ id: graph.id }))
	const new_graphs = data.graphs
		.filter(id => !graphs.some(graph => graph.id === id))
		.map(id => ({ id }))

	// Get old and new programs
	const programs = await getPrograms(data.id)
	const old_programs = programs
		.filter(program => !data.programs.includes(program.id))
		.map(program => ({ id: program.id }))
	const new_programs = data.programs
		.filter(id => !programs.some(program => program.id === id))
		.map(id => ({ id }))

	// Update
	try {
		await prisma.course.update({
			where: {
				id: data.id
			},
			data: {
				name: data.name,
				code: data.code,
				graphs: {
					connect: new_graphs,
					disconnect: old_graphs
				},
				programs: {
					connect: new_programs,
					disconnect: old_programs
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
		graphs, admins, editors, programs
	}
}

/**
 * Retrieves all Courses from the database.
 * @returns `SerializedCourse[]`
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
 * @param course_id `number`
 * @returns `SerializedCourse`
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
 * Retrieves Course graphs.
 * @param course_id `number`
 * @returns `SerializedGraph[]`
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
 * Retrieves Course programs.
 * @param course_id `number`
 * @returns `SerializedProgram[]`
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

/**
 * Retrieves Course admins.
 * @param course_id `number`
 * @returns `SerializedUser[]`
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
 * Retrieves Course editors.
 * @param course_id `number`
 * @returns `SerializedUser[]`
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