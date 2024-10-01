
// External imports
import prisma from '$lib/server/prisma'
import type { Program as PrismaProgram } from '@prisma/client'

// Internal imports
import type { SerializedProgram } from '$lib/scripts/types'

// Exports
export { create, reduce, getAll }

// --------------------> Helper Functions


/**
 * Retrieves all Programs from the database.
 * @returns Array of SerializedPrograms
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
 * Creates a new Program in the database.
 * @param name string
 * @returns SerializedProgram
 */

async function create(name: string): Promise<SerializedProgram> {
    try {
        var program = await prisma.program.create({
            data: {
                name
            } 
        })
    } catch (error) {
        return Promise.reject(error)
    }

    return await reduce(program)
}

/**
 * Reduces a Program to a SerializedProgram.
 * @param program PrismaProgram
 * @returns SerializedProgram
 */

async function reduce(program: PrismaProgram): Promise<SerializedProgram> {
	return {
		id: program.id,
		name: program.name
	}
}