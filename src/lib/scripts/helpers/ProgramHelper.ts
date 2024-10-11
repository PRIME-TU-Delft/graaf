
// External imports
import prisma from '$lib/server/prisma'
import type { Program as PrismaProgram } from '@prisma/client'

// Internal imports
import { CourseHelper } from '$scripts/helpers'
import type {
	SerializedProgram,
	SerializedCourse,
	SerializedUser
} from '$scripts/types'

// Exports
export { create, remove, update, reduce, getAll, getById, getCourses, getAdmins, getEditors }


// --------------------> Helper Functions


/**
 * Creates a new Program in the database.
 * @param name `string`
 * @returns `SerializedProgram`
 */

async function create(name: string): Promise<SerializedProgram> {
	try {
		var program = await prisma.program.create({ data: { name }})
	} catch (error) {
		return Promise.reject(error)
	}

	return await reduce(program)
}

/**
 * Removes Programs from the database.
 * @param program_id `number`
 */

async function remove(program_id: number): Promise<void> {
	try {
		await prisma.program.delete({ where: { id: program_id }})
	} catch (error) {
		return Promise.reject(error)
	}
}

/**
 * Updates a Program in the database.
 * @param data `SerializedProgram`
 */

async function update(data: SerializedProgram): Promise<void> {
	const courses = await getCourses(data.id)
	const old_courses = courses
		.filter(course => !data.courses.includes(course.id))
		.map(course => ({ id: course.id }))

	const new_courses = data.courses
		.filter(id => !courses.some(course => course.id === id))
		.map(id => ({ id }))

	try {
		await prisma.program.update({
			where: {
				id: data.id
			},
			data: {
				name: data.name,
				courses: {
					disconnect: old_courses,
					connect: new_courses
				}
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}
}

/**
 * Reduces a Program to a SerializedProgram.
 * @param program `PrismaProgram`
 * @returns `SerializedProgram`
 */

async function reduce(program: PrismaProgram): Promise<SerializedProgram> {
	try {
		var data = await prisma.program.findUniqueOrThrow({
			where: { id: program.id },
			include: {
				courses: {
					select: {
						id: true
					}
				},
				coordinators: {
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

	const courses = data.courses.map(course => course.id)

	const admins = data.coordinators
		.filter(coordinator => coordinator.role === 'ADMIN')
		.map(coordinator => Number(coordinator.userId))

	const editors = data.coordinators
		.filter(coordinator => coordinator.role === 'EDITOR')
		.map(coordinator => Number(coordinator.userId))

	return { 
		id: data.id,
		name: data.name, 
		courses, admins, editors
	}
}

/**
 * Retrieves all Programs from the database.
 * @returns `SerializedPrograms[]`
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
 * Retrieves Programs by ID
 * @param program_id `number`
 * @returns `SerializedProgram`
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
 * Retrieves Program courses.
 * @param program_id `number`
 * @returns `SerializedCourse[]`
 */

async function getCourses(program_id: number): Promise<SerializedCourse[]> {

	// TODO Course and program still not many to many :(
	/* try { */
	/* 	var data = await prisma.course.findMany({ */
	/* 		where: { */
	/* 			programs: { */
	/* 				some: { */
	/* 					programId: program_id */
	/* 				} */
	/* 			} */
	/* 		} */
	/* 	}) */
	/* } catch (error) { */
	/* 	return Promise.reject(error) */
	/* } */

	/* return await Promise.all(data.map(CourseHelper.reduce)) */

	try {
		var data = await prisma.program.findUniqueOrThrow({
			where: { 
				id: program_id 
			},
			select: { 
				courses: true 
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await Promise.all(data.courses.map(CourseHelper.reduce))
}

/**
 * Retrieves Program admin Users.
 * @param program_id `number`
 * @returns `SerializedUser[]`
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
 * Retrieves Program editor Users.
 * @param program_id `number`
 * @returns `SerializedUser[]`
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