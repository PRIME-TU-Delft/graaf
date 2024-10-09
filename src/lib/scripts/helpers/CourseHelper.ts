
// External imports
import prisma from '$lib/server/prisma'
import type { Course as PrismaCourse } from '@prisma/client'

// Internal imports
import type { SerializedCourse } from '$scripts/types'

// Exports
export { create, remove, update, reduce, getAll, getById }


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
		await prisma.course.delete({ where: { id: course_id }})
	} catch (error) {
		return Promise.reject(error)
	}
}

/**
 * Updates a Course in the database.
 * @param data `SerializedCourse`
 */

async function update(data: SerializedCourse): Promise<void> {
	
	const graphs = await getGraphIDs(data.id)
	const old_graphs = graphs.filter(graph => !data.graphs.includes(graph))
	const new_graphs = data.graphs.filter(graph => !graphs.includes(graph))

	const programs = await getProgramIDs(data.id)
	const old_programs = programs.filter(program => !data.programs.includes(program))
	const new_programs = data.programs.filter(program => !programs.includes(program))

	try {
		await prisma.course.update({
			where: {
				id: data.id
			},
			data: {
				name: data.name,
				code: data.code,
				graphs: {
					connect: new_graphs.map(graph => ({ id: graph })),
					disconnect: old_graphs.map(graph => ({ id: graph }))
				},
				programs: {
					connect: new_programs.map(program => ({ id: program })),
					disconnect: old_programs.map(program => ({ id: program }))
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
	const [graphs, admins, editors, programs] = await Promise.all([
		getGraphIDs(course.id),
		getAdminIds(course.id),
		getEditorIds(course.id),
		getProgramIDs(course.id)
	])

	return {
		id: course.id,
		code: course.code,
		name: course.name,
		archived: true, // TODO Implement archived field
		graphs,
		admins,
		editors,
		programs
	}
}

/**
 * Retrieves all Courses from the database.
 * @returns `SerializedCourse[]`
 */

async function getAll(): Promise<SerializedCourse[]> {
	try {
		var courses = await prisma.course.findMany()
	} catch (error) {
		return Promise.reject(error)
	}

	return await Promise.all(courses.map(reduce))
}

/**
 * Retrieves Courses by ID
 * @param course_id `number`
 * @returns `SerializedCourse`
 */

async function getById(course_id: number): Promise<SerializedCourse> {
	try {
		var courses = await prisma.course.findUniqueOrThrow({ where: { id: course_id }})
	} catch (error) {
		return Promise.reject(error)
	}

	return await reduce(courses)
}

/**
 * Retrieves Course graph IDs.
 * @param course_id `number`
 * @returns `number[]`
 */

async function getGraphIDs(course_id: number): Promise<number[]> {
	try {
		var graphs = await prisma.course.findUniqueOrThrow({
			where: {
				id: course_id
			},
			select: {
				graphs: {
					select: {
						id: true
					}
				}
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return graphs.graphs.map(graph => graph.id)
}

/**
 * Retrieves Course program IDs.
 * @param course_id `number`
 * @returns `number[]`
 */

async function getProgramIDs(course_id: number): Promise<number[]> {
	try {
		var programs = await prisma.program.findMany({
			where: {
				courses: {
					some: {
						id: course_id
					}
				}
			},
			select: {
				id: true
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return programs.map(program => program.id)
}

/**
 * Retrieves Course admin User IDs.
 * @param course_id `number`
 * @returns `number[]`
 */

async function getAdminIds(course_id: number): Promise<number[]> {
	return [] // TODO Implement getAdminIds
}

/**
 * Retrieves Course editor User IDs.
 * @param course_id `number`
 * @returns `number[]`
 */

async function getEditorIds(course_id: number): Promise<number[]> {
	return [] // TODO Implement getEditorIds
}
