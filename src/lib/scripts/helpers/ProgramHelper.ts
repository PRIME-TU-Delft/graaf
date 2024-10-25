
// External dependencies
import prisma from '$lib/server/prisma'
import type { Program as PrismaProgram } from '@prisma/client'

// Internal dependencies
import { array_delta } from './delta'

import {
	CourseHelper,
	UserHelper
} from '$scripts/helpers'

import type {
	SerializedProgram,
	SerializedCourse,
	SerializedUser
} from '$scripts/types'

// Exports
export {
	create,		// api/program
	remove,		// api/program/[id]
	update,		// api/program
	reduce,
	getAll,		// api/program
	getById,	// api/program/[id]
	getCourses,	// api/program/[id]/courses
	getAdmins,	// api/program/[id]/admins
	getEditors	// api/program/[id]/editors
}


// --------------------> Helper Functions


/**
 * Creates a new Program in the database
 * @param name Program name
 * @returns Newly created Serialized Program
 */

async function create(name: string): Promise<SerializedProgram> {
	try {
		var program = await prisma.program.create({
			data: {
				name
			}}
		)
	} catch (error) {
		return Promise.reject(error)
	}

	return await reduce(program)
}

/**
 * Removes Program from the database
 * @param program_id Target Program ID
 */

async function remove(program_id: number): Promise<void> {
	try {
		await prisma.program.delete({
			where: {
				id: program_id
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}
}

/**
 * Updates a Program in the database
 * @param data Serialized Program data
 */

async function update(data: SerializedProgram): Promise<void> {

	// Get current data
	const courses = await getCourses(data.id)

	// Get data delta
	const course_delta = array_delta(courses, data.courses)

	// Update
	try {
		await prisma.program.update({
			where: {
				id: data.id
			},
			data: {
				name: data.name,
				courses: course_delta
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}
}

/**
 * Reduces a Program to a SerializedProgram
 * @param program Program object
 * @returns Serialized Program
 */

async function reduce(program: PrismaProgram): Promise<SerializedProgram> {

	// Get additional data
	try {
		var data = await prisma.program.findUniqueOrThrow({
			where: {
				id: program.id
			},
			include: {
				courses: {
					select: {
						id: true
					}
				},
				users: {
					select: {
						userId: true,
						role: true
					}
				},
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	// Parse data
	const courses = data.courses.map(course => course.id)

	const admins = data.users
		.filter(user => user.role === 'ADMIN')
		.map(user => Number(user.userId))

	const editors = data.users
		.filter(user => user.role === 'EDITOR')
		.map(user => Number(user.userId))

	// Return reduced data
	return {
		id: data.id,
		name: data.name,
		courses, admins, editors
	}
}

/**
 * Retrieves all Programs from the database
 * @returns Array of Serialized Programs
 */

async function getAll(): Promise<SerializedProgram[]> {
	try {
		var courses = await prisma.program.findMany()
	} catch (error) {
		return Promise.reject(error)
	}

	return await Promise.all(courses.map(reduce))
}

/**
 * Retrieves program by ID
 * @param program_id Target Program ID
 * @returns Serialized Program
 */

async function getById(program_id: number): Promise<SerializedProgram> {
	try {
		var program = await prisma.program.findUniqueOrThrow({
			where: {
				id: program_id
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await reduce(program)
}

/**
 * Retrieves Program courses
 * @param program_id Target Program ID
 * @returns Array of Serialized Courses
 */

async function getCourses(program_id: number): Promise<SerializedCourse[]> {
	try {
		var data = await prisma.course.findMany({
			where: {
				programs: {
					some: {
						id: program_id
					}
				}
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await Promise.all(data.map(CourseHelper.reduce))
}

/**
 * Retrieves Program admin Users
 * @param program_id Target Program ID
 * @returns Array of Serialized Users
 */

async function getAdmins(program_id: number): Promise<SerializedUser[]> {
	try {
		var data = await prisma.user.findMany({
			where: {
				programs: {
					some: {
						programId: program_id,
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
 * Retrieves Program editor Users
 * @param program_id Target Program ID
 * @returns Array of Serialized Users
 */

async function getEditors(program_id: number): Promise<SerializedUser[]> {
	try {
		var data = await prisma.user.findMany({
			where: {
				programs: {
					some: {
						programId: program_id,
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