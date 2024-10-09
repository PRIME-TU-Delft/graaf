
// External imports
import prisma from '$lib/server/prisma'
import type { Program as PrismaProgram } from '@prisma/client'

// Internal imports
import { CourseHelper } from '$scripts/helpers'
import type { 
	SerializedProgram,
	SerializedCourse
} from '$scripts/types'

// Exports
export { create, remove, update, reduce, getAll, getById, getCourses }


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
	const [courses, admins, editors] = await Promise.all([
		getCourses(program.id).then(courses => courses.map(course => course.id)),
		getAdminIds(program.id),
		getEditorIds(program.id)
	])

	return {
		id: program.id,
		name: program.name,
		courses,
		admins,
		editors
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
		var program = await prisma.program.findUniqueOrThrow({ where: { id: program_id }})
	} catch (error) {
		return Promise.reject(error)
	}

	return await reduce(program)
}

/**
 * Retrieves Program course IDs.
 * @param program_id `number`
 * @returns `number[]`
 */

async function getCourses(program_id: number): Promise<SerializedCourse[]> {
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
 * Retrieves Program admin User IDs.
 * @param program_id `number`
 * @returns `number[]`
 */

async function getAdminIds(program_id: number): Promise<number[]> {
	try {
		var data = await prisma.program.findUniqueOrThrow({
			where: {
				id: program_id
			},

			select: {
				coordinators: {
					select: {
						id: true
					}
				}
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return data.coordinators.map(admin => admin.id)
}

/**
 * Retrieves Program editor User IDs.
 * @param program_id `number`
 * @returns `number[]`
 */

async function getEditorIds(program_id: number): Promise<number[]> {

	// TODO i do not know how to distinguish between admin and editor, so everyone is an admin for now
	return []
}