
// External imports
import prisma from '$lib/server/prisma'
import type { Course as PrismaCourse } from '@prisma/client'

// Internal imports
import type { SerializedCourse } from '$scripts/types'

// Exports
export { create, remove, update, reduce, getById }


// --------------------> Helper Functions


/**
 * Retrieves a Course by its ID.
 * @param course_id
 * @returns SerializedCourse object
 */

async function getById(course_id: number): Promise<SerializedCourse> {
	try {
		var course = await prisma.course.findUniqueOrThrow({
			where: {
				id: course_id
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await reduce(course)
}

/**
 * Creates a Course object in the database.
 * @param program_id The ID of the Program the Course belongs to
 * @param code The code of the Course
 * @param name The name of the Course
 * @returns SerializedCourse object
 */

async function create(program_id: number, code: string, name: string): Promise<SerializedCourse> {
	try {
		var course = await prisma.course.create({
			data: {
				code,
				name,
				program: {
					connect: {
						id: program_id
					}
				}
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await reduce(course)
}

/**
 * Removes a Course from the database.
 * @param course_id ID of the Course to remove
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
 * @param data SerializedCourse object
 */

async function update(data: SerializedCourse): Promise<void> {
	try {
		await prisma.course.update({
			where: {
				id: data.id
			},
			data: {
				name: data.name,
				code: data.code
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

async function reduce(course: PrismaCourse): Promise<SerializedCourse> {
	return {
		id: course.id,
		code: course.code,
		name: course.name
	}
}